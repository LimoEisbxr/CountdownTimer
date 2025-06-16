// Utility functions for Tizen TV theme support and fallbacks

export interface TizenCapabilities {
    isTizenTV: boolean;
    isSamsungTV: boolean;
    isSmartTV: boolean;
    supportsCSS3: boolean;
    supportsCustomProperties: boolean;
    supportsClassList: boolean;
    supportsMatchMedia: boolean;
    screenSize: {
        width: number;
        height: number;
        ratio: number;
    };
    isLargeScreen: boolean;
    hasTouch: boolean;
    userAgent: string;
}

export const forceApplyTheme = (theme: 'light' | 'dark') => {
    console.log(`Force applying ${theme} theme for Tizen TV`);

    // Apply to document element (only classes, no aggressive overrides)
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Apply to body (only basic styling)
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);

    // Only apply basic background and text color to body and root
    if (theme === 'dark') {
        document.body.style.backgroundColor = '#111827';
        document.body.style.color = '#f9fafb';
        root.style.backgroundColor = '#111827';
        root.style.color = '#f9fafb';
    } else {
        document.body.style.backgroundColor = '#f9fafb';
        document.body.style.color = '#111827';
        root.style.backgroundColor = '#f9fafb';
        root.style.color = '#111827';
    }

    // Preserve progress bar styling after theme application
    setTimeout(() => preserveProgressBars(theme), 100);

    console.log(`Theme ${theme} applied successfully (simplified)`);
};

export const detectTizenTVCapabilities = (): TizenCapabilities => {
    const userAgent = navigator.userAgent.toLowerCase();

    // Check various TV-specific capabilities
    const capabilities = {
        isTizenTV: userAgent.includes('tizen'),
        isSamsungTV: userAgent.includes('samsung'),
        isSmartTV:
            userAgent.includes('smart-tv') || userAgent.includes('smarttv'),
        supportsCSS3: checkCSS3Support(),
        supportsCustomProperties: checkCustomPropertiesSupport(),
        supportsClassList: 'classList' in document.documentElement,
        supportsMatchMedia: typeof window.matchMedia === 'function',
        screenSize: {
            width: screen.width,
            height: screen.height,
            ratio: screen.width / screen.height,
        },
        isLargeScreen: screen.width >= 1920 && screen.height >= 1080,
        hasTouch: 'ontouchstart' in window,
        userAgent: navigator.userAgent,
    };

    console.log('Tizen TV Capabilities:', capabilities);
    return capabilities;
};

const checkCSS3Support = (): boolean => {
    try {
        const testElement = document.createElement('div');
        testElement.style.transform = 'scale(1)';
        return testElement.style.transform === 'scale(1)';
    } catch {
        return false;
    }
};

const checkCustomPropertiesSupport = (): boolean => {
    try {
        const testElement = document.createElement('div');
        testElement.style.setProperty('--test-prop', 'test');
        return testElement.style.getPropertyValue('--test-prop') === 'test';
    } catch {
        return false;
    }
};

export const setupTizenTVFallbacks = () => {
    const capabilities = detectTizenTVCapabilities();

    if (
        capabilities.isTizenTV ||
        capabilities.isSamsungTV ||
        capabilities.isSmartTV
    ) {
        console.log('Setting up Tizen TV fallbacks...');

        // Add a minimal style for TV support
        const style = document.createElement('style');
        style.id = 'tizen-tv-fallback';
        style.textContent = `
            .tizen-button {
                min-height: 48px !important;
                min-width: 48px !important;
                border: 2px solid currentColor !important;
                padding: 8px 16px !important;
                font-size: 16px !important;
                cursor: pointer !important;
            }
            /* Basic theme support */
            body.dark, html.dark {
                background-color: #111827 !important;
                color: #f9fafb !important;
            }
            body.light, html.light {
                background-color: #f9fafb !important;
                color: #111827 !important;
            }
        `;
        document.head.appendChild(style);

        // Add keyboard navigation support
        document.addEventListener('keydown', handleTizenTVKeyDown);

        // Apply theme once on initialization
        setTimeout(() => {
            const savedTheme =
                (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
            forceApplyTheme(savedTheme);
        }, 1000);
    }

    return capabilities;
};

const handleTizenTVKeyDown = (event: KeyboardEvent) => {
    // Handle Samsung TV remote keys
    switch (event.keyCode) {
        case 403: // Red button
        case 404: // Green button
        case 405: // Yellow button
        case 406: {
            // Blue button
            event.preventDefault();
            // Toggle theme with colored buttons
            const currentTheme =
                (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            forceApplyTheme(newTheme);
            break;
        }
        case 37: // Left arrow
        case 39: // Right arrow
        case 38: // Up arrow
        case 40: {
            // Down arrow
            // Enhanced focus navigation for TV
            const focusedElement = document.activeElement;
            if (focusedElement && focusedElement.tagName === 'BUTTON') {
                (focusedElement as HTMLElement).style.outline =
                    '4px solid #60a5fa';
            }
            break;
        }
    }
};

export const preserveProgressBars = (theme: 'light' | 'dark') => {
    // Find and preserve progress bar styling after theme changes
    const progressBarContainers = document.querySelectorAll(
        '.progress-bar-container'
    );
    progressBarContainers.forEach((progressBar) => {
        if (progressBar instanceof HTMLElement) {
            // Restore progress bar background
            progressBar.style.backgroundColor =
                theme === 'dark' ? '#374151' : '#e5e7eb';
            progressBar.style.position = 'relative';
            progressBar.style.overflow = 'hidden';
            progressBar.style.borderRadius = '9999px';

            // Also update the theme class
            progressBar.classList.remove('dark-theme', 'light-theme');
            progressBar.classList.add(
                theme === 'dark' ? 'dark-theme' : 'light-theme'
            );

            console.log('Preserved progress bar styling for', progressBar);
        }
    });

    // Also preserve any remaining rounded-full progress bars
    const roundedProgressBars = document.querySelectorAll(
        '.rounded-full[style*="backgroundColor"]'
    );
    roundedProgressBars.forEach((progressBar) => {
        if (
            progressBar instanceof HTMLElement &&
            (progressBar.style.width?.includes('clamp') ||
                progressBar.style.width?.includes('vw') ||
                progressBar.style.width?.includes('px'))
        ) {
            progressBar.style.backgroundColor =
                theme === 'dark' ? '#374151' : '#e5e7eb';
        }
    });
};
