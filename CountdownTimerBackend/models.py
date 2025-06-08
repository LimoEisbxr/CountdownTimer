from datetime import datetime, timedelta
from database import db

class Project(db.Model):
    __tablename__ = 'projects'
    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    selected_timer_id = db.Column(db.Integer, db.ForeignKey('timers.id'), nullable=True)
    
    # Specify foreign_keys to resolve ambiguity
    timers      = db.relationship('Timer', backref='project', lazy=True, foreign_keys='Timer.project_id')
    selected_timer = db.relationship('Timer', foreign_keys=[selected_timer_id], post_update=True)

class Timer(db.Model):
    __tablename__ = 'timers'
    id                  = db.Column(db.Integer, primary_key=True)
    name                = db.Column(db.String(80), nullable=False)
    duration            = db.Column(db.Integer, nullable=False)      # seconds
    end_time            = db.Column(db.DateTime, nullable=False)
    paused              = db.Column(db.Boolean, nullable=False, default=True)
    project_id          = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    remaining_seconds   = db.Column(db.Integer, nullable=False, default=0)
    description         = db.Column(db.Text, nullable=True)

    def _get_safe_seconds(self, seconds_value):
        """Return a safe seconds value for timedelta calculations to prevent overflow"""
        # Define a reasonable maximum (e.g., 10 years in seconds)
        MAX_SECONDS = 10 * 365 * 24 * 60 * 60  # 10 years in seconds
        
        # Use the minimum of the actual value and the max value
        return min(seconds_value, MAX_SECONDS)

    def __init__(self, **kwargs):
        super(Timer, self).__init__(**kwargs)
        self.remaining_seconds = self.duration
        self.end_time = datetime.now() + timedelta(seconds=self._get_safe_seconds(self.duration))

    def start(self):
        """Start or resume the timer"""
        if self.paused:
            # If resuming from paused state, calculate new end time based on remaining seconds
            self.end_time = datetime.now() + timedelta(seconds=self._get_safe_seconds(self.remaining_seconds))
            self.paused = False
            db.session.commit()

    def remaining(self):
        """Get remaining seconds for a running timer"""
        if self.paused:
            return self.remaining_seconds
        else:
            delta = self.end_time - datetime.now()
            return max(int(delta.total_seconds()), 0)
    
    def pause(self):
        """Pause the timer and save the remaining seconds"""
        if not self.paused:
            self.remaining_seconds = self.remaining()
            self.paused = True
            db.session.commit()
        
    def reset(self):
        """Reset the timer to its initial state"""
        self.paused = True
        self.remaining_seconds = self.duration
        self.end_time = datetime.now() + timedelta(seconds=self._get_safe_seconds(self.duration))
        db.session.commit()
        
    def calculate_end_time_and_remaining_seconds(self):
        """Calculate the end time based on the current time and duration"""
        self.end_time = datetime.now() + timedelta(seconds=self._get_safe_seconds(self.duration))
        self.remaining_seconds = self.duration
        db.session.commit()