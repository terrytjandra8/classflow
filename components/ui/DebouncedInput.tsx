
import React, { useState, useEffect } from 'react';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string | number;
    onChange: (value: string) => void;
    debounce?: number;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = ({ 
    value: initialValue, 
    onChange, 
    debounce = 500, 
    className,
    ...props 
}) => {
    const [value, setValue] = useState<string | number>(initialValue);

    // Sync local state when prop changes externally (e.g. database load)
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (value !== initialValue) {
                onChange(String(value));
            }
        }, debounce);

        return () => clearTimeout(timeout);
    }, [value, debounce, initialValue, onChange]);

    // Force update on blur to ensure data consistency immediately when leaving field
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (value !== initialValue) {
            onChange(String(value));
        }
        if (props.onBlur) props.onBlur(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
        if (props.onKeyDown) props.onKeyDown(e);
    };

    return (
        <input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={className}
        />
    );
};
