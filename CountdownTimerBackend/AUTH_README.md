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

### Access Levels

-   **Anonymous Users**: Read-only access to all projects and timers (view-only)
-   **Regular Users**: Full access to authorized projects (view and modify)
-   **Admin Users**: Full access to all projects and user management

### View vs Modify Access

The system now provides universal read access while protecting write operations:

-   **View Operations (Public)**: Anyone can view all projects, timers, and their states
-   **Modify Operations (Authentication Required)**: Creating, editing, starting/stopping timers requires authentication and appropriate permissions

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

Project and timer endpoints are now split between public read access and authenticated write access:

#### Public Read Access (No Authentication Required)

-   `GET /api/projects` - View all projects and their timers
-   `GET /api/projects/{id}` - View specific project details
-   `GET /api/projects/{id}/timers/{timer_id}` - View timer details
-   `GET /api/projects/{id}/selected-timer` - View currently selected timer

#### Authenticated Write Access (Authentication + Permissions Required)

-   `POST /api/projects` - Create new project (optional authentication)
-   `POST /api/projects/{id}/timers` - Create timer (requires project access)
-   `PUT /api/projects/{id}` - Edit project (requires project access)
-   `DELETE /api/projects/{id}` - Delete project (admin only)
-   `PUT /api/projects/{id}/timers/{timer_id}` - Edit timer (requires project access)
-   `DELETE /api/projects/{id}/timers/{timer_id}` - Delete timer (requires project access)
-   `POST /api/projects/{id}/timers/{timer_id}/start|pause|reset` - Timer controls (requires project access)
-   `POST /api/projects/{id}/select-timer/{timer_id}` - Select timer (requires project access)
-   `POST /api/projects/{id}/deselect-timer` - Deselect timer (requires project access)

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

### 1. View Projects (No Authentication Needed)

```bash
# Anyone can view all projects and timers
curl -X GET http://localhost:5000/api/projects

# View specific project details
curl -X GET http://localhost:5000/api/projects/1

# View selected timer for a project
curl -X GET http://localhost:5000/api/projects/1/selected-timer
```

### 2. Login and Modify Projects

```bash
# Login to get authentication token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Create a timer (requires authentication)
curl -X POST http://localhost:5000/api/projects/1/timers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Timer", "duration": 300, "description": "5 minute timer"}'

# Start a timer (requires authentication)
curl -X POST http://localhost:5000/api/projects/1/timers/1/start \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Grant Project Permission to User

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

## 🌐 Public Access Features

The system now provides universal read access to encourage transparency and collaboration:

-   **Project Discovery**: Anyone can browse all available projects
-   **Timer Monitoring**: Real-time viewing of timer states and countdowns
-   **State Transparency**: Current selected timers and project information visible to all
-   **No Barrier to View**: No registration required to see project status

This approach allows for:

-   Public dashboards and displays
-   Monitoring systems without authentication
-   Easy integration with read-only clients
-   Transparency in project timer states

## 🔒 Security Features

-   **JWT Tokens**: Secure, stateless authentication for write operations
-   **HTTP-Only Cookies**: XSS protection for browser clients
-   **Password Hashing**: bcrypt with salt
-   **Per-Project Permissions**: Granular access control for modifications
-   **Admin Override**: Admins bypass all project restrictions
-   **Token Expiration**: Configurable token lifetimes
-   **Input Validation**: All inputs validated and sanitized
-   **Proper Error Codes**: Clear distinction between "not found" and "access denied"
-   **Public Read Access**: Universal transparency while protecting write operations
-   **Graduated Access**: View-only → Authenticated → Admin hierarchy

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

The API now distinguishes between view and modify operations:

#### View Operations (Always Allowed)

-   **200 OK**: Project/timer data returned successfully
-   **404 Not Found**: The requested resource doesn't exist

#### Modify Operations (Authentication Required)

-   **200 OK**: Modification successful
-   **400 Bad Request**: Invalid request data or parameters
-   **401 Unauthorized**: Authentication required or token invalid
-   **403 Forbidden**: Valid authentication but insufficient permissions for this project
-   **404 Not Found**: Resource (project, timer, user) does not exist

Example responses:

```json
// 200 - Anyone can view projects
{
  "id": 1,
  "name": "My Project",
  "description": "A sample project",
  "selected_timer_id": 5,
  "timers": [...]
}

// 401 - Modification requires authentication
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "code": 401
}

// 403 - Authenticated but no permission for this project
{
  "error": "Forbidden",
  "message": "You do not have permission to modify this project",
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
3. **All projects are now viewable by everyone** - no migration needed for read access
4. Grant project permissions to users who need **modification** access
5. Existing functionality maintains backward compatibility for viewing

## 🎯 Use Cases

### Public Display/Dashboard

-   No authentication required
-   Real-time timer monitoring
-   Project status visibility
-   Perfect for TV displays, monitoring screens

### Team Collaboration

-   Authenticated users can create and modify
-   Per-project permissions for controlled access
-   Admin oversight and management

### Mixed Access

-   Anonymous users see current state
-   Authenticated users can interact and control
-   Smooth transition from observer to participant
