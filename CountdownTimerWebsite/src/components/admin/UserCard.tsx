import { useState } from 'react';
import type { User } from '../../types/User';
import { ActionButton, ErrorMessage, Modal, FormField } from '../common';

interface UserCardProps {
    user: User;
    currentUserId: number;
    onUserUpdated: () => void;
    onUserDeleted: () => void;
}

function UserCard({
    user,
    currentUserId,
    onUserUpdated,
    onUserDeleted,
}: UserCardProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [formData, setFormData] = useState({
        username: user.username,
        password: '',
        confirmPassword: '',
        is_admin: user.is_admin,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Only validate passwords if they're being updated
        if (
            formData.password &&
            formData.password !== formData.confirmPassword
        ) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password && formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const updateData: Record<string, unknown> = {
                username: formData.username,
                is_admin: formData.is_admin,
            };

            // Only include password if it's being updated
            if (formData.password) {
                updateData.password = formData.password;
            }

            const response = await fetch(`/api/auth/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem(
                        'admin_token'
                    )}`,
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update user');
            }

            setIsEditOpen(false);
            setFormData({
                ...formData,
                password: '',
                confirmPassword: '',
            });
            onUserUpdated();
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Failed to update user'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/auth/users/${user.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem(
                        'admin_token'
                    )}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete user');
            }

            setIsDeleteOpen(false);
            onUserDeleted();
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Failed to delete user'
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isCurrentUser = user.id === currentUserId;

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {user.username}
                            </h3>
                            {user.is_admin && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                    Admin
                                </span>
                            )}
                            {isCurrentUser && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                    You
                                </span>
                            )}
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p>
                                <span className="font-medium">Created:</span>{' '}
                                {formatDate(user.created_at)}
                            </p>
                            <p>
                                <span className="font-medium">Last Login:</span>{' '}
                                {formatDate(user.last_login)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                        <ActionButton
                            onClick={() => setIsEditOpen(true)}
                            variant="secondary"
                            className="p-2 !bg-transparent"
                            aria-label="Edit user"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </ActionButton>

                        {!isCurrentUser && (
                            <ActionButton
                                onClick={() => setIsDeleteOpen(true)}
                                variant="danger"
                                className="p-2 !bg-transparent"
                                aria-label="Delete user"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </ActionButton>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditOpen && (
                <Modal
                    isOpen={isEditOpen}
                    isClosing={false}
                    onClose={() => setIsEditOpen(false)}
                    title={`Edit User: ${user.username}`}
                >
                    <ErrorMessage message={error} />

                    <form onSubmit={handleEdit} className="space-y-4">
                        <FormField
                            label="Username"
                            type="text"
                            value={formData.username}
                            onChange={(value) =>
                                setFormData({
                                    ...formData,
                                    username: value,
                                })
                            }
                            required
                        />

                        <FormField
                            label="New Password (leave blank to keep current)"
                            type="password"
                            value={formData.password}
                            onChange={(value) =>
                                setFormData({
                                    ...formData,
                                    password: value,
                                })
                            }
                            minLength={8}
                        />

                        {formData.password && (
                            <FormField
                                label="Confirm New Password"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        confirmPassword: value,
                                    })
                                }
                                minLength={8}
                            />
                        )}

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id={`is_admin_${user.id}`}
                                checked={formData.is_admin}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        is_admin: e.target.checked,
                                    })
                                }
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                                disabled={isCurrentUser && formData.is_admin} // Prevent removing own admin status
                            />
                            <label
                                htmlFor={`is_admin_${user.id}`}
                                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                            >
                                Administrator privileges
                                {isCurrentUser && formData.is_admin && (
                                    <span className="text-xs text-gray-500 block">
                                        Cannot remove your own admin privileges
                                    </span>
                                )}
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <ActionButton
                                type="button"
                                onClick={() => setIsEditOpen(false)}
                                variant="secondary"
                            >
                                Cancel
                            </ActionButton>
                            <ActionButton
                                type="submit"
                                disabled={loading}
                                variant="primary"
                            >
                                {loading ? 'Updating...' : 'Update User'}
                            </ActionButton>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <Modal
                    isOpen={isDeleteOpen}
                    isClosing={false}
                    onClose={() => setIsDeleteOpen(false)}
                    title="Delete User"
                    maxWidth="max-w-sm"
                >
                    <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900">
                            <svg
                                className="w-6 h-6 text-red-600 dark:text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to delete user{' '}
                            <strong>{user.username}</strong>? This action cannot
                            be undone.
                        </p>
                    </div>

                    <ErrorMessage message={error} />

                    <div className="flex justify-end space-x-3">
                        <ActionButton
                            type="button"
                            onClick={() => setIsDeleteOpen(false)}
                            variant="secondary"
                        >
                            Cancel
                        </ActionButton>
                        <ActionButton
                            onClick={handleDelete}
                            disabled={loading}
                            variant="danger"
                        >
                            {loading ? 'Deleting...' : 'Delete User'}
                        </ActionButton>
                    </div>
                </Modal>
            )}
        </>
    );
}

export default UserCard;
