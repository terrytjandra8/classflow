
import React from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import { Note, NoteColor } from '../../types';

interface NoteFooterProps {
    note: Note;
    userId?: string;
    onLike: (e: React.MouseEvent) => void;
    commentsEnabled: boolean;
    reactionsEnabled: boolean;
    canManageBoard?: boolean;
    isAuthor?: boolean;
    isPresentationMode?: boolean;
}

export const NoteFooter: React.FC<NoteFooterProps> = ({ note, userId, onLike, commentsEnabled, reactionsEnabled, canManageBoard, isAuthor, isPresentationMode }) => {
    const hasLiked = userId && note.likedBy && note.likedBy.includes(userId);
    
    // Filter comments for count based on visibility rules
    const visibleComments = React.useMemo(() => {
        const comments = note.comments || [];
        // Teacher sees everything in normal mode
        if (canManageBoard && !isPresentationMode) return comments; 
        
        // Normal mode: public comments
        if (commentsEnabled) return comments; 

        // Private Feedback Mode:
        if (note.isFeedbackPublic) return comments; 
        if (isAuthor) {
            // AUTHOR ONLY sees Teacher comments + their own comments
            return comments.filter(c => 
                c.authorRole === 'teacher' || 
                c.authorId === userId || 
                c.author === 'Teacher'
            );
        }

        return [];
    }, [note.comments, canManageBoard, commentsEnabled, isAuthor, isPresentationMode, note.isFeedbackPublic]);

    const showComments = commentsEnabled || (canManageBoard && !isPresentationMode);

    if (!showComments && !reactionsEnabled) return null;

    // Adaptive Colors
    const isTransparent = note.color === NoteColor.TRANSPARENT;
    
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
            {showComments && (
                <button 
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${visibleComments.length > 0 ? commentedColor : `${iconColor} hover:text-blue-500`}`}
                >
                        <MessageSquare size={16} fill={visibleComments.length > 0 ? "currentColor" : "none"} />
                        <span>{visibleComments.length}</span>
                </button>
            )}
        </div>
    );
};
