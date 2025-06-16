import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
    detectTizenTVCapabilities,
    forceApplyTheme,
} from '../utils/tizenTVHelper';
import type { TizenCapabilities } from '../utils/tizenTVHelper';

interface AppliedStyles {
    rootClasses: string;
    bodyClasses: string;
    rootStyle: {
        backgroundColor: string;
        color: string;
    };
    bodyStyle: {
        backgroundColor: string;
        color: string;
    };
}

const TizenTVDebugPanel: React.FC = () => {
    const { theme, isTizenTV, isThemeSwitchSupported, toggleTheme } =
        useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const [capabilities, setCapabilities] = useState<TizenCapabilities | null>(
        null
    );
    const [appliedStyles, setAppliedStyles] = useState<AppliedStyles>({
        rootClasses: '',
        bodyClasses: '',
        rootStyle: { backgroundColor: '', color: '' },
        bodyStyle: { backgroundColor: '', color: '' },
    });

    useEffect(() => {
        if (isTizenTV || !isThemeSwitchSupported) {
            setCapabilities(detectTizenTVCapabilities());

            // Check current applied styles
            const root = document.documentElement;
            const body = document.body;
            setAppliedStyles({
                rootClasses: root.className,
                bodyClasses: body.className,
                rootStyle: {
                    backgroundColor: root.style.backgroundColor,
                    color: root.style.color,
                },
                bodyStyle: {
                    backgroundColor: body.style.backgroundColor,
                    color: body.style.color,
                },
            });
        }
    }, [theme, isTizenTV, isThemeSwitchSupported]);

    if (!isTizenTV && isThemeSwitchSupported) {
        return null; // Only show for Tizen TV or problematic devices
    }

    const toggleDebugPanel = () => {
        setIsVisible(!isVisible);
    };

    const handleForceTheme = (forcedTheme: 'light' | 'dark') => {
        console.log(`Forcing ${forcedTheme} theme from debug panel`);
        forceApplyTheme(forcedTheme);
        localStorage.setItem('theme', forcedTheme);
        // Refresh capabilities after applying theme
        setTimeout(() => {
            setCapabilities(detectTizenTVCapabilities());
        }, 500);
    };

    const refreshCapabilities = () => {
        setCapabilities(detectTizenTVCapabilities());
        const root = document.documentElement;
        const body = document.body;
        setAppliedStyles({
            rootClasses: root.className,
            bodyClasses: body.className,
            rootStyle: {
                backgroundColor: root.style.backgroundColor,
                color: root.style.color,
            },
            bodyStyle: {
                backgroundColor: body.style.backgroundColor,
                color: body.style.color,
            },
        });
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Debug Panel Toggle Button */}
            <button
                onClick={toggleDebugPanel}
                className="px-3 py-2 bg-red-600 text-white text-xs rounded-lg shadow-lg hover:bg-red-700 border-2 border-red-500"
                style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: '2px solid #ef4444',
                    minHeight: '40px',
                    minWidth: '80px',
                }}
            >
                🔧 TV Debug
            </button>

            {/* Debug Panel */}
            {isVisible && (
                <div
                    className="absolute bottom-12 right-0 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4"
                    style={{
                        backgroundColor:
                            theme === 'dark' ? '#1f2937' : '#ffffff',
                        color: theme === 'dark' ? '#f9fafb' : '#111827',
                        border: `2px solid ${
                            theme === 'dark' ? '#4b5563' : '#d1d5db'
                        }`,
                    }}
                >
                    <h3 className="font-bold text-sm mb-3">
                        Tizen TV Debug Panel
                    </h3>

                    {/* Current State */}
                    <div className="mb-3">
                        <h4 className="font-semibold text-xs mb-1">
                            Current State:
                        </h4>
                        <div className="text-xs space-y-1">
                            <div>
                                Theme:{' '}
                                <span className="font-mono">{theme}</span>
                            </div>
                            <div>
                                Tizen TV:{' '}
                                <span className="font-mono">
                                    {isTizenTV ? 'Yes' : 'No'}
                                </span>
                            </div>
                            <div>
                                Theme Support:{' '}
                                <span className="font-mono">
                                    {isThemeSwitchSupported ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Controls */}
                    <div className="mb-3">
                        <h4 className="font-semibold text-xs mb-2">
                            Emergency Controls:
                        </h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleForceTheme('dark')}
                                className="w-full px-2 py-1 text-xs bg-gray-800 text-white rounded"
                                style={{
                                    backgroundColor: '#374151',
                                    color: '#f9fafb',
                                    border: '1px solid #6b7280',
                                }}
                            >
                                🌙 Force Dark Mode
                            </button>
                            <button
                                onClick={() => handleForceTheme('light')}
                                className="w-full px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded"
                                style={{
                                    backgroundColor: '#f3f4f6',
                                    color: '#111827',
                                    border: '1px solid #d1d5db',
                                }}
                            >
                                ☀️ Force Light Mode
                            </button>
                            <button
                                onClick={toggleTheme}
                                className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded"
                                style={{
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    border: '1px solid #3b82f6',
                                }}
                            >
                                🔄 Toggle Theme
                            </button>
                            <button
                                onClick={refreshCapabilities}
                                className="w-full px-2 py-1 text-xs bg-green-600 text-white rounded"
                                style={{
                                    backgroundColor: '#16a34a',
                                    color: '#ffffff',
                                    border: '1px solid #22c55e',
                                }}
                            >
                                🔄 Refresh Debug Info
                            </button>
                        </div>
                    </div>

                    {/* Device Capabilities */}
                    {capabilities && (
                        <div className="mb-3">
                            <h4 className="font-semibold text-xs mb-1">
                                Device Info:
                            </h4>
                            <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                                <div>
                                    Screen: {capabilities.screenSize.width}×
                                    {capabilities.screenSize.height}
                                </div>
                                <div>
                                    CSS3:{' '}
                                    {capabilities.supportsCSS3 ? '✅' : '❌'}
                                </div>
                                <div>
                                    Custom Props:{' '}
                                    {capabilities.supportsCustomProperties
                                        ? '✅'
                                        : '❌'}
                                </div>
                                <div>
                                    ClassList:{' '}
                                    {capabilities.supportsClassList
                                        ? '✅'
                                        : '❌'}
                                </div>
                                <div>
                                    Touch: {capabilities.hasTouch ? '✅' : '❌'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Applied Styles */}
                    <div className="mb-3">
                        <h4 className="font-semibold text-xs mb-1">
                            Applied Styles:
                        </h4>
                        <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
                            <div>
                                Root Classes:{' '}
                                <span className="font-mono text-xs">
                                    {appliedStyles.rootClasses}
                                </span>
                            </div>
                            <div>
                                Root BG:{' '}
                                <span className="font-mono text-xs">
                                    {appliedStyles.rootStyle?.backgroundColor ||
                                        'none'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        <strong>TV Remote:</strong> Use colored buttons to
                        toggle theme
                    </div>
                </div>
            )}
        </div>
    );
};

export default TizenTVDebugPanel;
