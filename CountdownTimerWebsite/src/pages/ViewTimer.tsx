import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

function ViewTimer() {
    const { timerId } = useParams<{ timerId: string }>();

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
    }, [actualTimerId, projectId, WS_BASE_URL]);

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
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-6"></div>
                <p className="text-gray-600 dark:text-gray-400 text-xl">
                    Loading timer...
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
                        )}
                    </div>
                    {/* Error message */}
                    {error && (
                        <div className="mb-12 p-8 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg w-full">
                            <p className="text-red-800 dark:text-red-300 text-center text-2xl">
                                {error}
                            </p>
                        </div>
                    )}{' '}
                    {/* Timer Display */}
                    <div className="w-full flex flex-col items-center justify-center max-w-[80vw] mx-auto">
                        {/* Timer Container */}{' '}
                        <div className="flex items-center justify-center w-full mb-[3vh]">
                            <div className="text-[clamp(4rem,15vw,18rem)] font-mono font-bold text-gray-800 dark:text-white tracking-wider leading-none text-center flex items-center justify-center max-w-[75vw] overflow-hidden">
                                {isLoading ? (
                                    <span className="opacity-50">
                                        Loading...
                                    </span>
                                ) : timer.timeLeft === 0 ? (
                                    'Ende'
                                ) : (
                                    formatTime(timer.timeLeft)
                                )}
                            </div>{' '}
                        </div>{' '}
                        {/* Progress Bar Container */}{' '}
                        <div className="w-full flex justify-center mb-[2vh]">
                            <div className="w-[clamp(20rem,80vw,80rem)] bg-gray-200 dark:bg-gray-700 rounded-full h-[clamp(1.5rem,3vh,4rem)] overflow-hidden">
                                {' '}
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
                                </span>{' '}
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

export default ViewTimer;
