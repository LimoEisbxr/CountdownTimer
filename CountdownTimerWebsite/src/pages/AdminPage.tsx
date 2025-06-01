import { useState, useEffect } from 'react';
import CreateProjectButton from '../components/admin/CreateProjectButton';
import AdminProjectCard from '../components/admin/AdminProjectCard';
import type { Project } from '../types/Project';

function AdminPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {/* Top Navigation */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                Project Dashboard
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Top Action Bar */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex-shrink-0">
                            <CreateProjectButton
                                onProjectCreated={fetchProjects}
                            />
                        </div>
                    </div>

                    {/* Projects Grid */}
                    <div className="mt-8">
                        {loading ? (
                            <div className="text-center py-10">
                                <p>Loading projects...</p>
                            </div>
                        ) : projects.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => (
                                    <AdminProjectCard
                                        key={project.id}
                                        project={project}
                                        onProjectUpdated={fetchProjects}
                                        onProjectDeleted={fetchProjects}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p>
                                    No projects found. Create your first project
                                    to get started.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPage;
