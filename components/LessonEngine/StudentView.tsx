
import React from 'react';

interface StudentViewProps {
    step: any;
    totalSteps: number;
    currentIndex: number;
    children: React.ReactNode;
}

export const StudentView: React.FC<StudentViewProps> = ({ step, totalSteps, currentIndex, children }) => {
    return (
        <div className="h-screen flex flex-col bg-black text-white">
            <div className="flex-1 overflow-hidden relative">
                {children}
            </div>
            {/* Minimal Footer for Students */}
            <div className="h-12 bg-[#1a1a1a] flex items-center justify-between px-6 border-t border-white/10 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Slide {currentIndex + 1} / {totalSteps}
                    </span>
                    <span className="text-xs font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wide">
                        {step?.type || 'Loading'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live</span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};
