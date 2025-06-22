import { useState } from 'react';
import { Modal, FormField, ErrorMessage, ActionButton } from '../common';

interface CreateUserButtonProps {
    onUserCreated: () => void;
}

function CreateUserButton({ onUserCreated }: CreateUserButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        is_admin: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 300); // Match this duration with your CSS transition duration
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem(
                        'admin_token'
                    )}`,
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    is_admin: formData.is_admin,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create user');
            }

            setFormData({
                username: '',
                password: '',
                confirmPassword: '',
                is_admin: false,
            });
            closeModal();
            onUserCreated();
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Failed to create user'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
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
                        d="M12 4v16m8-8H4"
                    />
                </svg>
                Add User
            </button>

            <Modal
                isOpen={isOpen}
                isClosing={isClosing}
                onClose={closeModal}
                title="Create New User"
            >
                <ErrorMessage message={error} />

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(value) =>
                            setFormData({
                                ...formData,
                                password: value,
                            })
                        }
                        required
                        minLength={8}
                    />

                    <FormField
                        label="Confirm Password"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(value) =>
                            setFormData({
                                ...formData,
                                confirmPassword: value,
                            })
                        }
                        required
                        minLength={8}
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                        <ActionButton
                            type="button"
                            variant="secondary"
                            onClick={closeModal}
                            disabled={loading}
                        >
                            Cancel
                        </ActionButton>
                        <ActionButton
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            loading={loading}
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </ActionButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}

export default CreateUserButton;
