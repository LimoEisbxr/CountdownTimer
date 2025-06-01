from flask import Flask, request
from flask_socketio import SocketIO
from database import db
from routes import routes, bp
import os, sqlalchemy, time
from threading import Lock


socketio = SocketIO(cors_allowed_origins="*")
routes = routes(socketio=socketio)
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
                    timer = Timer.query.get(timer_id)
                    if timer:
                        current_state = {
                            'id': timer.id,
                            'name': timer.name,
                            'remaining_seconds': timer.remaining(),
                            'paused': timer.paused,
                            'duration': timer.duration,
                            'description': timer.description
                        }
                        # Broadcast to all clients
                        socketio.emit('timer_update', current_state)
                except Exception as e:
                    print(f"Error updating timer {timer_id}: {e}")
            socketio.sleep(0.25)
                
def create_app():
    global app
    app = Flask(__name__)
    base = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(base, 'countdown.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    socketio.init_app(app)

    # Start background timer task
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
                conn.execute(sqlalchemy.text("ALTER TABLE timers ADD COLUMN paused BOOLEAN NOT NULL DEFAULT 1"))

    app.register_blueprint(bp)
    return app

@socketio.on('join_timer')
def handle_join_timer(data):
    from models import Project, Timer
    if not data or not isinstance(data, dict):
        return
    
    project = Project.query.get_or_404(data.get('project_id'))
    timer = Timer.query.filter_by(id=data.get('timer_id'), project=project).first_or_404()

    # Add timer to active timers
    active_timers.add(timer.id)
    
    # Send initial state
    current_state = {
        'id': timer.id,
        'name': timer.name,
        'remaining_seconds': timer.remaining(),
        'paused': timer.paused
    }
    socketio.emit('timer_update', current_state, room=request.sid)

# We don't need to handle disconnect for individual timers
# All timers remain active as long as the application is running

if __name__ == '__main__':
    app = create_app()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)