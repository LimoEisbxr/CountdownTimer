from flask import Blueprint, request, jsonify, abort
from database import db
from models import Project, Timer

bp = Blueprint('api', __name__)

def routes(socketio):
    """Register all routes with the blueprint"""
    @bp.route('/api/projects', methods=['POST'])
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
            'id': t.id,
            'name': t.name,
            'duration': t.duration,
            'description': t.description,
            'end_time': t.end_time.isoformat()
        }), 201

    @bp.route('/api/projects/<int:project_id>/timers/<int:timer_id>', methods=['GET'])
    def get_timer(project_id, timer_id):
        project = Project.query.get_or_404(project_id)
        t = Timer.query.filter_by(id=timer_id, project=project).first_or_404()
        return jsonify({
            'id': t.id,
            'name': t.name,
            'remaining_seconds': t.remaining(),
            'paused': t.paused
        }), 200
        
    @bp.route('/api/projects/<int:project_id>/timers/<int:timer_id>/start', methods=['POST'])
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
            print(f"DEBUG: ERROR in select_timer: {str(e)}")
            print(f"DEBUG: ========== SELECT TIMER ERROR ==========")
            raise

    @bp.route('/api/projects/<int:project_id>/deselect-timer', methods=['POST'])
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
                'project_id': project_id
            }), 200
            
        except Exception as e:
            print(f"DEBUG: ERROR in deselect_timer: {str(e)}")
            print(f"DEBUG: ========== DESELECT TIMER ERROR ==========")
            raise

    @bp.route('/api/projects/<int:project_id>/selected-timer', methods=['GET'])
    def get_selected_timer(project_id):
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
            'project_id': timer.project_id
        }), 200
    
    return bp