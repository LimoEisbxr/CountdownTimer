function ViewSelectedTimerButton({ projectId }: { projectId: string }) {
    const viewSelectedTimer = () => {
        window.open(`/view-selected/${projectId}`, '_blank');
    };

    return (
        <>
            <button
                className="px-4 py-2 font-medium text-white transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-600 flex items-center gap-2 transform hover:scale-105"
                onClick={viewSelectedTimer}
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    ></path>
                </svg>
                View Selected Timer
            </button>
        </>
    );
}

export default ViewSelectedTimerButton;
