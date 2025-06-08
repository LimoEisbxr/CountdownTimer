import React, { useState } from 'react';
import { parseTimeInput } from '../../utils/timeParser';

interface CreateTimerButtonProps {
    projectId: string;
    onTimerCreated?: () => void;
}

function CreateTimerButton({
    projectId,
    onTimerCreated,
}: CreateTimerButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [timerName, setTimerName] = useState('');
    const [timerDescription, setTimerDescription] = useState('');
    const [timerDurationInput, setTimerDurationInput] = useState('60'); // String input for flexible parsing
    const [durationError, setDurationError] = useState<string>('');
    const { createTimer } = useCreateTimer(onTimerCreated);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Parse the duration input on form submission
        const parseResult = parseTimeInput(timerDurationInput);

        if (!parseResult.isValid) {
            setDurationError(parseResult.error || 'Invalid duration format');
            return;
        }

        createTimer(
            projectId,
            timerName,
            timerDescription,
            parseResult.seconds
        );
        resetForm();
        closeModal();
    };

    const resetForm = () => {
        setTimerName('');
        setTimerDescription('');
        setTimerDurationInput('60');
        setDurationError('');
    };

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsClosing(false);
        }, 300);
    }; // Get parsed duration for display purposes (but allow invalid input while typing)
    const getParsedDuration = () => {
        const parseResult = parseTimeInput(timerDurationInput);
        return parseResult.isValid ? parseResult.seconds : 0;
    };
    const viewSelectedTimer = () => {
        window.open(`/view-selected/${projectId}`, '_blank');
    };
    return (
        <>
            <div className="flex gap-3">
                <button
                    className="px-4 py-2 font-medium text-white transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 flex items-center gap-2 transform hover:scale-105"
                    onClick={() => setIsModalOpen(true)}
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
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        ></path>
                    </svg>
                    Create Timer
                </button>
                <button
                    className="px-4 py-2 font-medium text-white transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-600 flex items-center gap-2 transform hover:scale-105"
                    onClick={viewSelectedTimer}
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        ></path>
                    </svg>
                    View Selected Timer
                </button>{' '}
            </div>

            {isModalOpen && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg transition-opacity duration-300 ${
                        isClosing ? 'opacity-0' : 'animate-fadeIn'
                    }`}
                >
                    <div
                        className={`w-full max-w-md p-6 mx-4 overflow-hidden transition-all transform bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl backdrop-blur-sm duration-300 ${
                            isClosing ? 'opacity-0 scale-95' : 'animate-scaleIn'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative mb-5">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                Create New Timer
                            </h3>
                            <button
                                className="absolute top-0 right-0 inline-flex items-center justify-center w-8 h-8 text-gray-600 rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none"
                                onClick={closeModal}
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

                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                    value={timerName}
                                    onChange={(e) =>
                                        setTimerName(e.target.value)
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
                                    value={timerDescription}
                                    onChange={(e) =>
                                        setTimerDescription(e.target.value)
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
                                    value={timerDurationInput}
                                    onChange={(e) => {
                                        setTimerDurationInput(e.target.value);
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
                            {/* Time conversion helper text */}
                            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                {(() => {
                                    const parsedDuration = getParsedDuration();
                                    if (parsedDuration > 0) {
                                        if (parsedDuration >= 3600) {
                                            return (
                                                <span>
                                                    {Math.floor(
                                                        parsedDuration / 3600
                                                    )}
                                                    h{' '}
                                                    {Math.floor(
                                                        (parsedDuration %
                                                            3600) /
                                                            60
                                                    )}
                                                    m {parsedDuration % 60}s
                                                </span>
                                            );
                                        } else if (parsedDuration >= 60) {
                                            return (
                                                <span>
                                                    {Math.floor(
                                                        parsedDuration / 60
                                                    )}
                                                    m {parsedDuration % 60}s
                                                </span>
                                            );
                                        } else {
                                            return (
                                                <span>{parsedDuration}s</span>
                                            );
                                        }
                                    } else {
                                        return (
                                            <span>
                                                Examples: "10m", "1h30m",
                                                "1d2h", "10:10", "14:30" (until
                                                time), or plain seconds
                                            </span>
                                        );
                                    }
                                })()}
                            </div>
                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 border border-transparent rounded-md shadow-sm hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                >
                                    <svg
                                        className="w-4 h-4 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        ></path>
                                    </svg>
                                    Create Timer
                                </button>
                            </div>{' '}
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function useCreateTimer(onTimerCreated?: () => void) {
    const createTimer = (
        projectId: string,
        name: string,
        description: string,
        duration: number
    ) => {
        console.log('Creating Timer:', {
            projectId,
            name,
            description,
            duration,
        });

        fetch(`/api/projects/${projectId}/timers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, description, duration }),
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to create timer');
                }
                return res.json();
            })
            .then((data) => {
                console.log('Timer created successfully:', data);
                // Call the callback function to notify parent component
                if (onTimerCreated) {
                    onTimerCreated();
                }
            })
            .catch((error) => {
                console.error('Error creating timer:', error);
                // Handle error (e.g., show a notification)
            });
    };

    return { createTimer };
}

export default CreateTimerButton;
