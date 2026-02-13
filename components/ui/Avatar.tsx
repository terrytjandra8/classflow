
import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AvatarProps {
    src?: string | null;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    isTeacher?: boolean;
    showBadge?: boolean;
    status?: 'online' | 'away';
}

const SIZE_MAP = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-24 h-24 text-2xl'
};

export const Avatar: React.FC<AvatarProps> = ({ 
    src, 
    name = '?', 
    size = 'md', 
    className = '', 
    isTeacher = false,
    showBadge = false,
    status
}) => {
    const initials = name.substring(0, 2).toUpperCase();
    const sizeClasses = SIZE_MAP[size];

    return (
        <div className={`relative inline-block rounded-full ${className}`}>
            <div 
                className={`
                    ${sizeClasses} rounded-full flex items-center justify-center font-bold overflow-hidden border-2 shadow-sm
                    ${isTeacher 
                        ? 'bg-pink-600 border-pink-400 text-white' 
                        : (src ? 'border-white dark:border-[#1a1a1a]' : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white border-transparent')
                    }
                `}
            >
                {src ? (
                    <img 
                        src={src} 
                        alt={name} 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                    />
                ) : (
                    initials
                )}
            </div>

            {/* Teacher Badge Overlay (Optional) */}
            {isTeacher && showBadge && (
                <div className="absolute -bottom-1 -right-1 bg-pink-600 text-white rounded-full p-0.5 border-2 border-white dark:border-[#111]">
                    <ShieldCheck size={10} />
                </div>
            )}

            {/* Status Dot */}
            {status && (
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1a1a1a] flex items-center justify-center ${status === 'away' ? 'bg-yellow-400' : 'bg-green-500'}`}>
                </div>
            )}
        </div>
    );
};
