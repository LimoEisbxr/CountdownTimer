import type { User } from '../../types/User';

interface UserCheckboxListProps {
    users: User[];
    selectedUsers: number[];
    onToggleUser: (userId: number) => void;
    loading?: boolean;
    className?: string;
}

function UserCheckboxList({
    users,
    selectedUsers,
    onToggleUser,
    loading = false,
    className = '',
}: UserCheckboxListProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Loading users...
                </span>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                No non-admin users available
            </p>
        );
    }

    return (
        <div
            className={`max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2 space-y-2 ${className}`}
        >
            {users.map((user) => (
                <label
                    key={user.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                >
                    <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => onToggleUser(user.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600 dark:checked:border-blue-600 checked:bg-blue-600 checked:border-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        {user.username}
                    </span>
                </label>
            ))}
        </div>
    );
}

export default UserCheckboxList;
