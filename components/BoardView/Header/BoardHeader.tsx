
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useHeaderLogic } from './useHeaderLogic';
import { HeaderTitle } from './HeaderTitle';
import { HeaderBadges } from './HeaderBadges';
import { HeaderMeta } from './HeaderMeta';
import { HeaderActions } from './HeaderActions';
import { useBoard } from '../BoardContext';

interface BoardHeaderProps {
    isPresenting: boolean;
    onTogglePresentation: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({ isPresenting }) => {
    const { goBack, isPresentationMode } = useHeaderLogic();
    const { embeddedMode } = useBoard();

    if (isPresenting) return null;

    // --- EMBEDDED MODE: compact inline toolbar, no overlap ---
    if (embeddedMode) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-black/30 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
                <HeaderActions />
            </div>
        );
    }

    // --- STANDALONE MODE: full floating overlay ---
    return (
        <div className="relative w-full z-50 pointer-events-none flex flex-col md:flex-row items-start justify-between px-4 md:px-8 pt-6 md:pt-8 pb-4 md:pb-6 shrink-0 bg-transparent gap-4">
            {/* Backdrop Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-[-1]" />
            
            {/* Left: Branding & Meta */}
            <div className="flex items-start gap-4 pointer-events-auto flex-1 min-w-0">
                {!isPresentationMode && (
                    <button 
                        onClick={goBack} 
                        className="mt-1 p-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-xl text-white/80 hover:text-white transition-all shadow-lg border border-white/5 shrink-0 group"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                )}
                
                <div className="flex flex-col min-w-0 w-full gap-2 mt-1">
                    <div className="flex items-center gap-3 w-full relative">
                        <HeaderTitle />
                        <HeaderBadges />
                    </div>
                    <div className="pl-1">
                        <HeaderMeta />
                    </div>
                </div>
            </div>

            {/* Right: Controls & Live Presence */}
            <div className="w-full md:w-auto">
                 <HeaderActions />
            </div>
        </div>
    );
};
