
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

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const resize = () => {
        const el = ref.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    };

    useLayoutEffect(() => {
        resize();
    }, [localValue]);

    useEffect(() => {
        if (autoFocus && ref.current) {
            ref.current.focus();
            const len = ref.current.value.length;
            ref.current.setSelectionRange(len, len);
        }
    }, [autoFocus]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
        onChange(e);
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
