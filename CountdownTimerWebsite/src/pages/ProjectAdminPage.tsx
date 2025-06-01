import { useParams } from 'react-router-dom';

function ProjectAdminPage() {
    const { projectID } = useParams<{ projectID: string }>();

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-4">Project Admin Page</h1>
            <p className="text-lg">This is the project admin page.</p>
            <p className="text-sm text-gray-600 mt-2">
                Project-specific administrative features will be displayed here.
            </p>
            <p className="text-sm text-gray-600 mt-2">
                Project ID: <span className="font-semibold">{projectID}</span>
            </p>
        </div>
    );
}

export default ProjectAdminPage;
