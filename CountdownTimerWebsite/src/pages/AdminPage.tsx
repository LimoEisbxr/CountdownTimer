import { useState, useEffect, useCallback } from 'react';
import CreateProjectButton from '../components/admin/CreateProjectButton';
import AdminProjectCard from '../components/admin/AdminProjectCard';
import CreateUserButton from '../components/admin/CreateUserButton';
import UserCard from '../components/admin/UserCard';
import ThemeSwitcher from '../components/ThemeSwitcher';
import Login from '../components/login';
import {
    LoadingSpinner,
    ActionButton,
    EmptyState,
    TabButton,
} from '../components/common';
import type { Project } from '../types/Project';
import type { User } from '../types/User';

function AdminPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [user, setUser] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [activeTab, setActiveTab] = useState<'projects' | 'users'>(
        'projects'
    );

    useEffect(() => {
        checkAuthentication();
    }, []);

    const fetchProjects = useCallback(() => {
        if (!isAuthenticated) return;

        setLoading(true);
        fetch('/api/projects', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
                'Content-Type': 'application/json',
            },
        })
            .then((response) => {
                if (response.status === 401) {
                    // Token expired or invalid
                    handleLogout();
                    throw new Error('Authentication required');
                }
                return response.json();
            })
            .then((data) => {
                setProjects(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching projects:', error);
                setLoading(false);
                if (error.message === 'Authentication required') {
                    return; // Don't show error for auth issues
                }
            });
    }, [isAuthenticated]);
    const fetchUsers = useCallback(() => {
        if (!isAuthenticated) return;

        setUsersLoading(true);
        fetch('/api/auth/users', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
                'Content-Type': 'application/json',
            },
        })
            .then((response) => {
                if (response.status === 401) {
                    handleLogout();
                    throw new Error('Authentication required');
                }
                return response.json();
            })
            .then((data) => {
                setUsers(data.users);
                setUsersLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching users:', error);
                setUsersLoading(false);
                if (error.message === 'Authentication required') {
                    return;
                }
            });
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchProjects();
            fetchUsers();
        }
    }, [isAuthenticated, fetchProjects, fetchUsers]);
    function checkAuthentication() {
        // Check if user is already logged in (e.g., from localStorage token)
        const token = localStorage.getItem('admin_token');
        const savedUser = localStorage.getItem('admin_user');

        if (token && savedUser) {
            // Decode the JWT to get user ID (simple decode without verification for client-side)
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.user_id);
            } catch (error) {
                console.error('Error decoding token:', error);
            }

            setIsAuthenticated(true);
            setUser(savedUser);
        } else {
            setIsLoginOpen(true);
        }
        setAuthChecked(true);
    }

    const handleLogin = async (
        username: string,
        password: string
    ): Promise<void> => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Invalid admin credentials');
        }
        const data = await response.json();

        // console.log('Login response:', data);
        if (data.user.is_admin) {
            // console.log('Login successful:', data);

            // Store authentication data
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_user', username);

            // Decode JWT to get user ID
            try {
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                setCurrentUserId(payload.user_id);
            } catch (error) {
                console.error('Error decoding token:', error);
            }

            // Update state
            setIsAuthenticated(true);
            setUser(username);
            setIsLoginOpen(false);
        }
    };
    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setIsAuthenticated(false);
        setUser(null);
        setCurrentUserId(null);
        setProjects([]);
        setUsers([]);
        setIsLoginOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {' '}
            {/* Top Navigation */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {' '}
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                Project Dashboard
                            </h1>
                            {user && (
                                <span className="ml-4 text-sm text-gray-600 dark:text-gray-300">
                                    Welcome, <strong>{user}</strong>
                                </span>
                            )}
                        </div>{' '}
                        <div className="flex items-center space-x-4">
                            {isAuthenticated && (
                                <ActionButton
                                    variant="danger"
                                    onClick={handleLogout}
                                >
                                    <svg
                                        className="w-4 h-4 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                    Sign Out
                                </ActionButton>
                            )}
                            <ThemeSwitcher />
                        </div>
                    </div>
                </div>
            </header>{' '}
            {/* Main Content */}
            {authChecked && isAuthenticated && (
                <div className="py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {' '}
                        {/* Tabs */}
                        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                            <nav className="-mb-px flex space-x-8">
                                <TabButton
                                    active={activeTab === 'projects'}
                                    onClick={() => setActiveTab('projects')}
                                >
                                    Projects
                                </TabButton>
                                <TabButton
                                    active={activeTab === 'users'}
                                    onClick={() => setActiveTab('users')}
                                >
                                    Users
                                </TabButton>
                            </nav>
                        </div>
                        {/* Projects Tab */}
                        {activeTab === 'projects' && (
                            <>
                                {/* Top Action Bar */}{' '}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex-shrink-0">
                                        <CreateProjectButton
                                            onProjectCreated={fetchProjects}
                                        />
                                    </div>
                                </div>
                                {/* Projects Grid */}{' '}
                                <div className="mt-8">
                                    {loading ? (
                                        <LoadingSpinner text="Loading projects..." />
                                    ) : projects.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                            {projects.map((project) => (
                                                <AdminProjectCard
                                                    key={project.id}
                                                    project={project}
                                                    onProjectUpdated={
                                                        fetchProjects
                                                    }
                                                    onProjectDeleted={
                                                        fetchProjects
                                                    }
                                                />
                                            ))}{' '}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            icon="📁"
                                            title="No projects found"
                                            description="Create your first project to get started."
                                        />
                                    )}
                                </div>
                            </>
                        )}
                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <>
                                {/* Top Action Bar */}
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                            User Management
                                        </h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Manage user accounts and permissions
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <CreateUserButton
                                            onUserCreated={fetchUsers}
                                        />
                                    </div>
                                </div>
                                {/* Users Grid */}{' '}
                                <div className="mt-8">
                                    {usersLoading ? (
                                        <LoadingSpinner text="Loading users..." />
                                    ) : users.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                            {users.map((userItem) => (
                                                <UserCard
                                                    key={userItem.id}
                                                    user={userItem}
                                                    currentUserId={
                                                        currentUserId || 0
                                                    }
                                                    onUserUpdated={fetchUsers}
                                                    onUserDeleted={fetchUsers}
                                                />
                                            ))}{' '}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            icon="👥"
                                            title="No users found"
                                            description="Create your first user to get started."
                                        />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {/* Login Modal */}
            <Login
                isOpen={isLoginOpen}
                onClose={() => {
                    // Prevent closing if not authenticated
                    if (!isAuthenticated) return;
                    setIsLoginOpen(false);
                }}
                onLogin={handleLogin}
                title="Admin Access Required"
                subtitle="Please sign in to access the admin dashboard"
            />
        </div>
    );
}

export default AdminPage;
