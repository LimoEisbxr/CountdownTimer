import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import FullScreenTimer from '../components/FullScreenTimer';

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

    return (
        <FullScreenTimer
            timer={timer}
            isLoading={isLoading}
            error={error}
            loadingText="Loading timer..."
        />
    );
}

export default ViewTimer;
