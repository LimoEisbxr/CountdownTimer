# CountdownTimer Backend - Authentication & Project Permissions

This backend now includes a comprehensive authentication system with per-project permissions.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set up Environment

Copy `.env.example` to `.env` and configure your database settings:

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Initialize Database & Create Admin User

```bash
# Initialize database and create default admin user
python init_auth.py

# OR create a custom admin user
python create_admin_account.py
```

### 4. Run the Application

```bash
python main.py
```

### 5. Test the Setup

```bash
python test_auth.py
```

## 🔐 Authentication System

### User Types

-   **Admin Users**: Full access to all projects and user management
-   **Regular Users**: Access only to authorized projects

### Login Process

1. **POST** `/api/auth/login` with username/password
2. Receive JWT token in response body and secure HTTP-only cookie
3. Use token in `Authorization: Bearer <token>` header for API calls
4. Cookie automatically sent with browser requests

## 📋 API Endpoints

### Authentication

-   `POST /api/auth/login` - Login with username/password
-   `POST /api/auth/logout` - Logout and clear session
-   `GET /api/auth/me` - Get current user info
-   `GET /api/auth/verify` - Verify token validity

### User Management (Admin Only)

-   `POST /api/auth/register` - Register new user
-   `GET /api/auth/users` - List all users
-   `DELETE /api/auth/users/{id}` - Delete user

### Project Permission Management

#### For Users

-   `GET /api/auth/me/projects` - Get my authorized projects

#### For Admins

-   `GET /api/auth/users/{id}/projects` - Get user's project permissions
-   `PUT /api/auth/users/{id}/projects` - Set user's project permissions (bulk)
-   `POST /api/auth/users/{id}/projects/{project_id}` - Grant project permission
-   `DELETE /api/auth/users/{id}/projects/{project_id}` - Revoke project permission
-   `GET /api/auth/projects/{id}/users` - Get users with access to project

### Project & Timer Access

All project-related endpoints now require appropriate permissions:

-   `GET /api/projects` - List accessible projects
-   `POST /api/projects/{id}/timers` - Create timer (requires project access)
-   `GET/PUT/DELETE /api/projects/{id}/timers/{timer_id}` - Timer operations (requires project access)
-   `POST /api/projects/{id}/timers/{timer_id}/start|pause|reset` - Timer controls (requires project access)

### Test Error Codes

```bash
python test_error_codes.py
```

## 🛠 Management Scripts

### Create Admin Account

```bash
# Interactive mode
python create_admin_account.py

# Command line mode
python create_admin_account.py -u admin -p SecurePassword123

# List existing users
python create_admin_account.py --list

# Force update existing user
python create_admin_account.py -u existing_user -p NewPassword123 --force
```

### Initialize Database

```bash
python init_auth.py
```

### Test System

```bash
python test_auth.py
```

## 📝 Usage Examples

### 1. Login and Get Projects

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Get projects (with token)
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Grant Project Permission to User

```bash
# Admin grants project access to user ID 2 for project ID 1
curl -X POST http://localhost:5000/api/auth/users/2/projects/1 \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### 3. Check User's Project Permissions

```bash
# Get current user's projects
curl -X GET http://localhost:5000/api/auth/me/projects \
  -H "Authorization: Bearer USER_TOKEN_HERE"
```

## 🔒 Security Features

-   **JWT Tokens**: Secure, stateless authentication
-   **HTTP-Only Cookies**: XSS protection for browser clients
-   **Password Hashing**: bcrypt with salt
-   **Per-Project Permissions**: Granular access control
-   **Admin Override**: Admins bypass all project restrictions
-   **Token Expiration**: Configurable token lifetimes
-   **Input Validation**: All inputs validated and sanitized
-   **Proper Error Codes**: Clear distinction between "not found" and "access denied"

## 📊 HTTP Status Codes

The API uses proper HTTP status codes to indicate different types of errors:

-   **200 OK**: Request successful
-   **201 Created**: Resource created successfully
-   **400 Bad Request**: Invalid request data or parameters
-   **401 Unauthorized**: Authentication required or token invalid
-   **403 Forbidden**: Valid authentication but insufficient permissions
-   **404 Not Found**: Resource (project, timer, user) does not exist
-   **500 Internal Server Error**: Server-side error

### Project Access Error Codes

When accessing projects, you'll receive different error codes based on the situation:

-   **404 Not Found**: The project ID doesn't exist in the database
-   **403 Forbidden**: The project exists, but you don't have permission to access it
-   **200 OK**: The project exists and you have permission to access it

Example responses:

```json
// 404 - Project doesn't exist
{
  "error": "Not Found",
  "message": "Project not found",
  "code": 404
}

// 403 - Project exists but no permission
{
  "error": "Forbidden",
  "message": "You do not have permission to access this project",
  "code": 403
}
```

## 🐛 Troubleshooting

### Blueprint Registration Error

If you see "The setup method 'route' can no longer be called on the blueprint", this typically means:

1. There are circular import issues
2. The blueprint is being registered multiple times

**Solution**: Restart the application and ensure clean imports.

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Run `python init_auth.py` to initialize tables

### Permission Denied Errors

1. Check if user has permission to access the project
2. Verify JWT token is valid and not expired
3. Ensure admin users aren't having permissions revoked (they have access to everything)

## 📚 Database Schema

### Users Table

-   `id` - Primary key
-   `username` - Unique username
-   `password_hash` - bcrypt hashed password
-   `is_admin` - Boolean admin flag
-   `created_at` - Account creation timestamp
-   `last_login` - Last login timestamp
-   `authorised_projects` - JSON array of authorized project IDs

### Projects Table

-   `id` - Primary key
-   `name` - Project name (unique)
-   `description` - Project description
-   `selected_timer_id` - Currently selected timer ID

### Timers Table

-   `id` - Primary key
-   `name` - Timer name
-   `duration` - Duration in seconds
-   `description` - Timer description
-   `project_id` - Foreign key to projects
-   `end_time` - When timer ends
-   `paused` - Paused state
-   `remaining_seconds` - Remaining time when paused

## 🔄 Migration

If upgrading from a version without authentication:

1. Run `python init_auth.py` to add new database columns
2. Create admin user with `python create_admin_account.py`
3. Existing projects remain accessible to admin users
4. Grant project permissions to regular users as needed
