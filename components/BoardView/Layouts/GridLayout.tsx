
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Plus, FolderPlus, Lock, Unlock, Wand2, X, Eye, EyeOff, Ghost, VenetianMask, Move, UserPlus, UserCheck } from 'lucide-react';
import { NoteCard } from '../../NoteCard/index';
import { EditableInput } from '../../ui/EditableInput';
import { Tooltip } from '../../Tooltip';
import { useBoard } from '../BoardContext';
import { Note } from '../../../types';
import { BoardRules } from '../../../utils/boardRules';
import { UserRules } from '../../../utils/userRules';
import { AssignStudentsModal } from '../AssignStudentsModal';
import { ConfirmationModal } from '../../ui/ConfirmationModal';


interface GridLayoutProps {
    gridClass: string;
    board?: any;
    notes?: any;
    isStudent?: boolean; // Optional override
}

export const GridLayout: React.FC<GridLayoutProps> = ({ gridClass, isStudent: propIsStudent }) => {
    const { 
        board, notes, updateBoard, openAddNote, canManageBoard,
        summarizeSection, sectionIdFilter, embeddedMode, updateNote, isStudent: contextIsStudent,
        toggleSectionLock, toggleSectionContentBlur, toggleSectionVisibility, toggleSectionAnonymous, toggleSectionRearrange,
        deleteNote, likeNote, addComment, userId, students, isPresentationMode
    } = useBoard();

    const [assigningSection, setAssigningSection] = useState<string | null>(null);
    const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);


    // Prioritize prop if passed, else context
    const isStudent = propIsStudent !== undefined ? propIsStudent : contextIsStudent;
    const isLocked = board.lockMode === 'readonly' || board.lockMode === 'comments_only';
    
    // --- Local State for Optimistic Dragging ---
    const [localNotes, setLocalNotes] = useState<Note[]>(notes);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const dragItemRef = useRef<string | null>(null);

    // Sync local notes
    useEffect(() => {
        if (!draggingId) {
            setLocalNotes(notes);
        }
    }, [notes, draggingId]);

    // Drag Handlers - Check board setting as fallback for generic starts
    const onDragStart = (e: React.DragEvent, id: string) => {
        const target = e.target as HTMLElement;
        // Only allow drag if it started from a designated drag handle area
        const isDragHandle = target.closest('[data-drag-handle]');
        if (!isDragHandle) {
            e.preventDefault();
            return;
        }
        setDraggingId(id);
        dragItemRef.current = id;
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragEnd = () => {
        setDraggingId(null);
        dragItemRef.current = null;
    };

    const onDragEnterNote = (e: React.DragEvent, targetId: string) => {
        const draggedId = dragItemRef.current;
        if (!draggedId || draggedId === targetId) return;

        setLocalNotes(prev => {
            const newNotes = [...prev];
            const draggedIdx = newNotes.findIndex(n => n.id === draggedId);
            const targetIdx = newNotes.findIndex(n => n.id === targetId);

            if (draggedIdx === -1 || targetIdx === -1) return prev;

            const [draggedItem] = newNotes.splice(draggedIdx, 1);
            newNotes.splice(targetIdx, 0, draggedItem);
            return newNotes;
        });
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const draggedId = dragItemRef.current;
        if (!draggedId) return;

        // Calculate New Timestamp based on neighbors in current LOCAL order
        const newIndex = localNotes.findIndex(n => n.id === draggedId);
        const prevNote = newIndex > 0 ? localNotes[newIndex - 1] : null;
        const nextNote = newIndex < localNotes.length - 1 ? localNotes[newIndex + 1] : null;

        let newCreatedAt = Date.now();
        if (prevNote && nextNote) {
            newCreatedAt = (prevNote.createdAt + nextNote.createdAt) / 2;
        } else if (prevNote) {
            newCreatedAt = prevNote.createdAt - 60000;
        } else if (nextNote) {
            newCreatedAt = nextNote.createdAt + 60000;
        }

        updateNote(draggedId, { createdAt: newCreatedAt });
        setDraggingId(null);
        dragItemRef.current = null;
    };

    const sections = sectionIdFilter 
        ? [{ id: sectionIdFilter, title: 'Lesson Activity', locked: false, isContentBlurred: false, isHidden: false, isAnonymous: false }]
        : (board.sections && board.sections.length > 0) ? board.sections : [{ id: 'default', title: 'Posts' }];
    
    const hideHeader = (!embeddedMode && sections.length === 1 && sections[0].id === 'default');

    const addSection = () => updateBoard({ sections: [...(board.sections || []), { id: Math.random().toString(36).substr(2, 9), title: `Group ${sections.length + 1}` }] });
    const renameSection = (id: string, newTitle: string) => updateBoard({ sections: sections.map(s => s.id === id ? { ...s, title: newTitle } : s) });
    const deleteSection = (id: string) => setSectionToDelete(id);
    
    const confirmDeleteSection = () => {
        if (sectionToDelete) {
            updateBoard({ sections: sections.filter(s => s.id !== sectionToDelete) });
            setSectionToDelete(null);
        }
    };

    
    const handleAddRelative = useCallback((noteId: string, position: 'before' | 'after') => {
        const note = localNotes.find((n: any) => n.id === noteId);
        if(note) openAddNote({ sectionId: note.sectionId, relativeId: note.id, position } as any);
    }, [localNotes, openAddNote]);

    const handleMoveNote = useCallback((noteId: string, direction: 'up' | 'down') => {
        const index = localNotes.findIndex(n => n.id === noteId);
        if (index === -1) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < localNotes.length) {
            const targetNote = localNotes[targetIndex];
            updateNote(noteId, { createdAt: targetNote.createdAt });
            updateNote(targetNote.id, { createdAt: localNotes[index].createdAt });
        }
    }, [localNotes, updateNote]);

    return (
        <div className={`mx-auto p-6 space-y-12 ${embeddedMode ? 'w-full pt-4' : 'pt-4 pb-20 max-w-[95%]'}`}>
            {sections.map(section => {
                if (BoardRules.isHidden(section.isHidden, !!isStudent, !!isPresentationMode)) return null;

                const sectionNotes = sectionIdFilter 
                    ? localNotes.filter((n: any) => n.sectionId === section.id) 
                    : localNotes.filter((n: any) => n.sectionId === section.id || (!n.sectionId && section.id === sections[0].id));
                
                const isSectionLocked = section.locked;
                
                // Permission Context
                const { isSimulatingStudent: simStudent } = useBoard();
                const fullCtx = { userId, board, isStudent: !!contextIsStudent && !simStudent, isSimulatingStudent: !!simStudent };

                const sectionCanDrag = section.studentsCanDrag !== undefined ? section.studentsCanDrag : (board.studentsCanDrag ?? false);
                const isContentBlurred = section.isContentBlurred !== undefined ? section.isContentBlurred : section.isTitleBlurred;
                const isHidden = section.isHidden;
                const commentsOn = section.commentsEnabled !== undefined ? section.commentsEnabled : board.commentsEnabled;

                const canAddToSection = UserRules.canAddPost(fullCtx, section.id);
                const canDragInSection = UserRules.canDragNote(fullCtx, undefined, !!sectionCanDrag);

                return (
                    <div key={section.id} className="animate-fade-in relative">
                        {!hideHeader && (
                            <div className={`flex items-center justify-between mb-6 border-b pb-2 group/header ${isHidden ? 'border-dashed border-red-500/20' : 'border-black/5 dark:border-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        {isSectionLocked && <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-md shadow-sm"><Lock size={14} strokeWidth={2.5} /></div>}
                                        {isHidden && <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-md shadow-sm"><EyeOff size={14} strokeWidth={2.5} /></div>}
                                        
                                        <EditableInput 
                                            disabled={!canManageBoard || embeddedMode}
                                            className={`font-bold text-xl bg-transparent border border-transparent hover:border-white/20 rounded px-2 py-1 min-w-[200px] focus:bg-white/10 outline-none transition-all ${!canManageBoard ? 'cursor-not-allowed' : ''} text-slate-800 dark:text-white placeholder-gray-400`}
                                            value={section.title} 
                                            onSave={(val) => renameSection(section.id, val)}
                                            style={{ color: board.groupTextColor }}
                                        />
                                    </div>
                                    <span className="bg-black/5 dark:bg-white/10 rounded-full text-gray-500 font-bold text-xs px-2.5 py-1">{sectionNotes.length}</span>
                                </div>
                                {canManageBoard && !embeddedMode && (
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                        <Tooltip content={isSectionLocked ? "Unlock Group" : "Lock Group"}>
                                            <button onClick={() => toggleSectionLock(section.id)} className={`p-2 rounded-lg transition-colors ${isSectionLocked ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                {isSectionLocked ? <Lock size={16} /> : <Unlock size={16} />}
                                            </button>
                                        </Tooltip>
                                        <Tooltip content={sectionCanDrag ? "Disable Dragging" : "Enable Dragging"}>
                                            <button onClick={() => toggleSectionRearrange(section.id)} className={`p-2 rounded-lg transition-colors ${sectionCanDrag ? 'text-green-500 bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                <Move size={16} />
                                            </button>
                                        </Tooltip>
                                        <Tooltip content={isContentBlurred ? "Reveal Content" : "Blur Content"}>
                                            <button onClick={() => toggleSectionContentBlur(section.id)} className={`p-2 rounded-lg transition-colors ${isContentBlurred ? 'text-orange-500 bg-orange-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                {isContentBlurred ? <EyeOff size={16} /> : <VenetianMask size={16} />}
                                            </button>
                                        </Tooltip>
                                        <Tooltip content={isHidden ? "Show Group" : "Hide Group"}>
                                            <button onClick={() => toggleSectionVisibility(section.id)} className={`p-2 rounded-lg transition-colors ${isHidden ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </Tooltip>
                                        <Tooltip content={section.isAnonymous ? "Disable Anonymous" : "Enable Anonymous"}>
                                            <button onClick={() => toggleSectionAnonymous(section.id)} className={`p-2 rounded-lg transition-colors ${section.isAnonymous ? 'text-purple-500 bg-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                <Ghost size={16} />
                                            </button>
                                        </Tooltip>
                                        {summarizeSection && sectionNotes.length > 0 && (
                                            <Tooltip content="Summarize Column">
                                                <button onClick={() => summarizeSection(section.id)} className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"><Wand2 size={16} /></button>
                                            </Tooltip>
                                        )}
                                        <Tooltip content="Delete Group">
                                            <button onClick={() => deleteSection(section.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><X size={16} /></button>
                                        </Tooltip>
                                        
                                        <Tooltip content="Assign Students">
                                            <button 
                                                onClick={() => setAssigningSection(section.id)} 
                                                className={`p-2 rounded-lg transition-colors ${section.assignedStudentIds?.length ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                            >
                                                <UserPlus size={16} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Assignment Status Badge */}
                        {section.assignedStudentIds && section.assignedStudentIds.length > 0 && (
                            <div className="bg-blue-500/10 border border-blue-500/20 p-2 mb-6 rounded-xl text-[10px] text-blue-400 font-bold uppercase tracking-wide flex items-center gap-2 justify-center max-w-fit mx-auto">
                                <UserCheck size={12} /> {section.assignedStudentIds.length} Students Assigned
                                {section.blurUnassigned && <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1 rounded ml-1">Blur Active</span>}
                            </div>
                        )}

                        <div 
                            className={gridClass}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={onDrop}
                        >
                            {sectionNotes.map((note: any) => (
                                <div 
                                    key={note.id}
                                    id={`grid-note-${note.id}`}
                                    draggable={UserRules.canEditNote(fullCtx, note)}
                                    onDragStart={(e) => onDragStart(e, note.id)}
                                    onDragEnter={(e) => onDragEnterNote(e, note.id)}
                                    onDragEnd={onDragEnd}
                                    className={`transition-transform duration-200 ease-out ${draggingId === note.id ? 'opacity-40' : ''}`}
                                >
                                    <NoteCard 
                                        note={note} 
                                        userId={userId}
                                        onAddBefore={() => handleAddRelative(note.id, 'before')}
                                        onAddAfter={() => handleAddRelative(note.id, 'after')}
                                        onMoveNote={handleMoveNote}
                                        canDrag={UserRules.canEditNote(fullCtx, note)}
                                        isSectionAnonymous={section.isAnonymous}
                                        isContentBlurred={isContentBlurred} 
                                        commentsEnabled={commentsOn}
                                        reactionsEnabled={board.reactionsEnabled}
                                        onDelete={deleteNote}
                                        onLike={likeNote}
                                        onAddComment={addComment}
                                        onUpdate={updateNote}
                                        isLocked={!UserRules.canEditNote(fullCtx, note)}
                                    />
                                </div>
                            ))}
                            
                            {!isPresentationMode && (
                                <button 
                                    onClick={() => canAddToSection && openAddNote(section.id)}
                                    disabled={!canAddToSection}
                                    className={`
                                        flex flex-col items-center justify-center gap-2 rounded-2xl transition-all group
                                        break-inside-avoid w-full aspect-auto min-h-[150px] shadow-sm hover:shadow-md backdrop-blur-sm
                                        ${!canAddToSection ? 'border-2 border-dashed border-red-500/20 text-red-400 cursor-not-allowed bg-red-500/5' : 'bg-white/50 dark:bg-white/5 border-2 border-transparent hover:border-pink-500/50'}
                                    `}
                                    >
                                    <div className={`p-3 rounded-full ${!canAddToSection ? 'bg-gray-400' : 'bg-pink-500'} text-white group-hover:scale-110 transition-transform shadow-lg`}>
                                        {canAddToSection ? <Plus size={24} /> : <Lock size={24} />}
                                    </div>
                                    <span className={`text-sm font-bold mt-1 ${!canAddToSection ? 'text-gray-400' : 'text-slate-600 dark:text-white'}`}>
                                        {canAddToSection ? 'Add Post' : 'Locked'}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            {canManageBoard && !sectionIdFilter && (
                <div className="flex justify-center opacity-50 hover:opacity-100 transition-opacity">
                    <button 
                        onClick={addSection}
                        className="py-2 px-6 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-full flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:border-gray-400 dark:hover:border-white/30 transition-all font-bold hover:bg-black/5 dark:hover:bg-white/5 text-xs"
                    >
                        <FolderPlus size={14} /> {sections.length > 1 ? 'Add Another Group' : 'Add Group / Section'}
                    </button>
                </div>
            )}
            
            {/* Assignment Modal */}
            {assigningSection && (
                <AssignStudentsModal
                    isOpen={!!assigningSection}
                    onClose={() => setAssigningSection(null)}
                    sectionTitle={sections.find(s => s.id === assigningSection)?.title || ''}
                    allStudents={students || []}
                    assignedIds={sections.find(s => s.id === assigningSection)?.assignedStudentIds || []}
                    blurUnassigned={sections.find(s => s.id === assigningSection)?.blurUnassigned || false}
                    targetGrade={board.targetGrade}
                    allAssignedOnBoard={sections.reduce((acc, s) => {
                        if (s.id !== assigningSection) {
                            return [...acc, ...(s.assignedStudentIds || [])];
                        }
                        return acc;
                    }, [] as string[])}
                    onSave={(assignedIds, blurUnassigned) => {
                        updateBoard({
                            sections: sections.map(s => 
                                s.id === assigningSection ? { ...s, assignedStudentIds: assignedIds, blurUnassigned } : s
                            )
                        });
                    }}
                />
            )}

            <ConfirmationModal 
                isOpen={!!sectionToDelete}
                onClose={() => setSectionToDelete(null)}
                onConfirm={confirmDeleteSection}
                title="Delete Section?"
                message={`Are you sure you want to delete "${sections.find(s => s.id === sectionToDelete)?.title || 'this section'}"? This will hide all notes in this section from the view.`}
                confirmText="Delete Section"
                type="danger"
            />
        </div>
    );
};
