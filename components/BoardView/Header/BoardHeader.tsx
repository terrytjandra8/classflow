import React from 'react';
import { useBoard } from '../BoardContext';
import { Settings, Share2, ArrowLeft, MonitorPlay, Minimize2 } from 'lucide-react';

interface BoardHeaderProps {
    // New props for presentation mode
    isPresenting?: boolean;
    onTogglePresentation?: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({ 
    isPresenting, 
    onTogglePresentation 
}) => {
    const { board, goBack, openSettings, openShare, canManageBoard } = useBoard();

    return (
        <header className="relative z-20 flex items-center justify-between px-6 py-3 bg-white/10 backdrop-blur-md border-b border-white/10 text-white">
            {/* LEFT: Back Button & Board Title */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={goBack}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="font-bold text-lg leading-none">{board.title || 'Untitled Board'}</h1>
                    {board.topic && <p className="text-xs opacity-70 mt-1">{board.topic}</p>}
                </div>
            </div>

            {/* RIGHT: Actions (Presentation, Share, Settings) */}
            <div className="flex items-center gap-2">
                {onTogglePresentation && (
                    <button 
                        onClick={onTogglePresentation}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
                    >
                        {isPresenting ? <Minimize2 size={18} /> : <MonitorPlay size={18} />}
                        <span>{isPresenting ? 'Exit' : 'Present'}</span>
                    </button>
                )}

                <button 
                    onClick={openShare}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Share Board"
                >
                    <Share2 size={20} />
                </button>

                {canManageBoard && (
                    <button 
                        onClick={openSettings}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title="Board Settings"
                    >
                        <Settings size={20} />
                    </button>
                )}
            </div>
        </header>
    );
};