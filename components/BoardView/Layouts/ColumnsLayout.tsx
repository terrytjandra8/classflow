import React, { useCallback, useState, useEffect, useRef } from 'react';
import { NoteCard } from '../../NoteCard/index';
import { EditableInput } from '../../ui/EditableInput';
import { Tooltip } from '../../Tooltip';
import { useBoard } from '../BoardContext';
import { Note, Section } from '../../../types';
import { BoardRules } from '../../../utils/boardRules';
import { 
    IconLock, IconUnlock, IconVisible, IconHidden, IconBlur, 
    IconAnonymous, IconComment, IconNoComment, IconReply, 
    IconMove, IconDrag, IconClose, IconPlus,
    IconCopyOff
} from '../../Icons';

interface ColumnsLayoutProps {
    isStudent?: boolean;
}

interface ColumnProps {
    section: Section;
    isStudent: boolean;
    onDragStart: (e: React.DragEvent, id: string, type: 'NOTE' | 'COLUMN') => void;
    onDragOverColumn: (e: React.DragEvent, sectionId: string) => void;
    onDrop: (e: React.DragEvent, sectionId: string) => void;
    insertSectionAt: (idx: number) => void;
    idx: number;
    localNotes: Note[];
    draggingId: string | null;
    draggingType: string | null;
    onDragOverNote: (e: React.DragEvent, targetId: string, sectionId: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
    handleAutoScroll: (e: React.DragEvent) => void;
}

const Column = ({ 
    section, isStudent, onDragStart, onDragOverColumn, onDrop, 
    insertSectionAt, idx, localNotes, draggingId, draggingType, 
    onDragOverNote, onDragEnd, handleAutoScroll 
}: ColumnProps) => {
    
    const { 
        board, updateBoard, openAddNote, updateNote, canManageBoard,
        toggleSectionLock, toggleSectionContentBlur, toggleSectionVisibility, 
        toggleSectionAnonymous, toggleSectionComments, toggleSectionReplies, 
        toggleSectionRearrange, deleteNote, likeNote, addComment, isPresentationMode
    } = useBoard();

    const isLocked = board.lockMode === 'readonly' || board.lockMode === 'comments_only';
    
    if (BoardRules.isHidden(section.isHidden, !!isStudent, !!isPresentationMode)) return null;

    const sectionNotes = localNotes.filter((n: any) => n.sectionId === section.id || (!n.sectionId && idx === 0));
    const canAdd = canManageBoard || (!isLocked && !section.locked);
    const commentsOn = section.commentsEnabled !== undefined ? section.commentsEnabled : board.commentsEnabled;
    const isContentBlurred = section.isContentBlurred !== undefined ? section.isContentBlurred : section.isTitleBlurred;
    const sectionCanDrag = section.studentsCanDrag !== undefined ? section.studentsCanDrag : (board.studentsCanDrag ?? false);
    const canDragNotes = canManageBoard || (sectionCanDrag && !isLocked && !section.locked);
    
    const renameSection = (id: string, newTitle: string) => updateBoard({ sections: board.sections?.map(s => s.id === id ? { ...s, title: newTitle } : s) });
    const deleteSection = (id: string) => updateBoard({ sections: board.sections?.filter(s => s.id !== id) });

    return (
        <div 
            className={`w-80 shrink-0 flex flex-col gap-3 max-h-full transition-transform ${draggingId === section.id && draggingType === 'COLUMN' ? 'opacity-50 scale-95' : ''}`}
            onDragOver={(e) => onDragOverColumn(e, section.id)} 
            onDrop={(e) => onDrop(e, section.id)}
        >
            <div className={`flex items-center justify-between group p-1.5 rounded-xl border border-transparent bg-black/5 dark:bg-white/5`}>
                <div className="flex items-center gap-2 w-full min-w-0">
                    <EditableInput 
                        disabled={!canManageBoard} 
                        className={`font-bold text-lg bg-transparent border border-transparent rounded px-2 py-1 w-full text-slate-800 dark:text-white`} 
                        value={section.title} 
                        onSave={(val) => renameSection(section.id, val)}
                    />
                </div>
                {canManageBoard && (
                    <button onClick={() => deleteSection(section.id)} className="p-1.5 hover:text-red-500 transition-colors">
                        <IconClose size={14} />
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-3 min-h-[100px]" onDragOver={handleAutoScroll}>
                {canAdd && (
                    <button 
                        onClick={() => openAddNote(section.id)} 
                        className="w-full py-4 rounded-xl flex items-center justify-center gap-2 bg-white/50 dark:bg-white/5 border-2 border-transparent hover:border-pink-500/50 text-slate-600 dark:text-white font-bold mb-3"
                    >
                        <IconPlus size={14} /> Add Post
                    </button>
                )}
                
                {sectionNotes.map((note: any) => (
                    <div 
                        key={note.id} 
                        className={`${draggingId === note.id ? 'opacity-40' : ''}`}
                        draggable={canDragNotes}
                        onDragStart={(e) => onDragStart(e, note.id, 'NOTE')}
                        onDragOver={(e) => onDragOverNote(e, note.id, section.id)}
                        onDragEnd={onDragEnd}
                    >
                        <NoteCard 
                            note={note} 
                            canDrag={canDragNotes}
                            isStudent={isStudent}
                            onDelete={deleteNote}
                            onLike={likeNote}
                            onAddComment={addComment}
                            onUpdate={updateNote}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ColumnsLayout: React.FC<ColumnsLayoutProps> = ({ isStudent: propIsStudent }) => {
    const boardContext = useBoard();
    const { board, notes, updateBoard, openAddNote, updateNote, sectionIdFilter, canManageBoard, isStudent: contextIsStudent } = boardContext;
    const isStudent = propIsStudent !== undefined ? propIsStudent : contextIsStudent;

    const [localNotes, setLocalNotes] = useState<Note[]>(notes);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [draggingType, setDraggingType] = useState<'NOTE' | 'COLUMN' | null>(null);
    const dragItemRef = useRef<string | null>(null); 
    const dragTypeRef = useRef<'NOTE' | 'COLUMN' | null>(null);

    useEffect(() => { setLocalNotes(notes); }, [notes]);
    
    const onDragEnd = () => { setDraggingId(null); setDraggingType(null); dragItemRef.current = null; dragTypeRef.current = null; };
    const onDragStart = (e: React.DragEvent, id: string, type: 'NOTE' | 'COLUMN') => {
        setDraggingId(id); setDraggingType(type); dragItemRef.current = id; dragTypeRef.current = type;
    };
    const handleAutoScroll = (e: React.DragEvent) => { e.preventDefault(); };
    const onDragOverNote = (e: React.DragEvent) => { e.preventDefault(); };
    const onDragOverColumn = (e: React.DragEvent) => { e.preventDefault(); };
    const onDrop = async (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        if (dragItemRef.current) await updateNote(dragItemRef.current, { sectionId });
        onDragEnd();
    };

    if (sectionIdFilter) return <div className="p-10 text-center">Single slide mode active.</div>;

    const activeSections = board.sections || [];

    return (
        <div className="flex h-full overflow-x-auto gap-4 p-6 items-start">
            {activeSections.map((section, idx) => (
                <Column 
                    key={section.id}
                    section={section}
                    isStudent={isStudent}
                    onDragStart={onDragStart}
                    onDragOverColumn={onDragOverColumn}
                    onDrop={onDrop}
                    insertSectionAt={() => {}}
                    idx={idx}
                    localNotes={localNotes}
                    draggingId={draggingId}
                    draggingType={draggingType}
                    onDragOverNote={onDragOverNote}
                    onDragEnd={onDragEnd}
                    handleAutoScroll={handleAutoScroll}
                />
            ))}
            {canManageBoard && (
                <button 
                    onClick={() => updateBoard({ sections: [...activeSections, { id: Math.random().toString(36).substr(2, 9), title: 'New Group' }] })}
                    className="w-16 h-40 bg-white/5 rounded-xl flex items-center justify-center border-2 border-dashed border-white/10 hover:bg-white/10 transition-all shrink-0"
                >
                    <IconPlus size={24} />
                </button>
            )}
        </div>
    );
};