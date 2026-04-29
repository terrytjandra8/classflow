
import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';

interface DynamicTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const DynamicTextarea = React.forwardRef<HTMLTextAreaElement, DynamicTextareaProps>(({ 
    value, 
    onChange, 
    className, 
    autoFocus,
    placeholder,
    onKeyDown,
    onPaste,
    style,
    ...props 
}, forwardedRef) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const [localValue, setLocalValue] = useState(value);

    React.useImperativeHandle(forwardedRef, () => internalRef.current!);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const resize = () => {
        const el = internalRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    };

    useLayoutEffect(() => {
        resize();
    }, [localValue]);

    useEffect(() => {
        if (autoFocus && internalRef.current) {
            internalRef.current.focus();
            const len = internalRef.current.value.length;
            internalRef.current.setSelectionRange(len, len);
        }
    }, [autoFocus]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
        onChange(e);
    };

    return (
        <textarea
            ref={internalRef}
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
});
