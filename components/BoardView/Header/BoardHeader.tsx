import React, { useState, useRef, useEffect } from 'react';
import { useBoard } from '../BoardContext';
import { EditableInput } from '../../ui/EditableInput'; 
import { Tooltip } from '../../Tooltip';
import { 
    Settings, Share2, ArrowLeft, MonitorPlay, 
    Users, MoreHorizontal, Circle
} from 'lucide-react';

const OnlineUsersList = ({ users, onClose }: { users: any[], onClose: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (ref.current && !ref.current.contains(event.target)) onClose();
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="absolute top-12 right-0 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span>Active Users ({users.length})</span>
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="max-h-64 overflow-y-auto">
                {users.map((user: any) => (
                    <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="relative">
                            <img 
                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'User'}`} 
                                className="w-8 h-8 rounded-full border border-slate-200"
                                alt={user.full_name}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">{user.full_name || 'Anonymous'}</div>
                            <div className="text-xs text-slate-400 truncate">{user.email || 'Student'}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const BoardHeader: React.FC = () => {
    const { 
        board, updateBoard, goBack, openSettings, openShare, 
        canManageBoard, onlineUsers 
    } = useBoard();
    
    const [showUsersList, setShowUsersList] = useState(false);
    
    // Safety check for onlineUsers
    const activeUsers = Array.isArray(onlineUsers) ? onlineUsers : [];

    const handleTitleSave = (newTitle: string) => updateBoard({ title: newTitle });

    const openPresentationWindow = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('present', 'true');
        window.open(url.toString(), 'ClassboardPresentation', 'width=1280,height=720,toolbar=no,menubar=no');
    };

    // Schema compatibility: snake_case fallback
    const isPublished = (board as any).isPublished ?? (board as any).is_published;
    const createdAt = (board as any).createdAt ?? (board as any).created_at;

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
            {/* LEFT: Navigation & Title */}
            <div className="flex items-center gap-3 md:gap-4 flex-1">
                <button 
                    onClick={goBack} 
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <EditableInput 
                            value={board.title || 'Untitled Board'} 
                            onSave={handleTitleSave}
                            disabled={!canManageBoard}
                            className="font-bold text-lg md:text-xl text-slate-800 bg-transparent border-none focus:ring-0 p-0 h-auto"
                        />
                        {!isPublished && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wide">
                                Draft
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-2 md:gap-3 relative">
                {/* Interactive Online Users */}
                <div className="relative">
                    <button 
                        onClick={() => setShowUsersList(!showUsersList)}
                        className="hidden md:flex items-center -space-x-2 mr-2 hover:opacity-80 transition-opacity p-1 rounded-full hover:bg-slate-50"
                        title="Click to view online users"
                    >
                        {activeUsers.slice(0, 4).map((user: any) => (
                            <img 
                                key={user.id}
                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'U'}`} 
                                className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 object-cover"
                                alt={user.full_name}
                            />
                        ))}
                        {activeUsers.length > 4 && (
                             <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                +{activeUsers.length - 4}
                            </div>
                        )}
                        {activeUsers.length === 0 && (
                             <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                                <Users size={14} />
                            </div>
                        )}
                    </button>
                    
                    {showUsersList && (
                        <OnlineUsersList users={activeUsers} onClose={() => setShowUsersList(false)} />
                    )}
                </div>

                <button 
                    onClick={openShare}
                    className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                    <Share2 size={18} />
                    <span>Share</span>
                </button>

                <button 
                    onClick={openPresentationWindow}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                    <MonitorPlay size={18} />
                    <span className="font-semibold">Start Presenting</span>
                </button>

                {canManageBoard && (
                    <button 
                        onClick={openSettings}
                        className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors"
                    >
                        <Settings size={20} />
                    </button>
                )}
            </div>
        </header>
    );
};