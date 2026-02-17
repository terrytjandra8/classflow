import React from 'react';
import { useBoard } from '../BoardContext';
// Note: Adjusted paths to ../.. because we are inside BoardView/Header/
import { EditableInput } from '../../ui/EditableInput'; 
import { Tooltip } from '../../Tooltip';
import { 
    Settings, Share2, ArrowLeft, MonitorPlay, Minimize2, 
    Users, Clock, Eye, EyeOff 
} from 'lucide-react';

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

    const handleTitleSave = (newTitle: string) => {
        updateBoard({ title: newTitle });
    };

    // Helper to format dates without external libraries
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Recent';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return 'Just now';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Safely access properties, preferring camelCase (TS) but falling back if needed
    const isPublished = (board as any).isPublished ?? (board as any).is_published;
    const createdAt = (board as any).createdAt ?? (board as any).created_at;
    const updatedAt = (board as any).updatedAt ?? (board as any).updated_at;

    return (
        <header className="relative z-20 flex flex-col w-full bg-white/10 backdrop-blur-xl border-b border-white/10 text-white p-4">
            <div className="flex items-center justify-between">
                
                {/* LEFT: Back Button & Title */}
                <div className="flex items-center gap-4">
                    <button onClick={goBack} className="p-2 hover:bg-white/10 rounded-full transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <EditableInput 
                                value={board.title || 'Untitled Board'} 
                                onSave={handleTitleSave}
                                disabled={!canManageBoard}
                                className="font-bold text-xl bg-transparent border-none focus:ring-0 p-0 cursor-pointer hover:opacity-80"
                            />
                            {isPublished === false && (
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/30 uppercase font-bold">
                                    Draft
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-[10px] opacity-60 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                                <Clock size={10} /> Created: {formatDate(createdAt)}
                            </span>
                            <span>
                                Updated: {formatTime(updatedAt)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* MIDDLE: Online Users */}
                <div className="hidden md:flex items-center gap-3 bg-black/20 px-4 py-1.5 rounded-full border border-white/5">
                    <div className="flex -space-x-2">
                        {onlineUsers?.slice(0, 3).map((user: any) => (
                            <img 
                                key={user.id} 
                                src={user.avatar_url} 
                                className="w-6 h-6 rounded-full border-2 border-slate-800" 
                                alt={user.full_name}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        {onlineUsers?.length || 0} Online
                    </span>
                </div>

                {/* RIGHT: Controls (Anti-Cheat & Present) */}
                <div className="flex items-center gap-2">
                    {canManageBoard && (
                        <Tooltip content={board.settings?.anonymousMode ? "Names Hidden" : "Names Visible"}>
                            <button 
                                onClick={() => updateBoard({ settings: { ...board.settings, anonymousMode: !board.settings?.anonymousMode }})}
                                className={`p-2 rounded-lg transition-colors ${board.settings?.anonymousMode ? 'bg-pink-600 text-white' : 'hover:bg-white/10'}`}
                            >
                                {board.settings?.anonymousMode ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </Tooltip>
                    )}

                    {onTogglePresentation && (
                        <button 
                            onClick={onTogglePresentation}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-bold"
                        >
                            {isPresenting ? <Minimize2 size={18} /> : <MonitorPlay size={18} />}
                            {isPresenting ? 'Exit' : 'Present'}
                        </button>
                    )}

                    <button onClick={openShare} className="p-2 hover:bg-white/10 rounded-full transition-all">
                        <Share2 size={20} />
                    </button>

                    {canManageBoard && (
                        <button onClick={openSettings} className="p-2 hover:bg-white/10 rounded-full transition-all text-pink-400">
                            <Settings size={20} />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};