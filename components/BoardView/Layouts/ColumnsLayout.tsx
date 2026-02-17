
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { NoteCard } from '../../NoteCard/index';
import { EditableInput } from '../../ui/EditableInput';
import { Tooltip } from '../../Tooltip';
import { useBoard } from '../BoardContext';
import { Note } from '../../../types';
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

export const ColumnsLayout: React.FC<ColumnsLayoutProps> = ({ isStudent: propIsStudent }) => {
    const { 
        board, notes, updateBoard, openAddNote, updateNote, sectionIdFilter, canManageBoard, isStudent: contextIsStudent,
        toggleSectionLock, toggleSectionContentBlur, toggleSectionVisibility, toggleSectionAnonymous, toggleSectionComments, toggleSectionReplies, toggleSectionRearrange,
        deleteNote, likeNote, addComment, isPresentationMode
    } = useBoard();

    // Prioritize propIsStudent (from BoardView) over context if explicit
    const isStudent = propIsStudent !== undefined ? propIsStudent : contextIsStudent;
    const isLocked = board.lockMode === 'readonly' || board.lockMode === 'comments_only';
    
    // --- Local State for Optimistic Dragging ---
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

    // Determine active sections, defaulting to a virtual one if none exist
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
        // Fix: If we are in "Virtual Group 1" mode (empty DB array), we must materialize Group 1 FIRST, then add Group 2.
        // Otherwise it just pushes Group 2 to an empty array, and Group 1 disappears.
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
    
    const toggleSectionCopy = (sectionId: string) => {
        const newSections = activeSections.map(s => s.id === sectionId ? { ...s, disableCopy: !s.disableCopy } : s);
        updateBoard({ sections: newSections });
    };

    const insertSectionAt = (index: number) => {
        // Same fix for insertion
        const currentSections = (board.sections && board.sections.length > 0) 
            ? board.sections 
            : [{ id: 'default-' + Math.random(), title: 'Group 1' }];

        const newSection = { id: Math.random().toString(36).substr(2, 9), title: `New Group` };
        const newSectionsList = [...currentSections];
        newSectionsList.splice(index, 0, newSection);
        updateBoard({ sections: newSectionsList });
    };

    // --- Helper for Manual Move/Add ---
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
        
        const sectionNotes = localNotes.filter(n => n.sectionId === note.sectionId);
        const currentIndex = sectionNotes.findIndex(n => n.id === noteId);
        
        let targetNote = null;
        if (direction === 'up' && currentIndex > 0) targetNote = sectionNotes[currentIndex - 1];
        if (direction === 'down' && currentIndex < sectionNotes.length - 1) targetNote = sectionNotes[currentIndex + 1];

        if (targetNote) {
            updateNote(noteId, { createdAt: targetNote.createdAt });
            updateNote(targetNote.id, { createdAt: note.createdAt });
        }
    }, [localNotes, updateNote]);

    // ... Drag Logic (Unchanged) ...
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
        const type = dragTypeRef.current;
        if (!draggedId || draggedId === targetId || type !== 'NOTE') return;
        const targetEl = e.currentTarget as HTMLElement;
        const rect = targetEl.getBoundingClientRect();
        const threshold = rect.top + (rect.height / 2);
        const mouseY = e.clientY;
        setLocalNotes(prev => {
            const newNotes = [...prev];
            const draggedIdx = newNotes.findIndex(n => n.id === draggedId);
            if (draggedIdx === -1) return prev;
            const draggedItem = newNotes[draggedIdx];
            newNotes.splice(draggedIdx, 1);
            draggedItem.sectionId = sectionId;
            let targetIdx = newNotes.findIndex(n => n.id === targetId);
            if (targetIdx === -1) newNotes.push(draggedItem);
            else {
                if (mouseY > threshold) targetIdx++;
                newNotes.splice(targetIdx, 0, draggedItem);
            }
            return newNotes;
        });
    };

    const onDragOverColumn = (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        const draggedId = dragItemRef.current;
        const type = dragTypeRef.current;
        if (!draggedId) return;
        if (type === 'COLUMN') {
            if (draggedId === sectionId) return;
            const currentSections = [...activeSections];
            const draggedIndex = currentSections.findIndex(s => s.id === draggedId);
            const targetIndex = currentSections.findIndex(s => s.id === sectionId);
            if (draggedIndex !== -1 && targetIndex !== -1) {
                const [removed] = currentSections.splice(draggedIndex, 1);
                currentSections.splice(targetIndex, 0, removed);
                updateBoard({ sections: currentSections });
            }
            return;
        }
        if (type === 'NOTE') {
            const notesInCol = localNotes.filter(n => n.sectionId === sectionId);
            if (notesInCol.length === 0) {
                 setLocalNotes(prev => {
                     if (prev.find(n => n.id === draggedId)?.sectionId === sectionId) return prev;
                     return prev.map(n => n.id === draggedId ? { ...n, sectionId } : n);
                 });
                 return;
            }
            if (e.currentTarget === e.target || (e.target as HTMLElement).getAttribute('data-drop-zone')) {
                 setLocalNotes(prev => {
                     const newNotes = [...prev];
                     const idx = newNotes.findIndex(n => n.id === draggedId);
                     if (idx === -1) return prev;
                     const item = newNotes[idx];
                     const sectionNotes = newNotes.filter(n => n.sectionId === sectionId);
                     if (sectionNotes.length > 0 && sectionNotes[sectionNotes.length - 1].id === draggedId) return prev;
                     newNotes.splice(idx, 1);
                     item.sectionId = sectionId;
                     let lastNoteIdx = -1;
                     for(let i = newNotes.length -1; i >= 0; i--) {
                         if (newNotes[i].sectionId === sectionId) {
                             lastNoteIdx = i;
                             break;
                         }
                     }
                     if (lastNoteIdx > -1) newNotes.splice(lastNoteIdx + 1, 0, item);
                     else newNotes.push(item);
                     return newNotes;
                 });
            }
        }
    };

    const onDrop = async (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        const draggedId = dragItemRef.current;
        const type = dragTypeRef.current;
        if (!draggedId) return;
        if (type === 'NOTE') {
            const sectionNotes = localNotes.filter(n => n.sectionId === sectionId);
            const newIndex = sectionNotes.findIndex(n => n.id === draggedId);
            const prevNote = newIndex > 0 ? sectionNotes[newIndex - 1] : null;
            const nextNote = newIndex < sectionNotes.length - 1 ? sectionNotes[newIndex + 1] : null;
            let newCreatedAt = Date.now();
            if (prevNote && nextNote) newCreatedAt = (prevNote.createdAt + nextNote.createdAt) / 2;
            else if (prevNote) newCreatedAt = prevNote.createdAt - 60000; 
            else if (nextNote) newCreatedAt = nextNote.createdAt + 60000; 
            await updateNote(draggedId, { sectionId: sectionId, createdAt: newCreatedAt });
        }
        setDraggingId(null);
        setDraggingType(null);
        dragItemRef.current = null;
        dragTypeRef.current = null;
    };

    const canDragColumns = canManageBoard || (board.studentsCanDragColumns && !isLocked);

    return (
        <div className="flex h-full overflow-x-auto gap-2 p-6 items-start pt-4">
            
            {activeSections.map((section, idx) => {
                // CENTRALIZED RULE: Hiding Logic
                if (BoardRules.isHidden(section.isHidden, !!isStudent, !!isPresentationMode)) return null;

                const sectionNotes = localNotes.filter((n: any) => n.sectionId === section.id || (!n.sectionId && idx === 0));
                const canAdd = canManageBoard || (!isLocked && !section.locked);
                const commentsOn = section.commentsEnabled !== undefined ? section.commentsEnabled : board.commentsEnabled;
                const repliesOn = section.repliesEnabled !== undefined ? section.repliesEnabled : (board.repliesEnabled !== false);
                const isContentBlurred = section.isContentBlurred !== undefined ? section.isContentBlurred : section.isTitleBlurred;
                const sectionCanDrag = section.studentsCanDrag !== undefined ? section.studentsCanDrag : (board.studentsCanDrag ?? false);
                const canDragNotes = canManageBoard || (sectionCanDrag && !isLocked && !section.locked);
                
                // Show controls logic - simplified for performance
                const showControls = !commentsOn || !repliesOn || section.locked || isContentBlurred || section.isHidden || section.isAnonymous || sectionCanDrag || section.disableCopy;

                return (
                    <React.Fragment key={section.id}>
                        {canManageBoard && (
                            <div 
                                className="w-6 hover:w-10 shrink-0 h-full flex flex-col items-center justify-center group/insert cursor-pointer transition-all duration-300 opacity-50 hover:opacity-100 z-10"
                                onClick={() => insertSectionAt(idx)}
                                title="Insert column here"
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
                                            title="Drag to reorder column"
                                        >
                                            <IconDrag size={16} />
                                        </div>
                                    )}
                                    {section.locked && <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-lg shadow-sm shrink-0"><IconLock size={12} strokeWidth={2.5} /></div>}
                                    {section.isHidden && <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-lg shadow-sm shrink-0"><IconHidden size={12} strokeWidth={2.5} /></div>}
                                    {section.disableCopy && <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-1.5 rounded-lg shadow-sm shrink-0"><IconCopyOff size={12} strokeWidth={2.5} /></div>}
                                    
                                    <EditableInput 
                                        disabled={!canManageBoard} 
                                        // Updated: Removed text-gray-500 so color stays even if locked
                                        className={`font-bold text-lg bg-transparent border border-transparent hover:border-white/20 rounded px-2 py-1 w-full focus:bg-white/10 outline-none transition-all ${!canManageBoard ? 'cursor-not-allowed' : ''} ${section.isHidden ? 'opacity-70' : 'opacity-100'} text-slate-800 dark:text-white placeholder-gray-400`} 
                                        value={section.title} 
                                        onSave={(val) => renameSection(section.id, val)}
                                        style={{ color: board.groupTextColor }}
                                    />
                                </div>
                                
                                {canManageBoard && (
                                    <div className={`grid grid-cols-4 gap-1 shrink-0 ml-2 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        
                                        <Tooltip content={section.locked ? "Unlock Group" : "Lock Group"}>
                                            <button onClick={() => toggleSectionLock(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.locked ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                {section.locked ? <IconLock size={14} /> : <IconUnlock size={14} />}
                                            </button>
                                        </Tooltip>

                                        <Tooltip content={commentsOn ? "Disable Comments" : "Enable Comments"}>
                                            <button onClick={() => toggleSectionComments(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${!commentsOn ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                {commentsOn ? <IconComment size={14} /> : <IconNoComment size={14} />}
                                            </button>
                                        </Tooltip>

                                        <Tooltip content={repliesOn ? "Disable Replies" : "Enable Replies"}>
                                            <button onClick={() => toggleSectionReplies(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${!repliesOn ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                <IconReply size={14} />
                                            </button>
                                        </Tooltip>

                                        <Tooltip content={sectionCanDrag ? "Disable Dragging" : "Enable Dragging"}>
                                            <button onClick={() => toggleSectionRearrange(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${sectionCanDrag ? 'text-green-500 bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                <IconMove size={14} />
                                            </button>
                                        </Tooltip>

                                        <Tooltip content={isContentBlurred ? "Reveal Content" : "Blur Content"}>
                                            <button onClick={() => toggleSectionContentBlur(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${isContentBlurred ? 'text-orange-500 bg-orange-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                {isContentBlurred ? <IconHidden size={14} /> : <IconBlur size={14} />}
                                            </button>
                                        </Tooltip>

                                        <Tooltip content={section.isHidden ? "Show Group" : "Hide Group"}>
                                            <button onClick={() => toggleSectionVisibility(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.isHidden ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                {section.isHidden ? <IconHidden size={14} /> : <IconVisible size={14} />}
                                            </button>
                                        </Tooltip>

                                        <Tooltip content={section.isAnonymous ? "Disable Anonymous" : "Enable Anonymous"}>
                                            <button onClick={() => toggleSectionAnonymous(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.isAnonymous ? 'text-purple-500 bg-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                <IconAnonymous size={14} />
                                            </button>
                                        </Tooltip>

                                        <Tooltip content={section.disableCopy ? "Enable Copying" : "Disable Copying"}>
                                            <button onClick={() => toggleSectionCopy(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.disableCopy ? 'text-orange-500 bg-orange-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                <IconCopyOff size={14} />
                                            </button>
                                        </Tooltip>

                                        <Tooltip content="Delete Group">
                                            <button onClick={() => deleteSection(section.id)} className="p-1.5 hover:text-red-500 text-slate-400 transition-colors hover:bg-red-500/10 rounded-lg flex justify-center">
                                                <IconClose size={14} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                )}
                            </div>
                            
                            <div 
                                className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-3 min-h-[100px] relative transition-colors rounded-xl"
                                onDragOver={handleAutoScroll}
                            >
                                {section.isHidden && (
                                    <div className="bg-red-500/10 border border-red-500/20 p-2 mb-2 rounded text-[10px] text-red-400 font-bold uppercase tracking-wide flex items-center gap-2 justify-center">
                                        <IconHidden size={12} /> Hidden from students
                                    </div>
                                )}

                                {/* Top Add Post Button */}
                                {canAdd && (
                                    <button 
                                        onClick={() => canAdd && openAddNote(section.id)} 
                                        disabled={!canAdd}
                                        className={`w-full py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md backdrop-blur-sm mb-3
                                        ${!canAdd 
                                            ? 'border-2 border-dashed border-red-500/20 text-red-400 cursor-not-allowed bg-red-500/5' 
                                            : 'bg-white/50 dark:bg-white/5 border-2 border-transparent hover:border-pink-500/50 text-slate-600 dark:text-white font-bold'}`}
                                    >
                                        {canAdd ? (
                                            <><div className="bg-pink-500 text-white rounded-full p-1"><IconPlus size={14} className="group-hover:scale-110 transition-transform"/></div> Add Post</>
                                        ) : (
                                            <><IconLock size={14} /> Locked</>
                                        )}
                                    </button>
                                )}
                                
                                {sectionNotes.map((note: any) => (
                                    <div 
                                        key={note.id} 
                                        id={`note-${note.id}`}
                                        className={`note-card-wrapper transition-transform duration-200 ease-out ${draggingId === note.id ? 'opacity-40' : ''}`}
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
                                            isStudent={isStudent} // Explicitly pass isStudent state to NoteCard
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
                                
                                <div 
                                    className={`h-24 w-full transition-colors rounded-lg flex items-center justify-center border-2 border-dashed border-transparent ${draggingId && draggingType === 'NOTE' ? 'hover:border-blue-500/50 hover:bg-blue-500/5' : ''}`}
                                    onDragOver={(e) => onDragOverColumn(e, section.id)}
                                    data-drop-zone="true"
                                >
                                    {draggingId && draggingType === 'NOTE' && <span className="text-xs text-gray-500 font-bold opacity-0 hover:opacity-100">Drop here to append</span>}
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}
            
            {canManageBoard && (
                <div className="flex items-center h-full px-4">
                    <button 
                        onClick={addSection} 
                        className="w-16 h-full max-h-[600px] bg-white/50 dark:bg-white/5 rounded-xl flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-gray-400 border-2 border-dashed border-slate-300 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-colors font-bold hover:w-32 group"
                    >
                        <IconPlus size={24} className="group-hover:scale-125 transition-transform" />
                        <span className="hidden group-hover:block whitespace-nowrap text-sm animate-in fade-in">Add Group</span>
                    </button>
                </div>
            )}
        </div>
    );
};
