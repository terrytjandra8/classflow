import React from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import { Note, NoteColor } from '../../types';
import { NOTE_COLORS } from '../../utils/theme';

interface NoteFooterProps {
    note: Note;
    userId?: string;
    onLike: (e: React.MouseEvent) => void;
    commentsEnabled: boolean;
    reactionsEnabled: boolean;
}

export const NoteFooter: React.FC<NoteFooterProps> = ({ note, userId, onLike, commentsEnabled, reactionsEnabled }) => {
    const hasLiked = userId && note.liked_by && note.liked_by.includes(userId);
    const comments = note.comments || [];

    if (!commentsEnabled && !reactionsEnabled) return null;

    // Adaptive Colors
    const isTransparent = note.color === NOTE_COLORS.TRANSPARENT;
    
    // VISIBILITY FIX:
    // Transparent: Adaptive colors
    // Solid (White + Colors): Dark colors
    
    const iconColor = isTransparent 
        ? 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
        : 'text-slate-500 hover:text-slate-800';
    
    const borderColor = isTransparent
        ? 'border-transparent'
        : 'border-black/5';

    const likedColor = 'text-red-500';
    const commentedColor = 'text-blue-600';

    return (
        <div className={`px-4 py-2 flex items-center gap-4 border-t mt-2 ${borderColor} ${isTransparent ? 'pl-0' : ''}`}>
            {reactionsEnabled && (
                <button 
                        onClick={onLike}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${hasLiked ? likedColor : `${iconColor} hover:text-red-500`}`}
                    >
                        <Heart size={16} fill={hasLiked ? "currentColor" : "none"} />
                        <span>{note.likes}</span>
                </button>
            )}
            {commentsEnabled && (
                <button 
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${comments.length > 0 ? commentedColor : `${iconColor} hover:text-blue-500`}`}
                >
                        <MessageSquare size={16} fill={comments.length > 0 ? "currentColor" : "none"} />
                        <span>{comments.length}</span>
                </button>
            )}
        </div>
    );
};
