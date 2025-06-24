interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    className?: string;
}

function EmptyState({
    icon,
    title,
    description,
    className = '',
}: EmptyStateProps) {
    return (
        <div className={`text-center py-10 ${className}`}>
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
    );
}

export default EmptyState;
