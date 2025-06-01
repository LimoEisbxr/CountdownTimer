from datetime import datetime, timedelta
from database import db

class Project(db.Model):
    __tablename__ = 'projects'
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    timers      = db.relationship('Timer', backref='project', lazy=True)

class Timer(db.Model):
    __tablename__ = 'timers'
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(80), nullable=False)
    duration    = db.Column(db.Integer, nullable=False)      # seconds
    end_time    = db.Column(db.DateTime, nullable=False)
    project_id  = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)

    def start(self):
        self.end_time = datetime.utcnow() + timedelta(seconds=self.duration)

    def remaining(self):
        delta = self.end_time - datetime.utcnow()
        return max(int(delta.total_seconds()), 0)