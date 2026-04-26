
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

export const EditableInput = ({ 
    value, 
    onSave, 
    className, 
    disabled, 
    placeholder,
    style
}: { 
    value: string; 
    onSave: (val: string) => void; 
    className?: string; 
    disabled?: boolean;
    placeholder?: string;
    style?: React.CSSProperties;
}) => {
    const [localValue, setLocalValue] = useState(value);
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!isEditing) {
            setLocalValue(value);
        }
    }, [value, isEditing]);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Reset height to auto to correctly calculate scrollHeight if text shrank
            textarea.style.height = 'auto'; 
            // Add generous buffer (+8px) to accommodate descenders, bold weights, and custom line heights
            textarea.style.height = `${textarea.scrollHeight + 8}px`;
        }
    };

    // Trigger adjustment on value change
    useLayoutEffect(() => {
        adjustHeight();
    }, [localValue, isEditing]);

    // Robust Fix for Page Reload: Trigger adjustment after a short delay
    // This handles cases where fonts load *after* the component mounts
    useEffect(() => {
        const timer = setTimeout(() => {
            adjustHeight();
        }, 100);
        
        // Also listen for window resize to adjust wrapping text
        window.addEventListener('resize', adjustHeight);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', adjustHeight);
        };
    }, []);

    const handleBlur = () => {
        setIsEditing(false);
        if (localValue !== value) {
            onSave(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
            setLocalValue(value); 
            setIsEditing(false);
            e.currentTarget.blur();
        }
    };

    return (
        <textarea 
            ref={textareaRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onFocus={() => setIsEditing(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`${className} resize-none overflow-hidden block break-words whitespace-pre-wrap`}
            placeholder={placeholder}
            rows={1}
            style={style}
        />
    );
};
