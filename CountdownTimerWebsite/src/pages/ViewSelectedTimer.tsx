import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

function ViewSelectedTimer() {
    const { projectId } = useParams<{ projectId: string }>();

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
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-center p-8">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                        No Selected Timer
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {error}
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                    Loading selected timer...
                </p>
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 h-screen w-screen overflow-hidden">
            <div className="w-[calc(100vw-48px)] h-[calc(100vh-48px)] bg-white/90 dark:bg-gray-800/90 shadow-2xl rounded-3xl overflow-hidden border-4 border-gray-200 dark:border-gray-600 m-6 flex items-center justify-center">
                {' '}
                <div
                    className="text-center p-8 w-full h-full flex flex-col items-center justify-center"
                    style={{
                        transform: `scale(${Math.min(
                            1,
                            Math.max(
                                0.6,
                                Math.min(
                                    (window.innerWidth - 96) / 600,
                                    (window.innerHeight - 96) / 500
                                )
                            )
                        )})`,
                        transformOrigin: 'center center',
                    }}
                >
                    {/* Header */}
                    <div className="mb-[2vh] text-center">
                        <h1 className="text-[clamp(3rem,8vw,9rem)] font-bold text-gray-800 dark:text-white mb-[1vh] leading-tight text-center">
                            {timer.name}
                        </h1>
                        {timer.description && (
                            <p className="text-[clamp(1.5rem,3vw,4rem)] text-gray-600 dark:text-gray-400 mb-[1vh] leading-relaxed text-center">
                                {timer.description}
                            </p>
                        )}{' '}
                    </div>{' '}
                    {/* Timer Display */}
                    <div className="w-full flex flex-col items-center justify-center max-w-[80vw] mx-auto">
                        {/* Timer Container */}{' '}
                        <div className="flex items-center justify-center w-full mb-[3vh]">
                            <div className="text-[clamp(4rem,15vw,18rem)] font-mono font-bold text-gray-800 dark:text-white tracking-wider leading-none text-center flex items-center justify-center max-w-[75vw] overflow-hidden">
                                {formatTime(timer.timeLeft)}
                            </div>{' '}
                        </div>{' '}
                        {/* Progress Bar Container */}{' '}
                        <div className="w-full flex justify-center mb-[2vh]">
                            <div className="w-[clamp(20rem,80vw,80rem)] bg-gray-200 dark:bg-gray-700 rounded-full h-[clamp(1.5rem,3vh,4rem)] overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ease-out ${
                                        timer.timeLeft === 0
                                            ? 'bg-red-500'
                                            : timer.isRunning
                                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                                            : 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>{' '}
                        {/* Status Container */}
                        <div className="flex items-center justify-center w-full">
                            <div className="flex items-center justify-center gap-2 text-[clamp(1.5rem,4vw,4rem)] flex-wrap">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Status:
                                </span>
                                <span
                                    className={`font-semibold ${
                                        timer.timeLeft === 0
                                            ? 'text-red-600 dark:text-red-400'
                                            : timer.isRunning
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-yellow-600 dark:text-yellow-400'
                                    }`}
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
            </div>
        </div>
    );
}

export default ViewSelectedTimer;
