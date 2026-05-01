
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { NoteCard } from '../../NoteCard/index';
import { Tooltip } from '../../Tooltip';
import { useBoard } from '../BoardContext';
import { Note } from '../../../types';
import { BoardRules } from '../../../utils/boardRules';
import { UserRules } from '../../../utils/userRules';
import { IconLock, IconHidden, IconPlus } from '../../Icons';
import { GitMerge, UserCheck } from 'lucide-react';
import { AssignStudentsModal } from '../AssignStudentsModal';
import { ConfirmationModal } from '../../ui/ConfirmationModal';


// Sub-components
import { GROUP_COLORS } from './Columns/constants';
import { MergeToolbar } from './Columns/MergeToolbar';
import { ColumnHeader } from './Columns/ColumnHeader';
import { GroupedColumnSubHeader } from './Columns/GroupedColumnSubHeader';
import { ColumnGroup } from './Columns/ColumnGroup';

interface ColumnsLayoutProps {
    isStudent?: boolean;
}

export const ColumnsLayout: React.FC<ColumnsLayoutProps> = ({ isStudent: propIsStudent }) => {
    const {
        board, notes, updateBoard, openAddNote, updateNote, sectionIdFilter, canManageBoard, isStudent: contextIsStudent,
        toggleSectionLock, toggleSectionContentBlur, toggleSectionVisibility, toggleSectionAnonymous, toggleSectionComments, toggleSectionReplies, toggleSectionRearrange,
        toggleSectionCopy, toggleSectionWatermark,
        deleteNote, likeNote, addComment, isPresentationMode, userId, students,
        isMergeMode, setIsMergeMode
    } = useBoard();

    const [assigningSection, setAssigningSection] = useState<string | null>(null);
    const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

    const isStudent = propIsStudent !== undefined ? propIsStudent : contextIsStudent;
    const isLocked = board.lockMode === 'readonly' || board.lockMode === 'comments_only';

    const [localNotes, setLocalNotes] = useState<Note[]>(notes);
    const [localSections, setLocalSections] = useState(board.sections || []);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [draggingType, setDraggingType] = useState<'NOTE' | 'COLUMN' | null>(null);

    // Sync local state when external data changes, but not while dragging
    useEffect(() => {
        if (!draggingId || draggingType !== 'NOTE') {
            setLocalNotes(notes);
        }
    }, [notes, draggingId, draggingType]);

    useEffect(() => {
        if (!draggingId || draggingType !== 'COLUMN') {
            setLocalSections(board.sections || []);
        }
    }, [board.sections, draggingId, draggingType]);

    // Merge mode state
    const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
    const [pendingGroupTitle, setPendingGroupTitle] = useState('');
    const [pendingGroupColor, setPendingGroupColor] = useState(GROUP_COLORS[0].accent);
    // Which group's color palette is open
    const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

    const dragItemRef = useRef<string | null>(null);
    const dragTypeRef = useRef<'NOTE' | 'COLUMN' | null>(null);

    // ── PANNING STATE ──
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false);
    const startX = useRef(0);
    const scrollLeftStart = useRef(0);

    const handlePanningMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 && scrollContainerRef.current) {
            isPanning.current = true;
            startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
            scrollLeftStart.current = scrollContainerRef.current.scrollLeft;
            scrollContainerRef.current.style.cursor = 'grabbing';
            scrollContainerRef.current.style.userSelect = 'none';
            e.preventDefault();
        }
    };

    const handlePanningMouseMove = (e: React.MouseEvent) => {
        if (!isPanning.current || !scrollContainerRef.current) return;
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX.current) * 1.5; // Adjusted speed
        scrollContainerRef.current.scrollLeft = scrollLeftStart.current - walk;
    };

    const handlePanningMouseUp = () => {
        if (isPanning.current && scrollContainerRef.current) {
            isPanning.current = false;
            scrollContainerRef.current.style.cursor = 'auto';
            scrollContainerRef.current.style.userSelect = 'auto';
        }
    };

    if (sectionIdFilter) {
        return <div className="p-10 text-center">Column view not supported in single slide mode.</div>;
    }

    const activeSections = (localSections && localSections.length > 0)
        ? localSections
        : [{
            id: 'default', title: 'Group 1', locked: false,
            isContentBlurred: false, isHidden: false, isAnonymous: false,
            commentsEnabled: true, repliesEnabled: true, studentsCanDrag: false
        }];

    // ── SECTION MANAGEMENT ──

    const addSection = () => {
        const currentSections = activeSections;
        updateBoard({
            sections: [...currentSections, { id: Math.random().toString(36).substr(2, 9), title: `Group ${currentSections.length + 1}` }]
        });
    };

    const renameSection = (id: string, newTitle: string) => updateBoard({ sections: activeSections.map(s => s.id === id ? { ...s, title: newTitle } : s) });
    const deleteSection = (id: string) => setSectionToDelete(id);

    const confirmDeleteSection = () => {
        if (sectionToDelete) {
            updateBoard({ sections: activeSections.filter(s => s.id !== sectionToDelete) });
            setSectionToDelete(null);
        }
    };


    const insertSectionAt = (index: number) => {
        const currentSections = activeSections;
        const newSection = { id: Math.random().toString(36).substr(2, 9), title: `New Group` };
        const list = [...currentSections];
        list.splice(index, 0, newSection);
        updateBoard({ sections: list });
    };

    // ── MERGE / GROUP LOGIC ──

    const toggleSelectForMerge = (id: string) => {
        setSelectedForMerge(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            // Auto-update pending title from selected names
            const titles = activeSections.filter(s => next.has(s.id)).map(s => s.title);
            setPendingGroupTitle(titles.join(' / '));
            return next;
        });
    };

    const mergeSelected = () => {
        if (selectedForMerge.size < 2) return;
        const groupId = Math.random().toString(36).substr(2, 9);
        const groupTitle = pendingGroupTitle || 'Merged Group';
        const newSections = activeSections.map(s =>
            selectedForMerge.has(s.id) ? { ...s, groupId, groupTitle, groupColor: pendingGroupColor } : s
        );
        updateBoard({ sections: newSections });
        cancelMergeMode();
    };

    const addToGroup = (groupId: string, groupTitle: string, groupColor?: string) => {
        const newSections = activeSections.map(s =>
            selectedForMerge.has(s.id) && !s.groupId ? { ...s, groupId, groupTitle, groupColor } : s
        );
        updateBoard({ sections: newSections });
        cancelMergeMode();
    };

    const unmergeSection = (id: string) => {
        const newSections = activeSections.map(s =>
            s.id === id ? { ...s, groupId: undefined, groupTitle: undefined, groupColor: undefined } : s
        );
        updateBoard({ sections: newSections });
    };

    const disbandGroup = (groupId: string) => {
        const newSections = activeSections.map(s =>
            s.groupId === groupId ? { ...s, groupId: undefined, groupTitle: undefined, groupColor: undefined } : s
        );
        updateBoard({ sections: newSections });
    };

    const renameGroup = (groupId: string, newTitle: string) => {
        const newSections = activeSections.map(s =>
            s.groupId === groupId ? { ...s, groupTitle: newTitle } : s
        );
        updateBoard({ sections: newSections });
    };

    const updateGroupColor = (groupId: string, color: string) => {
        const newSections = activeSections.map(s =>
            s.groupId === groupId ? { ...s, groupColor: color } : s
        );
        updateBoard({ sections: newSections });
        setOpenColorPicker(null);
    };

    const cancelMergeMode = () => {
        setIsMergeMode(false);
        setSelectedForMerge(new Set());
        setPendingGroupTitle('');
        setPendingGroupColor(GROUP_COLORS[0].accent);
    };

    // ── DRAG HANDLERS ──

    const onDragStart = (e: React.DragEvent, id: string, type: 'NOTE' | 'COLUMN') => {
        // Robust check: Prevent dragging if starting from an interactive element OR if one is already focused
        const target = e.target as HTMLElement;
        const activeEl = document.activeElement;
        const isInteractive = (el: Element | null) => 
            el && (el.closest('input, textarea, button, [contenteditable="true"]') || ['INPUT', 'TEXTAREA', 'BUTTON'].includes(el.tagName));

        if (isInteractive(target) || isInteractive(activeEl) || (e as any).button === 1) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        dragItemRef.current = id;
        dragTypeRef.current = type;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => { setDraggingId(id); setDraggingType(type); }, 0);
    };

    const onDragOverNote = useCallback((e: React.DragEvent, targetNoteId: string, targetSectionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragTypeRef.current !== 'NOTE') return;
        const draggedId = dragItemRef.current;
        if (!draggedId || draggedId === targetNoteId) return;
        setLocalNotes(prev => {
            const arr = [...prev];
            const fi = arr.findIndex(n => n.id === draggedId);
            const ti = arr.findIndex(n => n.id === targetNoteId);
            if (fi === -1 || ti === -1) return prev;
            const [moved] = arr.splice(fi, 1);
            arr.splice(ti, 0, { ...moved, sectionId: targetSectionId });
            return arr;
        });
    }, []);

    const onDragOverColumn = useCallback((e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault();
        if (dragTypeRef.current === 'COLUMN') {
            const draggedId = dragItemRef.current;
            if (!draggedId || draggedId === targetSectionId) return;
            
            setLocalSections(prev => {
                const sections = [...prev];
                const fi = sections.findIndex(s => s.id === draggedId);
                const ti = sections.findIndex(s => s.id === targetSectionId);
                if (fi === -1 || ti === -1) return prev;
                const [moved] = sections.splice(fi, 1);
                sections.splice(ti, 0, moved);
                return sections;
            });
        }
    }, []);

    const onDrop = useCallback((e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault();
        const draggedId = dragItemRef.current;
        if (!draggedId) return;

        if (dragTypeRef.current === 'COLUMN') {
            // Persist the final order from localSections
            updateBoard({ sections: localSections });
        } else if (dragTypeRef.current === 'NOTE') {
            // Calculate New Timestamp for persistence (matching GridLayout logic)
            const newIndex = localNotes.findIndex(n => n.id === draggedId);
            const prevNote = newIndex > 0 ? localNotes[newIndex - 1] : null;
            const nextNote = newIndex < localNotes.length - 1 ? localNotes[newIndex + 1] : null;

            let newCreatedAt = Date.now();
            if (prevNote && nextNote) {
                newCreatedAt = (prevNote.createdAt + nextNote.createdAt) / 2;
            } else if (prevNote) {
                newCreatedAt = prevNote.createdAt - 1000;
            } else if (nextNote) {
                newCreatedAt = nextNote.createdAt + 1000;
            }

            // Persist the change to the database
            updateNote(draggedId, {
                sectionId: targetSectionId,
                createdAt: newCreatedAt
            });
        }

        setDraggingId(null);
        setDraggingType(null);
        dragItemRef.current = null;
        dragTypeRef.current = null;
    }, [localNotes, localSections, updateNote, updateBoard]);

    const handleAutoScroll = useCallback((e: React.DragEvent) => {
        if (dragTypeRef.current !== 'NOTE') return;
        const el = e.currentTarget as HTMLElement;
        const { top, bottom } = el.getBoundingClientRect();
        if (e.clientY < top + 80) el.scrollTop -= 10;
        if (e.clientY > bottom - 80) el.scrollTop += 10;
    }, []);

    const handleMoveNote = useCallback((noteId: string, direction: 'up' | 'down') => {
        const index = localNotes.findIndex(n => n.id === noteId);
        if (index === -1) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex >= 0 && targetIndex < localNotes.length) {
            const targetNote = localNotes[targetIndex];
            // Swap Timestamps to swap positions
            const currentNote = localNotes[index];
            updateNote(noteId, { createdAt: targetNote.createdAt });
            updateNote(targetNote.id, { createdAt: currentNote.createdAt });
        }
    }, [localNotes, updateNote]);

    const onDragEnd = () => {
        // Cleanup dragging state
        setDraggingId(null);
        setDraggingType(null);
        dragItemRef.current = null;
        dragTypeRef.current = null;
    };

    // ── COMPUTED VALUES ──

    const canDragColumns = canManageBoard || (board.studentsCanDragColumns && !isLocked);

    // Build render items: single columns or groups
    type RenderItem =
        | { type: 'single'; section: typeof activeSections[0]; idx: number }
        | { type: 'group'; groupId: string; groupTitle: string; groupColor: string; sections: { section: typeof activeSections[0]; idx: number }[] };

    const renderItems: RenderItem[] = [];
    const seenGroupIds = new Set<string>();

    activeSections.forEach((section, idx) => {
        if (!section.groupId) {
            renderItems.push({ type: 'single', section, idx });
        } else if (!seenGroupIds.has(section.groupId)) {
            seenGroupIds.add(section.groupId);
            renderItems.push({
                type: 'group',
                groupId: section.groupId,
                groupTitle: section.groupTitle || 'Group',
                groupColor: section.groupColor || GROUP_COLORS[0].accent,
                sections: activeSections.map((s, i) => ({ section: s, idx: i })).filter(({ section: s }) => s.groupId === section.groupId),
            });
        }
    });

    const existingGroups = renderItems.filter(i => i.type === 'group') as Extract<RenderItem, { type: 'group' }>[];

    // ── RENDER COLUMN ──

    const renderColumn = (section: typeof activeSections[0], idx: number, isGrouped = false) => {
        if (BoardRules.isHidden(section.isHidden, !!isStudent, !!isPresentationMode)) return null;

        const sectionNotes = localNotes.filter((n: any) => n.sectionId === section.id || (!n.sectionId && idx === 0));
        const commentsOn = section.commentsEnabled !== undefined ? section.commentsEnabled : board.commentsEnabled;
        const repliesOn = section.repliesEnabled !== undefined ? section.repliesEnabled : (board.repliesEnabled !== false);
        const isContentBlurred = section.isContentBlurred !== undefined ? section.isContentBlurred : section.isTitleBlurred;
        const sectionCanDrag = section.studentsCanDrag !== undefined ? section.studentsCanDrag : (board.studentsCanDrag ?? false);
        // Let's get the real values from useBoard
        const { isSimulatingStudent: simStudent } = useBoard();
        const fullCtx = { userId, board, isStudent: !!contextIsStudent && !simStudent, isSimulatingStudent: !!simStudent };

        const canAdd = UserRules.canAddPost(fullCtx, section.id);
        const canDragNotes = UserRules.canDragNote(fullCtx, undefined, !!sectionCanDrag);
        const showControls = canManageBoard || !commentsOn || !repliesOn || section.locked || isContentBlurred || section.isHidden || section.isAnonymous || sectionCanDrag || section.disableCopy;
        const isSelected = selectedForMerge.has(section.id);

        return (
            <div
                key={section.id}
                className={`w-[360px] shrink-0 flex flex-col gap-2 max-h-full transition-all duration-200 ${draggingId === section.id && draggingType === 'COLUMN' ? 'opacity-50 scale-95' : ''}`}
                onDragOver={(e) => onDragOverColumn(e, section.id)}
                onDrop={(e) => onDrop(e, section.id)}
            >
                {isGrouped ? (
                    <GroupedColumnSubHeader
                        section={section}
                        canManageBoard={canManageBoard}
                        renameSection={renameSection}
                        unmergeSection={unmergeSection}
                        groupTextColor={board.groupTextColor}
                    />
                ) : (
                    <ColumnHeader
                        section={section}
                        isMergeMode={isMergeMode}
                        isSelected={isSelected}
                        canManageBoard={canManageBoard}
                        canDragColumns={!!canDragColumns}
                        groupTextColor={board.groupTextColor}
                        commentsOn={!!commentsOn}
                        repliesOn={!!repliesOn}
                        isContentBlurred={!!isContentBlurred}
                        sectionCanDrag={!!sectionCanDrag}
                        showControls={!!showControls}
                        onDragStart={onDragStart}
                        renameSection={renameSection}
                        toggleSelectForMerge={toggleSelectForMerge}
                        toggleSectionLock={toggleSectionLock}
                        toggleSectionComments={toggleSectionComments}
                        toggleSectionReplies={toggleSectionReplies}
                        toggleSectionRearrange={toggleSectionRearrange}
                        toggleSectionContentBlur={toggleSectionContentBlur}
                        toggleSectionVisibility={toggleSectionVisibility}
                        toggleSectionAnonymous={toggleSectionAnonymous}
                        toggleSectionCopy={toggleSectionCopy}
                        toggleSectionWatermark={toggleSectionWatermark}
                        deleteSection={deleteSection}
                        setAssigningSection={setAssigningSection}
                    />
                )}

                {/* Assignment Status Badge */}
                {section.assignedStudentIds && section.assignedStudentIds.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-2 mb-2 rounded text-[10px] text-blue-400 font-bold uppercase tracking-wide flex items-center gap-2 justify-center">
                        <UserCheck size={12} /> {section.assignedStudentIds.length} Students Assigned
                        {section.blurUnassigned && <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1 rounded ml-1">Blur Active</span>}
                    </div>
                )}

                {/* Add Post button — outside scroll area so it stays visible */}
                {!isMergeMode && (
                    <button onClick={() => canAdd && openAddNote(section.id)} disabled={!canAdd}
                        className={`w-full py-2 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md backdrop-blur-sm mb-1 shrink-0 text-sm ${!canAdd ? 'border-2 border-dashed border-red-500/20 text-red-400 cursor-not-allowed bg-red-500/5' : 'bg-white/50 dark:bg-white/5 border border-transparent hover:border-pink-500/50 text-slate-600 dark:text-white font-bold'}`}>
                        {canAdd ? <><div className="bg-pink-500 text-white rounded-full p-0.5"><IconPlus size={12} className="group-hover:scale-110 transition-transform" /></div> Add Post</> : <><IconLock size={12} /> Locked</>}
                    </button>
                )}

                {/* ── Notes area ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pt-4 pb-10 min-h-[100px] relative rounded-xl space-y-3" onDragOver={handleAutoScroll}>
                    {section.isHidden && (
                        <div className="bg-red-500/10 border border-red-500/20 p-2 mb-2 rounded text-[10px] text-red-400 font-bold uppercase tracking-wide flex items-center gap-2 justify-center">
                            <IconHidden size={12} /> Hidden from students
                        </div>
                    )}
                    {sectionNotes.map((note: any) => (
                        <div key={note.id} id={`note-${note.id}`}
                            className={`note-card-wrapper transition-transform duration-200 ease-out ${draggingId === note.id ? 'opacity-40' : ''}`}
                            draggable={UserRules.canEditNote(fullCtx, note)} onDragStart={(e) => onDragStart(e, note.id, 'NOTE')}
                            onDragOver={(e) => onDragOverNote(e, note.id, section.id)} onDragEnd={onDragEnd}>
                            <NoteCard
                                key={note.id}
                                note={note}
                                userId={userId}
                                onDelete={deleteNote}
                                onLike={likeNote}
                                onAddComment={addComment}
                                onUpdate={updateNote}
                                isStudent={isStudent}
                                isLocked={!UserRules.canEditNote(fullCtx, note)}
                                commentsEnabled={commentsOn}
                                reactionsEnabled={board.reactionsEnabled}
                                contentTextColor={board.contentTextColor}
                                isSectionAnonymous={section.isAnonymous}
                                isContentBlurred={isContentBlurred}
                                isWatermarked={section.isWatermarked}
                                onAddBefore={() => openAddNote({ sectionId: section.id, relativeId: note.id, position: 'before' })}
                                onAddAfter={() => openAddNote({ sectionId: section.id, relativeId: note.id, position: 'after' })}
                                onMoveNote={(id, dir) => handleMoveNote(id, dir)}
                            />
                        </div>
                    ))}
                    <div className={`h-24 w-full transition-colors rounded-lg flex items-center justify-center border-2 border-dashed border-transparent ${draggingId && draggingType === 'NOTE' ? 'hover:border-blue-500/50 hover:bg-blue-500/5' : ''}`}
                        onDragOver={(e) => onDragOverColumn(e, section.id)} data-drop-zone="true">
                        {draggingId && draggingType === 'NOTE' && <span className="text-xs text-gray-500 font-bold opacity-0 hover:opacity-100">Drop here</span>}
                    </div>
                </div>
            </div>
        );
    };

    // ── MAIN RENDER ──

    return (
        <div className="flex flex-col h-full overflow-hidden" onClick={() => setOpenColorPicker(null)}>

            {/* ── MERGE MODE TOOLBAR ── */}
            {canManageBoard && isMergeMode && (
                <MergeToolbar
                    pendingGroupTitle={pendingGroupTitle}
                    setPendingGroupTitle={setPendingGroupTitle}
                    pendingGroupColor={pendingGroupColor}
                    setPendingGroupColor={setPendingGroupColor}
                    selectedForMerge={selectedForMerge}
                    mergeSelected={mergeSelected}
                    existingGroups={existingGroups}
                    addToGroup={addToGroup}
                    cancelMergeMode={cancelMergeMode}
                />
            )}

            {/* ── BOARD COLUMNS ── */}
            <div 
                ref={scrollContainerRef}
                onMouseDown={handlePanningMouseDown}
                onMouseMove={handlePanningMouseMove}
                onMouseUp={handlePanningMouseUp}
                onMouseLeave={handlePanningMouseUp}
                className="flex flex-1 overflow-x-auto gap-4 p-6 items-start pt-4 custom-scrollbar main-board-scrollbar select-none-during-pan"
            >

                {renderItems.map((item) => {
                    if (item.type === 'single') {
                        return (
                            <React.Fragment key={item.section.id}>
                                {canManageBoard && !isMergeMode && (
                                    <div className="w-6 hover:w-10 shrink-0 h-full flex flex-col items-center justify-center group/insert cursor-pointer transition-all duration-300 opacity-50 hover:opacity-100 z-10"
                                        onClick={() => insertSectionAt(item.idx)} title="Insert column here">
                                        <div className="h-[80%] w-1 rounded-full bg-blue-500/20 group-hover/insert:bg-blue-500 transition-colors relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md transform scale-0 group-hover/insert:scale-100 transition-transform">
                                                <IconPlus size={14} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {renderColumn(item.section, item.idx, false)}
                            </React.Fragment>
                        );
                    }

                    // ── MERGED GROUP ──
                    return (
                        <ColumnGroup
                            key={item.groupId}
                            groupId={item.groupId}
                            groupTitle={item.groupTitle}
                            groupColor={item.groupColor}
                            canManageBoard={canManageBoard}
                            openColorPicker={openColorPicker}
                            setOpenColorPicker={setOpenColorPicker}
                            renameGroup={renameGroup}
                            disbandGroup={disbandGroup}
                            updateGroupColor={updateGroupColor}
                        >
                            {item.sections.map(({ section, idx }) => renderColumn(section, idx, true))}
                        </ColumnGroup>
                    );
                })}

                {canManageBoard && !isMergeMode && (
                    <div className="flex items-center h-full px-4">
                        <button onClick={addSection}
                            className="w-16 h-full max-h-[600px] bg-white/50 dark:bg-white/5 rounded-xl flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-gray-400 border-2 border-dashed border-slate-300 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-colors font-bold hover:w-32 group">
                            <IconPlus size={24} className="group-hover:scale-125 transition-transform" />
                            <span className="hidden group-hover:block whitespace-nowrap text-sm animate-in fade-in">Add Column</span>
                        </button>
                    </div>
                )}

                {/* Assignment Modal */}
                {assigningSection && (
                    <AssignStudentsModal
                        isOpen={!!assigningSection}
                        onClose={() => setAssigningSection(null)}
                        sectionTitle={activeSections.find(s => s.id === assigningSection)?.title || ''}
                        allStudents={students || []}
                        assignedIds={activeSections.find(s => s.id === assigningSection)?.assignedStudentIds || []}
                        blurUnassigned={activeSections.find(s => s.id === assigningSection)?.blurUnassigned || false}
                        targetGrade={board.targetGrade}
                        allAssignedOnBoard={activeSections.reduce((acc, s) => {
                            if (s.id !== assigningSection) {
                                return [...acc, ...(s.assignedStudentIds || [])];
                            }
                            return acc;
                        }, [] as string[])}
                        onSave={(assignedIds, blurUnassigned) => {
                            updateBoard({
                                sections: activeSections.map(s =>
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
                    title="Delete Column?"
                    message={`Are you sure you want to delete "${activeSections.find(s => s.id === sectionToDelete)?.title || 'this column'}"? This will also hide all notes in this column from the current view.`}
                    confirmText="Delete Column"
                    type="danger"
                />

            </div>
        </div>
    );
};

