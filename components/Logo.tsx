import React from 'react';
import { Layout, Sparkles } from 'lucide-react';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
    const sizeClasses = {
        sm: { container: 'w-8 h-8', card: 'w-6 h-6', icon: 14, sparkles: 10, offset1: 'top-0 left-0', offset2: 'top-0.5 left-1', offset3: 'top-1 left-0.5' },
        md: { container: 'w-12 h-12', card: 'w-10 h-10', icon: 20, sparkles: 14, offset1: 'top-0 left-0', offset2: 'top-1 left-2', offset3: 'top-2 left-1' },
        lg: { container: 'w-20 h-20', card: 'w-16 h-16', icon: 32, sparkles: 24, offset1: 'top-0 left-0', offset2: 'top-2 left-4', offset3: 'top-4 left-2' },
        xl: { container: 'w-32 h-32', card: 'w-24 h-24', icon: 48, sparkles: 32, offset1: 'top-0 left-0', offset2: 'top-4 left-8', offset3: 'top-8 left-4' }
    };

    const s = sizeClasses[size];

    return (
        <div className={`relative ${s.container} ${className}`}>
            {/* Yellow Card */}
            <div className={`absolute ${s.offset1} ${s.card} bg-yellow-400 rounded-xl transform -rotate-12 shadow-lg border border-white/10`}></div>
            {/* Blue Card */}
            <div className={`absolute ${s.offset2} ${s.card} bg-blue-500 rounded-xl transform rotate-6 shadow-lg border border-white/10`}></div>
            {/* Pink Card (Top) */}
            <div className={`absolute ${s.offset3} ${s.card} bg-pink-600 rounded-xl transform -rotate-3 shadow-2xl flex items-center justify-center border border-white/10 z-10`}>
                <Layout className="text-white" size={s.icon} />
            </div>
            {/* Animated Sparkles */}
            <Sparkles 
                className="absolute -top-1 -right-1 text-yellow-300 animate-pulse z-20" 
                size={s.sparkles} 
            />
        </div>
    );
};
