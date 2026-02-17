
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useHeaderLogic } from './useHeaderLogic';
import { HeaderTitle } from './HeaderTitle';
import { HeaderBadges } from './HeaderBadges';
import { HeaderMeta } from './HeaderMeta';
import { HeaderActions } from './HeaderActions';

interface BoardHeaderProps {
    isPresenting: boolean;
    onTogglePresentation: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({ isPresenting }) => {
    const { goBack, isPresentationMode } = useHeaderLogic();

    if (isPresenting) return null;

    return (
        <div className="relative w-full z-50 pointer-events-none flex flex-col md:flex-row items-start justify-between px-8 pt-8 pb-6 shrink-0 bg-transparent gap-6">
            {/* Backdrop Gradient - Increased opacity at top for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none z-[-1]" />
            
            {/* Left: Branding & Meta */}
            <div className="flex items-start gap-5 pointer-events-auto flex-1 min-w-0">
                {!isPresentationMode && (
                    <button 
                        onClick={goBack} 
                        className="mt-2 p-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-xl text-white/80 hover:text-white transition-all shadow-lg border border-white/5 shrink-0 group"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                )}
                
                <div className="flex flex-col min-w-0 w-full gap-2">
                    {/* Top Row: Icon + Title + Badges */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full relative">
                        <HeaderTitle />
                        <div className="md:mt-1">
                            <HeaderBadges />
                        </div>
                    </div>

                    {/* Bottom Row: Metadata */}
                    <div className="pl-1">
                        <HeaderMeta />
                    </div>
                </div>
            </div>

            {/* Right: Controls & Live Presence - Aligned to top for balance */}
            <div className="md:mt-1">
                <HeaderActions />
            </div>
        </div>
    );
};
