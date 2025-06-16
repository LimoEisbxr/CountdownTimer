import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { setupTizenTVFallbacks } from './utils/tizenTVHelper';
import AdminPage from './pages/AdminPage';
import ViewTimer from './pages/ViewTimer';
import ViewSelectedTimer from './pages/ViewSelectedTimer';
import NotFoundPage from './pages/NotFoundPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectAdminPage from './pages/ProjectAdminPage';

function App() {
    useEffect(() => {
        // Initialize Tizen TV support and fallbacks on app startup
        const capabilities = setupTizenTVFallbacks();
        console.log('App initialized with TV capabilities:', capabilities);
    }, []);

    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<ProjectsPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route
                        path="/view-selected/:projectId"
                        element={<ViewSelectedTimer />}
                    />
                    <Route
                        path="/view-timer/:timerId"
                        element={<ViewTimer />}
                    />
                    <Route
                        path="/project-admin/:projectID"
                        element={<ProjectAdminPage />}
                    />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
