#!/usr/bin/env python3
"""
Database initialization script for CountdownTimer backend
This script ensures the database is properly set up and creates a default admin user
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from database import db
from auth import User, AuthManager
import sqlalchemy

def create_app():
    """Create Flask app for database operations"""
    app = Flask(__name__)
    
    # PostgreSQL database configuration
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        pg_user = os.getenv('POSTGRES_USER', 'postgres')
        pg_password = os.getenv('POSTGRES_PASSWORD', 'password')
        pg_host = os.getenv('POSTGRES_HOST', 'localhost')
        pg_port = os.getenv('POSTGRES_PORT', '5432')
        pg_database = os.getenv('POSTGRES_DB', 'countdown_timer')
        
        app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_database}'
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    return app

def init_database():
    """Initialize the database with all tables and default data"""
    app = create_app()
    
    with app.app_context():
        print("Initializing database...")
        
        # Create all tables
        db.create_all()
        print("✓ Database tables created")
        
        # Check and add missing columns (for existing installations)
        insp = sqlalchemy.inspect(db.engine)
        
        # add description to projects if missing
        cols = [c['name'] for c in insp.get_columns('projects')]
        if 'description' not in cols:
            with db.engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE projects ADD COLUMN description TEXT"))
            print("✓ Added description column to projects table")

        # add name to timers if missing
        cols = [c['name'] for c in insp.get_columns('timers')]
        if 'name' not in cols:
            with db.engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE timers ADD COLUMN name TEXT NOT NULL DEFAULT ''"))
            print("✓ Added name column to timers table")

        # add paused to timers if missing
        cols = [c['name'] for c in insp.get_columns('timers')]
        if 'paused' not in cols:
            with db.engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE timers ADD COLUMN paused BOOLEAN NOT NULL DEFAULT 1"))
            print("✓ Added paused column to timers table")        # add selected_timer_id to projects if missing
        cols = [c['name'] for c in insp.get_columns('projects')]
        if 'selected_timer_id' not in cols:
            with db.engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE projects ADD COLUMN selected_timer_id INTEGER"))
            print("✓ Added selected_timer_id column to projects table")

        # add authorised_projects to users if missing
        cols = [c['name'] for c in insp.get_columns('users')]
        if 'authorised_projects' not in cols:
            with db.engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE users ADD COLUMN authorised_projects TEXT"))
            print("✓ Added authorised_projects column to users table")

        # Create default admin user if no users exist
        if User.query.count() == 0:
            default_admin_username = os.getenv('DEFAULT_ADMIN_USERNAME', 'admin')
            default_admin_password = os.getenv('DEFAULT_ADMIN_PASSWORD', 'admin123')
            
            admin_user, message = AuthManager.create_user(
                default_admin_username, 
                default_admin_password, 
                is_admin=True
            )
            
            if admin_user:
                print(f"✓ Created default admin user: {default_admin_username}")
                print(f"  Default password: {default_admin_password}")
                print("  IMPORTANT: Change the default password immediately after first login!")
            else:
                print(f"✗ Failed to create default admin user: {message}")
        else:
            print(f"✓ Found {User.query.count()} existing users")

        print("\nDatabase initialization complete!")
        print("\nAuthentication endpoints available:")
        print("  POST /api/auth/login     - Login with username/password")
        print("  POST /api/auth/logout    - Logout and clear session")
        print("  GET  /api/auth/me        - Get current user info")
        print("  GET  /api/auth/verify    - Verify token validity")
        print("  POST /api/auth/register  - Register new user (admin only)")
        print("  GET  /api/auth/users     - List all users (admin only)")
        print("  DEL  /api/auth/users/id  - Delete user (admin only)")
        print("\nProject permission endpoints:")
        print("  GET  /api/auth/me/projects                     - Get my project permissions")
        print("  GET  /api/auth/users/{id}/projects             - Get user's project permissions (admin)")
        print("  PUT  /api/auth/users/{id}/projects             - Set user's project permissions (admin)")
        print("  POST /api/auth/users/{id}/projects/{project_id} - Grant project permission (admin)")
        print("  DEL  /api/auth/users/{id}/projects/{project_id} - Revoke project permission (admin)")
        print("  GET  /api/auth/projects/{id}/users             - Get project's authorized users (admin)")

if __name__ == '__main__':
    try:
        init_database()
    except Exception as e:
        print(f"Error initializing database: {e}")
        print("Make sure PostgreSQL is running and the database exists.")
        sys.exit(1)
