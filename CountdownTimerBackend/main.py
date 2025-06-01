from flask import Flask, request
from flask_socketio import SocketIO
from database import db
from routes import bp
import os, sqlalchemy, time

socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(__name__)
    base = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(base, 'countdown.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    socketio.init_app(app)

    with app.app_context():
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

    app.register_blueprint(bp)
    return app

@socketio.on('join_timer')
def handle_join_timer(data):
    from models import Project, Timer
    project = Project.query.get_or_404(data.get('project_id'))
    timer   = Timer.query.filter_by(id=data.get('timer_id'), project=project).first_or_404()
    def send_updates():
        while True:
            rem = timer.remaining()
            socketio.emit('timer_update', {
                'id': timer.id,
                'name': timer.name,
                'remaining_seconds': rem
            }, room=request.sid)
            if rem <= 0: break
            time.sleep(1)
    socketio.start_background_task(send_updates)

if __name__ == '__main__':
    app = create_app()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)