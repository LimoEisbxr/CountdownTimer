import type { ProjectCardProps } from '../../types/ProjectCardProps';
import { useNavigate } from 'react-router-dom';

function ProjectCard({ project }: ProjectCardProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/project-admin/${project.id}`);
    };
    return (
        <div
            className="relative bg-white/90 dark:bg-gray-800/90 shadow-md rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] cursor-pointer webkit-appearance-none backface-hidden"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-label={`View project: ${project.name}`}
        >
            {/* Gradient header */}
            <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

            <div className="p-6">
                {/* Project name */}
                <h2
                    className="text-xl font-semibold text-gray-800 dark:text-white mb-3 select-text"
                    style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {project.name}
                </h2>

                {/* Project description */}
                <div className="mt-4">
                    <p
                        className="text-gray-600 dark:text-gray-300 select-text"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {project.description || 'No description provided'}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ProjectCard;
