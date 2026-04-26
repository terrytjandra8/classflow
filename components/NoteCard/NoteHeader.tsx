
import React, { useRef } from 'react';
import { ShieldCheck, MoreVertical, X, Pin, Ghost, ShieldAlert } from 'lucide-react';
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
}

export const NoteHeader: React.FC<NoteHeaderProps> = ({ 
    note, canDelete, canEdit, onDelete, onEdit, onColorChange, onPin, onDuplicate, onAddBefore, onAddAfter, onMove, isStickyNote, isTransparent, isSectionAnonymous,
    showMenu, setShowMenu, showUpdatedAt
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
        <div className={`p-4 pb-2 flex items-start justify-between relative ${isTransparent ? 'pl-0' : ''}`}>
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
                        
                        {/* Focus Violation Flag (Visible to teachers and the student themselves) */}
                        {((!isStudent) || (isStudent && isAuthor)) && (note.violation_count || 0) > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-black animate-pulse shadow-sm ml-1" title={`${note.violation_count} focus violations`}>
                                <ShieldAlert size={10} />
                                {note.violation_count}
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
                        />
                    )}
                </div>
            )}
        </div>
    );
};
