import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { parseTimeInput } from '../../utils/timeParser';

interface Timer {
    id: string;
    name: string;
    description: string;
    duration: number;
    timeLeft?: number;
    isRunning?: boolean;
    isPaused?: boolean;
}

interface TimerCardProps {
    projectId: string;
    id: string;
    name: string;
    duration: number; // in seconds
    description?: string;
    isSelected?: boolean;
    onTimerDeleted?: (id: string) => void;
    onTimerUpdated?: (timer: Timer) => void;
    onTimerSelected?: (id: string) => void;
    isViewOnly?: boolean;
    disabled?: boolean;
}

// Dynamically generate API and WebSocket base URLs from the current browser location

function TimerCard({
    projectId,
    id,
    name = 'Countdown Timer',
    duration = 60,
    description = '',
    isSelected = false,
    onTimerDeleted,
    onTimerUpdated,
    onTimerSelected,
    disabled = false,
}: TimerCardProps) {
    const { hostname } = window.location;
    const API_BASE_URL = `/api/projects/${projectId}`;
    const WS_BASE_URL = `wss://${hostname}`;

    // Timer state
    const [currentDuration, setCurrentDuration] = useState(duration);
    const [currentName, setCurrentName] = useState(name);
    const [currentDescription, setCurrentDescription] = useState(
        description || ''
    );
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isClosingDelete, setIsClosingDelete] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isClosingEdit, setIsClosingEdit] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false); // Edit form state
    const [editedName, setEditedName] = useState(name);
    const [editedDescription, setEditedDescription] = useState(
        description || ''
    );
    const [editedDurationInput, setEditedDurationInput] = useState(
        duration.toString()
    );
    const [durationError, setDurationError] = useState<string>('');

    const disabledClasses = 'opacity-30 cursor-not-allowed grayscale-90'; // Define disabled classes

    // WebSocket reference
    const wsRef = useRef<Socket | null>(null); // Format time as HH:MM:SS
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
        // Connect to Socket.IO server
        const socket = io(WS_BASE_URL, {
            path: '/socket.io',
            transports: ['websocket'],
            query: { EIO: '4', transport: 'websocket' },
        });

        wsRef.current = socket;

        // Join the specific timer room
        socket.on('connect', () => {
            console.log(`Socket.IO connection established for timer ${id}`);

            socket.emit('join_timer', {
                project_id: projectId,
                timer_id: id,
            });
        }); // Listen for timer updates
        socket.on('timer_update', (data) => {
            if (String(data.id) === String(id)) {
                console.log('Received timer update:', data);
                // Update timer state based on server data
                if (data.remaining_seconds !== undefined) {
                    setTimeLeft(data.remaining_seconds);
                }

                setIsPaused(data.paused);
                setIsRunning(!data.paused);
                setCurrentName(data.name);
                setCurrentDescription(data.description);

                // Update duration state if provided
                if (data.duration) {
                    setCurrentDuration(data.duration);
                }

                console.log(
                    `Timer ${id}: isRunning: ${!data.paused}, isPaused: ${
                        data.paused
                    }`
                );
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
                socket.disconnect();
                console.log(`Socket.IO connection closed for timer ${id}`);
            }
        };
    }, [
        id,
        projectId,
        WS_BASE_URL,
        isPaused,
        isRunning,
        currentName,
        currentDescription,
    ]);

    // Timer control functions with server communication
    const startTimer = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/timers/${id}/start`, {
                method: 'POST',
            });

            if (response.ok) {
                setIsRunning(true);
                setIsPaused(false);
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            setIsLoading(false);
            setError(null);
        } catch (err) {
            console.error('Error starting timer:', err);
            setError('Failed to start timer');
            setIsLoading(false);
        }
    };

    const pauseTimer = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/timers/${id}/pause`, {
                method: 'POST',
            });

            if (response.ok) {
                setIsPaused(true);
                setIsRunning(false);
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            setIsLoading(false);
            setError(null);
        } catch (err) {
            console.error('Error pausing timer:', err);
            setError('Failed to pause timer');
            setIsLoading(false);
        }
    };
    const resetTimer = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/timers/${id}/reset`, {
                method: 'POST',
            });

            if (response.ok) {
                setTimeLeft(currentDuration);
                setIsRunning(false);
                setIsPaused(false);
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            setIsLoading(false);
            setError(null);
        } catch (err) {
            console.error('Error resetting timer:', err);
            setError('Failed to reset timer');
            setIsLoading(false);
        }
    };
    const selectTimer = async () => {
        console.log(
            'DEBUG: ========== FRONTEND SELECT/DESELECT TIMER =========='
        );
        console.log(
            'DEBUG: selectTimer called for timer ID:',
            id,
            'in project:',
            projectId
        );
        console.log('DEBUG: API_BASE_URL:', API_BASE_URL);
        console.log('DEBUG: onTimerSelected callback:', onTimerSelected);
        console.log('DEBUG: isSelected current state:', isSelected);

        try {
            setIsLoading(true);

            let response;
            let actionType;

            if (isSelected) {
                // Deselect the timer
                actionType = 'deselect';
                console.log(
                    'DEBUG: Deselecting timer - Full URL:',
                    `${API_BASE_URL}/deselect-timer`
                );
                response = await fetch(`${API_BASE_URL}/deselect-timer`, {
                    method: 'POST',
                });
            } else {
                // Select the timer
                actionType = 'select';
                console.log(
                    'DEBUG: Selecting timer - Full URL:',
                    `${API_BASE_URL}/select-timer/${id}`
                );
                response = await fetch(`${API_BASE_URL}/select-timer/${id}`, {
                    method: 'POST',
                });
            }

            console.log(
                `DEBUG: ${actionType}Timer response status:`,
                response.status
            );
            console.log(`DEBUG: ${actionType}Timer response ok:`, response.ok);

            if (response.ok) {
                const responseData = await response.json();
                console.log(
                    `DEBUG: ${actionType}Timer response data:`,
                    responseData
                );

                if (onTimerSelected) {
                    if (isSelected) {
                        // Deselecting - pass null or empty string to indicate no selection
                        console.log(
                            'DEBUG: Calling onTimerSelected with null (deselect)'
                        );
                        onTimerSelected('');
                    } else {
                        // Selecting - pass the timer ID
                        console.log(
                            'DEBUG: Calling onTimerSelected with timer ID:',
                            id
                        );
                        onTimerSelected(id);
                    }
                    console.log('DEBUG: onTimerSelected callback executed');
                } else {
                    console.log(
                        'DEBUG: ERROR - onTimerSelected callback is not defined'
                    );
                }
            } else {
                const errorData = await response.json();
                console.error(
                    `DEBUG: Failed to ${actionType} timer - response not ok:`,
                    errorData
                );
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            setIsLoading(false);
            setError(null);
            console.log(
                `DEBUG: ========== FRONTEND ${actionType.toUpperCase()} TIMER SUCCESS ==========`
            );
        } catch (err) {
            console.error('DEBUG: Error selecting timer:', err);
            setError('Failed to select timer');
            setIsLoading(false);
            console.log(
                'DEBUG: ========== FRONTEND SELECT TIMER ERROR =========='
            );
        }
    }; // Modal control functions
    const handleEditTimer = () => {
        setEditedName(currentName);
        setEditedDescription(currentDescription || '');
        setEditedDurationInput(currentDuration.toString());
        setDurationError('');
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setIsClosingEdit(true);
        setTimeout(() => {
            setShowEditModal(false);
            setIsClosingEdit(false);
        }, 300);
    };

    const openDeleteConfirmation = () => {
        setShowDeleteModal(true);
    };

    const closeDeleteConfirmation = () => {
        setIsClosingDelete(true);
        setTimeout(() => {
            setShowDeleteModal(false);
            setIsClosingDelete(false);
        }, 300);
    }; // Form submission handlers with server communication
    const submitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUpdating(true);
        setError(null);

        // Parse the duration input on form submission
        const parseResult = parseTimeInput(editedDurationInput);

        if (!parseResult.isValid) {
            setDurationError(parseResult.error || 'Invalid duration format');
            setIsUpdating(false);
            return;
        }

        try {
            const updatedTimer = {
                id,
                name: editedName,
                description: editedDescription,
                duration: parseResult.seconds,
            };

            const response = await fetch(`${API_BASE_URL}/timers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedTimer),
            });

            if (response.ok) {
                const responseData = await response.json();

                if (onTimerUpdated) {
                    onTimerUpdated(responseData);
                }

                // Update local state with new values from server
                setTimeLeft(
                    responseData.remaining_seconds || responseData.duration
                );

                setIsUpdating(false);
                closeEditModal();
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (err) {
            console.error('Error updating timer:', err);
            setError('Failed to update timer');
            setIsUpdating(false);
        }
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/timers/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                if (onTimerDeleted) {
                    onTimerDeleted(id);
                }

                setIsDeleting(false);
                closeDeleteConfirmation();
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (err) {
            console.error('Error deleting timer:', err);
            setError('Failed to delete timer');
            setIsDeleting(false);
        }
    };

    // Progress calculation
    const progress = Math.max(
        0,
        Math.min(100, ((currentDuration - timeLeft) / currentDuration) * 100)
    );
    return (
        <>
            <div
                className={`relative shadow-md rounded-lg overflow-hidden border hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] ${
                    isSelected
                        ? 'bg-green-50/90 dark:bg-green-900/20 border-green-300 dark:border-green-600'
                        : 'bg-white/90 dark:bg-gray-800/90 border-gray-100 dark:border-gray-700'
                }`}
            >
                {/* Gradient header */}
                <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                {/* Timer content */}
                <div className="p-6">
                    {' '}
                    {/* Timer name and action buttons */}
                    <div className="flex justify-between items-start mb-3">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white line-clamp-2 flex-1 mr-2">
                            {currentName}
                        </h2>
                        <div className="flex gap-2 flex-shrink-0">
                            {' '}
                            <button
                                className={`px-3 py-1.5 rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                                    isSelected
                                        ? 'bg-green-500 text-white focus:ring-green-400'
                                        : 'bg-gray-500 text-white focus:ring-gray-400'
                                } ${
                                    disabled
                                        ? disabledClasses
                                        : isSelected
                                        ? 'hover:bg-green-600'
                                        : 'hover:bg-gray-600'
                                }`}
                                disabled={disabled}
                                onClick={selectTimer}
                                title={
                                    isSelected
                                        ? 'Deselect Timer'
                                        : 'Select Timer'
                                }
                            >
                                {isSelected ? (
                                    // Checkmark icon when selected
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                        ></path>
                                    </svg>
                                ) : (
                                    // Bookmark icon when not selected
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                        ></path>
                                    </svg>
                                )}
                            </button>
                            <button
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
                                onClick={() => {
                                    window.open(
                                        `/view-timer/${projectId}-${id}`,
                                        '_blank'
                                    );
                                }}
                                title="View Timer"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    ></path>
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    ></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-sm text-red-800 dark:text-red-300">
                                {error}
                            </p>
                        </div>
                    )}
                    {/* Timer description */}
                    <div className="mt-2 mb-4 min-h-[3rem]">
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                            {currentDescription || '\u00A0'}
                        </p>
                    </div>
                    {/* Timer display */}
                    <div className="mt-4 mb-4">
                        <div className="text-3xl font-mono text-center font-bold text-gray-800 dark:text-white mb-2">
                            {isLoading ? (
                                <span className="opacity-50">Loading...</span>
                            ) : (
                                formatTime(timeLeft)
                            )}
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                    {/* Control buttons */}
                    <div className="flex justify-between items-center mb-4">
                        {/* Left side - Start/Resume/Pause button */}
                        <div className="flex gap-2">
                            {!isRunning && !isPaused && (
                                <button
                                    onClick={startTimer}
                                    disabled={isLoading || disabled}
                                    className={`px-6 py-3 bg-blue-500 text-white rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 text-lg font-medium ${
                                        isLoading || disabled
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-blue-600'
                                    } ${disabled ? 'grayscale-90' : ''}`}
                                >
                                    <svg
                                        className="w-10 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                        ></path>
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        ></path>
                                    </svg>
                                </button>
                            )}

                            {isRunning && (
                                <button
                                    onClick={pauseTimer}
                                    disabled={isLoading || disabled}
                                    className={`px-6 py-3 bg-yellow-500 text-white rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-lg font-medium ${
                                        isLoading || disabled
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-yellow-600'
                                    } ${disabled ? 'grayscale-90' : ''}`}
                                >
                                    <svg
                                        className="w-10 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        ></path>
                                    </svg>
                                </button>
                            )}

                            {isPaused && (
                                <button
                                    onClick={startTimer}
                                    disabled={isLoading || disabled}
                                    className={`px-6 py-3 bg-blue-500 text-white rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 text-lg font-medium ${
                                        isLoading || disabled
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-blue-600'
                                    } ${disabled ? 'grayscale-90' : ''}`}
                                >
                                    <svg
                                        className="w-10 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                        ></path>
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        ></path>
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Right side buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={resetTimer}
                                disabled={isLoading || disabled}
                                className={`px-4 py-3 bg-gray-500 text-white rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ${
                                    isLoading || disabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-gray-600'
                                } ${disabled ? 'grayscale-90' : ''}`}
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    ></path>
                                </svg>
                            </button>

                            <button
                                className={`px-4 py-3 bg-blue-500 text-white rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 ${
                                    disabled
                                        ? disabledClasses
                                        : 'hover:bg-blue-600'
                                }`}
                                onClick={handleEditTimer}
                                disabled={disabled}
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    ></path>
                                </svg>
                            </button>

                            <button
                                className={`px-4 py-3 bg-red-500 text-white rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 ${
                                    disabled
                                        ? disabledClasses
                                        : 'hover:bg-red-600'
                                }`}
                                onClick={openDeleteConfirmation}
                                disabled={disabled}
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    ></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Timer Modal */}
            {/* ... existing modal code remains the same ... */}
            {showEditModal && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg transition-opacity duration-300 ${
                        isClosingEdit ? 'opacity-0' : 'animate-fadeIn'
                    }`}
                >
                    <div
                        className={`w-full max-w-md p-6 mx-4 overflow-hidden transition-all transform bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl backdrop-blur-sm duration-300 ${
                            isClosingEdit
                                ? 'opacity-0 scale-95'
                                : 'animate-scaleIn'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ... existing modal content ... */}
                        <div className="relative mb-5">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                Edit Timer
                            </h3>
                            <button
                                className="absolute top-0 right-0 inline-flex items-center justify-center w-8 h-8 text-gray-600 rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none"
                                onClick={closeEditModal}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    ></path>
                                </svg>
                                <span className="sr-only">Close</span>
                            </button>
                        </div>

                        <form onSubmit={submitEdit} className="space-y-5">
                            <div>
                                <label
                                    htmlFor="timerName"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Timer Name
                                </label>
                                <input
                                    type="text"
                                    id="timerName"
                                    value={editedName}
                                    onChange={(e) =>
                                        setEditedName(e.target.value)
                                    }
                                    required
                                    className="block w-full px-3 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                                    placeholder="Enter timer name"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="timerDescription"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Description (optional)
                                </label>
                                <textarea
                                    id="timerDescription"
                                    value={editedDescription}
                                    onChange={(e) =>
                                        setEditedDescription(e.target.value)
                                    }
                                    rows={2}
                                    className="block w-full px-3 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                                    placeholder="Describe your timer"
                                />
                            </div>{' '}
                            <div>
                                <label
                                    htmlFor="timerDuration"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Duration
                                </label>
                                <input
                                    type="text"
                                    id="timerDuration"
                                    value={editedDurationInput}
                                    onChange={(e) => {
                                        setEditedDurationInput(e.target.value);
                                        // Clear error when user starts typing
                                        if (durationError) {
                                            setDurationError('');
                                        }
                                    }}
                                    required
                                    className="block w-full px-3 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                                    placeholder="e.g., 10m, 1h30m, 10:10, or 300"
                                />
                                {durationError && (
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        {durationError}
                                    </p>
                                )}
                            </div>
                            {error && (
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                                    <p className="text-sm text-red-800 dark:text-red-300">
                                        {error}
                                    </p>
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                    onClick={closeEditModal}
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 border border-transparent rounded-md shadow-sm hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                >
                                    {isUpdating ? (
                                        <svg
                                            className="w-4 h-4 animate-spin"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            ></path>
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M5 13l4 4L19 7"
                                            ></path>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg transition-opacity duration-300 ${
                        isClosingDelete ? 'opacity-0' : 'animate-fadeIn'
                    }`}
                >
                    <div
                        className={`w-full max-w-md p-6 mx-4 overflow-hidden transition-all transform bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl backdrop-blur-sm duration-300 ${
                            isClosingDelete
                                ? 'opacity-0 scale-95'
                                : 'animate-scaleIn'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative mb-5">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                Confirm Deletion
                            </h3>
                            <button
                                className="absolute top-0 right-0 inline-flex items-center justify-center w-8 h-8 text-gray-600 rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none"
                                onClick={closeDeleteConfirmation}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    ></path>
                                </svg>
                                <span className="sr-only">Close</span>
                            </button>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{currentName}</span>
                            ? This action cannot be undone.
                        </p>

                        {error && (
                            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-sm text-red-800 dark:text-red-300">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                onClick={closeDeleteConfirmation}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                            >
                                {isDeleting ? (
                                    <svg
                                        className="w-6 h-6 animate-spin"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        ></path>
                                    </svg>
                                ) : (
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        ></path>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default TimerCard;
