#!/usr/bin/env python3
"""
Test script to demonstrate the different error codes for project access.
This script shows the difference between 404 (project not found) and 403 (permission denied).
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5000"

def test_error_codes():
    """Test different error codes for project access"""
    print("=== Project Access Error Code Test ===\n")
    
    # First, let's try to login as admin to get a token
    print("1. Logging in as admin...")
    login_response = requests.post(f"{BASE_URL}/api/auth/login", 
                                 json={"username": "admin", "password": "admin123"})
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return False
    
    admin_token = login_response.json().get('token')
    print(f"✅ Admin login successful")
    
    # Create a test project first
    print("\n2. Creating a test project...")
    create_response = requests.post(f"{BASE_URL}/api/projects",
                                  json={"name": "Test Project", "description": "For testing error codes"},
                                  headers={"Authorization": f"Bearer {admin_token}"})
    
    if create_response.status_code == 201:
        project_id = create_response.json().get('id')
        print(f"✅ Created test project with ID: {project_id}")
    else:
        print(f"⚠️  Failed to create project, trying to get existing projects...")
        projects_response = requests.get(f"{BASE_URL}/api/projects",
                                       headers={"Authorization": f"Bearer {admin_token}"})
        if projects_response.status_code == 200:
            projects = projects_response.json()
            if projects:
                project_id = projects[0]['id']
                print(f"✅ Using existing project with ID: {project_id}")
            else:
                print("❌ No projects available for testing")
                return False
        else:
            print("❌ Failed to get projects")
            return False
    
    # Create a regular user
    print("\n3. Creating a regular user...")
    user_response = requests.post(f"{BASE_URL}/api/auth/register",
                                json={"username": "testuser", "password": "testpass123", "is_admin": False},
                                headers={"Authorization": f"Bearer {admin_token}"})
    
    if user_response.status_code == 201:
        user_id = user_response.json().get('user', {}).get('id')
        print(f"✅ Created test user with ID: {user_id}")
    else:
        print(f"⚠️  User creation failed (might already exist): {user_response.status_code}")
        # Try to get existing users
        users_response = requests.get(f"{BASE_URL}/api/auth/users",
                                    headers={"Authorization": f"Bearer {admin_token}"})
        if users_response.status_code == 200:
            users = users_response.json().get('users', [])
            regular_users = [u for u in users if not u['is_admin']]
            if regular_users:
                user_id = regular_users[0]['id']
                username = regular_users[0]['username']
                print(f"✅ Using existing regular user: {username} (ID: {user_id})")
            else:
                print("❌ No regular users available")
                return False
        else:
            print("❌ Failed to get users")
            return False
    
    # Login as the regular user
    print("\n4. Logging in as regular user...")
    user_login_response = requests.post(f"{BASE_URL}/api/auth/login",
                                      json={"username": "testuser", "password": "testpass123"})
    
    if user_login_response.status_code != 200:
        print(f"❌ User login failed: {user_login_response.status_code}")
        # Try with the existing user
        users_response = requests.get(f"{BASE_URL}/api/auth/users",
                                    headers={"Authorization": f"Bearer {admin_token}"})
        if users_response.status_code == 200:
            users = users_response.json().get('users', [])
            regular_users = [u for u in users if not u['is_admin']]
            if regular_users:
                username = regular_users[0]['username']
                # We can't get the password, so we'll need to create a new user or use a known password
                print(f"⚠️  Cannot test with existing user {username} (password unknown)")
                return False
        return False
    
    user_token = user_login_response.json().get('token')
    print(f"✅ User login successful")
    
    print("\n" + "="*60)
    print("TESTING ERROR CODES:")
    print("="*60)
    
    # Test 1: Access non-existent project (should return 404)
    print("\n📋 Test 1: Accessing non-existent project")
    print("Expected: 404 Not Found")
    
    non_existent_id = 99999
    response_404 = requests.get(f"{BASE_URL}/api/projects/{non_existent_id}",
                               headers={"Authorization": f"Bearer {user_token}"})
    
    print(f"Result: {response_404.status_code}")
    if response_404.status_code == 404:
        print("✅ Correct! Got 404 for non-existent project")
        print(f"Message: {response_404.json().get('message', 'No message')}")
    else:
        print(f"❌ Expected 404, got {response_404.status_code}")
        print(f"Response: {response_404.text}")
    
    # Test 2: Access existing project without permission (should return 403)
    print("\n📋 Test 2: Accessing existing project without permission")
    print("Expected: 403 Forbidden")
    
    response_403 = requests.get(f"{BASE_URL}/api/projects/{project_id}",
                               headers={"Authorization": f"Bearer {user_token}"})
    
    print(f"Result: {response_403.status_code}")
    if response_403.status_code == 403:
        print("✅ Correct! Got 403 for existing project without permission")
        print(f"Message: {response_403.json().get('message', 'No message')}")
    else:
        print(f"❌ Expected 403, got {response_403.status_code}")
        print(f"Response: {response_403.text}")
    
    # Test 3: Grant permission and access (should return 200)
    print("\n📋 Test 3: Grant permission and access project")
    print("Expected: 200 OK")
    
    # Grant permission
    grant_response = requests.post(f"{BASE_URL}/api/auth/users/{user_id}/projects/{project_id}",
                                 headers={"Authorization": f"Bearer {admin_token}"})
    
    if grant_response.status_code == 200:
        print("✅ Permission granted successfully")
        
        # Now try to access the project
        response_200 = requests.get(f"{BASE_URL}/api/projects/{project_id}",
                                   headers={"Authorization": f"Bearer {user_token}"})
        
        print(f"Result: {response_200.status_code}")
        if response_200.status_code == 200:
            print("✅ Correct! Got 200 for authorized project access")
            project_data = response_200.json()
            print(f"Project: {project_data.get('name', 'Unknown')}")
        else:
            print(f"❌ Expected 200, got {response_200.status_code}")
            print(f"Response: {response_200.text}")
    else:
        print(f"❌ Failed to grant permission: {grant_response.status_code}")
        print(f"Response: {grant_response.text}")
    
    print("\n" + "="*60)
    print("ERROR CODE SUMMARY:")
    print("="*60)
    print("🔍 404 Not Found     - Project does not exist")
    print("🚫 403 Forbidden     - Project exists but user has no permission")
    print("✅ 200 OK           - Project exists and user has permission")
    print("🔐 401 Unauthorized - No valid authentication token")
    
    return True

if __name__ == "__main__":
    try:
        test_error_codes()
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed. Make sure the server is running on http://localhost:5000")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        sys.exit(1)
