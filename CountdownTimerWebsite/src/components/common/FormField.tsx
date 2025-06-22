interface FormFieldProps {
    label: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    minLength?: number;
    placeholder?: string;
    className?: string;
}

function FormField({
    label,
    type,
    value,
    onChange,
    required = false,
    minLength,
    placeholder = '',
    className = '',
}: FormFieldProps) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                required={required}
                minLength={minLength}
            />
        </div>
    );
}

export default FormField;
