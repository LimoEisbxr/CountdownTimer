import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TimerCard from '../components/timer/TimerCard';
import CreateTimerButton from '../components/timer/CreateTimerButton';

interface ProjectData {
    name: string;
    description: string;
    selected_timer_id?: string | number | null;
}

interface Timer {
    id: string | number;
    name: string;
    description: string;
    duration: number;
}

function ProjectAdminPage() {
    const { projectID } = useParams<{ projectID: string }>();
    const [projectData, setProjectData] = useState<ProjectData | null>(null);
    const [timers, setTimers] = useState<Timer[]>([]);
    const [selectedTimerId, setSelectedTimerId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch project data and timers when component mounts
    useEffect(() => {
        if (projectID) {
            fetchProjectData(projectID);
        }
    }, [projectID]);

    const fetchProjectData = (id: string) => {
        fetch(`/api/projects/${id}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                setProjectData(data);
                setSelectedTimerId(
                    data.selected_timer_id
                        ? String(data.selected_timer_id)
                        : null
                );
                setIsLoading(false);
                setTimers(data.timers || []); // Assuming timers are part of the project data
            })
            .catch((error) => {
                console.error(
                    'There was a problem with the fetch operation:',
                    error
                );
                setError('Failed to load project data');
                setIsLoading(false);
            });
    };
    const handleTimerDeleted = (timerId: string) => {
        // Update local state to remove the deleted timer
        setTimers((prevTimers) =>
            prevTimers.filter((timer) => String(timer.id) !== timerId)
        );
    };
    const handleTimerUpdated = (updatedTimer: {
        id: string;
        name: string;
        description: string;
        duration: number;
    }) => {
        // Update local state with the updated timer
        setTimers((prevTimers) =>
            prevTimers.map((timer) =>
                String(timer.id) === updatedTimer.id
                    ? { ...timer, ...updatedTimer, id: timer.id }
                    : timer
            )
        );
    };
    const handleTimerSelected = (timerId: string) => {
        console.log(
            'DEBUG: ========== PROJECT ADMIN handleTimerSelected =========='
        );
        console.log(
            'DEBUG: handleTimerSelected called with timer ID:',
            timerId
        );
        console.log('DEBUG: Previous selected timer ID:', selectedTimerId);
        console.log('DEBUG: Project data before update:', projectData);

        // Handle deselection (empty string means deselect)
        const newSelectedTimerId = timerId === '' ? null : timerId;

        // Update local state immediately for instant visual feedback
        setSelectedTimerId(newSelectedTimerId);

        // Also update the project data state to reflect the selection
        setProjectData((prev) =>
            prev ? { ...prev, selected_timer_id: newSelectedTimerId } : null
        );

        console.log('DEBUG: Updated selected timer ID to:', newSelectedTimerId);
        console.log(
            'DEBUG: ========== PROJECT ADMIN handleTimerSelected COMPLETE =========='
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="flex justify-between"
                        style={{ minHeight: '5.5rem' }}
                    >
                        <div className="flex flex-col items-start justify-center py-4">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isLoading
                                    ? 'Loading Project...'
                                    : error
                                    ? 'Project Admin'
                                    : `${
                                          projectData?.name || 'Unknown Project'
                                      } - Admin`}
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {isLoading
                                    ? 'Please wait...'
                                    : error
                                    ? error
                                    : projectData?.description ||
                                      'No description available'}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Top Action Bar */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">
                            Project Timers
                        </h2>
                        <div className="flex-shrink-0">
                            {projectID && (
                                <CreateTimerButton
                                    projectId={projectID}
                                    onTimerCreated={() =>
                                        projectID && fetchProjectData(projectID)
                                    }
                                />
                            )}
                        </div>
                    </div>

                    {timers.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                No timers found for this project. Create your
                                first timer!
                            </p>
                            {projectID && (
                                <div className="flex justify-center">
                                    <CreateTimerButton
                                        projectId={projectID}
                                        onTimerCreated={() =>
                                            projectID &&
                                            fetchProjectData(projectID)
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {timers.map((timer) => {
                                const timerIdStr = String(timer.id);
                                const selectedIdStr = String(
                                    selectedTimerId || ''
                                );
                                const isTimerSelected =
                                    selectedIdStr === timerIdStr;

                                return (
                                    <TimerCard
                                        projectId={projectID!}
                                        key={timerIdStr}
                                        id={timerIdStr}
                                        name={timer.name}
                                        description={timer.description}
                                        duration={timer.duration}
                                        isSelected={isTimerSelected}
                                        onTimerDeleted={handleTimerDeleted}
                                        onTimerUpdated={handleTimerUpdated}
                                        onTimerSelected={handleTimerSelected}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProjectAdminPage;
