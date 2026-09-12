import React, { useState, useEffect } from 'react';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    theme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', theme }) => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        if (theme) {
            setIsDark(theme === 'dark');
            return;
        }

        const checkDark = () => {
            const hasDarkClass = document.documentElement.classList.contains('dark');
            setIsDark(hasDarkClass);
        };

        checkDark();

        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, [theme]);

    const sizeClasses = {
        sm: 'h-8 w-auto min-w-8',
        md: 'h-12 w-auto min-w-12',
        lg: 'h-16 w-auto min-w-16',
        xl: 'h-24 w-auto min-w-24'
    };

    const logoSrc = isDark ? '/logo_dark.svg' : '/logo_light.svg';

    return (
        <img 
            src={logoSrc} 
            alt="ClassFlow Logo" 
            className={`object-contain inline-block ${sizeClasses[size]} ${className}`} 
        />
    );
};
