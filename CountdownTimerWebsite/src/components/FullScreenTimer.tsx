import { type ReactNode } from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import TizenTVDebugPanel from './TizenTVDebugPanel';
import { LoadingSpinner } from './common';
import { useTheme } from '../contexts/ThemeContext';

interface TimerData {
    id?: string;
    name: string;
    description: string;
    duration: number;
    timeLeft: number;
    isRunning: boolean;
    isPaused: boolean;
}

interface FullScreenTimerProps {
    timer: TimerData;
    isLoading: boolean;
    error?: string | null;
    loadingText?: string;
    errorContent?: ReactNode;
    showThemeSwitcher?: boolean;
    showDebugPanel?: boolean;
}

function FullScreenTimer({
    timer,
    isLoading,
    error,
    loadingText = 'Loading timer...',
    errorContent,
    showThemeSwitcher = true,
    showDebugPanel = true,
}: FullScreenTimerProps) {
    const { theme } = useTheme(); // Improved scaling for all device types
    const getDeviceScale = () => {
        const screenWidth = window.innerWidth;

        // Mobile devices (prioritize better mobile experience)
        if (screenWidth <= 480) return 0.4; // Very small phones
        if (screenWidth <= 768) return 0.6; // Phones and small tablets
        if (screenWidth <= 1024) return 0.8; // Tablets

        // Desktop and TV scaling
        if (screenWidth >= 3840) return 2.5; // 4K
        if (screenWidth >= 1920) return 1.8; // Full HD
        if (screenWidth >= 1280) return 1.2; // HD
        return 1; // Fallback for desktop
    };

    const deviceScale = getDeviceScale(); // Dynamic padding based on screen size
    const getPadding = () => {
        const screenWidth = window.innerWidth;
        if (screenWidth <= 480) return 24; // More padding for phones
        if (screenWidth <= 768) return 32; // More padding for tablets
        return 48; // Normal padding for desktop/TV
    };

    const dynamicPadding = getPadding();

    // Dynamic spacing based on screen size
    const getSpacing = () => {
        const screenWidth = window.innerWidth;
        if (screenWidth <= 480) {
            return {
                headerMargin: '16px',
                timerMargin: '24px',
                progressMargin: '20px',
            };
        } else if (screenWidth <= 768) {
            return {
                headerMargin: '24px',
                timerMargin: '32px',
                progressMargin: '30px',
            };
        } else {
            return {
                headerMargin: '40px',
                timerMargin: '60px',
                progressMargin: '40px',
            };
        }
    };

    const spacing = getSpacing();

    // Dynamic progress bar dimensions
    const getProgressBarDimensions = () => {
        const screenWidth = window.innerWidth;
        if (screenWidth <= 480) {
            return {
                width: Math.min(screenWidth * 0.9, 320),
                height: 16,
            };
        } else if (screenWidth <= 768) {
            return {
                width: Math.min(screenWidth * 0.85, 500),
                height: 20,
            };
        } else {
            return {
                width: Math.min(1280, 800 * deviceScale),
                height: Math.min(64, 32 * deviceScale),
            };
        }
    };

    const progressBarDimensions = getProgressBarDimensions(); // Dynamic font sizes with better mobile scaling
    const getFontSizes = () => {
        const screenWidth = window.innerWidth;

        if (screenWidth <= 480) {
            // Very small phones - make timer much larger relative to screen
            return {
                title: Math.min(28, screenWidth * 0.06),
                description: Math.min(14, screenWidth * 0.03),
                timer: Math.min(72, screenWidth * 0.18), // Slightly smaller max to prevent overflow
                error: Math.min(16, screenWidth * 0.035),
                status: Math.min(16, screenWidth * 0.04), // Bigger status text
            };
        } else if (screenWidth <= 768) {
            // Phones and small tablets - bigger timer
            return {
                title: Math.min(40, screenWidth * 0.05),
                description: Math.min(18, screenWidth * 0.022),
                timer: Math.min(100, screenWidth * 0.13), // Slightly smaller max to prevent overflow
                error: Math.min(18, screenWidth * 0.022),
                status: Math.min(20, screenWidth * 0.025), // Bigger status text
            };
        } else {
            // Desktop and TV - use original scaling
            return {
                title: Math.min(144, 80 * deviceScale),
                description: Math.min(64, 32 * deviceScale),
                timer: Math.min(288, 150 * deviceScale),
                error: Math.min(48, 24 * deviceScale),
                status: Math.min(64, 40 * deviceScale),
            };
        }
    };

    const fontSizes = getFontSizes();

    // Format time as HH:MM:SS
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0'),
        ].join(':');
    };

    // Progress calculation
    const progress = Math.max(
        0,
        Math.min(
            100,
            ((timer.duration - timer.timeLeft) / timer.duration) * 100
        )
    );

    // Error state
    if (error && errorContent) {
        return (
            <div
                className="flex flex-col items-center justify-center h-screen"
                style={{
                    backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                    color: theme === 'dark' ? '#f9fafb' : '#111827',
                }}
            >
                {showThemeSwitcher && (
                    <div className="fixed top-4 right-4 z-10">
                        <ThemeSwitcher />
                    </div>
                )}

                {errorContent}

                {showDebugPanel && <TizenTVDebugPanel />}
            </div>
        );
    }

    // Loading state
    if (isLoading && !timer.name) {
        return (
            <div
                className="flex flex-col items-center justify-center h-screen"
                style={{
                    backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                    color: theme === 'dark' ? '#f9fafb' : '#111827',
                }}
            >
                {showThemeSwitcher && (
                    <div className="fixed top-4 right-4 z-10">
                        <ThemeSwitcher />
                    </div>
                )}

                <LoadingSpinner
                    text={loadingText}
                    size="lg"
                    className="text-xl"
                />

                {showDebugPanel && <TizenTVDebugPanel />}
            </div>
        );
    }

    // Main timer display
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
            }}
        >
            {showThemeSwitcher && (
                <div className="fixed top-4 right-4 z-10">
                    <ThemeSwitcher />
                </div>
            )}{' '}
            <div
                style={{
                    width:
                        window.innerWidth <= 768
                            ? `${window.innerWidth - dynamicPadding}px`
                            : `${Math.min(
                                  window.innerWidth - dynamicPadding,
                                  1200 * deviceScale
                              )}px`,
                    height:
                        window.innerWidth <= 768
                            ? `${window.innerHeight - dynamicPadding}px`
                            : `${Math.min(
                                  window.innerHeight - dynamicPadding,
                                  800 * deviceScale
                              )}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    backgroundColor:
                        theme === 'dark'
                            ? 'rgba(31, 41, 55, 0.95)'
                            : 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    borderRadius: window.innerWidth <= 768 ? '12px' : '24px',
                    border: `${
                        window.innerWidth <= 768 ? '2px' : '4px'
                    } solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                }}
            >
                <div
                    className="text-center"
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform:
                            window.innerWidth <= 768
                                ? 'none'
                                : `scale(${Math.min(1, deviceScale * 0.8)})`,
                        transformOrigin: 'center center',
                        padding: window.innerWidth <= 768 ? '16px' : '32px',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            marginBottom: spacing.headerMargin,
                            textAlign: 'center',
                            width: '100%',
                        }}
                    >
                        <h1
                            className="font-bold leading-tight"
                            style={{
                                fontSize: `${fontSizes.title}px`,
                                marginBottom: '20px',
                                lineHeight: '1.1',
                                wordBreak: 'break-word',
                                color: theme === 'dark' ? '#f9fafb' : '#111827',
                            }}
                        >
                            {timer.name}
                        </h1>
                        {timer.description && (
                            <p
                                className="leading-relaxed"
                                style={{
                                    fontSize: `${fontSizes.description}px`,
                                    marginBottom: '20px',
                                    lineHeight: '1.4',
                                    color:
                                        theme === 'dark'
                                            ? '#e5e7eb'
                                            : '#6b7280',
                                }}
                            >
                                {timer.description}
                            </p>
                        )}
                    </div>
                    {/* Error message */}
                    {error && (
                        <div
                            style={{
                                marginBottom: '40px',
                                padding: '20px',
                                border: `2px solid ${
                                    theme === 'dark' ? '#dc2626' : '#fecaca'
                                }`,
                                borderRadius: '12px',
                                width: '100%',
                                backgroundColor:
                                    theme === 'dark'
                                        ? 'rgba(127, 29, 29, 0.3)'
                                        : '#fef2f2',
                            }}
                        >
                            <p
                                style={{
                                    textAlign: 'center',
                                    fontSize: `${fontSizes.error}px`,
                                    color:
                                        theme === 'dark'
                                            ? '#fca5a5'
                                            : '#991b1b',
                                }}
                            >
                                {error}
                            </p>
                        </div>
                    )}{' '}
                    {/* Timer Display */}
                    <div
                        style={{
                            width: '100%',
                            maxWidth: window.innerWidth <= 768 ? '100%' : '90%',
                            margin: '0 auto',
                        }}
                    >
                        {/* Timer Container */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                marginBottom: spacing.timerMargin,
                            }}
                        >
                            {' '}
                            <div
                                className="font-mono font-bold"
                                style={{
                                    fontSize: `${fontSizes.timer}px`,
                                    letterSpacing: '0.1em',
                                    lineHeight: '1',
                                    textAlign: 'center',
                                    fontFamily:
                                        'monospace, Consolas, "Courier New"',
                                    fontWeight: 'bold',
                                    display: 'block',
                                    width: '100%',
                                    overflow: 'visible',
                                    whiteSpace:
                                        window.innerWidth <= 768
                                            ? 'normal'
                                            : 'nowrap',
                                    color:
                                        theme === 'dark'
                                            ? '#f9fafb'
                                            : '#111827',
                                }}
                            >
                                {isLoading ? (
                                    <span className="opacity-50 flex items-center justify-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Loading...
                                    </span>
                                ) : timer.timeLeft === 0 ? (
                                    'Ende'
                                ) : (
                                    formatTime(timer.timeLeft)
                                )}
                            </div>
                        </div>{' '}
                        {/* Progress Bar Container */}
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: spacing.progressMargin,
                            }}
                        >
                            <div
                                className={`progress-bar-container ${
                                    theme === 'dark'
                                        ? 'dark-theme'
                                        : 'light-theme'
                                }`}
                                style={{
                                    width: `${progressBarDimensions.width}px`,
                                    height: `${progressBarDimensions.height}px`,
                                    backgroundColor:
                                        theme === 'dark'
                                            ? '#374151'
                                            : '#e5e7eb',
                                    borderRadius: '9999px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        height: '100%',
                                        width: `${progress}%`,
                                        backgroundColor:
                                            timer.timeLeft === 0
                                                ? '#ef4444'
                                                : timer.isRunning
                                                ? '#22c55e'
                                                : '#eab308',
                                        transition: 'width 1s ease-out',
                                        borderRadius: '9999px',
                                        background:
                                            timer.timeLeft === 0
                                                ? '#ef4444'
                                                : timer.isRunning
                                                ? 'linear-gradient(to right, #4ade80, #16a34a)'
                                                : 'linear-gradient(to right, #facc15, #ca8a04)',
                                    }}
                                ></div>
                            </div>
                        </div>
                        {/* Status Container */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                flexWrap: 'wrap',
                                gap: '10px',
                            }}
                        >
                            {' '}
                            <span
                                style={{
                                    fontSize: `${fontSizes.status}px`,
                                    color:
                                        theme === 'dark'
                                            ? '#9ca3af'
                                            : '#6b7280',
                                }}
                            >
                                Status:
                            </span>
                            <span
                                style={{
                                    fontSize: `${fontSizes.status}px`,
                                    fontWeight: '600',
                                    color:
                                        timer.timeLeft === 0
                                            ? theme === 'dark'
                                                ? '#f87171'
                                                : '#dc2626'
                                            : timer.isRunning
                                            ? theme === 'dark'
                                                ? '#4ade80'
                                                : '#16a34a'
                                            : theme === 'dark'
                                            ? '#facc15'
                                            : '#ca8a04',
                                }}
                            >
                                {timer.timeLeft === 0
                                    ? 'Beendet'
                                    : timer.isRunning
                                    ? 'Läuft'
                                    : 'Pausiert'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            {showDebugPanel && <TizenTVDebugPanel />}
        </div>
    );
}

export default FullScreenTimer;
