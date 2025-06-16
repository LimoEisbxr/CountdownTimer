import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSwitcher: React.FC = () => {
    const { theme, toggleTheme, isTizenTV, isThemeSwitchSupported } =
        useTheme();

    const handleClick = () => {
        console.log('ThemeSwitcher clicked, current theme:', theme);
        console.log('Is Tizen TV:', isTizenTV);
        console.log('Theme switch supported:', isThemeSwitchSupported);
        console.log(
            'Document classes before toggle:',
            document.documentElement.className
        );
        toggleTheme();
        // Check after a small delay to see the result
        setTimeout(() => {
            console.log(
                'Document classes after toggle:',
                document.documentElement.className
            );
        }, 100);
    }; // Enhanced styling for Tizen TV
    const buttonClasses = isTizenTV
        ? 'relative inline-flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 focus:outline-none border-2 tv-button'
        : 'relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800';

    // Use CSS custom properties for Tizen TV compatibility
    const buttonStyle = isTizenTV
        ? {
              backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
              borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db',
              color: theme === 'dark' ? '#f9fafb' : '#111827',
          }
        : {};

    return (
        <div className="flex items-center space-x-2">
            {/* Show device info for debugging on Tizen TV */}
            {isTizenTV && (
                <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                        backgroundColor:
                            theme === 'dark' ? '#1f2937' : '#e5e7eb',
                        color: theme === 'dark' ? '#e5e7eb' : '#374151',
                    }}
                >
                    TV
                </span>
            )}

            <button
                onClick={handleClick}
                className={buttonClasses}
                style={buttonStyle}
                aria-label={`Switch to ${
                    theme === 'light' ? 'dark' : 'light'
                } mode`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode${
                    isTizenTV ? ' (TV Mode)' : ''
                }`}
            >
                {/* Sun Icon (Light Mode) */}
                <svg
                    className={`absolute w-6 h-6 transition-all duration-300 ${
                        theme === 'light'
                            ? 'opacity-100 rotate-0 scale-100'
                            : 'opacity-0 rotate-90 scale-75'
                    }`}
                    fill={
                        isTizenTV
                            ? theme === 'dark'
                                ? '#f59e0b'
                                : '#d97706'
                            : 'currentColor'
                    }
                    style={{
                        color: isTizenTV
                            ? undefined
                            : theme === 'light'
                            ? '#f59e0b'
                            : 'transparent',
                    }}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>

                {/* Moon Icon (Dark Mode) */}
                <svg
                    className={`absolute w-6 h-6 transition-all duration-300 ${
                        theme === 'dark'
                            ? 'opacity-100 rotate-0 scale-100'
                            : 'opacity-0 -rotate-90 scale-75'
                    }`}
                    fill={
                        isTizenTV
                            ? theme === 'dark'
                                ? '#60a5fa'
                                : '#3b82f6'
                            : 'currentColor'
                    }
                    style={{
                        color: isTizenTV
                            ? undefined
                            : theme === 'dark'
                            ? '#60a5fa'
                            : 'transparent',
                    }}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
        </div>
    );
};

export default ThemeSwitcher;
