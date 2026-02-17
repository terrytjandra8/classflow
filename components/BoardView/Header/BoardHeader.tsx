import React from 'react';
import { useBoard } from '../BoardContext';
import { EditableInput } from '../../ui/EditableInput';
import { Tooltip } from '../../Tooltip';
import { 
    IconSettings, IconShare, IconBack, IconMonitor, IconMinimize,
    IconVisible, IconHidden, IconUsers, IconClock 
} from '../../Icons';
import { format } from 'date-fns';

interface BoardHeaderProps {
    isPresenting?: boolean;
    onTogglePresentation?: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({ 
    isPresenting, 
    onTogglePresentation 
}) => {
    const { 
        board, updateBoard, goBack, openSettings, openShare, 
        canManageBoard, onlineUsers 
    } = useBoard();

    // Handle Title Change
    const handleTitleSave = (newTitle: string) => {
        updateBoard({ title: newTitle });
    };

    return (
        <header className="relative z-20 flex flex-col w-full bg-white/10 backdrop-blur-xl border-b border-white/10 text-white p-4">
            <div className="flex items-center justify-between">
                
                {/* LEFT: Back, Interactive Title, and Timestamps */}
                <div className="flex items-center gap-4">
                    <button onClick={goBack} className="p-2 hover:bg-white/10 rounded-full transition-all">
                        <IconBack size={20} />
                    </button>
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <EditableInput 
                                value={board.title || 'Untitled Board'} 
                                onSave={handleTitleSave}
                                disabled={!canManageBoard}
                                className="font-bold text-xl bg-transparent border-none focus:ring-0 p-0 cursor-pointer hover:opacity-80"
                            />
                            {!board.is_published && (
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/30 uppercase font-bold">
                                    Draft
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-[10px] opacity-60 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                                <IconClock size={10} /> Created: {board.created_at ? format(new Date(board.created_at), 'MMM d, yyyy') : 'Recently'}
                            </span>
                            <span>
                                Updated: {board.updated_at ? format(new Date(board.updated_at), 'HH:mm') : 'Just now'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* MIDDLE: Online Users Indicator */}
                <div className="hidden md:flex items-center gap-3 bg-black/20 px-4 py-1.5 rounded-full border border-white/5">
                    <div className="flex -space-x-2">
                        {onlineUsers?.slice(0, 3).map((user: any) => (
                            <img 
                                key={user.id} 
                                src={user.avatar_url} 
                                className="w-6 h-6 rounded-full border-2 border-slate-800" 
                                title={user.full_name}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        {onlineUsers?.length || 1} Online
                    </span>
                </div>

                {/* RIGHT: Controls (Anti-Cheat / Present / Settings) */}
                <div className="flex items-center gap-2">
                    {canManageBoard && (
                        <Tooltip content="Anti-Cheat: Hide names until reveal">
                            <button 
                                onClick={() => updateBoard({ settings: { ...board.settings, anonymousMode: !board.settings?.anonymousMode }})}
                                className={`p-2 rounded-lg transition-colors ${board.settings?.anonymousMode ? 'bg-pink-600 text-white' : 'hover:bg-white/10'}`}
                            >
                                <IconHidden size={20} />
                            </button>
                        </Tooltip>
                    )}

                    {onTogglePresentation && (
                        <button 
                            onClick={onTogglePresentation}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-bold"
                        >
                            {isPresenting ? <IconMinimize size={18} /> : <IconMonitor size={18} />}
                            {isPresenting ? 'Exit' : 'Present'}
                        </button>
                    )}

                    <button onClick={openShare} className="p-2 hover:bg-white/10 rounded-full transition-all">
                        <IconShare size={20} />
                    </button>

                    {canManageBoard && (
                        <button onClick={openSettings} className="p-2 hover:bg-white/10 rounded-full transition-all text-pink-400">
                            <IconSettings size={20} />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};