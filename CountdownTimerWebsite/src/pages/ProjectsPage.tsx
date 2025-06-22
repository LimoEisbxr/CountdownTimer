import { useState, useEffect } from 'react';
import ProjectCard from '../components/projects/ProjectCard';
import ThemeSwitcher from '../components/ThemeSwitcher';
import TizenTVDebugPanel from '../components/TizenTVDebugPanel';
import { LoadingSpinner, EmptyState } from '../components/common';
import { useTheme } from '../contexts/ThemeContext';
import { forceApplyTheme } from '../utils/tizenTVHelper';
import type { Project } from '../types/Project';

function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const { theme, isTizenTV, isThemeSwitchSupported } = useTheme();

    useEffect(() => {
        fetchProjects();
    }, []);

    function fetchProjects() {
        setLoading(true);
        fetch('/api/projects')
            .then((response) => response.json())
            .then((data) => {
                setProjects(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching projects:', error);
                setLoading(false);
            });
    }

    // Emergency theme controls for Tizen TV
    const handleEmergencyDark = () => {
        console.log('Emergency dark mode activated');
        forceApplyTheme('dark');
        localStorage.setItem('theme', 'dark');
    };

    const handleEmergencyLight = () => {
        console.log('Emergency light mode activated');
        forceApplyTheme('light');
        localStorage.setItem('theme', 'light');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                Projects
                            </h1>
                            {/* Debug info for Tizen TV */}
                            {isTizenTV && (
                                <div className="ml-4 text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                                    Tizen TV Mode - Theme: {theme}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Emergency theme controls for Tizen TV */}
                            {(isTizenTV || !isThemeSwitchSupported) && (
                                <>
                                    <button
                                        onClick={handleEmergencyDark}
                                        className="px-3 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 border border-gray-600"
                                        title="Force Dark Mode"
                                    >
                                        🌙 Dark
                                    </button>
                                    <button
                                        onClick={handleEmergencyLight}
                                        className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 border border-gray-300"
                                        title="Force Light Mode"
                                    >
                                        ☀️ Light
                                    </button>
                                </>
                            )}
                            <ThemeSwitcher />
                        </div>
                    </div>
                </div>
            </header>
            {/* Main Content */}
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {' '}
                    {/* Projects Grid */}
                    <div className="mt-8">
                        {loading ? (
                            <LoadingSpinner text="Loading projects..." />
                        ) : projects.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon="📁"
                                title="No projects available"
                                description="No projects are available at this time."
                            />
                        )}
                    </div>{' '}
                </div>
            </div>

            {/* Tizen TV Debug Panel */}
            <TizenTVDebugPanel />
        </div>
    );
}

export default ProjectsPage;
