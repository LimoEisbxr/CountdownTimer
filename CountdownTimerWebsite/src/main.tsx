import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Initialize theme before React renders
const initializeTheme = () => {
    const saved = localStorage.getItem('theme');
    const systemPrefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (systemPrefersDark ? 'dark' : 'light');

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
};

// Call immediately
initializeTheme();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
