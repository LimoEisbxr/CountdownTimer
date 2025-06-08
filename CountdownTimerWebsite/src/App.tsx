import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import ViewTimer from './pages/ViewTimer';
import ViewSelectedTimer from './pages/ViewSelectedTimer';
import NotFoundPage from './pages/NotFoundPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectAdminPage from './pages/ProjectAdminPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<ProjectsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route
                    path="/view-selected/:projectId"
                    element={<ViewSelectedTimer />}
                />
                <Route path="/view-timer/:timerId" element={<ViewTimer />} />
                <Route
                    path="/project-admin/:projectID"
                    element={<ProjectAdminPage />}
                />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Router>
    );
}

export default App;
