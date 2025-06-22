interface ModalProps {
    isOpen: boolean;
    isClosing: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

function Modal({
    isOpen,
    isClosing,
    onClose,
    title,
    children,
    maxWidth = 'max-w-md',
}: ModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg transition-opacity duration-300 ${
                isClosing ? 'opacity-0' : 'animate-fadeIn'
            } p-4`}
            onClick={onClose}
        >
            <div
                className={`bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-xl backdrop-blur-sm ${maxWidth} w-full transition-all transform duration-300 ${
                    isClosing ? 'opacity-0 scale-95' : 'animate-scaleIn'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="relative flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="absolute top-0 right-0 inline-flex items-center justify-center w-8 h-8 text-gray-600 rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            <span className="sr-only">Close</span>
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;
