import React, { createContext, useContext, useEffect, useState } from 'react';
import { preserveProgressBars } from '../utils/tizenTVHelper';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isTizenTV: boolean;
    isThemeSwitchSupported: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Device detection utilities
const detectTizenTV = (): boolean => {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    // Check for Tizen TV specific identifiers
    return (
        userAgent.includes('tizen') ||
        userAgent.includes('smart-tv') ||
        userAgent.includes('smarttv') ||
        platform.includes('tizen') ||
        // Samsung TV specific checks
        (userAgent.includes('samsung') &&
            (userAgent.includes('tv') ||
                userAgent.includes('webos') ||
                userAgent.includes('netcast'))) ||
        // Additional TV browser checks
        userAgent.includes('hbbtv') ||
        userAgent.includes('ce-html') ||
        // Check for TV screen characteristics
        (typeof screen !== 'undefined' &&
            screen.width >= 1920 &&
            screen.height >= 1080 &&
            !('ontouchstart' in window) &&
            !window.matchMedia('(pointer: fine)').matches)
    );
};

const detectThemeSwitchSupport = (): boolean => {
    // Check if the browser supports proper CSS custom properties and classes
    if (typeof window === 'undefined') return false;

    try {
        // Test if CSS custom properties work
        const testElement = document.createElement('div');
        testElement.style.setProperty('--test-prop', 'test');
        const supportsCustomProps =
            testElement.style.getPropertyValue('--test-prop') === 'test';

        // Test if matchMedia works properly
        const supportsMatchMedia =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-color-scheme: dark)').media !==
                'not all';

        // Test if classList manipulation works
        const supportsClassList = 'classList' in document.documentElement;

        return supportsCustomProps && supportsMatchMedia && supportsClassList;
    } catch (error) {
        console.warn('Theme support detection failed:', error);
        return false;
    }
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [isTizenTV] = useState(() => detectTizenTV());
    const [isThemeSwitchSupported] = useState(() => detectThemeSwitchSupport());

    const [theme, setTheme] = useState<Theme>(() => {
        // For Tizen TV or unsupported devices, default to dark mode for better visibility
        if (isTizenTV || !isThemeSwitchSupported) {
            const saved = localStorage.getItem('theme') as Theme;
            return saved || 'dark'; // Default to dark for TV
        }

        // Check localStorage first, then system preference for supported devices
        const saved = localStorage.getItem('theme') as Theme;
        if (saved) {
            return saved;
        }

        // Check system preference
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
        }

        return 'light';
    });
    useEffect(() => {
        const applyTheme = (currentTheme: Theme) => {
            const root = document.documentElement;

            if (isTizenTV || !isThemeSwitchSupported) {
                // For Tizen TV, apply inline styles directly since CSS classes might not work
                applyTizenTVTheme(currentTheme);
            } else {
                // Standard theme application for supported devices
                root.classList.remove('light', 'dark');
                root.classList.add(currentTheme);
            }

            // Save to localStorage
            localStorage.setItem('theme', currentTheme);

            // Update meta theme-color for mobile browsers
            const metaThemeColor = document.querySelector(
                'meta[name="theme-color"]'
            );
            if (metaThemeColor) {
                metaThemeColor.setAttribute(
                    'content',
                    currentTheme === 'dark' ? '#1f2937' : '#ffffff'
                );
            } else {
                const newMeta = document.createElement('meta');
                newMeta.name = 'theme-color';
                newMeta.content =
                    currentTheme === 'dark' ? '#1f2937' : '#ffffff';
                document.head.appendChild(newMeta);
            }
        };

        // Tizen TV specific theme application using CSS custom properties
        const applyTizenTVTheme = (currentTheme: Theme) => {
            const root = document.documentElement;

            // Remove existing theme classes
            root.classList.remove('light', 'dark');
            root.classList.add(currentTheme);

            // Apply CSS custom properties for better Tizen TV compatibility
            if (currentTheme === 'dark') {
                root.style.setProperty('--bg-primary', '#111827'); // gray-900
                root.style.setProperty('--bg-secondary', '#1f2937'); // gray-800
                root.style.setProperty('--bg-tertiary', '#374151'); // gray-700
                root.style.setProperty('--text-primary', '#f9fafb'); // gray-50
                root.style.setProperty('--text-secondary', '#e5e7eb'); // gray-200
                root.style.setProperty('--text-muted', '#9ca3af'); // gray-400
                root.style.setProperty('--border-color', '#4b5563'); // gray-600
                root.style.setProperty('--button-bg', '#374151'); // gray-700
                root.style.setProperty('--button-hover', '#4b5563'); // gray-600
                root.style.setProperty('--card-bg', '#1f2937'); // gray-800
            } else {
                root.style.setProperty('--bg-primary', '#f9fafb'); // gray-50
                root.style.setProperty('--bg-secondary', '#ffffff'); // white
                root.style.setProperty('--bg-tertiary', '#f3f4f6'); // gray-100
                root.style.setProperty('--text-primary', '#111827'); // gray-900
                root.style.setProperty('--text-secondary', '#374151'); // gray-700
                root.style.setProperty('--text-muted', '#6b7280'); // gray-500
                root.style.setProperty('--border-color', '#d1d5db'); // gray-300
                root.style.setProperty('--button-bg', '#f3f4f6'); // gray-100
                root.style.setProperty('--button-hover', '#e5e7eb'); // gray-200
                root.style.setProperty('--card-bg', '#ffffff'); // white
            }

            // Apply styles directly to body for immediate effect
            document.body.style.backgroundColor =
                currentTheme === 'dark' ? '#111827' : '#f9fafb';
            document.body.style.color =
                currentTheme === 'dark' ? '#f9fafb' : '#111827';

            console.log(`Applied ${currentTheme} theme for Tizen TV`);
        };
        applyTheme(theme);

        // Preserve progress bars after theme application
        setTimeout(() => preserveProgressBars(theme), 200);

        // Add device info to console for debugging
        if (isTizenTV) {
            console.log('Tizen TV detected - using enhanced theme support');
            console.log('User Agent:', navigator.userAgent);
        }

        if (!isThemeSwitchSupported) {
            console.log(
                'Limited theme support detected - using fallback methods'
            );
        }
    }, [theme, isTizenTV, isThemeSwitchSupported]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        console.log(`Switching theme from ${theme} to ${newTheme}`);
        setTheme(newTheme);
    };

    const value = {
        theme,
        toggleTheme,
        isTizenTV,
        isThemeSwitchSupported,
    };

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};
