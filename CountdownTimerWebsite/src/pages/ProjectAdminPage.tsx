import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import TimerCard from '../components/timer/TimerCard';
import CreateTimerButton from '../components/timer/CreateTimerButton';
import ThemeSwitcher from '../components/ThemeSwitcher';
import Login from '../components/login';
import { LoadingSpinner, ActionButton, EmptyState } from '../components/common';

interface ProjectData {
    name: string;
    description: string;
    selected_timer_id?: string | number | null;
}

interface Timer {
    id: string | number;
    name: string;
    description: string;
    duration: number;
}

function ProjectAdminPage() {
    const { projectID } = useParams<{ projectID: string }>();
    const [projectData, setProjectData] = useState<ProjectData | null>(null);
    const [timers, setTimers] = useState<Timer[]>([]);
    const [selectedTimerId, setSelectedTimerId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [user, setUser] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        checkAuthentication();
    }, []);

    // Fetch project data and timers when component mounts
    useEffect(() => {
        if (projectID && isAuthenticated) {
            fetchProjectData(projectID);
        }
    }, [projectID, isAuthenticated]);

    function checkAuthentication() {
        // Check if user is already logged in (e.g., from localStorage token)
        const token = localStorage.getItem('admin_token');
        const savedUser = localStorage.getItem('admin_user');

        if (token && savedUser) {
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

        // Store authentication data
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', username);

        // Update state
        setIsAuthenticated(true);
        setUser(username);
        setIsLoginOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setIsAuthenticated(false);
        setUser(null);
        setProjectData(null);
        setTimers([]);
        setIsLoginOpen(true);
    };

    const fetchProjectData = useCallback(
        (id: string) => {
            if (!isAuthenticated) return;

            fetch(`/api/projects/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem(
                        'admin_token'
                    )}`,
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => {
                    if (response.status === 401) {
                        // Token expired or invalid
                        handleLogout();
                        throw new Error('Authentication required');
                    }
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then((data) => {
                    setProjectData(data);
                    setSelectedTimerId(
                        data.selected_timer_id
                            ? String(data.selected_timer_id)
                            : null
                    );
                    setIsLoading(false);
                    setTimers(data.timers || []); // Assuming timers are part of the project data
                })
                .catch((error) => {
                    console.error(
                        'There was a problem with the fetch operation:',
                        error
                    );
                    if (error.message !== 'Authentication required') {
                        setError('Failed to load project data');
                    }
                    setIsLoading(false);
                });
        },
        [isAuthenticated]
    );

    const handleTimerDeleted = (timerId: string) => {
        // Update local state to remove the deleted timer
        setTimers((prevTimers) =>
            prevTimers.filter((timer) => String(timer.id) !== timerId)
        );
    };
    const handleTimerUpdated = (updatedTimer: {
        id: string;
        name: string;
        description: string;
        duration: number;
    }) => {
        // Update local state with the updated timer
        setTimers((prevTimers) =>
            prevTimers.map((timer) =>
                String(timer.id) === updatedTimer.id
                    ? { ...timer, ...updatedTimer, id: timer.id }
                    : timer
            )
        );
    };
    const handleTimerSelected = (timerId: string) => {
        console.log(
            'DEBUG: ========== PROJECT ADMIN handleTimerSelected =========='
        );
        console.log(
            'DEBUG: handleTimerSelected called with timer ID:',
            timerId
        );
        console.log('DEBUG: Previous selected timer ID:', selectedTimerId);
        console.log('DEBUG: Project data before update:', projectData);

        // Handle deselection (empty string means deselect)
        const newSelectedTimerId = timerId === '' ? null : timerId;

        // Update local state immediately for instant visual feedback
        setSelectedTimerId(newSelectedTimerId);

        // Also update the project data state to reflect the selection
        setProjectData((prev) =>
            prev ? { ...prev, selected_timer_id: newSelectedTimerId } : null
        );

        console.log('DEBUG: Updated selected timer ID to:', newSelectedTimerId);
        console.log(
            'DEBUG: ========== PROJECT ADMIN handleTimerSelected COMPLETE =========='
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="flex justify-between"
                        style={{ minHeight: '5.5rem' }}
                    >
                        <div className="flex flex-col items-start justify-center py-4">
                            {' '}
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {error
                                    ? 'Project Admin'
                                    : `${
                                          !isLoading && projectData
                                              ? projectData.name
                                              : 'Project'
                                      }${!isLoading ? ' - Admin' : ''}`}
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {isLoading ? (
                                    <span className="inline-flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Loading project details...
                                    </span>
                                ) : error ? (
                                    error
                                ) : (
                                    projectData?.description ||
                                    'No description available'
                                )}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {' '}
                            {user && (
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    Welcome, <strong>{user}</strong>
                                </span>
                            )}
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
            </header>
            {/* Main Content */}
            {authChecked && isAuthenticated && (
                <div className="py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Top Action Bar */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">
                                Project Timers
                            </h2>
                            <div className="flex-shrink-0">
                                {projectID && (
                                    <CreateTimerButton
                                        projectId={projectID}
                                        onTimerCreated={() =>
                                            projectID &&
                                            fetchProjectData(projectID)
                                        }
                                    />
                                )}
                            </div>
                        </div>{' '}
                        {isLoading ? (
                            <LoadingSpinner text="Loading timers..." />
                        ) : timers.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                                <EmptyState
                                    icon="⏱️"
                                    title="No timers found"
                                    description="No timers found for this project. Create your first timer!"
                                />
                                {projectID && (
                                    <div className="flex justify-center mt-4">
                                        <CreateTimerButton
                                            projectId={projectID}
                                            onTimerCreated={() =>
                                                projectID &&
                                                fetchProjectData(projectID)
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {timers.map((timer) => {
                                    const timerIdStr = String(timer.id);
                                    const selectedIdStr = String(
                                        selectedTimerId || ''
                                    );
                                    const isTimerSelected =
                                        selectedIdStr === timerIdStr;

                                    return (
                                        <TimerCard
                                            projectId={projectID!}
                                            key={timerIdStr}
                                            id={timerIdStr}
                                            name={timer.name}
                                            description={timer.description}
                                            duration={timer.duration}
                                            isSelected={isTimerSelected}
                                            onTimerDeleted={handleTimerDeleted}
                                            onTimerUpdated={handleTimerUpdated}
                                            onTimerSelected={
                                                handleTimerSelected
                                            }
                                        />
                                    );
                                })}
                            </div>
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
                title="Project Access Required"
                subtitle="Please sign in with your project or admin account"
            />
        </div>
    );
}

export default ProjectAdminPage;
