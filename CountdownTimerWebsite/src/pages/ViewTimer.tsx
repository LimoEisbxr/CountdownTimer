import { useParams } from 'react-router-dom';

function ViewTimer() {
    const { timerId } = useParams<{ timerId: string }>();

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-4">View Timer</h1>
            <p className="text-lg text-gray-700">
                This is where you can view your timer.
            </p>
            <p className="text-lg text-gray-700 mt-2">
                Timer ID: <span className="font-mono">{timerId}</span>
            </p>
        </div>
    );
}

export default ViewTimer;
