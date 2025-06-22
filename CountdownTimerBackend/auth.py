import os
import jwt
import bcrypt
import json
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from database import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    authorised_projects = db.Column(db.Text, nullable=True)  # JSON string of project IDs

    def set_password(self, password):
        """Hash and set the user's password"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        """Check if the provided password matches the stored hash"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def update_last_login(self):
        """Update the user's last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()

    def get_authorised_projects(self):
        """Get list of project IDs the user is authorised to access"""
        if not self.authorised_projects:
            return []
        try:
            return json.loads(self.authorised_projects)
        except (json.JSONDecodeError, TypeError):
            return []

    def set_authorised_projects(self, project_ids):
        """Set the list of project IDs the user is authorised to access"""
        if project_ids is None:
            self.authorised_projects = None
        else:
            # Ensure project_ids is a list of integers
            project_ids = [int(pid) for pid in project_ids if isinstance(pid, (int, str)) and str(pid).isdigit()]
            self.authorised_projects = json.dumps(project_ids)

    def add_project_permission(self, project_id):
        """Add permission for a specific project"""
        project_id = int(project_id)
        current_projects = self.get_authorised_projects()
        if project_id not in current_projects:
            current_projects.append(project_id)
            self.set_authorised_projects(current_projects)

    def remove_project_permission(self, project_id):
        """Remove permission for a specific project"""
        project_id = int(project_id)
        current_projects = self.get_authorised_projects()
        if project_id in current_projects:
            current_projects.remove(project_id)
            self.set_authorised_projects(current_projects)

    def has_project_permission(self, project_id):
        """Check if user has permission to access a specific project"""
        if self.is_admin:
            return True  # Admins can access everything
        
        project_id = int(project_id)
        return project_id in self.get_authorised_projects()

    def can_access_project(self, project_id):
        """Alias for has_project_permission for clarity"""
        return self.has_project_permission(project_id)

class AuthManager:
    @staticmethod
    def get_jwt_secret():
        """Get JWT secret from environment or generate a default one"""
        secret = os.getenv('JWT_SECRET_KEY')
        if not secret:
            # In production, always use an environment variable
            secret = 'your-secret-key-change-this-in-production'
            print("WARNING: Using default JWT secret. Set JWT_SECRET_KEY environment variable in production!")
        return secret

    @staticmethod
    def generate_token(user_id, username, is_admin=False, expires_in_hours=24):
        """Generate a JWT token for the user"""
        payload = {
            'user_id': user_id,
            'username': username,
            'is_admin': is_admin,
            'exp': datetime.utcnow() + timedelta(hours=expires_in_hours),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, AuthManager.get_jwt_secret(), algorithm='HS256')

    @staticmethod
    def verify_token(token):
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, AuthManager.get_jwt_secret(), algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    @staticmethod
    def authenticate_user(username, password):
        """Authenticate a user with username and password"""
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            user.update_last_login()
            return user
        return None

    @staticmethod
    def create_user(username, password, is_admin=False):
        """Create a new user"""
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return None, "User already exists"
        
        try:
            user = User(username=username, is_admin=is_admin)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            return user, "User created successfully"
        except Exception as e:
            db.session.rollback()
            return None, f"Error creating user: {str(e)}"

    @staticmethod
    def get_user_from_token(token):
        """Get user object from JWT token"""
        payload = AuthManager.verify_token(token)
        if payload:
            user = User.query.get(payload['user_id'])
            return user
        return None

def token_required(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                pass
        
        # Check for token in cookies as fallback
        if not token:
            token = request.cookies.get('auth_token')
        
        if not token:
            return jsonify({
                'error': 'Authentication required',
                'message': 'No token provided',
                'code': 401
            }), 401
        
        payload = AuthManager.verify_token(token)
        if not payload:
            return jsonify({
                'error': 'Authentication failed',
                'message': 'Invalid or expired token',
                'code': 401
            }), 401
        
        # Add user info to request context
        request.current_user = {
            'user_id': payload['user_id'],
            'username': payload['username'],
            'is_admin': payload['is_admin']
        }
        
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator to require admin privileges"""
    @token_required
    @wraps(f)
    def decorated(*args, **kwargs):
        if not request.current_user.get('is_admin', False):
            return jsonify({
                'error': 'Access denied',
                'message': 'Admin privileges required',
                'code': 403
            }), 403
        return f(*args, **kwargs)
    return decorated

def optional_auth(f):
    """Decorator for optional authentication (won't fail if no token)"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                pass
        
        # Check for token in cookies as fallback
        if not token:
            token = request.cookies.get('auth_token')
        
        # Set user context if token is valid
        request.current_user = None
        if token:
            payload = AuthManager.verify_token(token)
            if payload:
                request.current_user = {
                    'user_id': payload['user_id'],
                    'username': payload['username'],
                    'is_admin': payload['is_admin']
                }
        
        return f(*args, **kwargs)
    return decorated

def project_access_required(f):
    """Decorator to require access to a specific project"""
    @token_required
    @wraps(f)
    def decorated(*args, **kwargs):
        # Extract project_id from URL parameters
        project_id = kwargs.get('project_id')
        if not project_id:
            # Try to get from request args or JSON
            project_id = request.args.get('project_id') or request.view_args.get('project_id')
            if not project_id and request.is_json:
                data = request.get_json() or {}
                project_id = data.get('project_id')
        
        if not project_id:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Project ID is required',
                'code': 400
            }), 400
        
        try:
            project_id = int(project_id)
        except (ValueError, TypeError):
            return jsonify({
                'error': 'Bad Request',
                'message': 'Invalid project ID',
                'code': 400
            }), 400
          # Get user and check if project exists first
        user = User.query.get(request.current_user['user_id'])
        if not user:
            return jsonify({
                'error': 'Unauthorized',
                'message': 'User not found',
                'code': 401
            }), 401
        
        # Check if project exists first
        from models import Project  # Import here to avoid circular imports
        project = Project.query.get(project_id)
        if not project:
            return jsonify({
                'error': 'Not Found',
                'message': 'Project not found',
                'code': 404
            }), 404
        
        # Now check if user has permission to access this existing project
        if not user.has_project_permission(project_id):
            return jsonify({
                'error': 'Forbidden',
                'message': 'You do not have permission to access this project',
                'code': 403
            }), 403
        
        return f(*args, **kwargs)
    return decorated

def optional_project_access(f):
    """Decorator for optional project access (returns filtered results if no permission)"""
    @optional_auth
    @wraps(f)
    def decorated(*args, **kwargs):
        # Add current user's accessible projects to request context
        request.accessible_projects = []
        
        if hasattr(request, 'current_user') and request.current_user:
            user = User.query.get(request.current_user['user_id'])
            if user:
                if user.is_admin:
                    # Admin can see all projects - we'll handle this in the route
                    request.accessible_projects = 'all'
                else:
                    request.accessible_projects = user.get_authorised_projects()
        
        return f(*args, **kwargs)
    return decorated
