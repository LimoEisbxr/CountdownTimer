import React from 'react';

interface ActionButtonProps {
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'danger';
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    children: React.ReactNode;
    className?: string;
    iconOnly?: boolean; // New prop to indicate icon-only buttons
}

function ActionButton({
    type = 'button',
    variant = 'primary',
    onClick,
    disabled = false,
    loading = false,
    children,
    className = '',
    iconOnly = false, // Default to false
}: ActionButtonProps) {
    const baseClasses = iconOnly
        ? 'inline-flex items-center justify-center text-sm font-medium rounded-lg transition-colors focus:outline-none'
        : 'inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none';

    const variantClasses = {
        primary:
            'text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
        secondary:
            'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
        danger: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:underline',
    };

    // Check if children is a single SVG and iconOnly is true to apply special styling
    let hasSingleSVGChild = false;

    if (
        React.Children.count(children) === 1 &&
        React.isValidElement(children)
    ) {
        // Check if it's directly an SVG element
        if (children.type === 'svg') {
            hasSingleSVGChild = true;
        }
        // Otherwise check for SVG-like properties in props
        else if (children.props) {
            const props = children.props as {
                className?: string;
                viewBox?: string;
            };
            hasSingleSVGChild =
                (typeof props.className === 'string' &&
                    props.className.includes('w-')) ||
                props.viewBox !== undefined;
        }
    }

    const buttonClasses = [
        baseClasses,
        variantClasses[variant],
        iconOnly && hasSingleSVGChild ? 'p-2' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={buttonClasses}
        >
            {children}
        </button>
    );
}

export default ActionButton;
