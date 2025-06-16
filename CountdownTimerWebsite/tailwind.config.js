/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    'Roboto',
                    '-webkit-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'system-ui',
                    '-apple-system',
                    'sans-serif',
                ],
            },
            animation: {
                fadeIn: 'fadeIn 0.2s ease-out',
                scaleIn: 'scaleIn 0.3s ease-out',
                fadeOut: 'fadeOut 0.2s ease-in',
                scaleOut: 'scaleOut 0.3s ease-in',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                fadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                scaleOut: {
                    '0%': { transform: 'scale(1)', opacity: '1' },
                    '100%': { transform: 'scale(0.95)', opacity: '0' },
                },
            },
            // Enhanced color palette for better contrast across browsers
            colors: {
                gray: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                },
            },
            // Better spacing for TV/large screen optimization
            spacing: {
                18: '4.5rem',
                88: '22rem',
                112: '28rem',
                128: '32rem',
            },
            // Improved screen breakpoints for Tizen TV
            screens: {
                tv: '1280px',
                '4k': '2560px',
            },
        },
    },
    plugins: [
        // Add custom plugin for cross-browser compatibility
        function ({ addUtilities, theme }) {
            const newUtilities = {
                '.webkit-appearance-none': {
                    '-webkit-appearance': 'none',
                    appearance: 'none',
                },
                '.webkit-scrolling-touch': {
                    '-webkit-overflow-scrolling': 'touch',
                },
                '.backface-hidden': {
                    '-webkit-backface-visibility': 'hidden',
                    'backface-visibility': 'hidden',
                },
                '.font-smooth': {
                    '-webkit-font-smoothing': 'antialiased',
                    '-moz-osx-font-smoothing': 'grayscale',
                },
                '.select-none': {
                    '-webkit-user-select': 'none',
                    '-moz-user-select': 'none',
                    '-ms-user-select': 'none',
                    'user-select': 'none',
                },
                '.select-text': {
                    '-webkit-user-select': 'text',
                    '-moz-user-select': 'text',
                    '-ms-user-select': 'text',
                    'user-select': 'text',
                },
            };

            addUtilities(newUtilities, ['responsive', 'hover']);
        },
    ],
};
