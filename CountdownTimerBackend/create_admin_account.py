#!/usr/bin/env python3
"""
Admin Account Creation Script for CountdownTimer Backend

This script allows you to create admin accounts for the CountdownTimer application.
It can be used to:
- Create the initial admin account
- Add additional admin users
- Reset admin passwords if needed

Usage:
    python create_admin_account.py
    python create_admin_account.py --username admin --password mypassword
    python create_admin_account.py --interactive
"""

import os
import sys
import argparse
import getpass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def create_app():
    """Create Flask app for database operations"""
    from flask import Flask
    from database import db
    
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

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    
    return True, "Password is valid"

def interactive_create_admin():
    """Interactive admin creation with prompts"""
    print("=== CountdownTimer Admin Account Creation ===\n")
    
    # Get username
    while True:
        username = input("Enter admin username: ").strip()
        if not username:
            print("Username cannot be empty. Please try again.")
            continue
        if len(username) < 3:
            print("Username must be at least 3 characters long. Please try again.")
            continue
        break
    
    # Get password
    while True:
        password = getpass.getpass("Enter admin password: ")
        if not password:
            print("Password cannot be empty. Please try again.")
            continue
        
        is_valid, message = validate_password(password)
        if not is_valid:
            print(f"Password validation failed: {message}")
            continue
        
        # Confirm password
        confirm_password = getpass.getpass("Confirm admin password: ")
        if password != confirm_password:
            print("Passwords do not match. Please try again.")
            continue
        
        break
    
    return username, password

def create_admin_account(username, password, force=False):
    """Create an admin account"""
    app = create_app()
    
    with app.app_context():
        from auth import User, AuthManager
        from database import db
        
        # Initialize database tables if they don't exist
        db.create_all()
        
        # Check if user already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            if not force:
                print(f"Error: User '{username}' already exists!")
                print("Use --force to update the existing user's password and make them admin.")
                return False
            else:
                print(f"Updating existing user '{username}' to admin with new password...")
                existing_user.set_password(password)
                existing_user.is_admin = True
                # Clear project permissions for admin users
                existing_user.set_authorised_projects(None)
                db.session.commit()
                print(f"✓ Successfully updated user '{username}' as admin")
                return True
        
        # Validate password
        is_valid, message = validate_password(password)
        if not is_valid:
            print(f"Password validation failed: {message}")
            return False
        
        # Create new admin user
        try:
            admin_user, creation_message = AuthManager.create_user(username, password, is_admin=True)
            
            if admin_user:
                print(f"✓ Successfully created admin user: {username}")
                print(f"  User ID: {admin_user.id}")
                print(f"  Created at: {admin_user.created_at}")
                print(f"  Admin privileges: {admin_user.is_admin}")
                print("\nYou can now use these credentials to log in to the application.")
                return True
            else:
                print(f"✗ Failed to create admin user: {creation_message}")
                return False
                
        except Exception as e:
            print(f"✗ Error creating admin user: {str(e)}")
            return False

def list_users():
    """List all existing users"""
    app = create_app()
    
    with app.app_context():
        from auth import User
        from database import db
        
        db.create_all()
        users = User.query.all()
        
        if not users:
            print("No users found in the database.")
            return
        
        print(f"\nFound {len(users)} user(s):")
        print("-" * 60)
        print(f"{'ID':<4} {'Username':<20} {'Admin':<8} {'Created':<20}")
        print("-" * 60)
        
        for user in users:
            created_str = user.created_at.strftime('%Y-%m-%d %H:%M:%S')
            admin_str = "Yes" if user.is_admin else "No"
            print(f"{user.id:<4} {user.username:<20} {admin_str:<8} {created_str:<20}")

def main():
    parser = argparse.ArgumentParser(
        description="Create admin accounts for CountdownTimer backend",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python create_admin_account.py                          # Interactive mode
  python create_admin_account.py --list                   # List existing users
  python create_admin_account.py -u admin -p mypassword   # Create admin user
  python create_admin_account.py -u admin -p mypassword --force  # Force update existing user
        """
    )
    
    parser.add_argument('-u', '--username', 
                       help='Admin username')
    parser.add_argument('-p', '--password', 
                       help='Admin password')
    parser.add_argument('--force', action='store_true',
                       help='Force update existing user (make them admin and change password)')
    parser.add_argument('--list', action='store_true',
                       help='List all existing users')
    parser.add_argument('--interactive', action='store_true',
                       help='Use interactive mode (default if no username/password provided)')
    
    args = parser.parse_args()
    
    try:
        # List users mode
        if args.list:
            list_users()
            return
        
        # Interactive mode or if no username/password provided
        if args.interactive or (not args.username or not args.password):
            if args.username or args.password:
                print("Warning: Partial credentials provided. Switching to interactive mode.\n")
            username, password = interactive_create_admin()
        else:
            username = args.username
            password = args.password
        
        # Create the admin account
        success = create_admin_account(username, password, args.force)
        
        if success:
            print("\n" + "="*50)
            print("IMPORTANT SECURITY NOTES:")
            print("="*50)
            print("1. Store these credentials securely")
            print("2. Consider changing the password after first login")
            print("3. Use HTTPS in production")
            print("4. Set a strong JWT_SECRET_KEY in your .env file")
            print("="*50)
        else:
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        print("Make sure PostgreSQL is running and the database exists.")
        sys.exit(1)

if __name__ == '__main__':
    main()
