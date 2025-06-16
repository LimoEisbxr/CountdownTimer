import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ThemeSwitcher from '../components/ThemeSwitcher';
import TizenTVDebugPanel from '../components/TizenTVDebugPanel';
import { useTheme } from '../contexts/ThemeContext';

function ViewTimer() {
    const { timerId } = useParams<{ timerId: string }>();
    const { theme } = useTheme();

    // Extract projectId from timerId (assuming format: projectId-timerId)
    // You may need to adjust this based on your URL structure
    const projectId = timerId?.split('-')[0] || '';
    const actualTimerId = timerId?.split('-')[1] || timerId || '';

    // Timer state
    const [timer, setTimer] = useState({
        name: 'Loading...',
        description: '',
        duration: 0,
        timeLeft: 0,
        isRunning: false,
        isPaused: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // WebSocket reference
    const wsRef = useRef<Socket | null>(null);

    const { hostname } = window.location;
    // const API_BASE_URL = `/api/projects/${projectId}`;
    const WS_BASE_URL = `wss://${hostname}`;

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
    };

    // Initialize WebSocket connection
    useEffect(() => {
        if (!actualTimerId || !projectId) return;

        // Connect to Socket.IO server
        const socket = io(WS_BASE_URL, {
            path: '/socket.io',
            transports: ['websocket'],
            query: { EIO: '4', transport: 'websocket' },
        });

        wsRef.current = socket;

        // Join the specific timer room
        socket.on('connect', () => {
            setIsLoading(true);
            console.log(
                `Socket.IO connection established for timer ${actualTimerId}`
            );
            socket.emit('join_timer', {
                project_id: projectId,
                timer_id: actualTimerId,
            });
        });

        // Listen for timer updates
        socket.on('timer_update', (data) => {
            if (data.id == actualTimerId) {
                console.log('Received timer update:', data);
                setTimer((prev) => ({
                    ...prev,
                    timeLeft:
                        data.remaining_seconds !== undefined
                            ? data.remaining_seconds
                            : prev.timeLeft,
                    isPaused: data.paused,
                    isRunning: !data.paused,
                    duration: data.duration || prev.duration,
                    name: data.name || prev.name,
                    description: data.description || prev.description,
                }));
                setIsLoading(false);
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
                // socket.disconnect();
                console.log(
                    `Socket.IO connection closed for timer ${actualTimerId}`
                );
            }
        };
    }, [actualTimerId, projectId, WS_BASE_URL]); // Add Tizen-specific scaling (similar to ViewSelectedTimer)
    const getTizenScale = () => {
        const screenWidth = window.innerWidth;

        // Base scale for different TV resolutions
        if (screenWidth >= 3840) return 2.5; // 4K
        if (screenWidth >= 1920) return 1.8; // Full HD
        if (screenWidth >= 1280) return 1.2; // HD
        return 1; // Fallback
    };

    const tizenScale = getTizenScale();

    // Progress calculation
    const progress = Math.max(
        0,
        Math.min(
            100,
            ((timer.duration - timer.timeLeft) / timer.duration) * 100
        )
    );
    if (isLoading && !timer.name) {
        return (
            <div
                className="flex flex-col items-center justify-center h-screen"
                style={{
                    backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                    color: theme === 'dark' ? '#f9fafb' : '#111827',
                }}
            >
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-6"></div>
                <p
                    className="text-xl"
                    style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                >
                    Loading timer...
                </p>
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

                    {/* Error message */}
                    {error && (
                        <div
                            style={{
                                marginBottom: '40px',
                                padding: '20px',
                                border: `2px solid ${
                                    theme === 'dark' ? '#dc2626' : '#fecaca'
                                }`,
                                borderRadius: '12px',
                                width: '100%',
                                backgroundColor:
                                    theme === 'dark'
                                        ? 'rgba(127, 29, 29, 0.3)'
                                        : '#fef2f2',
                            }}
                        >
                            <p
                                style={{
                                    textAlign: 'center',
                                    fontSize: `${Math.min(
                                        48,
                                        24 * tizenScale
                                    )}px`,
                                    color:
                                        theme === 'dark'
                                            ? '#fca5a5'
                                            : '#991b1b',
                                }}
                            >
                                {error}
                            </p>
                        </div>
                    )}

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
                                {isLoading ? (
                                    <span className="opacity-50">
                                        Loading...
                                    </span>
                                ) : timer.timeLeft === 0 ? (
                                    'Ende'
                                ) : (
                                    formatTime(timer.timeLeft)
                                )}
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Tizen TV Debug Panel */}
            <TizenTVDebugPanel />
        </div>
    );
}

export default ViewTimer;
