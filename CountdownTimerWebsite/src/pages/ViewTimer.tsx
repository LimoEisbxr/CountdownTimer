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
                <div className="text-xl text-gray-600 dark:text-gray-300">
                    Loading timer...
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 h-screen">
            <div className="w-[calc(100vw-10vw)] h-[calc(105vh-10vh)] bg-white/90 dark:bg-gray-800/90 shadow-2xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 mx-20 my-20 flex justify-center items-center">
                {/* Timer content */}
                <div className="p-32">
                    {/* Timer name */}
                    <div className="text-center">
                        <h1
                            className="font-bold text-gray-800 dark:text-white mb-4 text-center"
                            style={{ fontSize: '7vw' }}
                        >
                            {timer.name}
                        </h1>
                        {timer.description && (
                            <p
                                className="text-gray-600 dark:text-gray-300 text-center mx-auto"
                                style={{ fontSize: '2vw' }}
                            >
                                {timer.description}
                            </p>
                        )}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-800 dark:text-red-300 text-center">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Large timer display */}
                    <div className="flex justify-center text-center mb-8 align-center flex-col">
                        <div
                            className="font-mono font-bold text-gray-800 dark:text-white mb-6"
                            style={{ fontSize: '12vw' }}
                        >
                            {isLoading ? (
                                <span className="opacity-50">Loading...</span>
                            ) : timer.timeLeft === 0 ? (
                                'Ende'
                            ) : (
                                formatTime(timer.timeLeft)
                            )}
                        </div>

                        {/* Large progress bar */}
                        <div className="flex justify-center mb-8">
                            <div
                                className="bg-gray-200 dark:bg-gray-700 rounded-full"
                                style={{ width: '65vw' }}
                            >
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progress}%`,
                                        height: '5vh',
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewTimer;
