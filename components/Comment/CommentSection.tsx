import React, { useState } from 'react';
import { X, Plus, Smile, Send, Link as LinkIcon } from 'lucide-react';
import { Comment, CommentAttachment, NoteColor, UserRole } from '../../types';
import { AttachmentPicker } from '../AttachmentPicker';
import { CommentItem } from './CommentItem';
import { DynamicTextarea } from './DynamicTextarea';
import { useBoard } from '../BoardView/BoardContext';
import { isValidUrl } from '../../utils/validation';
import { NOTE_COLORS } from '../../utils/theme';

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏", "✅", "💯"];

interface CommentSectionProps {
    comments: Comment[];
    noteId: string;
    userId?: string;
    userRole: UserRole | string;
    onAddComment?: (noteId: string, text: string, attachment?: CommentAttachment) => void;
    onUpdateNote?: (noteId: string, updates: any) => void;
    reactionsEnabled: boolean;
    noteColor?: NoteColor;
    isStudent?: boolean;
    disablePaste?: boolean;
    repliesEnabled?: boolean; 
    isSectionAnonymous?: boolean; 
    isReadOnly?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ 
    comments, noteId, userId, userRole, onAddComment, onUpdateNote, reactionsEnabled, 
    noteColor, isStudent, disablePaste, repliesEnabled, isSectionAnonymous, isReadOnly 
}) => {
    const { board, username, userAvatar: contextAvatar } = useBoard();
    const allowLinks = board.allow_links; 

    const [showAllComments, setShowAllComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [isCommentInputFocused, setIsCommentInputFocused] = useState(false);
    const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
    const [draftAttachment, setDraftAttachment] = useState<CommentAttachment | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [pasteError, setPasteError] = useState(false);
    
    const isSolidCard = noteColor !== NOTE_COLORS.TRANSPARENT && noteColor !== NOTE_COLORS.WHITE;
    const isTeacher = userRole === 'teacher';

    const updateCommentInTree = (list: Comment[], targetId: string, updater: (c: Comment) => Comment | null): Comment[] => {
        return list.reduce((acc: Comment[], c) => {
            if (c.id === targetId) {
                const updated = updater(c);
                if (updated) acc.push(updated);
            } else {
                if (c.replies && c.replies.length > 0) {
                    acc.push({ ...c, replies: updateCommentInTree(c.replies, targetId, updater) });
                } else {
                    acc.push(c);
                }
            }
            return acc;
        }, []);
    };

    const addReplyToTree = (list: Comment[], parentId: string, newReply: Comment): Comment[] => {
        return list.map(c => {
            if (c.id === parentId) return { ...c, replies: [...(c.replies || []), newReply] };
            if (c.replies?.length) return { ...c, replies: addReplyToTree(c.replies, parentId, newReply) };
            return c;
        });
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (isStudent && disablePaste) {
            const text = e.clipboardData.getData('text/plain');
            if (allowLinks && isValidUrl(text)) return;
            if (text.length > 50) {
                e.preventDefault();
                setPasteError(true);
                setTimeout(() => setPasteError(false), 3000);
            }
        }
    };

    const handleLikeComment = (commentId: string) => {
        if (!reactionsEnabled || !userId || !onUpdateNote || isReadOnly) return;
        
        const updater = (c: Comment) => {
            const isLiked = c.liked_by?.includes(userId);
            const newLikedBy = isLiked ? (c.liked_by || []).filter((uid: string) => uid !== userId) : [...(c.liked_by || []), userId];
            const newLikes = isLiked ? Math.max(0, (c.likes || 0) - 1) : (c.likes || 0) + 1;
            return { ...c, likes: newLikes, liked_by: newLikedBy };
        };

        onUpdateNote(noteId, { comments: updateCommentInTree(comments, commentId, updater) });
    };

    const handleDeleteComment = (commentId: string) => {
        if (!onUpdateNote) return;
        onUpdateNote(noteId, { comments: updateCommentInTree(comments, commentId, () => null) });
    };

    const handleEditComment = (commentId: string, newText: string) => {
        if (!onUpdateNote) return;
        onUpdateNote(noteId, { comments: updateCommentInTree(comments, commentId, c => ({ ...c, content: newText })) });
    };

    const handleReplyComment = (parentId: string, text: string) => {
        if (!onUpdateNote || isReadOnly || !userId) return;
        
        const newReply: Comment = {
            id: Math.random().toString(36).substr(2, 9),
            note_id: noteId,
            content: text,
            author_id: userId,
            author_name: username || 'Student', 
            author_role: isTeacher ? 'teacher' : 'student',
            author_avatar: contextAvatar || undefined,
            createdAt: new Date().toISOString(),
            likes: 0,
            liked_by: [],
            replies: [],
        };

        onUpdateNote(noteId, { comments: addReplyToTree(comments, parentId, newReply) });
    };

    const submitComment = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!commentInput.trim() && !draftAttachment) || !onAddComment) return;
        onAddComment(noteId, commentInput, draftAttachment || undefined);
        setCommentInput('');
        setDraftAttachment(null);
        setIsCommentInputFocused(false);
        setShowAttachmentPicker(false);
        setShowEmojiPicker(false);
        setShowAllComments(true);
    };

    const insertEmoji = (emoji: string) => {
        setCommentInput(prev => prev + emoji);
        setShowEmojiPicker(false);
        setIsCommentInputFocused(true);
    };

    const handleSelectAttachment = (att: CommentAttachment) => {
        setDraftAttachment(att);
        setIsCommentInputFocused(true);
    };

    const containerClasses = isSolidCard ? `bg-black/5 hover:bg-black/10 border-transparent text-slate-800` : `bg-gray-100 dark:bg-white/5 border-transparent text-slate-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10`;
    const focusedClasses = isCommentInputFocused ? (isSolidCard ? 'bg-white ring-2 ring-blue-500/20 shadow-sm' : 'bg-white dark:bg-black ring-2 ring-blue-500/50 shadow-sm') : '';
    const iconColor = isSolidCard ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300';

    return (
        <div className="px-4 pb-4 pt-0">
            {comments.length > 0 && (
                <div className="mb-3">
                    {(showAllComments ? comments : comments.slice(-2)).map(comment => (
                        <CommentItem key={comment.id} comment={comment} userId={userId} reactionsEnabled={reactionsEnabled} handleLikeComment={handleLikeComment} handleDeleteComment={handleDeleteComment} handleEditComment={handleEditComment} handleReplyComment={handleReplyComment} isColoredCard={noteColor !== NOTE_COLORS.TRANSPARENT} isTeacher={isTeacher} disablePaste={disablePaste} allowLinks={allowLinks} isStudent={isStudent} repliesEnabled={repliesEnabled} isSectionAnonymous={isSectionAnonymous} isReadOnly={isReadOnly} />
                    ))}
                    {comments.length > 2 && !showAllComments && <button onClick={(e) => { e.stopPropagation(); setShowAllComments(true); }} className={`text-[10px] font-bold cursor-pointer hover:underline bg-transparent border-none p-2 w-full text-center outline-none rounded-xl transition-colors ${isSolidCard ? 'text-slate-600 bg-black/5 hover:bg-black/10' : 'text-slate-500 dark:text-slate-400 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}>View all {comments.length} comments</button>}
                </div>
            )}

            {!isReadOnly && (
                <div className="relative w-full mt-2">
                    {draftAttachment && <div className="mb-2 p-2 bg-white dark:bg-[#333] rounded-lg shadow-lg border border-slate-200 dark:border-white/10 flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200 w-fit"><div className="w-8 h-8 rounded overflow-hidden bg-slate-100 flex items-center justify-center">{draftAttachment.type === 'image' || draftAttachment.type === 'drawing' ? <img src={draftAttachment.content as string} className="w-full h-full object-cover" /> : <LinkIcon size={16} className="text-blue-500" />}</div><span className="text-xs text-slate-500 dark:text-gray-300 truncate max-w-[150px]">Attached</span><button onClick={() => setDraftAttachment(null)} className="text-slate-400 hover:text-red-500"><X size={14} /></button></div>}
                    {showAttachmentPicker && <AttachmentPicker onSelect={handleSelectAttachment} onClose={() => setShowAttachmentPicker(false)} />}
                    <div className={`flex items-end gap-2 rounded-[20px] px-3 py-2 transition-all border ${containerClasses} ${focusedClasses}`}>
                        <button type="button" onClick={() => setShowAttachmentPicker(!showAttachmentPicker)} className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${iconColor} hover:bg-black/5 active:scale-95`} title="Add attachment"><Plus size={18} /></button>
                        <div className="flex-1 py-1"><DynamicTextarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)} onPaste={handlePaste} onFocus={() => setIsCommentInputFocused(true)} onBlur={() => !commentInput && !draftAttachment && setIsCommentInputFocused(false)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }} placeholder="Add a comment..." className="w-full bg-transparent text-sm outline-none min-w-0 resize-none overflow-hidden leading-relaxed placeholder-current opacity-60 focus:opacity-100" /></div>
                        <div className="flex items-center gap-1 mb-0.5">
                            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`h-7 w-7 flex items-center justify-center rounded-full transition-colors ${iconColor} hover:bg-black/5`}><Smile size={18} /></button>
                            {(commentInput || draftAttachment) && <button onClick={submitComment} className="w-7 h-7 flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-all shrink-0 shadow-sm animate-in zoom-in duration-200"><Send size={14} className="ml-0.5" /></button>}
                        </div>
                        {showEmojiPicker && <div className="absolute bottom-12 right-0 bg-white dark:bg-[#333] shadow-xl rounded-xl border border-slate-200 dark:border-white/10 p-2 z-50 grid grid-cols-5 gap-1 w-48 animate-in zoom-in-95 origin-bottom-right">{EMOJIS.map(emoji => <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors">{emoji}</button>)}</div>}
                    </div>
                </div>
            )}
            {pasteError && <div className="text-[10px] text-red-500 font-bold px-3 mt-1 animate-in slide-in-from-top-1 fade-in">Pasting large text is disabled.</div>}
        </div>
    );
};
