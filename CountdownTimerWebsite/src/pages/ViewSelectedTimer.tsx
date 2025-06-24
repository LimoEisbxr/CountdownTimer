import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import FullScreenTimer from '../components/FullScreenTimer';
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

    // Fetch selected timer data
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

    // Custom error content for no selected timer
    const errorContent = error ? (
        <div className="text-center p-8">
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
        </div>
    ) : null;

    return (
        <FullScreenTimer
            timer={timer}
            isLoading={isLoading}
            error={error}
            loadingText="Loading selected timer..."
            errorContent={errorContent}
        />
    );
}

export default ViewSelectedTimer;
