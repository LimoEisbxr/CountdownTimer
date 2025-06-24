from flask import Blueprint, request, jsonify, abort, make_response
from database import db
from models import Project, Timer
from auth import AuthManager, User, token_required, admin_required, optional_auth, project_access_required, optional_project_access
from datetime import datetime, timedelta

def create_routes(socketio):
    """Create and return a blueprint with all routes"""
    bp = Blueprint('api', __name__)
    
    @bp.route('/api/projects', methods=['POST'])
    @admin_required
    def create_project():
        data = request.get_json() or {}
        name = data.get('name')
        description = data.get('description')
        if not name:
            abort(400, 'Project name required')
        if Project.query.filter_by(name=name).first():
            abort(400, 'Project already exists')
        p = Project(name=name, description=description)
        db.session.add(p)
        db.session.commit()
        return jsonify({
            'id': p.id,
            'name': p.name,
            'description': p.description
        }), 201        
        
    @bp.route('/api/projects', methods=['GET'])
    def list_projects():
        # Everyone can see all projects (read-only)
        projects = Project.query.all()
        
        # Debug: Print all projects and their selected timers
        print("DEBUG: All projects and their selected timers:")
        for p in projects:
            print(f"  Project {p.id} ({p.name}) - Selected timer: {p.selected_timer_id}")
        
        return jsonify([
            {
                'id': p.id,
                'name': p.name,
                'description': p.description,
                'selected_timer_id': p.selected_timer_id,
                'timers': [
                    {
                        'id': t.id,
                        'name': t.name,
                        'duration': t.duration,
                        'description': t.description,
                        'remaining_seconds': t.remaining(),
                        'paused': t.paused
                    }
                    for t in p.timers
                ]
            }
            for p in projects
        ])    
        
    @bp.route('/api/projects/<int:project_id>/timers', methods=['POST'])
    @project_access_required
    def create_timer(project_id):
        project = Project.query.get_or_404(project_id)
        data = request.get_json() or {}
        duration = data.get('duration')
        if not data.get('name') or data.get('duration') is None:
            abort(400, 'Timer name and duration required')
        t = Timer(
            name=data.get('name', 'New Timer'),
            duration=duration,
            description=data.get('description', ''),
            project=project
        )
        t.start()
        db.session.add(t)
        db.session.commit()
        
        # NO AUTO-SELECTION - Let user manually select timers
        
        return jsonify({
            'id': t.id,            'name': t.name,
            'duration': t.duration,
            'description': t.description,
            'end_time': t.end_time.isoformat()
        }), 201    
    
    @bp.route('/api/projects/<int:project_id>/timers/<int:timer_id>', methods=['GET'])
    def get_timer(project_id, timer_id):
        # Everyone can view timer details (read-only)
        project = Project.query.get_or_404(project_id)
        t = Timer.query.filter_by(id=timer_id, project=project).first_or_404()
        return jsonify({
            'id': t.id,
            'name': t.name,
            'remaining_seconds': t.remaining(),
            'paused': t.paused
        }), 200
        
    @bp.route('/api/projects/<int:project_id>/timers/<int:timer_id>/start', methods=['POST'])
    @project_access_required
    def start_timer(project_id, timer_id):
        project = Project.query.get_or_404(project_id)
        t = Timer.query.filter_by(id=timer_id, project=project).first_or_404()
        if not t.paused:
            abort(400, 'Timer already running')
        
        # Start/resume the timer
        t.start()
        
        # Broadcast update to all clients watching this timer
        timer_room = f'timer_{t.id}'
        socketio.emit('timer_update', {
            'id': t.id,
            'name': t.name,
            'remaining_seconds': t.remaining(),
            'paused': t.paused,
            'project_id': t.project_id
        }, room=timer_room)
        
        # Return response to API caller
        return jsonify({
            'id': t.id,
            'name': t.name,
            'duration': t.duration,
            'remaining_seconds': t.remaining(),
            'paused': t.paused
        }), 200    
        
    @bp.route('/api/projects/<int:project_id>/timers/<int:timer_id>/pause', methods=['POST'])
    @project_access_required
    def pause_timer(project_id, timer_id):
        project = Project.query.get_or_404(project_id)
        t = Timer.query.filter_by(id=timer_id, project=project).first_or_404()
        if t.paused:
            abort(400, 'Timer already paused')
        
        # capture remaining seconds and pause
        t.pause()
        db.session.commit()
        
        timer_room = f'timer_{t.id}'
        socketio.emit('timer_update', {
            'id': t.id,
            'name': t.name,
            'remaining_seconds': t.remaining(),
            'paused': t.paused,
            'project_id': t.project_id
        }, room=timer_room)
        
        return jsonify({
            'id': t.id,
            'name': t.name,
            'remaining_seconds': t.remaining(),
            'paused': t.paused
        }), 200    
        
    @bp.route('/api/projects/<int:project_id>/timers/<int:timer_id>', methods=['PUT'])
    @project_access_required
    def edit_timer(project_id, timer_id):
        project = Project.query.get_or_404(project_id)
        timer = Timer.query.filter_by(id=timer_id, project=project).first_or_404()
        data = request.get_json() or {}
        if data.get('name'): timer.name = data['name']
        if data.get('description') is not None: timer.description = data['description']
        new_duration = data.get('duration')
        if new_duration is not None and new_duration != timer.duration:
            timer.duration = new_duration
            timer.calculate_end_time_and_remaining_seconds()
    
        db.session.commit()
        
        timer_room = f'timer_{timer.id}'
        socketio.emit('timer_update', {
            'id': timer.id,
            'name': timer.name,
            'description': timer.description,
            'remaining_seconds': timer.remaining(),
            'paused': timer.paused,
            'project_id': timer.project_id
        }, room=timer_room)
        
        return jsonify({
            'id': timer.id,
            'name': timer.name,
            'duration': timer.duration,
            'description': timer.description,
            'end_time': timer.end_time.isoformat()
        }), 200    
        
    @bp.route('/api/projects/<int:project_id>/timers/<int:timer_id>', methods=['DELETE'])
    @project_access_required
    def delete_timer(project_id, timer_id):
        project = Project.query.get_or_404(project_id)
        timer = Timer.query.filter_by(id=timer_id, project=project).first_or_404()
        
        # Only deselect if this timer is currently selected (no auto-selection of remaining timers)
        if project.selected_timer_id == timer_id:
            project.selected_timer_id = None
        
        db.session.delete(timer)
        db.session.commit()
        return jsonify({'message': 'Timer deleted'}), 200    
    
    @bp.route('/api/projects/<int:project_id>/timers/<int:timer_id>/reset', methods=['POST'])
    @project_access_required
    def reset_timer(project_id, timer_id):
        project = Project.query.get_or_404(project_id)
        t = Timer.query.filter_by(id=timer_id, project=project).first_or_404()        # Reset the timer properly
        t.reset()
        
        timer_room = f'timer_{t.id}'
        socketio.emit('timer_update', {
            'id': t.id,
            'name': t.name,
            'remaining_seconds': t.remaining(),
            'paused': t.paused,
            'project_id': t.project_id
        }, room=timer_room)
        
        return jsonify({
            'id': t.id,
            'name': t.name,
            'duration': t.duration,
            'remaining_seconds': t.remaining(),
            'paused': t.paused
        }), 200      
        
    @bp.route('/api/projects/<int:project_id>', methods=['GET'])
    def get_project(project_id):
        # Everyone can view project details (read-only)
        project = Project.query.get_or_404(project_id)
        timers = Timer.query.filter_by(project=project).all()
        
        # Debug: Print selected timer for this project
        print(f"DEBUG: Project {project_id} ({project.name}) - Selected timer ID: {project.selected_timer_id}")
        
        return jsonify({
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'selected_timer_id': project.selected_timer_id,
            'timers': [
                {
                    'id': x.id,
                    'name': x.name,
                    'duration': x.duration,
                    'description': x.description,
                    'remaining_seconds': x.remaining(),
                    'end_time': x.end_time.isoformat(),
                    'paused': x.paused
                }
                for x in timers
            ]
        }), 200    
        
    @bp.route('/api/projects/<int:project_id>', methods=['PUT'])
    @admin_required
    def edit_project(project_id):
        project = Project.query.get_or_404(project_id)
        data = request.get_json() or {}
        new_name = data.get('name')
        new_description = data.get('description')
        if new_name:
            if new_name != project.name and Project.query.filter_by(name=new_name).first():
                abort(400, 'Project name already in use')
            project.name = new_name
        if new_description is not None:
            project.description = new_description
        db.session.commit()
        return jsonify({
            'id': project.id,
            'name': project.name,
            'description': project.description        }), 200    
        
    @bp.route('/api/projects/<int:project_id>', methods=['DELETE'])
    @admin_required
    def delete_project(project_id):
        project = Project.query.get_or_404(project_id)
        db.session.delete(project)
        db.session.commit()
        return jsonify({'message': 'Project deleted'}), 200

    @bp.route('/api/debug/projects', methods=['GET'])
    def debug_projects():
        """Debug endpoint to show all projects and their selected timers"""
        projects = Project.query.all()
        debug_info = []
        
        for p in projects:
            project_info = {
                'id': p.id,
                'name': p.name,
                'selected_timer_id': p.selected_timer_id,
                'timers': [
                    {
                        'id': t.id,
                        'name': t.name,
                        'duration': t.duration
                    }
                    for t in p.timers                ]
            }
            debug_info.append(project_info)
            print(f"DEBUG API: Project {p.id} ({p.name}) - Selected timer: {p.selected_timer_id}")
            print(f"DEBUG API: Available timers: {[t.id for t in p.timers]}")
        
        return jsonify(debug_info)    
    
    @bp.route('/api/projects/<int:project_id>/select-timer/<int:timer_id>', methods=['POST'])
    @project_access_required
    def select_timer(project_id, timer_id):
        print(f"DEBUG: ========== SELECT TIMER REQUEST ==========")
        print(f"DEBUG: Project ID: {project_id} (type: {type(project_id)})")
        print(f"DEBUG: Timer ID: {timer_id} (type: {type(timer_id)})")
        
        try:
            project = Project.query.get_or_404(project_id)
            print(f"DEBUG: Found project: {project.name} (ID: {project.id})")
            
            timer = Timer.query.filter_by(id=timer_id, project=project).first_or_404()
            print(f"DEBUG: Found timer: {timer.name} (ID: {timer.id})")
            
            # Debug: Print previous and new selected timer
            print(f"DEBUG: Previous selected timer: {project.selected_timer_id}")
            project.selected_timer_id = timer_id
            
            # Force commit and verify
            db.session.commit()
            db.session.refresh(project)
            print(f"DEBUG: New selected timer after commit: {project.selected_timer_id}")
            
            # Verify the change was persisted
            verification_project = Project.query.get(project_id)
            print(f"DEBUG: Verification - selected timer in DB: {verification_project.selected_timer_id}")
            
            print(f"DEBUG: ========== SELECT TIMER SUCCESS ==========")
            return jsonify({
                'message': 'Timer selected',
                'selected_timer_id': timer_id,
                'project_id': project_id
            }), 200
            
        except Exception as e:
            print(f"DEBUG: ========== SELECT TIMER ERROR ==========")
            raise

    @bp.route('/api/projects/<int:project_id>/deselect-timer', methods=['POST'])
    @project_access_required
    def deselect_timer(project_id):
        print(f"DEBUG: ========== DESELECT TIMER REQUEST ==========")
        print(f"DEBUG: Project ID: {project_id} (type: {type(project_id)})")
        
        try:
            project = Project.query.get_or_404(project_id)
            print(f"DEBUG: Found project: {project.name} (ID: {project.id})")
            
            # Debug: Print previous selected timer
            print(f"DEBUG: Previous selected timer: {project.selected_timer_id}")
            
            # Clear the selected timer
            project.selected_timer_id = None
            
            # Force commit and verify
            db.session.commit()
            db.session.refresh(project)
            print(f"DEBUG: New selected timer after commit: {project.selected_timer_id}")
            
            # Verify the change was persisted
            verification_project = Project.query.get(project_id)
            print(f"DEBUG: Verification - selected timer in DB: {verification_project.selected_timer_id}")
            
            print(f"DEBUG: ========== DESELECT TIMER SUCCESS ==========")
            return jsonify({
                'message': 'Timer deselected',
                'selected_timer_id': None,
                'project_id': project_id            }), 200
            
        except Exception as e:
            print(f"DEBUG: ERROR in deselect_timer: {str(e)}")
            print(f"DEBUG: ========== DESELECT TIMER ERROR ==========")
            raise

    @bp.route('/api/projects/<int:project_id>/selected-timer', methods=['GET'])
    def get_selected_timer(project_id):
        # Everyone can view the selected timer (read-only)
        project = Project.query.get_or_404(project_id)
        
        if not project.selected_timer_id:
            return jsonify({
                'error': 'No timer selected',
                'message': 'This project has no selected timer'
            }), 404
        
        timer = Timer.query.get(project.selected_timer_id)
        if not timer:
            # If selected timer was deleted, clear the selection
            project.selected_timer_id = None
            db.session.commit()
            return jsonify({
                'error': 'Selected timer not found',
                'message': 'The selected timer no longer exists'
            }), 404
        
        return jsonify({
            'id': timer.id,
            'name': timer.name,
            'duration': timer.duration,
            'description': timer.description,
            'remaining_seconds': timer.remaining(),
            'paused': timer.paused,
            'project_id': timer.project_id        }), 200
        
    ## Authentication routes 
        
    @bp.route('/api/auth/register', methods=['POST'])
    @admin_required
    def register_user():
        """Register a new user (admin only)"""
        data = request.get_json() or {}
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('is_admin', False)
        
        if not username or not password:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Username and password are required',
                'code': 400
            }), 400
        
        if len(password) < 8:
            return jsonify({
                'error': 'Bad Request', 
                'message': 'Password must be at least 8 characters long',
                'code': 400
            }), 400
        
        user, message = AuthManager.create_user(username, password, is_admin)
        if not user:
            return jsonify({
                'error': 'Bad Request',
                'message': message,
                'code': 400
            }), 400
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'is_admin': user.is_admin,
                'created_at': user.created_at.isoformat()
            }
        }), 201

    @bp.route('/api/auth/login', methods=['POST'])
    def login():
        """Login with username and password"""
        data = request.get_json() or {}
        username = data.get('username')
        password = data.get('password')
        remember_me = data.get('remember_me', False)
        
        if not username or not password:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Username and password are required',
                'code': 400
            }), 400
        
        user = AuthManager.authenticate_user(username, password)
        if not user:
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Invalid username or password',
                'code': 401
            }), 401
        
        # Generate token (longer expiration if remember_me is True)
        expires_in_hours = 24 * 7 if remember_me else 24  # 7 days vs 1 day
        token = AuthManager.generate_token(
            user.id, 
            user.username, 
            user.is_admin, 
            expires_in_hours
        )
        
        # Create response with token in cookie
        response = make_response(jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'is_admin': user.is_admin,
                'last_login': user.last_login.isoformat() if user.last_login else None
            },
            'token': token  # Also return token in response body for API usage
        }))
        
        # Set secure cookie
        cookie_expires = datetime.utcnow() + timedelta(hours=expires_in_hours)
        response.set_cookie(
            'auth_token',
            token,
            expires=cookie_expires,
            httponly=True,  # Prevent XSS
            secure=False,   # Set to True in production with HTTPS
            samesite='Lax'
        )
        
        return response, 200

    @bp.route('/api/auth/logout', methods=['POST'])
    @optional_auth
    def logout():
        """Logout user by clearing cookie"""
        response = make_response(jsonify({
            'message': 'Logged out successfully'
        }))
        
        # Clear the auth cookie
        response.set_cookie(
            'auth_token',
            '',
            expires=datetime.utcnow() - timedelta(days=1),
            httponly=True,
            secure=False,
            samesite='Lax'
        )
        
        return response, 200

    @bp.route('/api/auth/me', methods=['GET'])
    @token_required
    def get_current_user():
        """Get current user information"""
        user = User.query.get(request.current_user['user_id'])
        if not user:
            return jsonify({
                'error': 'Not Found',
                'message': 'User not found',
                'code': 404
            }), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'is_admin': user.is_admin,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
        }), 200

    @bp.route('/api/auth/verify', methods=['GET'])
    @token_required
    def verify_token():
        """Verify if current token is valid"""
        return jsonify({
            'valid': True,
            'user': request.current_user
        }), 200

    @bp.route('/api/auth/users', methods=['GET'])
    @admin_required
    def list_users():
        """List all users (admin only)"""
        users = User.query.all()
        return jsonify({
            'users': [
                {
                    'id': user.id,
                    'username': user.username,
                    'is_admin': user.is_admin,
                    'created_at': user.created_at.isoformat(),
                    'last_login': user.last_login.isoformat() if user.last_login else None
                }
                for user in users
            ]
        }), 200

    @bp.route('/api/auth/users/<int:user_id>', methods=['PUT'])
    @admin_required
    def update_user(user_id):
        """Update a user (admin only)"""
        user = User.query.get_or_404(user_id)
        data = request.get_json() or {}
        
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('is_admin')
        
        # Update username if provided
        if username and username != user.username:
            # Check if username already exists
            existing_user = User.query.filter_by(username=username).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({
                    'error': 'Bad Request',
                    'message': 'Username already exists',
                    'code': 400
                }), 400
            user.username = username
        
        # Update password if provided
        if password:
            if len(password) < 8:
                return jsonify({
                    'error': 'Bad Request',
                    'message': 'Password must be at least 8 characters long',
                    'code': 400
                }), 400
            user.set_password(password)
        
        # Update admin status if provided
        if is_admin is not None:
            # Prevent admin from removing their own admin status
            if request.current_user['user_id'] == user_id and not is_admin:
                return jsonify({
                    'error': 'Bad Request',
                    'message': 'Cannot remove your own admin privileges',
                    'code': 400
                }), 400
            user.is_admin = is_admin
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'is_admin': user.is_admin,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
        }), 200

    @bp.route('/api/auth/users/<int:user_id>', methods=['DELETE'])
    @admin_required
    def delete_user(user_id):
        """Delete a user (admin only)"""
        # Prevent admin from deleting themselves
        if request.current_user['user_id'] == user_id:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Cannot delete your own account',
                'code': 400
            }), 400
        
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User deleted successfully'
        }), 200
    
    ## Project Permission Management Routes
    
    @bp.route('/api/auth/users/<int:user_id>/projects', methods=['GET'])
    @admin_required
    def get_user_project_permissions(user_id):
        """Get project permissions for a specific user (admin only)"""
        user = User.query.get_or_404(user_id)
        
        # Get all projects the user has access to
        authorized_projects = user.get_authorised_projects()
        
        # Get project details for authorized projects
        projects = []
        if authorized_projects:
            projects = Project.query.filter(Project.id.in_(authorized_projects)).all()
        
        return jsonify({
            'user_id': user.id,
            'username': user.username,
            'is_admin': user.is_admin,
            'authorized_projects': [
                {
                    'id': p.id,
                    'name': p.name,
                    'description': p.description
                } for p in projects
            ]
        }), 200

    @bp.route('/api/auth/users/<int:user_id>/projects/<int:project_id>', methods=['POST'])
    @admin_required
    def grant_project_permission(user_id, project_id):
        """Grant a user permission to access a specific project (admin only)"""
        user = User.query.get_or_404(user_id)
        project = Project.query.get_or_404(project_id)
        
        if user.is_admin:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Admin users already have access to all projects',
                'code': 400
            }), 400
        
        # Add project permission
        user.add_project_permission(project_id)
        db.session.commit()
        
        return jsonify({
            'message': f'Permission granted for project "{project.name}"',
            'user_id': user.id,
            'project_id': project_id,
            'username': user.username,
            'project_name': project.name
        }), 200

    @bp.route('/api/auth/users/<int:user_id>/projects/<int:project_id>', methods=['DELETE'])
    @admin_required
    def revoke_project_permission(user_id, project_id):
        """Revoke a user's permission to access a specific project (admin only)"""
        user = User.query.get_or_404(user_id)
        project = Project.query.get_or_404(project_id)
        
        if user.is_admin:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Cannot revoke permissions from admin users',
                'code': 400
            }), 400
        
        # Remove project permission
        user.remove_project_permission(project_id)
        db.session.commit()
        
        return jsonify({
            'message': f'Permission revoked for project "{project.name}"',
            'user_id': user.id,
            'project_id': project_id,
            'username': user.username,
            'project_name': project.name
        }), 200

    @bp.route('/api/auth/users/<int:user_id>/projects', methods=['PUT'])
    @admin_required
    def set_user_project_permissions(user_id):
        """Set all project permissions for a user (admin only)"""
        user = User.query.get_or_404(user_id)
        data = request.get_json() or {}
        project_ids = data.get('project_ids', [])
        
        if user.is_admin:
            return jsonify({
                'error': 'Bad Request',
                'message': 'Admin users already have access to all projects',
                'code': 400
            }), 400
        
        # Validate project IDs
        if project_ids:
            # Check if all project IDs exist
            existing_projects = Project.query.filter(Project.id.in_(project_ids)).all()
            existing_ids = [p.id for p in existing_projects]
            
            invalid_ids = [pid for pid in project_ids if pid not in existing_ids]
            if invalid_ids:
                return jsonify({
                    'error': 'Bad Request',
                    'message': f'Invalid project IDs: {invalid_ids}',
                    'code': 400
                }), 400
        
        # Set project permissions
        user.set_authorised_projects(project_ids)
        db.session.commit()
        
        # Get project details for response
        projects = []
        if project_ids:
            projects = Project.query.filter(Project.id.in_(project_ids)).all()
        
        return jsonify({
            'message': 'Project permissions updated',
            'user_id': user.id,
            'username': user.username,
            'authorized_projects': [
                {
                    'id': p.id,
                    'name': p.name,
                    'description': p.description
                } for p in projects
            ]
        }), 200

    @bp.route('/api/auth/projects/<int:project_id>/users', methods=['GET'])
    @admin_required
    def get_project_users(project_id):
        """Get all users who have access to a specific project (admin only)"""
        project = Project.query.get_or_404(project_id)
        
        # Get all users
        all_users = User.query.all()
        
        # Filter users who have access to this project
        authorized_users = []
        for user in all_users:
            if user.has_project_permission(project_id):
                authorized_users.append({
                    'id': user.id,
                    'username': user.username,
                    'is_admin': user.is_admin,
                    'created_at': user.created_at.isoformat(),
                    'last_login': user.last_login.isoformat() if user.last_login else None
                })
        
        return jsonify({
            'project_id': project.id,
            'project_name': project.name,
            'authorized_users': authorized_users
        }), 200

    @bp.route('/api/auth/me/projects', methods=['GET'])
    @token_required
    def get_my_project_permissions():
        """Get project permissions for the current user"""
        user = User.query.get(request.current_user['user_id'])
        if not user:
            return jsonify({
                'error': 'Not Found',
                'message': 'User not found',
                'code': 404
            }), 404
        
        if user.is_admin:
            # Admin can see all projects
            projects = Project.query.all()
        else:
            # Regular user can see only authorized projects
            authorized_project_ids = user.get_authorised_projects()
            if authorized_project_ids:
                projects = Project.query.filter(Project.id.in_(authorized_project_ids)).all()
            else:
                projects = []
        
        return jsonify({
            'user_id': user.id,
            'username': user.username,
            'is_admin': user.is_admin,
            'authorized_projects': [
                {
                    'id': p.id,
                    'name': p.name,
                    'description': p.description
                } for p in projects
            ]
        }), 200
    
    return bp

