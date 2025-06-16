import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import ThemeSwitcher from '../components/ThemeSwitcher';
import TizenTVDebugPanel from '../components/TizenTVDebugPanel';
import { useTheme } from '../contexts/ThemeContext';

function ViewSelectedTimer() {
    const { projectId } = useParams<{ projectId: string }>();
    const { theme } = useTheme();

    console.log('DEBUG: ViewSelectedTimer - projectId:', projectId);

    // Timer state
    const [timer, setTimer] = useState({
        id: '',
        name: 'Loading...',
        description: '',
        duration: 0,
        timeLeft: 0,
        isRunning: false,
        isPaused: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // WebSocket reference
    const wsRef = useRef<Socket | null>(null);

    const { hostname } = window.location;
    const WS_BASE_URL = `wss://${hostname}`;

    // Add Tizen-specific scaling (moved before conditional returns)
    const getTizenScale = () => {
        const screenWidth = window.innerWidth;
        // const screenHeight = window.innerHeight;

        // Base scale for different TV resolutions
        if (screenWidth >= 3840) return 2.5; // 4K
        if (screenWidth >= 1920) return 1.8; // Full HD
        if (screenWidth >= 1280) return 1.2; // HD
        return 1; // Fallback
    };

    const tizenScale = getTizenScale();

    // Format time as HH:MM:SS
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0'),
        ].join(':');
    }; // Fetch selected timer data
    const fetchSelectedTimer = useCallback(async () => {
        if (!projectId) {
            console.log('DEBUG: No projectId available');
            return;
        }

        console.log('DEBUG: Fetching selected timer for project:', projectId);
        try {
            // Only show loading animation on initial load
            if (isInitialLoad) {
                setIsLoading(true);
            }
            const url = `/api/projects/${projectId}/selected-timer`;
            console.log('DEBUG: Making API call to:', url);

            const response = await fetch(url);
            console.log('DEBUG: Response status:', response.status);
            console.log('DEBUG: Response ok:', response.ok);
            if (!response.ok) {
                if (response.status === 404) {
                    const errorData = await response.json();
                    console.log('DEBUG: 404 error data:', errorData);
                    setError(
                        errorData.message ||
                            'No timer selected for this project'
                    );
                } else {
                    console.log(
                        'DEBUG: Non-404 error, status:',
                        response.status
                    );
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                setIsLoading(false);
                setIsInitialLoad(false);
                return;
            }

            const timerData = await response.json();
            console.log('DEBUG: Timer data received:', timerData); // Check if the selected timer has changed
            const newTimerId = timerData.id.toString();
            if (timer.id && timer.id !== '' && timer.id !== newTimerId) {
                console.log(
                    'DEBUG: Selected timer changed from',
                    timer.id,
                    'to',
                    newTimerId
                );
                // Don't show loading animation for timer changes, just update silently
            }

            setTimer({
                id: newTimerId,
                name: timerData.name,
                description: timerData.description || '',
                duration: timerData.duration,
                timeLeft: timerData.remaining_seconds,
                isRunning: !timerData.paused,
                isPaused: timerData.paused,
            });
            setError(null);
            setIsLoading(false);
            setIsInitialLoad(false);
        } catch (err) {
            console.error('Error fetching selected timer:', err);
            setError('Failed to load selected timer data');
            setIsLoading(false);
            setIsInitialLoad(false);
        }
    }, [projectId, timer.id, isInitialLoad]); // Fetch selected timer on component mount and set up polling
    useEffect(() => {
        fetchSelectedTimer();

        // Set up polling to check for selected timer changes every 2 seconds
        const pollInterval = setInterval(() => {
            fetchSelectedTimer();
        }, 2000);

        return () => {
            clearInterval(pollInterval);
        };
    }, [fetchSelectedTimer]);

    // Initialize WebSocket connection for the selected timer (only after we have timer data)
    useEffect(() => {
        if (!projectId || !timer.id || timer.id === '') return;

        // Connect to Socket.IO server
        const socket = io(WS_BASE_URL, {
            path: '/socket.io',
            transports: ['websocket'],
            query: { EIO: '4', transport: 'websocket' },
        });

        wsRef.current = socket;

        // Join the specific timer room
        socket.on('connect', () => {
            console.log(
                `Socket.IO connection established for selected timer ${timer.id}`
            );
            socket.emit('join_timer', {
                project_id: projectId,
                timer_id: timer.id,
            });
        }); // Listen for timer updates
        socket.on('timer_update', (data) => {
            if (data.id == timer.id) {
                console.log('Received selected timer update:', data);
                setTimer((prev) => ({
                    ...prev,
                    name: data.name,
                    description: data.description || '',
                    duration: data.duration,
                    timeLeft: data.remaining_seconds,
                    isRunning: !data.paused,
                    isPaused: data.paused,
                }));
            }
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            setError('Connection error. Timer updates may not be accurate.');
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO connection closed');
        });

        return () => {
            if (wsRef.current) {
                wsRef.current.disconnect();
                wsRef.current = null;
            }
        };
    }, [projectId, timer.id, WS_BASE_URL]);

    // Progress calculation
    const progress = Math.max(
        0,
        Math.min(
            100,
            ((timer.duration - timer.timeLeft) / timer.duration) * 100
        )
    );
    if (error) {
        return (
            <div
                className="flex flex-col items-center justify-center h-screen"
                style={{
                    backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                    color: theme === 'dark' ? '#f9fafb' : '#111827',
                }}
            >
                {/* Theme Switcher - Fixed position */}
                <div className="fixed top-4 right-4 z-10">
                    <ThemeSwitcher />
                </div>

                <div className="text-center p-8">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{
                            color: theme === 'dark' ? '#f9fafb' : '#111827',
                        }}
                    >
                        No Selected Timer
                    </h1>
                    <p
                        className="mb-4"
                        style={{
                            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                        }}
                    >
                        {error}
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Go Back
                    </button>
                </div>

                {/* Tizen TV Debug Panel */}
                <TizenTVDebugPanel />
            </div>
        );
    }
    if (isLoading) {
        return (
            <div
                className="flex flex-col items-center justify-center h-screen"
                style={{
                    backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                    color: theme === 'dark' ? '#f9fafb' : '#111827',
                }}
            >
                {/* Theme Switcher - Fixed position */}
                <div className="fixed top-4 right-4 z-10">
                    <ThemeSwitcher />
                </div>

                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    Loading selected timer...
                </p>

                {/* Tizen TV Debug Panel */}
                <TizenTVDebugPanel />
            </div>
        );
    }
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
            }}
        >
            {/* Theme Switcher - Fixed position */}
            <div className="fixed top-4 right-4 z-10">
                <ThemeSwitcher />
            </div>

            <div
                style={{
                    width: `${Math.min(
                        window.innerWidth - 48,
                        1200 * tizenScale
                    )}px`,
                    height: `${Math.min(
                        window.innerHeight - 48,
                        800 * tizenScale
                    )}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    backgroundColor:
                        theme === 'dark'
                            ? 'rgba(31, 41, 55, 0.95)'
                            : 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    borderRadius: '24px',
                    border: `4px solid ${
                        theme === 'dark' ? '#4b5563' : '#e5e7eb'
                    }`,
                }}
            >
                <div
                    className="text-center p-8"
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: `scale(${Math.min(1, tizenScale * 0.8)})`,
                        transformOrigin: 'center center',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            marginBottom: '40px',
                            textAlign: 'center',
                            width: '100%',
                        }}
                    >
                        {' '}
                        <h1
                            className="font-bold leading-tight"
                            style={{
                                fontSize: `${Math.min(144, 80 * tizenScale)}px`,
                                marginBottom: '20px',
                                lineHeight: '1.1',
                                wordBreak: 'break-word',
                                color: theme === 'dark' ? '#f9fafb' : '#111827',
                            }}
                        >
                            {timer.name}
                        </h1>
                        {timer.description && (
                            <p
                                className="leading-relaxed"
                                style={{
                                    fontSize: `${Math.min(
                                        64,
                                        32 * tizenScale
                                    )}px`,
                                    marginBottom: '20px',
                                    lineHeight: '1.4',
                                    color:
                                        theme === 'dark'
                                            ? '#e5e7eb'
                                            : '#6b7280',
                                }}
                            >
                                {timer.description}
                            </p>
                        )}
                    </div>

                    {/* Timer Display */}
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '90%',
                            margin: '0 auto',
                        }}
                    >
                        {/* Timer Container */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                marginBottom: '60px',
                            }}
                        >
                            {' '}
                            <div
                                className="font-mono font-bold"
                                style={{
                                    fontSize: `${Math.min(
                                        288,
                                        150 * tizenScale
                                    )}px`,
                                    letterSpacing: '0.1em',
                                    lineHeight: '1',
                                    textAlign: 'center',
                                    fontFamily:
                                        'monospace, Consolas, "Courier New"',
                                    fontWeight: 'bold',
                                    display: 'block',
                                    width: '100%',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    color:
                                        theme === 'dark'
                                            ? '#f9fafb'
                                            : '#111827',
                                }}
                            >
                                {timer.timeLeft === 0
                                    ? 'Ende'
                                    : formatTime(timer.timeLeft)}
                            </div>
                        </div>
                        {/* Progress Bar Container */}
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: '40px',
                            }}
                        >
                            {' '}
                            <div
                                className={`progress-bar-container ${
                                    theme === 'dark'
                                        ? 'dark-theme'
                                        : 'light-theme'
                                }`}
                                style={{
                                    width: `${Math.min(
                                        1280,
                                        800 * tizenScale
                                    )}px`,
                                    height: `${Math.min(
                                        64,
                                        32 * tizenScale
                                    )}px`,
                                    backgroundColor:
                                        theme === 'dark'
                                            ? '#374151'
                                            : '#e5e7eb',
                                    borderRadius: '9999px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {' '}
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        height: '100%',
                                        width: `${progress}%`,
                                        backgroundColor:
                                            timer.timeLeft === 0
                                                ? '#ef4444'
                                                : timer.isRunning
                                                ? '#22c55e'
                                                : '#eab308',
                                        transition: 'width 1s ease-out',
                                        borderRadius: '9999px',
                                        background:
                                            timer.timeLeft === 0
                                                ? '#ef4444'
                                                : timer.isRunning
                                                ? 'linear-gradient(to right, #4ade80, #16a34a)'
                                                : 'linear-gradient(to right, #facc15, #ca8a04)',
                                    }}
                                ></div>
                            </div>
                        </div>
                        {/* Status Container */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                flexWrap: 'wrap',
                                gap: '10px',
                            }}
                        >
                            {' '}
                            <span
                                style={{
                                    fontSize: `${Math.min(
                                        64,
                                        40 * tizenScale
                                    )}px`,
                                    color:
                                        theme === 'dark'
                                            ? '#9ca3af'
                                            : '#6b7280',
                                }}
                            >
                                Status:
                            </span>
                            <span
                                style={{
                                    fontSize: `${Math.min(
                                        64,
                                        40 * tizenScale
                                    )}px`,
                                    fontWeight: '600',
                                    color:
                                        timer.timeLeft === 0
                                            ? theme === 'dark'
                                                ? '#f87171'
                                                : '#dc2626'
                                            : timer.isRunning
                                            ? theme === 'dark'
                                                ? '#4ade80'
                                                : '#16a34a'
                                            : theme === 'dark'
                                            ? '#facc15'
                                            : '#ca8a04',
                                }}
                            >
                                {timer.timeLeft === 0
                                    ? 'Beendet'
                                    : timer.isRunning
                                    ? 'Läuft'
                                    : 'Pausiert'}
                            </span>
                        </div>{' '}
                    </div>
                </div>
            </div>

            {/* Tizen TV Debug Panel */}
            <TizenTVDebugPanel />
        </div>
    );
}

export default ViewSelectedTimer;
