interface ErrorMessageProps {
    message: string;
    className?: string;
}

function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
    if (!message) return null;

    return (
        <div
            className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 ${className}`}
        >
            {message}
        </div>
    );
}

export default ErrorMessage;
