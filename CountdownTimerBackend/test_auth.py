#!/usr/bin/env python3
"""
Test script to verify the authentication system is working correctly.
Run this script to test the basic functionality of the authentication and project permission system.
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_app_creation():
    """Test that the Flask app can be created without errors"""
    try:
        from main import create_app
        print("✓ Testing app creation...")
        app = create_app()
        print("✓ Flask app created successfully!")
        
        with app.app_context():
            from database import db
            from auth import User
            from models import Project, Timer
            
            # Test database connection
            print("✓ Testing database connection...")
            user_count = User.query.count()
            project_count = Project.query.count()
            timer_count = Timer.query.count()
            
            print(f"✓ Database connection successful!")
            print(f"  - Users: {user_count}")
            print(f"  - Projects: {project_count}")
            print(f"  - Timers: {timer_count}")
            
            # Test permission system
            print("✓ Testing permission system...")
            if user_count > 0:
                test_user = User.query.first()
                print(f"  - Test user: {test_user.username}")
                print(f"  - Is admin: {test_user.is_admin}")
                print(f"  - Authorized projects: {test_user.get_authorised_projects()}")
                
                if project_count > 0:
                    test_project = Project.query.first()
                    has_permission = test_user.has_project_permission(test_project.id)
                    print(f"  - Has permission to project '{test_project.name}': {has_permission}")
            
        return True
        
    except Exception as e:
        print(f"✗ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_auth_functions():
    """Test authentication functions"""
    try:
        from auth import AuthManager, User
        
        print("✓ Testing authentication functions...")
        
        # Test JWT token generation
        test_token = AuthManager.generate_token(1, "testuser", False, 1)
        print(f"✓ JWT token generated: {test_token[:20]}...")
        
        # Test token verification
        payload = AuthManager.verify_token(test_token)
        if payload:
            print(f"✓ Token verification successful: {payload['username']}")
        else:
            print("✗ Token verification failed")
            return False
            
        return True
        
    except Exception as e:
        print(f"✗ Error testing auth functions: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("=== CountdownTimer Authentication System Test ===\n")
    
    tests_passed = 0
    total_tests = 2
    
    # Test 1: App creation
    if test_app_creation():
        tests_passed += 1
        print()
    
    # Test 2: Auth functions
    if test_auth_functions():
        tests_passed += 1
    
    print(f"\n=== Test Results ===")
    print(f"Passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("✅ All tests passed! The authentication system is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
