import React, { useState, useEffect } from 'react';
import type { User } from '../../types/User';
import {
    Modal,
    FormField,
    TextAreaField,
    UserCheckboxList,
    ActionButton,
} from '../common';

interface CreateProjectButtonProps {
    onProjectCreated?: () => void;
}

function CreateProjectButton({ onProjectCreated }: CreateProjectButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const { createProject } = useCreateProject(onProjectCreated);
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        createProject(projectName, projectDescription, selectedUsers);
        setProjectName('');
        setProjectDescription('');
        setSelectedUsers([]);
        closeModal();
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await fetch('/api/auth/users', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem(
                        'admin_token'
                    )}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                // Filter out admin users since they already have access to all projects
                setUsers(data.users.filter((user: User) => !user.is_admin));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const toggleUserSelection = (userId: number) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    useEffect(() => {
        if (isModalOpen) {
            fetchUsers();
        }
    }, [isModalOpen]);

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsClosing(false);
        }, 300); // Match this duration with your CSS transition duration
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
                Create Project
            </button>{' '}
            <Modal
                isOpen={isModalOpen}
                isClosing={isClosing}
                onClose={closeModal}
                title="Create New Project"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {' '}
                    <FormField
                        label="Project Name"
                        type="text"
                        value={projectName}
                        onChange={setProjectName}
                        placeholder="Enter project name"
                        required
                    />
                    <TextAreaField
                        label="Description"
                        value={projectDescription}
                        onChange={setProjectDescription}
                        placeholder="Describe your project"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            User Permissions
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Select which non-admin users can edit this project.
                            Admin users always have access to all projects.
                        </p>

                        <UserCheckboxList
                            users={users}
                            selectedUsers={selectedUsers}
                            onToggleUser={toggleUserSelection}
                            loading={loadingUsers}
                        />
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
                            Create Project
                        </ActionButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}

function useCreateProject(onProjectCreated?: () => void) {
    const createProject = async (
        name: string,
        description: string,
        authorizedUsers: number[] = []
    ) => {
        // Logic to create a project goes here
        console.log('Creating Project:', {
            name,
            description,
            authorizedUsers,
        });

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem(
                        'admin_token'
                    )}`,
                },
                body: JSON.stringify({ name, description }),
            });

            if (!response.ok) {
                throw new Error('Failed to create project');
            }

            const projectData = await response.json();
            console.log('Project created successfully:', projectData); // Set user permissions for the newly created project
            if (authorizedUsers.length > 0) {
                await Promise.all(
                    authorizedUsers.map(async (userId) => {
                        try {
                            // Get current user permissions
                            const userPermissionsResponse = await fetch(
                                `/api/auth/users/${userId}/projects`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${localStorage.getItem(
                                            'admin_token'
                                        )}`,
                                        'Content-Type': 'application/json',
                                    },
                                }
                            );

                            if (userPermissionsResponse.ok) {
                                const userPermissions =
                                    await userPermissionsResponse.json();
                                const currentProjectIds =
                                    userPermissions.authorized_projects.map(
                                        (p: { id: number }) => p.id
                                    );

                                // Add this project to user's permissions
                                const updatedProjectIds = [
                                    ...currentProjectIds,
                                    projectData.id,
                                ];

                                const permissionResponse = await fetch(
                                    `/api/auth/users/${userId}/projects`,
                                    {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${localStorage.getItem(
                                                'admin_token'
                                            )}`,
                                        },
                                        body: JSON.stringify({
                                            project_ids: updatedProjectIds,
                                        }),
                                    }
                                );

                                if (!permissionResponse.ok) {
                                    console.error(
                                        `Failed to set permissions for user ${userId}`
                                    );
                                }
                            }
                        } catch (error) {
                            console.error(
                                `Error setting permissions for user ${userId}:`,
                                error
                            );
                        }
                    })
                );
            }

            // Call the callback function to notify parent component
            if (onProjectCreated) {
                onProjectCreated();
            }
        } catch (error) {
            console.error('Error creating project:', error);
            // Handle error (e.g., show a notification)
        }
    };
    return { createProject };
}
export default CreateProjectButton;
