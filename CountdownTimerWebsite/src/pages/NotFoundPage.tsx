import ThemeSwitcher from '../components/ThemeSwitcher';

function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
            {/* Theme Switcher - Fixed position */}
            <div className="fixed top-4 right-4 z-10">
                <ThemeSwitcher />
            </div>

            <h1 className="text-6xl font-bold text-red-600 dark:text-red-500">
                404
            </h1>
            <p className="mt-4 text-xl text-gray-700 dark:text-gray-300">
                Page Not Found
            </p>
            <a
                href="/"
                className="mt-6 text-blue-500 hover:underline dark:text-blue-400"
            >
                Go back to Home
            </a>
        </div>
    );
}

export default NotFoundPage;
