
import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';

interface DynamicTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const DynamicTextarea: React.FC<DynamicTextareaProps> = ({ 
    value, 
    onChange, 
    className, 
    autoFocus,
    placeholder,
    onKeyDown,
    onPaste,
    style,
    ...props 
}) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    const [localValue, setLocalValue] = useState(value);

    // Sync local state with prop value when it changes externally
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Efficient resize function
    const resize = () => {
        const el = ref.current;
        if (el) {
            el.style.height = 'auto';
            const newHeight = el.scrollHeight;
            el.style.height = `${newHeight}px`;
        }
    };

    // Resize on value change
    useLayoutEffect(() => {
        resize();
    }, [localValue]);

    // Initial focus and cursor placement
    useEffect(() => {
        if (autoFocus && ref.current) {
            ref.current.focus();
            // Place cursor at end
            const len = ref.current.value.length;
            ref.current.setSelectionRange(len, len);
        }
    }, [autoFocus]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setLocalValue(val); // Immediate local update for fluidity
        onChange(e); // Propagate to parent
    };

    return (
        <textarea
            ref={ref}
            value={localValue}
            onChange={handleChange}
            className={`resize-none overflow-hidden block ${className}`}
            rows={1}
            placeholder={placeholder}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            style={style}
            {...props}
        />
    );
};
