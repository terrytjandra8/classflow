
import React, { useRef } from 'react';
import { ShieldCheck, MoreVertical, X, Pin, Ghost, ShieldAlert, MessageSquare, MessageSquareOff } from 'lucide-react';
import { Note, NoteColor } from '../../types';
import { NoteMenu } from './NoteMenu';
import { Avatar } from '../ui/Avatar';
import { useBoard } from '../BoardView/BoardContext';
import { getAnonymousIdentity } from '../../utils/anonymizer';
import { BoardRules } from '../../utils/boardRules';
import { Timestamp } from './Timestamp';

interface NoteHeaderProps {
    note: Note;
    canDelete: boolean;
    canEdit: boolean;
    onDelete: (id: string) => void;
    onEdit: () => void;
    onColorChange: (color: NoteColor) => void;
    onPin?: (id: string) => void;
    onDuplicate?: (note: Note) => void;
    onAddBefore?: () => void;
    onAddAfter?: () => void;
    onMove?: (direction: 'up' | 'down') => void;
    isStickyNote: boolean;
    isTransparent: boolean;
    isSectionAnonymous?: boolean;
    showMenu: boolean;
    setShowMenu: (show: boolean) => void;
    showUpdatedAt?: boolean;
    onUpdate?: (id: string, updates: Partial<Note>) => void;
    canManageBoard?: boolean;
    commentsEnabled?: boolean;
    onPrivateFeedback?: () => void;
}

export const NoteHeader: React.FC<NoteHeaderProps> = ({
    note, canDelete, canEdit, onDelete, onEdit, onColorChange, onPin, onDuplicate, onAddBefore, onAddAfter, onMove, isStickyNote, isTransparent, isSectionAnonymous,
    showMenu, setShowMenu, showUpdatedAt, onUpdate, canManageBoard, commentsEnabled, onPrivateFeedback
}) => {
    const { board, isStudent, userId, isPresentationMode, username } = useBoard();
    const triggerRef = useRef<HTMLButtonElement>(null);

    const isTeacher = note.authorRole === 'teacher' || note.author === 'Teacher';

    // Robust Author Check: Match by ID OR (Name + Role) fallback
    const isAuthor = userId === note.author_id ||
        (!!userId && !!username &&
            note.author?.trim().toLowerCase() === username.trim().toLowerCase() &&
            note.authorRole === (isStudent ? 'student' : 'teacher'));

    const shouldMask = BoardRules.shouldAnonymizeNote(board, isSectionAnonymous, note, userId, !!isStudent, !!isPresentationMode);
    const anonymousIdentity = shouldMask && note.author_id ? getAnonymousIdentity(note.author_id) : null;

    const rawName = note.author && note.author.trim() !== '' ? note.author : 'Anonymous';
    const displayName = shouldMask ? (anonymousIdentity?.name || 'Anonymous') : rawName;
    const displayAvatar = shouldMask ? (anonymousIdentity?.avatar || null) : note.authorAvatar;

    const nameColor = isTransparent ? 'text-slate-900 dark:text-white' : 'text-slate-900';
    const subTextColor = isTransparent ? 'text-slate-600 dark:text-slate-400' : 'text-slate-600';
    const iconHoverBg = isTransparent ? 'hover:bg-black/5 dark:hover:bg-white/10' : 'hover:bg-black/10';
    const menuIconColor = isTransparent ? 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white' : 'text-slate-600 hover:text-slate-900';

    if (isStickyNote) {
        if (canDelete) {
            return (
                <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                        className="p-1.5 hover:bg-black/10 rounded-full text-slate-500 hover:text-red-600 transition-colors"
                        title="Delete"
                    >
                        <X size={16} />
                    </button>
                </div>
            );
        }
        return null;
    }

    return (
        <div data-drag-handle className={`p-4 pb-2 flex items-start justify-between relative cursor-grab active:cursor-grabbing ${isTransparent ? 'pl-0' : ''}`}>
            <div className="flex items-center gap-3">
                <Avatar
                    src={displayAvatar}
                    name={displayName}
                    size="md"
                    isTeacher={isTeacher}
                />
                <div className="flex flex-col">
                    <span className={`font-bold text-sm leading-tight flex items-center gap-1 ${nameColor}`}>
                        {displayName}
                        {shouldMask && isAuthor && <span className="opacity-60 text-[10px] ml-0.5">(You)</span>}
                        {shouldMask && <Ghost size={10} className="text-gray-400" />}
                        {isTeacher && <ShieldCheck size={12} className="text-pink-600 fill-pink-100" />}
                        {note.isPinned && <Pin size={10} className="text-orange-500 rotate-45 ml-1 fill-orange-500" />}

                        {/* Focus Violation Flag (Visible to teachers always, students only if toggle is on) */}
                        {(note.violation_count || 0) > 0 && (
                            (!isStudent || (isStudent && isAuthor && board.showFocusViolations))
                        ) && (
                            <div
                                className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-black shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-[pulse_1s_infinite] ml-1 border border-red-400/50"
                                title={`${note.violation_count} focus violations`}
                            >
                                <ShieldAlert size={11} className="animate-bounce" />
                                <span className="tracking-tighter">{note.violation_count}</span>
                            </div>
                        )}
                    </span>
                    <div className={`text-[10px] font-medium flex items-center gap-2 ${subTextColor}`}>
                        <Timestamp time={note.createdAt} />
                        {showUpdatedAt && note.updatedAt && (
                            <Timestamp time={note.updatedAt} isEdited={true} />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 relative">
                {canManageBoard && onUpdate && commentsEnabled === false && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onUpdate(note.id, { isFeedbackPublic: !note.isFeedbackPublic }); }}
                        className={`p-1 rounded-full transition-all ${
                            note.isFeedbackPublic 
                                ? 'text-emerald-500 bg-emerald-500/10' 
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5'
                        }`}
                        title={
                            note.isFeedbackPublic 
                                ? 'Release Feedback to Everyone' 
                                : 'Keep Feedback Private'
                        }
                    >
                        {note.isFeedbackPublic ? <MessageSquare size={16} /> : <MessageSquareOff size={16} />}
                    </button>
                )}

                {(canEdit || canDelete) && (
                    <div className="relative">
                        <button
                            ref={triggerRef}
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className={`p-1 rounded-full transition-colors ${showMenu ? 'bg-black/10 text-slate-900' : `${menuIconColor} ${iconHoverBg}`}`}>
                            <MoreVertical size={16} />
                        </button>

                        {showMenu && (
                            <NoteMenu
                                triggerRef={triggerRef}
                                note={note}
                                canEdit={canEdit}
                                canDelete={canDelete}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onColorChange={onColorChange}
                                onPin={onPin}
                                onDuplicate={onDuplicate}
                                onAddBefore={onAddBefore}
                                onAddAfter={onAddAfter}
                                onMove={onMove}
                                onClose={() => setShowMenu(false)}
                                isTeacher={!isStudent}
                                onPrivateFeedback={onPrivateFeedback}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
