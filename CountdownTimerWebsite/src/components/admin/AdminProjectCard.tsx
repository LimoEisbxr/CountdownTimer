import { useState } from 'react';
import type { ProjectCardProps } from '../../types/ProjectCardProps';

function AdminProjectCard({
    project,
    onProjectDeleted,
    onProjectUpdated,
}: ProjectCardProps) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isClosingDelete, setIsClosingDelete] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isClosingEdit, setIsClosingEdit] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editedName, setEditedName] = useState(project.name);
    const [editedDescription, setEditedDescription] = useState(
        project.description || ''
    );

    const handleEditProject = () => {
        setEditedName(project.name);
        setEditedDescription(project.description || '');
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setIsClosingEdit(true);
        setTimeout(() => {
            setShowEditModal(false);
            setIsClosingEdit(false);
        }, 300); // Match this duration with your CSS transition duration
    };

    const openDeleteConfirmation = () => {
        setShowDeleteModal(true);
    };

    const closeDeleteConfirmation = () => {
        setIsClosingDelete(true);
        setTimeout(() => {
            setShowDeleteModal(false);
            setIsClosingDelete(false);
        }, 300); // Match this duration with the CSS transition
    };

    const submitEdit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUpdating(true);

        fetch(`/api/projects/${project.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: editedName,
                description: editedDescription,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to update project');
                }
                return response.json();
            })
            .then((data) => {
                console.log('Project updated successfully:', data);
                // Notify parent component about update if callback exists
                if (onProjectUpdated) {
                    onProjectUpdated(data);
                }
                setIsUpdating(false);
                closeEditModal();
            })
            .catch((error) => {
                console.error('Error updating project:', error);
                setIsUpdating(false);
                // Could add error state here to show in the modal
            });
    };

    const confirmDelete = () => {
        setIsDeleting(true);

        fetch(`/api/projects/${project.id}`, {
            method: 'DELETE',
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to delete project');
                }
                return response.json();
            })
            .then((data) => {
                console.log('Project deleted successfully:', data);
                setShowDeleteModal(false);
                setIsDeleting(false);
                // Notify parent component about deletion if callback exists
                if (onProjectDeleted) {
                    onProjectDeleted(project.id);
                }
            })
            .catch((error) => {
                console.error('Error deleting project:', error);
                setIsDeleting(false);
                // Could add error state here to show in the modal
            });
    };

    return (
        <>
            {' '}
            <div className="relative bg-white/90 dark:bg-gray-800/90 shadow-md rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] webkit-appearance-none backface-hidden">
                {/* Gradient header */}
                <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                <div className="p-6">
                    {/* Project name */}
                    <h2
                        className="text-xl font-semibold text-gray-800 dark:text-white mb-3 select-text"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {project.name}
                    </h2>
                    {/* Project description */}
                    <div className="mt-4 mb-6">
                        <p
                            className="text-gray-600 dark:text-gray-300 select-text"
                            style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {project.description || 'No description provided'}
                        </p>
                    </div>{' '}
                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 webkit-appearance-none"
                            onClick={handleEditProject}
                            type="button"
                            aria-label="Edit project"
                        >
                            Edit
                        </button>
                        <button
                            className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-opacity-50 webkit-appearance-none"
                            onClick={openDeleteConfirmation}
                            type="button"
                            aria-label="Delete project"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
            {/* Edit Project Modal */}
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
                        <div className="relative mb-5">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                Edit Project
                            </h3>{' '}
                            <button
                                className="absolute top-0 right-0 inline-flex items-center justify-center w-8 h-8 text-gray-600 rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none webkit-appearance-none"
                                onClick={closeEditModal}
                                type="button"
                                aria-label="Close edit modal"
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
                                    htmlFor="projectName"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Project Name
                                </label>{' '}
                                <input
                                    type="text"
                                    id="projectName"
                                    value={editedName}
                                    onChange={(e) =>
                                        setEditedName(e.target.value)
                                    }
                                    required
                                    className="block w-full px-3 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 webkit-appearance-none"
                                    placeholder="Enter project name"
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="projectDescription"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Description
                                </label>{' '}
                                <textarea
                                    id="projectDescription"
                                    value={editedDescription}
                                    onChange={(e) =>
                                        setEditedDescription(e.target.value)
                                    }
                                    rows={3}
                                    className="block w-full px-3 py-2 mt-1 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 webkit-appearance-none"
                                    placeholder="Describe your project"
                                    autoComplete="off"
                                />
                            </div>

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
                                        'Updating...'
                                    ) : (
                                        <>
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
                                                    d="M5 13l4 4L19 7"
                                                ></path>
                                            </svg>
                                            Update Project
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Custom Delete Confirmation Modal */}
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
                            <span className="font-semibold">
                                {project.name}
                            </span>
                            ? This action cannot be undone.
                        </p>

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
                                    'Deleting...'
                                ) : (
                                    <>
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            ></path>
                                        </svg>
                                        Delete Project
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AdminProjectCard;
