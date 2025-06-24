import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface LoginProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (username: string, password: string) => Promise<void>;
    onViewOnly?: () => void;
    title?: string;
    subtitle?: string;
    showOnlyViewButton?: boolean;
}

const Login: React.FC<LoginProps> = ({
    isOpen,
    onClose,
    onLogin,
    onViewOnly,
    title = 'Login',
    subtitle = 'Please sign in to your account',
    showOnlyViewButton = false,
}) => {
    const { isTizenTV } = useTheme();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
            // Reset form state when closing
            setUsername('');
            setPassword('');
            setError('');
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onLogin(username.trim(), password);
            // Clear form on successful login
            setUsername('');
            setPassword('');
            handleClose();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Login failed. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // Enhanced button classes for TV compatibility
    const buttonClasses = isTizenTV
        ? 'inline-flex items-center justify-center px-6 py-3 min-h-12 text-sm font-medium border-2 rounded-md transition-all duration-200 focus:outline-none tv-button'
        : 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-transparent rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg transition-opacity duration-300 ${
                isClosing ? 'opacity-0' : 'animate-fadeIn'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            tabIndex={-1}
        >
            <div
                className={`w-full max-w-md p-6 mx-4 overflow-hidden transition-all transform bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl backdrop-blur-sm duration-300 ${
                    isClosing ? 'opacity-0 scale-95' : 'animate-scaleIn'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Gradient header */}
                <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-xl -mx-6 -mt-6 mb-6"></div>

                {/* Header with close button */}
                <div className="relative mb-6">
                    <div className="text-center">
                        <h2
                            id="login-title"
                            className="text-2xl font-bold text-gray-800 dark:text-white mb-2"
                        >
                            {title}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                        <div className="flex items-center">
                            <svg
                                className="w-5 h-5 text-red-800 dark:text-red-300 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                            <p className="text-sm text-red-800 dark:text-red-300">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* Login form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            Username or Email
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            className="block w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Enter your username or email"
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="block w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-between flex-col gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`${buttonClasses} text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex-1`}
                            style={
                                isTizenTV
                                    ? {
                                          background:
                                              'linear-gradient(to right, #3b82f6, #4f46e5)',
                                          borderColor: '#3b82f6',
                                          color: '#ffffff',
                                      }
                                    : {}
                            }
                        >
                            {isLoading ? (
                                <>
                                    <svg
                                        className="w-4 h-4 mr-2 animate-spin"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        {/* View Only Button */}
                        {showOnlyViewButton && (
                            <button
                                disabled={isLoading}
                                className={`${buttonClasses} text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex-1`}
                                onClick={() => {
                                    if (onViewOnly) {
                                        onViewOnly();
                                    }
                                }}
                                type="button"
                                style={
                                    isTizenTV
                                        ? {
                                              background:
                                                  'linear-gradient(to right, #6b7280, #4b5563)',
                                              borderColor: '#6b7280',
                                              color: '#ffffff',
                                          }
                                        : {
                                              background: '#6b7280',
                                          }
                                }
                            >
                                Continue without Login
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
