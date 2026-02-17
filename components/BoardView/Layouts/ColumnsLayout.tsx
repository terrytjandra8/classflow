import React, { useCallback, useState, useEffect, useRef } from 'react';
import { NoteCard } from '../../NoteCard/index';
import { EditableInput } from '../../ui/EditableInput';
import { Tooltip } from '../../Tooltip';
import { useBoard } from '../BoardContext';
import { Note, Section, ColumnGroup } from '../../../types';
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

// Fixed: Added explicit types to Column component
interface ColumnProps {
    section: Section;
    isStudent: boolean;
    onDragStart: (e: React.DragEvent, id: string, type: 'NOTE' | 'COLUMN') => void;
    onDragOverColumn: (e: React.DragEvent, sectionId: string) => void;
    onDrop: (e: React.DragEvent, sectionId: string) => void;
    insertSectionAt: (idx: number) => void;
    idx: number;
    localNotes: Note[]; // Passed from parent
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

    // Filter notes for this specific section
    const sectionNotes = localNotes.filter((n: any) => n.sectionId === section.id || (!n.sectionId && idx === 0));
    
    const canAdd = canManageBoard || (!isLocked && !section.locked);
    const commentsOn = section.commentsEnabled !== undefined ? section.commentsEnabled : board.commentsEnabled;
    const repliesOn = section.repliesEnabled !== undefined ? section.repliesEnabled : (board.repliesEnabled !== false);
    const isContentBlurred = section.isContentBlurred !== undefined ? section.isContentBlurred : section.isTitleBlurred;
    const sectionCanDrag = section.studentsCanDrag !== undefined ? section.studentsCanDrag : (board.studentsCanDrag ?? false);
    const canDragNotes = canManageBoard || (sectionCanDrag && !isLocked && !section.locked);
    
    const showControls = !commentsOn || !repliesOn || section.locked || isContentBlurred || section.isHidden || section.isAnonymous || sectionCanDrag || section.disableCopy;

    const renameSection = (id: string, newTitle: string) => updateBoard({ sections: board.sections?.map(s => s.id === id ? { ...s, title: newTitle } : s) });
    const deleteSection = (id: string) => updateBoard({ sections: board.sections?.filter(s => s.id !== id) });
    const toggleSectionCopy = (sectionId: string) => {
        const newSections = board.sections?.map(s => s.id === sectionId ? { ...s, disableCopy: !s.disableCopy } : s);
        updateBoard({ sections: newSections });
    };

    const handleAddRelative = useCallback((noteId: string, position: 'before' | 'after') => {
        const note = localNotes.find(n => n.id === noteId);
        if (note) {
            openAddNote({ 
                sectionId: note.sectionId, 
                relativeId: note.id,
                position: position
            } as any);
        }
    }, [localNotes, openAddNote]);

    const handleMoveNote = useCallback((noteId: string, direction: 'up' | 'down') => {
        const note = localNotes.find(n => n.id === noteId);
        if (!note) return;
        
        const currentSectionNotes = localNotes.filter(n => n.sectionId === note.sectionId);
        const currentIndex = currentSectionNotes.findIndex(n => n.id === noteId);
        
        let targetNote = null;
        if (direction === 'up' && currentIndex > 0) targetNote = currentSectionNotes[currentIndex - 1];
        if (direction === 'down' && currentIndex < currentSectionNotes.length - 1) targetNote = currentSectionNotes[currentIndex + 1];

        if (targetNote) {
            updateNote(noteId, { createdAt: targetNote.createdAt });
            updateNote(targetNote.id, { createdAt: note.createdAt });
        }
    }, [localNotes, updateNote]);

    const canDragColumns = canManageBoard || (board.studentsCanDragColumns && !isLocked);

    return (
        <React.Fragment>
            {canManageBoard && (
                <div 
                    className="w-6 hover:w-10 shrink-0 h-full flex flex-col items-center justify-center group/insert cursor-pointer transition-all duration-300 opacity-50 hover:opacity-100 z-10"
                    onClick={() => insertSectionAt(idx)}
                >
                    <div className="h-[80%] w-1 rounded-full bg-blue-500/20 group-hover/insert:bg-blue-500 transition-colors relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md transform scale-0 group-hover/insert:scale-100 transition-transform">
                            <IconPlus size={14} strokeWidth={3} />
                        </div>
                    </div>
                </div>
            )}

            <div 
                className={`w-80 shrink-0 flex flex-col gap-3 max-h-full transition-transform ${draggingId === section.id && draggingType === 'COLUMN' ? 'opacity-50 scale-95' : ''}`}
                onDragOver={(e) => onDragOverColumn(e, section.id)} 
                onDrop={(e) => onDrop(e, section.id)}
            >
                <div className={`flex items-center justify-between group p-1.5 rounded-xl border border-transparent hover:border-white/10 transition-colors relative ${section.isHidden ? 'bg-red-500/5 border-dashed border-red-500/20' : 'bg-black/5 dark:bg-white/5'}`}>
                    <div className="flex items-center gap-2 w-full min-w-0">
                        {canDragColumns && (
                            <div 
                                className="text-gray-400 p-1 cursor-grab active:cursor-grabbing hover:text-white transition-colors"
                                draggable={true}
                                onDragStart={(e) => onDragStart(e, section.id, 'COLUMN')}
                            >
                                <IconDrag size={16} />
                            </div>
                        )}
                        {section.locked && <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-lg shrink-0"><IconLock size={12} /></div>}
                        
                        <EditableInput 
                            disabled={!canManageBoard} 
                            className={`font-bold text-lg bg-transparent border border-transparent hover:border-white/20 rounded px-2 py-1 w-full focus:bg-white/10 outline-none text-slate-800 dark:text-white`} 
                            value={section.title} 
                            onSave={(val) => renameSection(section.id, val)}
                        />
                    </div>
                    
                    {canManageBoard && (
                        <div className={`grid grid-cols-4 gap-1 shrink-0 ml-2 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                             <button onClick={() => toggleSectionLock(section.id)} className="p-1.5 rounded-lg"><IconLock size={14} /></button>
                             <button onClick={() => deleteSection(section.id)} className="p-1.5 rounded-lg text-red-400"><IconClose size={14} /></button>
                        </div>
                    )}
                </div>
                
                <div 
                    className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-3 min-h-[100px] relative transition-colors"
                    onDragOver={handleAutoScroll}
                >
                    {canAdd && (
                        <button 
                            onClick={() => openAddNote(section.id)} 
                            className="w-full py-4 rounded-xl transition-all flex items-center justify-center gap-2 bg-white/50 dark:bg-white/5 border-2 border-transparent hover:border-pink-500/50 text-slate-600 dark:text-white font-bold mb-3"
                        >
                            <IconPlus size={14} /> Add Post
                        </button>
                    )}
                    
                    {sectionNotes.map((note: any) => (
                        <div 
                            key={note.id} 
                            id={`note-${note.id}`}
                            className={`note-card-wrapper ${draggingId === note.id ? 'opacity-40' : ''}`}
                            draggable={canDragNotes}
                            onDragStart={(e) => onDragStart(e, note.id, 'NOTE')}
                            onDragOver={(e) => onDragOverNote(e, note.id, section.id)}
                            onDragEnd={onDragEnd}
                        >
                            <NoteCard 
                                note={note} 
                                onAddBefore={() => handleAddRelative(note.id, 'before')}
                                onAddAfter={() => handleAddRelative(note.id, 'after')}
                                onMoveNote={handleMoveNote}
                                canDrag={canDragNotes}
                                isStudent={isStudent}
                                isSectionAnonymous={section.isAnonymous}
                                isContentBlurred={isContentBlurred}
                                commentsEnabled={commentsOn}
                                reactionsEnabled={board.reactionsEnabled}
                                onDelete={deleteNote}
                                onLike={likeNote}
                                onAddComment={addComment}
                                onUpdate={updateNote}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </React.Fragment>
    );
}


export const ColumnsLayout: React.FC<ColumnsLayoutProps> = ({ isStudent: propIsStudent }) => {
    const boardContext = useBoard();
    const { 
        board, notes, updateBoard, openAddNote, updateNote, sectionIdFilter, canManageBoard, isStudent: contextIsStudent,
    } = boardContext;

    const isStudent = propIsStudent !== undefined ? propIsStudent : contextIsStudent;
    
    // --- Local State for Dragging ---
    const [localNotes, setLocalNotes] = useState<Note[]>(notes);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [draggingType, setDraggingType] = useState<'NOTE' | 'COLUMN' | null>(null);
    
    const dragItemRef = useRef<string | null>(null); 
    const dragTypeRef = useRef<'NOTE' | 'COLUMN' | null>(null);

    useEffect(() => {
        setLocalNotes(notes);
    }, [notes]);
    
    const onDragEnd = (e: React.DragEvent) => {
        setDraggingId(null);
        setDraggingType(null);
        dragItemRef.current = null;
        dragTypeRef.current = null;
    };

    const handleAutoScroll = (e: React.DragEvent) => {
        if (dragTypeRef.current !== 'NOTE') return;
        e.preventDefault();
        const container = e.currentTarget as HTMLDivElement;
        const { top, bottom } = container.getBoundingClientRect();
        const mouseY = e.clientY;
        const threshold = 100;
        const scrollSpeed = 15; 
        if (container.scrollHeight > container.clientHeight) {
            if (mouseY < top + threshold) container.scrollTop -= scrollSpeed;
            else if (mouseY > bottom - threshold) container.scrollTop += scrollSpeed;
        }
    };

    const onDragOverNote = (e: React.DragEvent, targetId: string, sectionId: string) => {
        e.preventDefault(); 
        const draggedId = dragItemRef.current;
        if (!draggedId || draggedId === targetId || dragTypeRef.current !== 'NOTE') return;

        setLocalNotes(prev => {
            const newNotes = [...prev];
            const draggedIdx = newNotes.findIndex(n => n.id === draggedId);
            if (draggedIdx === -1) return prev;
            
            const draggedItem = { ...newNotes[draggedIdx], sectionId };
            newNotes.splice(draggedIdx, 1);
            
            const targetIdx = newNotes.findIndex(n => n.id === targetId);
            newNotes.splice(targetIdx, 0, draggedItem);
            return newNotes;
        });
    };

    const onDragStart = (e: React.DragEvent, id: string, type: 'NOTE' | 'COLUMN') => {
        e.stopPropagation(); 
        setDraggingId(id);
        setDraggingType(type);
        dragItemRef.current = id;
        dragTypeRef.current = type;
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOverColumn = (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        const draggedId = dragItemRef.current;
        if (!draggedId || dragTypeRef.current !== 'NOTE') return;

        setLocalNotes(prev => {
            const currentItem = prev.find(n => n.id === draggedId);
            if (currentItem?.sectionId === sectionId) return prev;
            return prev.map(n => n.id === draggedId ? { ...n, sectionId } : n);
        });
    };

    const onDrop = async (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        const draggedId = dragItemRef.current;
        if (!draggedId || dragTypeRef.current !== 'NOTE') return;

        const finalNote = localNotes.find(n => n.id === draggedId);
        if (finalNote) {
            await updateNote(draggedId, { sectionId: sectionId, createdAt: finalNote.createdAt });
        }
        onDragEnd(e);
    };

    if (sectionIdFilter) {
         return <div className="p-10 text-center">Column view not supported in single slide mode.</div>;
    }

    const activeSections = board.sections || [];
    
    const addSection = () => {
        const newSection = { id: Math.random().toString(36).substr(2, 9), title: `Group ${activeSections.length + 1}` };
        updateBoard({ sections: [...activeSections, newSection] });
    };
    
    const insertSectionAt = (index: number) => {
        const newSection = { id: Math.random().toString(36).substr(2, 9), title: `New Group` };
        const newSectionsList = [...activeSections];
        newSectionsList.splice(index, 0, newSection);
        updateBoard({ sections: newSectionsList });
    };

    return (
        <div className="flex h-full overflow-x-auto gap-2 p-6 items-start pt-4">
            {activeSections.map((section, idx) => (
                <Column 
                    key={section.id}
                    section={section}
                    isStudent={isStudent}
                    onDragStart={onDragStart}
                    onDragOverColumn={onDragOverColumn}
                    onDrop={onDrop}
                    insertSectionAt={insertSectionAt}
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
                <div className="flex items-center h-full px-4">
                    <button 
                        onClick={addSection}