import React, { useState } from 'react';
import { parseTimeInput } from '../../utils/timeParser';
import { Modal, FormField, TextAreaField, ActionButton } from '../common';

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
            </div>{' '}
            <Modal
                isOpen={isModalOpen}
                isClosing={isClosing}
                onClose={closeModal}
                title="Create New Timer"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {' '}
                    <FormField
                        label="Timer Name"
                        type="text"
                        value={timerName}
                        onChange={setTimerName}
                        placeholder="Enter timer name"
                        required
                    />
                    <TextAreaField
                        label="Description (optional)"
                        value={timerDescription}
                        onChange={setTimerDescription}
                        rows={2}
                        placeholder="Describe your timer"
                    />{' '}
                    <div>
                        <FormField
                            label="Duration"
                            type="text"
                            value={timerDurationInput}
                            onChange={(value) => {
                                setTimerDurationInput(value);
                                if (durationError) {
                                    setDurationError('');
                                }
                            }}
                            placeholder="e.g., 10m, 1h30m, 10:10, or 300"
                            required
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
                                            {Math.floor(parsedDuration / 3600)}h{' '}
                                            {Math.floor(
                                                (parsedDuration % 3600) / 60
                                            )}
                                            m {parsedDuration % 60}s
                                        </span>
                                    );
                                } else if (parsedDuration >= 60) {
                                    return (
                                        <span>
                                            {Math.floor(parsedDuration / 60)}m{' '}
                                            {parsedDuration % 60}s
                                        </span>
                                    );
                                } else {
                                    return <span>{parsedDuration}s</span>;
                                }
                            } else {
                                return (
                                    <span>
                                        Examples: "10m", "1h30m", "1d2h",
                                        "10:10", "14:30" (until time), or plain
                                        seconds
                                    </span>
                                );
                            }
                        })()}
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-6">
                        <ActionButton
                            type="button"
                            variant="secondary"
                            onClick={closeModal}
                        >
                            Cancel
                        </ActionButton>
                        <ActionButton
                            type="submit"
                            variant="primary"
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                        >
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Create Timer
                        </ActionButton>
                    </div>
                </form>
            </Modal>
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
