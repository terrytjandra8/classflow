import React, { useState } from 'react';
import { useBoard } from '../BoardContext';
import { EditableInput } from '../../ui/EditableInput'; 
import { Tooltip } from '../../Tooltip';
import { 
    Settings, Share2, ArrowLeft, MonitorPlay, 
    Users, MoreHorizontal, Copy, ExternalLink, QrCode
} from 'lucide-react';

export const BoardHeader: React.FC = () => {
    const { 
        board, updateBoard, goBack, openSettings, openShare, 
        canManageBoard, onlineUsers 
    } = useBoard();
    
    // Helper to format dates safely without external libraries
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
        });
    };

    const handleTitleSave = (newTitle: string) => {
        updateBoard({ title: newTitle });
    };

    const openPresentationWindow = () => {
        const width = 1280;
        const height = 720;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const url = new URL(window.location.href);
        url.searchParams.set('present', 'true');

        window.open(
            url.toString(), 
            'ClassboardPresentation', 
            `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,location=no,status=no`
        );
    };

    // Fix variable names to match your TypeScript types (camelCase)
    // We check both camelCase (TS) and snake_case (DB) to be safe
    const isPublished = (board as any).isPublished ?? (board as any).is_published;
    const createdAt = (board as any).createdAt ?? (board as any).created_at;

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
            {/* LEFT: Navigation & Title */}
            <div className="flex items-center gap-3 md:gap-4 flex-1">
                <button 
                    onClick={goBack} 
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                    title="Back to Dashboard"
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
                    {createdAt && (
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider hidden md:block">
                            Created {formatDate(createdAt)}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Online Users */}
                <div className="hidden md:flex items-center -space-x-2 mr-2">
                    {onlineUsers?.slice(0, 4).map((user: any) => (
                        <Tooltip key={user.id} content={user.full_name}>
                            <img 
                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`} 
                                className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"
                                alt={user.full_name}
                            />
                        </Tooltip>
                    ))}
                    {onlineUsers?.length > 4 && (
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                            +{onlineUsers.length - 4}
                        </div>
                    )}
                </div>

                <button 
                    onClick={openShare}
                    className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                    <Users size={18} />
                    <span>Share</span>
                </button>

                <button 
                    onClick={openPresentationWindow}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                    <MonitorPlay size={18} />
                    <span className="hidden md:inline font-semibold">Start Presenting</span>
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