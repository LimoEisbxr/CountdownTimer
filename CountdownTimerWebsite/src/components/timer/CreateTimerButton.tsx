import React, { useState } from 'react';

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
    const [timerDuration, setTimerDuration] = useState(60); // Default 60 seconds
    const { createTimer } = useCreateTimer(onTimerCreated);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        createTimer(projectId, timerName, timerDescription, timerDuration);
        resetForm();
        closeModal();
    };

    const resetForm = () => {
        setTimerName('');
        setTimerDescription('');
        setTimerDuration(60);
    };

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsClosing(false);
        }, 300);
    };

    return (
        <>
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
                            </div>

                            <div>
                                <label
                                    htmlFor="timerDuration"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Duration (seconds)
                                </label>
                                <input
                                    type="number"
                                    id="timerDuration"
                                    value={timerDuration}
                                    onChange={(e) =>
                                        setTimerDuration(
                                            Math.max(
                                                1,
                                                parseInt(e.target.value) || 0
                                            )
                                        )
                                    }
                                    min="1"
                                    required
                                    className="block w-full px-3 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                                    placeholder="Enter duration in seconds"
                                />
                            </div>

                            {/* Time conversion helper text */}
                            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                {timerDuration >= 3600 ? (
                                    <span>
                                        {Math.floor(timerDuration / 3600)}h{' '}
                                        {Math.floor(
                                            (timerDuration % 3600) / 60
                                        )}
                                        m {timerDuration % 60}s
                                    </span>
                                ) : timerDuration >= 60 ? (
                                    <span>
                                        {Math.floor(timerDuration / 60)}m{' '}
                                        {timerDuration % 60}s
                                    </span>
                                ) : (
                                    <span>{timerDuration}s</span>
                                )}
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
                            </div>
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
