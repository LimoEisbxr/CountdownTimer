from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from database import db
from routes import create_routes
from auth import User, AuthManager
import os, sqlalchemy, time
from threading import Lock
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize SocketIO but don't create routes yet
socketio = SocketIO(cors_allowed_origins="*")
thread = None
thread_lock = Lock()
active_timers = set()  # Just track which timers are active

def background_task():
    """Background task that sends timer updates every second"""
    while True:
        with app.app_context():
            # Update all active timers
            from models import Timer
            for timer_id in list(active_timers):
                try:
                    timer = db.session.get(Timer, timer_id)
                    if timer:
                        remaining_time = timer.remaining()
                        
                        # Auto-pause timer when it reaches zero
                        if remaining_time <= 0 and not timer.paused:
                            timer.pause()
                            # print(f"Timer {timer.name} (ID: {timer.id}) has finished and been paused.")
                        
                        current_state = {
                            'id': timer.id,
                            'name': timer.name,
                            'remaining_seconds': remaining_time,
                            'paused': timer.paused,
                            'duration': timer.duration,
                            'description': timer.description,
                            'project_id': timer.project_id
                        }
                        # Broadcast to all clients
                        socketio.emit('timer_update', current_state)
                except Exception as e:
                    print(f"Error updating timer {timer_id}: {e}")
            socketio.sleep(0.25)
                
def create_app():
    global app
    app = Flask(__name__)
    
    # PostgreSQL database configuration
    # You can set these environment variables or modify directly
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        # Default PostgreSQL configuration - modify these values for your setup
        pg_user = os.getenv('POSTGRES_USER')
        pg_password = os.getenv('POSTGRES_PASSWORD')
        pg_host = os.getenv('POSTGRES_HOST')
        pg_port = os.getenv('POSTGRES_PORT')
        pg_database = os.getenv('POSTGRES_DB')
        
        app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_database}'
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


    db.init_app(app)
    socketio.init_app(app)

    # Add error handlers for API responses
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found',
            'code': 404
        }), 404

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'Bad Request',
            'message': str(error.description) if hasattr(error, 'description') else 'Invalid request',
            'code': 400
        }), 400

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
            'code': 500
        }), 500    # Start background timer task
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(background_task)
            
    with app.app_context():
        # Database setup remains the same
        db.create_all()
        insp = sqlalchemy.inspect(db.engine)

        # add description to projects if missing
        cols = [c['name'] for c in insp.get_columns('projects')]
        if 'description' not in cols:
            with db.engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE projects ADD COLUMN description TEXT"))

        # add name to timers if missing
        cols = [c['name'] for c in insp.get_columns('timers')]
        if 'name' not in cols:
            with db.engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE timers ADD COLUMN name TEXT NOT NULL DEFAULT ''"))        
        
        # add paused to timers if missing
        cols = [c['name'] for c in insp.get_columns('timers')]
        if 'paused' not in cols:
            with db.engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE timers ADD COLUMN paused BOOLEAN NOT NULL DEFAULT 1"))        # add selected_timer_id to projects if missing
        cols = [c['name'] for c in insp.get_columns('projects')]
        if 'selected_timer_id' not in cols:
            with db.engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE projects ADD COLUMN selected_timer_id INTEGER"))

        # add authorised_projects to users if missing
        cols = [c['name'] for c in insp.get_columns('users')]
        if 'authorised_projects' not in cols:
            with db.engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE users ADD COLUMN authorised_projects TEXT"))        # Create default admin user if no users exist
        if User.query.count() == 0:
            default_admin_username = os.getenv('DEFAULT_ADMIN_USERNAME', 'admin')
            default_admin_password = os.getenv('DEFAULT_ADMIN_PASSWORD', 'admin123')
            
            admin_user, message = AuthManager.create_user(
                default_admin_username, 
                default_admin_password, 
                is_admin=True
            )
            
            if admin_user:
                print(f"Created default admin user: {default_admin_username}")
                print(f"Default password: {default_admin_password}")
                print("IMPORTANT: Change the default password immediately!")
            else:
                print(f"Failed to create default admin user: {message}")

    # Create and register the blueprint with routes
    bp = create_routes(socketio)
    app.register_blueprint(bp)
    return app

@socketio.on('join_timer')
def handle_join_timer(data):
    from models import Project, Timer
    if not data or not isinstance(data, dict):
        socketio.emit('error', {
            'code': 400,
            'message': 'Invalid request data'
        }, room=request.sid)
        return
    
    project_id = data.get('project_id')
    timer_id = data.get('timer_id')
    
    if not project_id or not timer_id:
        socketio.emit('error', {
            'code': 400,
            'message': 'Missing project_id or timer_id'
        }, room=request.sid)
        return
    
    # Check if project exists
    project = db.session.get(Project, project_id)
    if not project:
        socketio.emit('error', {
            'code': 404,
            'message': f'Project with id {project_id} not found'
        }, room=request.sid)
        return
    
    # Check if timer exists in the project
    timer = Timer.query.filter_by(id=timer_id, project=project).first()
    if not timer:
        socketio.emit('error', {
            'code': 404,
            'message': f'Timer with id {timer_id} not found in project {project_id}'
        }, room=request.sid)
        return

    # Add timer to active timers
    active_timers.add(timer.id)
    
    # Send initial state
    current_state = {
        'id': timer.id,
        'name': timer.name,
        'remaining_seconds': timer.remaining(),
        'paused': timer.paused,
        'duration': timer.duration,
        'description': timer.description,
        'project_id': timer.project_id,
    }
    socketio.emit('timer_update', current_state, room=request.sid)

@socketio.on_error_default
def default_error_handler(e):
    """Handle any unhandled errors in WebSocket connections"""
    print(f"WebSocket error: {e}")
    socketio.emit('error', {
        'code': 500,
        'message': 'An unexpected error occurred'
    }, room=request.sid)

# We don't need to handle disconnect for individual timers
# All timers remain active as long as the application is running

if __name__ == '__main__':
    app = create_app()

    flask_debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1', 'yes']
    
    socketio.run(app, debug=flask_debug_mode, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)