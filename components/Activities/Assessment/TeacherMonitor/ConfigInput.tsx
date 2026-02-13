
import React, { useState, useEffect } from 'react';

interface ConfigInputProps {
    value: number;
    onChange: (val: number) => void;
    min?: number;
    className?: string;
}

export const ConfigInput: React.FC<ConfigInputProps> = ({ value, onChange, min = 0, className }) => {
    const [localValue, setLocalValue] = useState(value?.toString());

    useEffect(() => {
        setLocalValue(value?.toString());
    }, [value]);

    const handleBlur = () => {
        let num = parseInt(localValue);
        if (!isNaN(num)) {
            if (num < min) num = min;
            onChange(num);
            setLocalValue(num.toString());
        } else {
            setLocalValue(value.toString());
        }
    };

    return (
        <input 
            type="number" 
            min={min}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            onFocus={(e) => e.target.select()}
            className={className}
        />
    );
};
