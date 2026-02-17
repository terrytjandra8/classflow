
import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Heart, Link as LinkIcon, MoreVertical, Edit2, Trash2, Reply, ChevronDown, ChevronUp, Send, Ghost } from 'lucide-react';
import { Comment, CommentAttachment } from '../../types';
import { formatTime } from '../NoteCard/utils';
import { Tooltip } from '../Tooltip';
import { DynamicTextarea } from './DynamicTextarea';
import { Avatar } from '../ui/Avatar';
import { getAnonymousIdentity } from '../../utils/anonymizer';
import { isValidUrl } from '../../utils/validation';
import { useBoard } from '../BoardView/BoardContext';
import { BoardRules } from '../../utils/boardRules';

interface CommentItemProps { 
    comment: Comment; 
    userId?: string; 
    reactionsEnabled: boolean; 
    handleLikeComment: (id: string) => void;
    handleDeleteComment: (id: string) => void;
    handleEditComment: (id: string, newText: string) => void;
    handleReplyComment: (parentId: string, text: string) => void;
    isColoredCard: boolean;
    isTeacher: boolean;
    depth?: number;
    disablePaste?: boolean;
    allowLinks?: boolean;
    isStudent?: boolean;
    repliesEnabled?: boolean;
    isAnonymous?: boolean;
    isSectionAnonymous?: boolean;
    isReadOnly?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({ 
    comment, 
    userId, 
    reactionsEnabled, 
    handleLikeComment, 
    handleDeleteComment, 
    handleEditComment, 
    handleReplyComment, 
    isColoredCard, 
    isTeacher, 
    depth = 0, 
    disablePaste, 
    allowLinks,
    isStudent, 
    repliesEnabled,
    isAnonymous,
    isSectionAnonymous,
    isReadOnly
}) => {
    const { board, isPresentationMode } = useBoard();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [replyText, setReplyText] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [pasteError, setPasteError] = useState(false);
    
    const menuRef = useRef<HTMLDivElement>(null);

    const CHAR_LIMIT = 120;
    const isLong = comment.text.length > CHAR_LIMIT;
    const isCommentLiked = comment.likedBy?.includes(userId || '');
    const hasReplies = comment.replies && comment.replies.length > 0;
    
    const canManage = isTeacher || (userId && comment.authorId === userId);
    const canReply = repliesEnabled !== false && !isReadOnly; 
    const isAuthor = userId === comment.authorId;

    // --- CENTRALIZED ANONYMITY LOGIC ---
    const shouldMask = BoardRules.shouldAnonymizeComment(board, isSectionAnonymous, comment, userId, !!isStudent, !!isPresentationMode);
    const anonymousIdentity = shouldMask && comment.authorId ? getAnonymousIdentity(comment.authorId) : null;
    
    const displayName = shouldMask ? (anonymousIdentity?.name || 'Anonymous') : comment.author;
    const displayAvatar = shouldMask ? (anonymousIdentity?.avatar || null) : comment.authorAvatar;

    const MAX_INDENT_DEPTH = 3;
    const shouldIndent = depth < MAX_INDENT_DEPTH;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const handlePaste = (e: React.ClipboardEvent) => {
        if (isStudent && disablePaste) {
            const text = e.clipboardData.getData('text/plain');
            
            if (allowLinks && isValidUrl(text)) {
                return;
            }

            if (text.length > 50) {
                e.preventDefault();
                e.stopPropagation();
                setPasteError(true);
                setTimeout(() => setPasteError(false), 3000);
                return;
            }
        }
    };

    const onSaveEdit = () => {
        if (editText.trim() !== comment.text) {
            handleEditComment(comment.id, editText);
        }
        setIsEditing(false);
    };

    const onSubmitReply = () => {
        if (replyText.trim()) {
            handleReplyComment(comment.id, replyText);
            setReplyText('');
            setIsReplying(false);
        }
    };

    const bgClass = isColoredCard 
        ? 'bg-black/5 border-black/5' 
        : 'bg-white/60 dark:bg-white/5 border-black/5 dark:border-white/5';
    
    const textClass = isColoredCard
        ? 'text-slate-900'
        : 'text-slate-700 dark:text-slate-200';

    const metaTextClass = isColoredCard
        ? 'text-slate-500'
        : 'text-slate-400 dark:text-slate-400';

    const authorTextClass = isColoredCard
        ? 'text-slate-900'
        : 'text-slate-800 dark:text-slate-100';

    return (
        <div className={`text-xs ${depth === 0 ? 'mb-2' : 'mt-2'} group/comment w-full`}>
            {/* Main Comment Bubble */}
            <div className={`p-3 rounded-2xl relative border transition-colors shadow-sm ${bgClass}`}>
                <div className="flex items-center justify-between mb-1 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <Avatar 
                            src={displayAvatar} 
                            name={displayName} 
                            size="xs" 
                            isTeacher={comment.authorRole === 'teacher'}
                        />
                        <Tooltip content={displayName} position="top" className="min-w-0">
                            <span className={`font-bold flex items-center gap-1 truncate ${comment.authorRole === 'teacher' ? (isColoredCard ? 'text-pink-600' : 'text-pink-600 dark:text-pink-400') : authorTextClass}`}>
                                {displayName}
                                {shouldMask && isAuthor && <span className="opacity-60 text-[9px] font-normal ml-0.5">(You)</span>}
                                {shouldMask && <Ghost size={8} className="text-gray-400" />}
                                {comment.authorRole === 'teacher' && <ShieldCheck size={10} className="fill-pink-100 text-pink-600 shrink-0" />}
                            </span>
                        </Tooltip>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] ${metaTextClass}`}>{formatTime(comment.createdAt)}</span>
                        
                        {(canReply || canManage) && (
                            <div className="relative" ref={menuRef}>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                    className={`p-0.5 rounded opacity-0 group-hover/comment:opacity-100 transition-opacity ${metaTextClass} hover:text-slate-700 dark:hover:text-white`}
                                >
                                    <MoreVertical size={12} />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-1 w-24 bg-[#222] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                        {canReply && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setIsReplying(true); setShowMenu(false); }}
                                                className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                                            >
                                                <Reply size={10} /> Reply
                                            </button>
                                        )}
                                        {canManage && (
                                            <>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                                                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                                                >
                                                    <Edit2 size={10} /> Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteComment(comment.id); }}
                                                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"
                                                >
                                                    <Trash2 size={10} /> Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {isEditing ? (
                    <div className="mt-2 animate-in fade-in">
                        <DynamicTextarea 
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className={`w-full bg-white/50 dark:bg-black/20 rounded-xl p-3 text-sm outline-none border focus:border-blue-500 focus:bg-white dark:focus:bg-black/40 transition-all ${textClass} border-transparent shadow-inner`}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onSaveEdit();
                                }
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setIsEditing(false)} className="text-[10px] font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
                            <button onClick={onSaveEdit} className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div 
                            className={`block pl-7 text-sm leading-relaxed whitespace-pre-wrap break-words w-full ${textClass} ${isLong && !isExpanded ? 'max-h-[60px] overflow-hidden' : ''}`}
                            style={{
                                overflowWrap: 'break-word',
                                wordBreak: 'normal',
                                ...(isLong && !isExpanded ? {
                                    maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                                    WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
                                } : {})
                            }}
                        >
                            {comment.text}
                        </div>

                        {isLong && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                className="ml-7 mt-1 text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-0.5 bg-transparent border-none p-0 outline-none"
                            >
                                {isExpanded ? (
                                    <>Show less <ChevronUp size={10} /></>
                                ) : (
                                    <>Read more <ChevronDown size={10} /></>
                                )}
                            </button>
                        )}
                        
                        {comment.attachment && (
                            <div className="ml-7 mt-2 rounded-lg overflow-hidden border border-black/5 max-w-[150px]">
                                {comment.attachment.type === 'image' || comment.attachment.type === 'drawing' ? (
                                    <img src={comment.attachment.content} alt="attachment" className="w-full h-auto" />
                                ) : comment.attachment.type === 'link' ? (
                                    <a href={comment.attachment.content} target="_blank" rel="noopener noreferrer" className="block p-2 bg-blue-500/10 text-blue-600 truncate hover:underline text-[10px]">
                                        <LinkIcon size={10} className="inline mr-1" />
                                        {comment.attachment.content}
                                    </a>
                                ) : null}
                            </div>
                        )}
                    </>
                )}

                {/* Comment Actions (Like/Reply) */}
                <div className="flex justify-end items-center gap-3 mt-2">
                    {/* Reply Trigger */}
                    {!isEditing && canReply && (
                        <button 
                            onClick={() => setIsReplying(!isReplying)}
                            className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${metaTextClass} hover:text-blue-500`}
                        >
                            <Reply size={10} /> Reply
                        </button>
                    )}

                    {/* Likes */}
                    {reactionsEnabled && !isEditing && (
                        <button 
                            onClick={() => !isReadOnly && handleLikeComment(comment.id)}
                            disabled={isReadOnly}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${isCommentLiked ? 'text-pink-500 bg-pink-50 dark:bg-pink-900/30' : `${metaTextClass} ${isReadOnly ? '' : 'hover:text-pink-500 hover:bg-black/5'}`}`}
                        >
                            <Heart size={10} fill={isCommentLiked ? "currentColor" : "none"} /> 
                            {comment.likes && comment.likes > 0 ? comment.likes : ''}
                        </button>
                    )}
                </div>
                
                {pasteError && (
                    <div className="text-[10px] text-red-500 font-bold px-3 mt-1 animate-in slide-in-from-top-1 fade-in">
                        Pasting large text is disabled.
                    </div>
                )}
            </div>

            {/* Reply Input Form */}
            {isReplying && (
                <div className="mt-2 ml-4 pl-3 border-l-2 border-blue-500/30 animate-in slide-in-from-top-2">
                    <div className={`p-2 rounded-xl border flex items-start gap-2 ${bgClass}`}>
                        <DynamicTextarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onPaste={handlePaste}
                            placeholder="Write a reply..."
                            className={`w-full bg-transparent outline-none text-xs leading-relaxed ${textClass}`}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onSubmitReply();
                                }
                                if (e.key === 'Escape') setIsReplying(false);
                            }}
                        />
                        <button 
                            onClick={onSubmitReply}
                            disabled={!replyText.trim()}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full transition-colors disabled:opacity-50"
                        >
                            <Send size={12} />
                        </button>
                    </div>
                </div>
            )}

            {/* Nested Replies */}
            {hasReplies && (
                <div className={`${shouldIndent ? 'ml-4 pl-3 border-l-2 border-black/5 dark:border-white/10' : ''} mt-2 space-y-2`}>
                    {comment.replies!.map(reply => (
                        <CommentItem 
                            key={reply.id}
                            comment={reply}
                            userId={userId}
                            reactionsEnabled={reactionsEnabled}
                            handleLikeComment={handleLikeComment}
                            handleDeleteComment={handleDeleteComment}
                            handleEditComment={handleEditComment}
                            handleReplyComment={handleReplyComment}
                            isColoredCard={isColoredCard}
                            isTeacher={isTeacher}
                            depth={depth + 1}
                            disablePaste={disablePaste}
                            allowLinks={allowLinks}
                            isStudent={isStudent}
                            repliesEnabled={repliesEnabled}
                            isAnonymous={isAnonymous}
                            isSectionAnonymous={isSectionAnonymous}
                            isReadOnly={isReadOnly}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
