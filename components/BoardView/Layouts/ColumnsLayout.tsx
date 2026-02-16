
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { NoteCard } from '../../NoteCard/index';
import { EditableInput } from '../../ui/EditableInput';
import { Tooltip } from '../../Tooltip';
import { useBoard } from '../BoardContext';
import { Note, Section, SectionGroup } from '../../../types';
import { BoardRules } from '../../../utils/boardRules';
import { 
    IconLock, IconUnlock, IconVisible, IconHidden, IconBlur, 
    IconAnonymous, IconComment, IconNoComment, IconReply, 
    IconMove, IconDrag, IconClose, IconPlus,
    IconCopyOff
} from '../../Icons';

interface ColumnsLayoutProps {
    isStudent?: boolean; // Optional override
}

const SectionGroupHeader: React.FC<{ 
    group: SectionGroup, 
    canManageBoard: boolean, 
    onUpdate: (id: string, updates: Partial<SectionGroup>) => void, 
    onDelete: (id: string) => void,
    span: number
}> = ({ group, canManageBoard, onUpdate, onDelete, span }) => {
    // w-80 is 320px, gap-2 is 8px
    const groupWidth = span * 320 + (span - 1) * 8;

    return (
        <div 
            className="p-2 rounded-t-xl bg-black/10 dark:bg-white/10 border-b border-black/20 dark:border-white/20 mb-2 flex items-center justify-between"
            style={{ width: `${groupWidth}px` }}
        >
            <EditableInput
                disabled={!canManageBoard}
                className="font-bold text-xl bg-transparent border border-transparent hover:border-white/20 rounded px-2 py-1 w-full focus:bg-white/10 outline-none transition-all text-slate-800 dark:text-white"
                value={group.title}
                onSave={(newTitle) => onUpdate(group.id, { title: newTitle })}
            />
            {canManageBoard && (
                <div className="flex items-center gap-1">
                    <Tooltip content="Delete Group">
                        <button onClick={() => onDelete(group.id)} className="p-1.5 hover:text-red-500 text-slate-400 transition-colors hover:bg-red-500/10 rounded-lg flex justify-center">
                            <IconClose size={14} />
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};

export const ColumnsLayout: React.FC<ColumnsLayoutProps> = ({ isStudent: propIsStudent }) => {
    const { 
        board, notes, updateBoard, openAddNote, updateNote, sectionIdFilter, canManageBoard, isStudent: contextIsStudent,
        toggleSectionLock, toggleSectionContentBlur, toggleSectionVisibility, toggleSectionAnonymous, toggleSectionComments, toggleSectionReplies, toggleSectionRearrange,
        deleteNote, likeNote, addComment, isPresentationMode
    } = useBoard();

    const isStudent = propIsStudent !== undefined ? propIsStudent : contextIsStudent;
    const isLocked = board.lockMode === 'readonly' || board.lockMode === 'comments_only';
    
    const [localNotes, setLocalNotes] = useState<Note[]>(notes);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [draggingType, setDraggingType] = useState<'NOTE' | 'COLUMN' | null>(null);
    
    const dragItemRef = useRef<string | null>(null); 
    const dragTypeRef = useRef<'NOTE' | 'COLUMN' | null>(null);

    useEffect(() => {
        if (!draggingId || draggingType !== 'NOTE') {
            setLocalNotes(notes);
        }
    }, [notes, draggingId, draggingType]);

    if (sectionIdFilter) {
         return <div className="p-10 text-center">Column view not supported in single slide mode.</div>;
    }

    const activeSections = (board.sections && board.sections.length > 0) 
        ? board.sections 
        : [{ 
            id: 'default', 
            title: 'Group 1',
            locked: false,
            isContentBlurred: false,
            isHidden: false,
            isAnonymous: false,
            commentsEnabled: true,
            repliesEnabled: true,
            studentsCanDrag: false
        }];
    
    const addSection = () => {
        const currentSections = (board.sections && board.sections.length > 0) 
            ? board.sections 
            : [{ id: 'default-' + Math.random(), title: 'Group 1' }];

        updateBoard({ 
            sections: [
                ...currentSections, 
                { id: Math.random().toString(36).substr(2, 9), title: `Group ${currentSections.length + 1}` }
            ] 
        });
    };

    const renameSection = (id: string, newTitle: string) => updateBoard({ sections: activeSections.map(s => s.id === id ? { ...s, title: newTitle } : s) });
    const deleteSection = (id: string) => updateBoard({ sections: activeSections.filter(s => s.id !== id) });
    const toggleSectionCopy = (sectionId: string) => updateBoard({ sections: activeSections.map(s => s.id === sectionId ? { ...s, disableCopy: !s.disableCopy } : s) });

    const insertSectionAt = (index: number) => {
        const currentSections = (board.sections && board.sections.length > 0) 
            ? board.sections 
            : [{ id: 'default-' + Math.random(), title: 'Group 1' }];

        const newSection = { id: Math.random().toString(36).substr(2, 9), title: `New Group` };
        const newSectionsList = [...currentSections];
        newSectionsList.splice(index, 0, newSection);
        updateBoard({ sections: newSectionsList });
    };

    const handleAddRelative = useCallback((noteId: string, position: 'before' | 'after') => {
        const note = localNotes.find(n => n.id === noteId);
        if (note) {
            openAddNote({ sectionId: note.sectionId, relativeId: note.id, position } as any);
        }
    }, [localNotes, openAddNote]);

    const handleMoveNote = useCallback((noteId: string, direction: 'up' | 'down') => {
        // ... (logic unchanged)
    }, [localNotes, updateNote]);

    const onDragStart = (e: React.DragEvent, id: string, type: 'NOTE' | 'COLUMN') => {
        e.stopPropagation(); 
        setDraggingId(id);
        setDraggingType(type);
        dragItemRef.current = id;
        dragTypeRef.current = type;
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragEnd = (e: React.DragEvent) => {
        setDraggingId(null);
        setDraggingType(null);
        dragItemRef.current = null;
        dragTypeRef.current = null;
    };

    const onDrop = async (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        const draggedId = dragItemRef.current;
        const type = dragTypeRef.current;
        if (!draggedId || type !== 'NOTE') return;
        
        const sectionNotes = localNotes.filter(n => n.sectionId === sectionId);
        const newIndex = sectionNotes.findIndex(n => n.id === draggedId);
        const prevNote = newIndex > 0 ? sectionNotes[newIndex - 1] : null;
        const nextNote = newIndex < sectionNotes.length - 1 ? sectionNotes[newIndex + 1] : null;
        
        let newCreatedAt = Date.now();
        if (prevNote && nextNote) newCreatedAt = (prevNote.createdAt + nextNote.createdAt) / 2;
        else if (prevNote) newCreatedAt = prevNote.createdAt - 60000; 
        else if (nextNote) newCreatedAt = nextNote.createdAt + 60000; 
        
        await updateNote(draggedId, { sectionId: sectionId, createdAt: newCreatedAt });

        setDraggingId(null);
        setDraggingType(null);
        dragItemRef.current = null;
        dragTypeRef.current = null;
    };

    const canDragColumns = canManageBoard || (board.studentsCanDragColumns && !isLocked);

    const renderColumn = (section: Section, idx: number) => {
        if (BoardRules.isHidden(section.isHidden, !!isStudent, !!isPresentationMode)) return null;

        const sectionNotes = localNotes.filter((n: any) => n.sectionId === section.id || (!n.sectionId && idx === 0));
        const canAdd = canManageBoard || (!isLocked && !section.locked);
        const commentsOn = section.commentsEnabled !== undefined ? section.commentsEnabled : board.commentsEnabled;
        const repliesOn = section.repliesEnabled !== undefined ? section.repliesEnabled : (board.repliesEnabled !== false);
        const isContentBlurred = section.isContentBlurred !== undefined ? section.isContentBlurred : section.isTitleBlurred;
        const sectionCanDrag = section.studentsCanDrag !== undefined ? section.studentsCanDrag : (board.studentsCanDrag ?? false);
        const canDragNotes = canManageBoard || (sectionCanDrag && !isLocked && !section.locked);
        const showControls = !commentsOn || !repliesOn || section.locked || isContentBlurred || section.isHidden || section.isAnonymous || sectionCanDrag || section.disableCopy;

        return (
            <div key={section.id} className="flex items-start gap-2">
                {canManageBoard && (
                    <div className="w-6 hover:w-10 shrink-0 h-full flex flex-col items-center justify-center group/insert cursor-pointer transition-all duration-300 opacity-50 hover:opacity-100 z-10" onClick={() => insertSectionAt(idx)} title="Insert column here">
                        <div className="h-[80%] w-1 rounded-full bg-blue-500/20 group-hover/insert:bg-blue-500 transition-colors relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md transform scale-0 group-hover/insert:scale-100 transition-transform">
                                <IconPlus size={14} strokeWidth={3} />
                            </div>
                        </div>
                    </div>
                )}
                <div className={`w-80 shrink-0 flex flex-col gap-3 max-h-full transition-transform ${draggingId === section.id && draggingType === 'COLUMN' ? 'opacity-50 scale-95' : ''}`} onDrop={(e) => onDrop(e, section.id)}>
                    <div className={`flex items-center justify-between group p-1.5 rounded-xl border border-transparent hover:border-white/10 transition-colors relative ${section.isHidden ? 'bg-red-500/5 border-dashed border-red-500/20' : 'bg-black/5 dark:bg-white/5'}`}>
                        <div className="flex items-center gap-2 w-full min-w-0">
                            {canDragColumns && <div className="text-gray-400 p-1 cursor-grab active:cursor-grabbing hover:text-white transition-colors" draggable onDragStart={(e) => onDragStart(e, section.id, 'COLUMN')} title="Drag to reorder column"><IconDrag size={16} /></div>}
                            <EditableInput disabled={!canManageBoard} className="font-bold text-lg bg-transparent ..." value={section.title} onSave={(val) => renameSection(section.id, val)} style={{ color: board.groupTextColor }} />
                        </div>
                        {canManageBoard && <div className={`grid grid-cols-4 gap-1 ...`}>...</div>}
                    </div>
                    <div className="flex-1 overflow-y-auto ...">
                        {canAdd && <button onClick={() => canAdd && openAddNote(section.id)} ...>...</button>}
                        {sectionNotes.map((note: any) => <NoteCard key={note.id} note={note} ... />)}
                    </div>
                </div>
            </div>
        );
    };

    const renderLayout = () => {
        const elements = [];
        let sectionCursor = 0;

        if (board.sectionGroups && board.sectionGroups.length > 0) {
            board.sectionGroups.forEach(group => {
                const sectionsInGroup = activeSections.slice(sectionCursor, sectionCursor + group.span);
                if (sectionsInGroup.length > 0) {
                    elements.push(
                        <div key={group.id} className="flex flex-col items-start">
                            <SectionGroupHeader 
                                group={group} 
                                span={group.span}
                                canManageBoard={canManageBoard}
                                onUpdate={(id, updates) => {
                                    const newGroups = (board.sectionGroups || []).map(g => g.id === id ? {...g, ...updates} : g);
                                    updateBoard({ sectionGroups: newGroups });
                                }}
                                onDelete={(id) => {
                                    const newGroups = (board.sectionGroups || []).filter(g => g.id !== id);
                                    updateBoard({ sectionGroups: newGroups });
                                }}
                            />
                            <div className="flex items-start">
                                {sectionsInGroup.map((section, index) => renderColumn(section, sectionCursor + index))}
                            </div>
                        </div>
                    );
                }
                sectionCursor += group.span;
            });
        }

        const remainingSections = activeSections.slice(sectionCursor);
        remainingSections.forEach((section, index) => {
            elements.push(renderColumn(section, sectionCursor + index));
        });

        return elements;
    };

    return (
        <div className="flex h-full overflow-x-auto gap-2 p-6 items-start pt-4">
            {renderLayout()}
            {canManageBoard && (
                <div className="flex items-center h-full px-4">
                    <button onClick={addSection} className="w-16 h-full max-h-[600px] ...">
                        <IconPlus size={24} />
                        <span className="hidden group-hover:block ...">Add Group</span>
                    </button>
                </div>
            )}
        </div>
    );
};
