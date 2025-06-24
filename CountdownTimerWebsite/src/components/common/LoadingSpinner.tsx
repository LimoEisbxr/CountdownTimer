interface LoadingSpinnerProps {
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

function LoadingSpinner({
    text = 'Loading...',
    size = 'md',
    className = '',
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    return (
        <div className={`flex items-center justify-center py-4 ${className}`}>
            <div
                className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}
            ></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {text}
            </span>
        </div>
    );
}

export default LoadingSpinner;
