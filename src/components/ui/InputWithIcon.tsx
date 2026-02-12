import React from 'react';

interface InputWithIconProps {
    label: string;
    icon: any;
    placeholder?: string;
    error?: string;
    required?: boolean;
    children?: React.ReactNode;
    className?: string;
}

export const InputWithIcon = ({
    label, icon: Icon, placeholder, error, required, children, className = ''
}: InputWithIconProps) => {
    const id = React.useId();
    // Safely clone the first child to inject the ID
    const child = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { id } as any);
        }
        return child;
    });

    return (
        <div className={className}>
            <label htmlFor={id} className="block text-sm font-semibold text-[#0a3d7c] mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className={`flex items-center gap-2 border-2 ${error ? 'border-red-400' : 'border-gray-300'} rounded-xl px-3 py-2.5 bg-white hover:border-[#0a3d7c] focus-within:border-[#0a3d7c] transition-colors`}>
                <Icon className="w-5 h-5 text-[#0a3d7c] flex-shrink-0" />
                {child}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};
