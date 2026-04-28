
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
    IconCopyOff, IconWatermark
} from '../../Icons';
import { GitMerge, Ungroup, CheckCircle, Circle, X, Palette, UserPlus, UserCheck } from 'lucide-react';
import { AssignStudentsModal } from '../AssignStudentsModal';

// Preset color palette for groups
const GROUP_COLORS = [
    { label: 'Blue',   accent: '#3b82f6', bg: 'rgba(59,130,246,0.18)',  border: 'rgba(59,130,246,0.45)' },
    { label: 'Purple', accent: '#a855f7', bg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.45)' },
    { label: 'Green',  accent: '#22c55e', bg: 'rgba(34,197,94,0.18)',  border: 'rgba(34,197,94,0.45)'  },
    { label: 'Amber',  accent: '#f59e0b', bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.45)' },
    { label: 'Red',    accent: '#ef4444', bg: 'rgba(239,68,68,0.18)',  border: 'rgba(239,68,68,0.45)'  },
    { label: 'Pink',   accent: '#ec4899', bg: 'rgba(236,72,153,0.18)', border: 'rgba(236,72,153,0.45)' },
    { label: 'Cyan',   accent: '#06b6d4', bg: 'rgba(6,182,212,0.18)',  border: 'rgba(6,182,212,0.45)'  },
    { label: 'Slate',  accent: '#94a3b8', bg: 'rgba(148,163,184,0.18)',border: 'rgba(148,163,184,0.45)' },
];

interface ColumnsLayoutProps {
    isStudent?: boolean;
}

export const ColumnsLayout: React.FC<ColumnsLayoutProps> = ({ isStudent: propIsStudent }) => {
    const { 
        board, notes, updateBoard, openAddNote, updateNote, sectionIdFilter, canManageBoard, isStudent: contextIsStudent,
        toggleSectionLock, toggleSectionContentBlur, toggleSectionVisibility, toggleSectionAnonymous, toggleSectionComments, toggleSectionReplies, toggleSectionRearrange,
        toggleSectionCopy, toggleSectionWatermark,
        deleteNote, likeNote, addComment, isPresentationMode, userId, students
    } = useBoard();

    const [assigningSection, setAssigningSection] = useState<string | null>(null);

    const isStudent = propIsStudent !== undefined ? propIsStudent : contextIsStudent;
    const isLocked = board.lockMode === 'readonly' || board.lockMode === 'comments_only';
    
    const [localNotes, setLocalNotes] = useState<Note[]>(notes);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [draggingType, setDraggingType] = useState<'NOTE' | 'COLUMN' | null>(null);

    // Merge mode state
    const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
    const [isMergeMode, setIsMergeMode] = useState(false);
    const [pendingGroupTitle, setPendingGroupTitle] = useState('');
    const [pendingGroupColor, setPendingGroupColor] = useState(GROUP_COLORS[0].accent);
    // Which group's color palette is open
    const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

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
            id: 'default', title: 'Group 1', locked: false,
            isContentBlurred: false, isHidden: false, isAnonymous: false,
            commentsEnabled: true, repliesEnabled: true, studentsCanDrag: false
        }];
    
    const addSection = () => {
        const currentSections = (board.sections && board.sections.length > 0) 
            ? board.sections 
            : [{ id: 'default-' + Math.random(), title: 'Group 1' }];
        updateBoard({ 
            sections: [...currentSections, { id: Math.random().toString(36).substr(2, 9), title: `Group ${currentSections.length + 1}` }] 
        });
    };

    // Toggle column selection in merge mode
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

    // Merge all selected into a new group
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

    const renameSection = (id: string, newTitle: string) => updateBoard({ sections: activeSections.map(s => s.id === id ? { ...s, title: newTitle } : s) });
    const deleteSection = (id: string) => updateBoard({ sections: activeSections.filter(s => s.id !== id) });

    const insertSectionAt = (index: number) => {
        const currentSections = (board.sections && board.sections.length > 0) 
            ? board.sections : [{ id: 'default-' + Math.random(), title: 'Group 1' }];
        const newSection = { id: Math.random().toString(36).substr(2, 9), title: `New Group` };
        const list = [...currentSections];
        list.splice(index, 0, newSection);
        updateBoard({ sections: list });
    };

    // --- DRAG HANDLERS ---
    const onDragStart = (e: React.DragEvent, id: string, type: 'NOTE' | 'COLUMN') => {
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
            const sections = [...activeSections];
            const fi = sections.findIndex(s => s.id === draggedId);
            const ti = sections.findIndex(s => s.id === targetSectionId);
            if (fi === -1 || ti === -1) return;
            const [moved] = sections.splice(fi, 1);
            sections.splice(ti, 0, moved);
            updateBoard({ sections });
        }
    }, [activeSections, updateBoard]);

    const onDrop = useCallback((e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault();
        if (dragTypeRef.current !== 'NOTE') return;
        const draggedId = dragItemRef.current;
        if (!draggedId) return;

        // Calculate New Timestamp for persistence (matching GridLayout logic)
        // This ensures the note stays in the correct relative position after refresh
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
        
        setDraggingId(null); 
        setDraggingType(null);
        dragItemRef.current = null;
        dragTypeRef.current = null;
    }, [localNotes, updateNote]);

    const handleAutoScroll = useCallback((e: React.DragEvent) => {
        if (dragTypeRef.current !== 'NOTE') return;
        const el = e.currentTarget as HTMLElement;
        const { top, bottom } = el.getBoundingClientRect();
        if (e.clientY < top + 80) el.scrollTop -= 10;
        if (e.clientY > bottom - 80) el.scrollTop += 10;
    }, []);

    const handleAddRelative = (noteId: string, _: 'before' | 'after') => {
        const note = localNotes.find(n => n.id === noteId);
        if (note) openAddNote(note.sectionId || 'default');
    };

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

    const cancelMergeMode = () => {
        setIsMergeMode(false);
        setSelectedForMerge(new Set());
        setPendingGroupTitle('');
        setPendingGroupColor(GROUP_COLORS[0].accent);
    };

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

    // Helper: get color config for a hex accent
    const getColorConfig = (accent: string) => GROUP_COLORS.find(c => c.accent === accent) || GROUP_COLORS[0];

    // Renders a single column card
    const renderColumn = (section: typeof activeSections[0], idx: number, isGrouped = false) => {
        if (BoardRules.isHidden(section.isHidden, !!isStudent, !!isPresentationMode)) return null;

        const sectionNotes = localNotes.filter((n: any) => n.sectionId === section.id || (!n.sectionId && idx === 0));
        const commentsOn = section.commentsEnabled !== undefined ? section.commentsEnabled : board.commentsEnabled;
        const repliesOn = section.repliesEnabled !== undefined ? section.repliesEnabled : (board.repliesEnabled !== false);
        const isContentBlurred = section.isContentBlurred !== undefined ? section.isContentBlurred : section.isTitleBlurred;
        const sectionCanDrag = section.studentsCanDrag !== undefined ? section.studentsCanDrag : (board.studentsCanDrag ?? false);
        const canDragNotes = canManageBoard || (sectionCanDrag && !isLocked && !section.locked);
        
        // NEW: Check if student can post in this specific section
        const canPostInSection = BoardRules.canPostInSection(board, section.id, userId, !!isStudent);
        
        const canAdd = canManageBoard || (!isLocked && !section.locked && canPostInSection);
        
        const showControls = canManageBoard || !commentsOn || !repliesOn || section.locked || isContentBlurred || section.isHidden || section.isAnonymous || sectionCanDrag || section.disableCopy;

        const isSelected = selectedForMerge.has(section.id);

        return (
            <div
                key={section.id}
                className={`w-80 shrink-0 flex flex-col gap-2 max-h-full transition-all duration-200 ${draggingId === section.id && draggingType === 'COLUMN' ? 'opacity-50 scale-95' : ''}`}
                onDragOver={(e) => onDragOverColumn(e, section.id)}
                onDrop={(e) => onDrop(e, section.id)}
            >
                {isGrouped ? (
                    /* ── Minimal editable sub-label inside a group ── */
                    <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/10">
                        {section.locked && <IconLock size={10} className="text-red-400 shrink-0" />}
                        {section.isHidden && <IconHidden size={10} className="text-red-400 shrink-0" />}
                        <EditableInput
                            disabled={!canManageBoard}
                            className="text-xs font-semibold text-gray-300 bg-transparent outline-none w-full border border-transparent hover:border-white/20 rounded px-1 py-0.5 focus:bg-white/10 transition-all"
                            value={section.title}
                            onSave={(val) => renameSection(section.id, val)}
                            style={{ color: board.groupTextColor }}
                        />
                        {canManageBoard && (
                            <Tooltip content="Remove from group">
                                <button onClick={() => unmergeSection(section.id)} className="p-0.5 text-white/30 hover:text-orange-400 transition-colors shrink-0">
                                    <Ungroup size={11} />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                ) : (
                    /* ── Full standalone column header ── */
                    <div
                        className={`flex flex-col gap-3 p-3 rounded-xl border transition-all relative cursor-pointer group ${
                            isMergeMode && isSelected
                                ? 'border-blue-400 bg-blue-500/20 ring-2 ring-blue-400/50'
                                : isMergeMode
                                ? 'border-blue-500/40 hover:border-blue-400 hover:bg-blue-500/10 bg-black/5 dark:bg-white/5'
                                : section.isHidden
                                ? 'border-dashed border-red-500/20 bg-red-500/5 cursor-default'
                                : 'border-transparent hover:border-white/10 bg-black/5 dark:bg-white/5 cursor-default'
                        }`}
                        onClick={isMergeMode ? () => toggleSelectForMerge(section.id) : undefined}
                    >
                        {/* Row 1: Handle + Title + Status Badges */}
                        <div className="flex items-center gap-2 w-full min-w-0">
                            {isMergeMode && canManageBoard ? (
                                <div className={`shrink-0 transition-colors ${isSelected ? 'text-blue-400' : 'text-white/30'}`}>
                                    {isSelected ? <CheckCircle size={18} /> : <Circle size={18} />}
                                </div>
                            ) : (
                                canDragColumns && (
                                    <div className="text-gray-400 p-1 cursor-grab active:cursor-grabbing hover:text-white transition-colors shrink-0"
                                        draggable={true} onDragStart={(e) => onDragStart(e, section.id, 'COLUMN')} title="Drag to reorder">
                                        <IconDrag size={16} />
                                    </div>
                                )
                            )}
                            
                            <div className="flex items-center gap-1 shrink-0">
                                {section.locked && <div className="bg-red-500 text-white p-1 rounded shadow-sm"><IconLock size={10} strokeWidth={3} /></div>}
                                {section.isHidden && <div className="bg-orange-500 text-white p-1 rounded shadow-sm"><IconHidden size={10} strokeWidth={3} /></div>}
                                {section.disableCopy && <div className="bg-slate-700 text-white p-1 rounded shadow-sm"><IconCopyOff size={10} strokeWidth={3} /></div>}
                                {section.isWatermarked && <div className="bg-red-600 text-white p-1 rounded shadow-sm"><IconWatermark size={10} strokeWidth={3} /></div>}
                            </div>

                            <EditableInput
                                disabled={!canManageBoard || isMergeMode}
                                className={`font-bold text-base bg-transparent border border-transparent hover:border-white/20 rounded px-1.5 py-1 w-full focus:bg-white/10 outline-none transition-all ${isMergeMode ? 'pointer-events-none' : ''} ${section.isHidden ? 'opacity-70' : 'opacity-100'} text-slate-800 dark:text-white`}
                                value={section.title}
                                onSave={(val) => renameSection(section.id, val)}
                                style={{ color: board.groupTextColor }}
                            />
                        </div>

                        {/* Row 2: Teacher Controls (only when manage and not merge) */}
                        {canManageBoard && !isMergeMode && (
                            <div className={`grid grid-cols-5 sm:flex sm:flex-wrap items-center gap-1 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <Tooltip content={section.locked ? "Unlock" : "Lock"}>
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
                                <Tooltip content={section.isHidden ? "Show" : "Hide"}>
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
                                <Tooltip content={section.isWatermarked ? "Disable Focus Guard" : "Enable Stay Focused Guard (Tab-switch tracking)"}>
                                    <button onClick={() => toggleSectionWatermark(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.isWatermarked ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                        <IconWatermark size={14} />
                                    </button>
                                </Tooltip>
                                <Tooltip content="Delete Column">
                                    <button onClick={() => deleteSection(section.id)} className="p-1.5 hover:text-red-500 text-slate-400 transition-colors hover:bg-red-500/10 rounded-lg flex justify-center">
                                        <IconClose size={14} />
                                    </button>
                                </Tooltip>
                                
                                {/* NEW: Assign Students Button */}
                                <Tooltip content="Assign Students to this column">
                                    <button 
                                        onClick={() => setAssigningSection(section.id)} 
                                        className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.assignedStudentIds?.length ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                    >
                                        <UserPlus size={14} />
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                )}

                {/* Assignment Status Badge */}
                {section.assignedStudentIds && section.assignedStudentIds.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-2 mb-2 rounded text-[10px] text-blue-400 font-bold uppercase tracking-wide flex items-center gap-2 justify-center">
                        <UserCheck size={12} /> {section.assignedStudentIds.length} Students Assigned
                        {section.blurUnassigned && <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1 rounded ml-1">Blur Active</span>}
                    </div>
                )}

                {/* ── Notes area ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10 min-h-[100px] relative rounded-xl space-y-3" onDragOver={handleAutoScroll}>
                    {section.isHidden && (
                        <div className="bg-red-500/10 border border-red-500/20 p-2 mb-2 rounded text-[10px] text-red-400 font-bold uppercase tracking-wide flex items-center gap-2 justify-center">
                            <IconHidden size={12} /> Hidden from students
                        </div>
                    )}
                    {canAdd && !isMergeMode && (
                        <button onClick={() => canAdd && openAddNote(section.id)} disabled={!canAdd}
                            className={`w-full py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md backdrop-blur-sm mb-3 ${!canAdd ? 'border-2 border-dashed border-red-500/20 text-red-400 cursor-not-allowed bg-red-500/5' : 'bg-white/50 dark:bg-white/5 border-2 border-transparent hover:border-pink-500/50 text-slate-600 dark:text-white font-bold'}`}>
                            {canAdd ? <><div className="bg-pink-500 text-white rounded-full p-1"><IconPlus size={14} className="group-hover:scale-110 transition-transform" /></div> Add Post</> : <><IconLock size={14} /> Locked</>}
                        </button>
                    )}
                    {sectionNotes.map((note: any) => (
                        <div key={note.id} id={`note-${note.id}`}
                            className={`note-card-wrapper transition-transform duration-200 ease-out ${draggingId === note.id ? 'opacity-40' : ''}`}
                            draggable={canDragNotes} onDragStart={(e) => onDragStart(e, note.id, 'NOTE')}
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
                                isLocked={section.locked || isLocked}
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

    return (
        <div className="flex flex-col h-full overflow-hidden" onClick={() => setOpenColorPicker(null)}>

            {/* ── MERGE MODE TOOLBAR ── */}
            {canManageBoard && isMergeMode && (
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/80 border-b border-white/10 backdrop-blur-md shrink-0 z-20 shadow-lg">
                    <GitMerge size={16} className="text-blue-400 shrink-0" />

                    {/* Group name input */}
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Group Name</span>
                        <input
                            type="text"
                            value={pendingGroupTitle}
                            onChange={e => setPendingGroupTitle(e.target.value)}
                            placeholder="e.g. Feedback Round"
                            className="bg-white/10 border border-white/20 text-white text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 w-44 placeholder-white/30 transition-colors"
                        />
                    </div>

                    {/* Color picker */}
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Color</span>
                        <div className="flex gap-1.5">
                            {GROUP_COLORS.map(c => (
                                <button key={c.accent} onClick={(e) => { e.stopPropagation(); setPendingGroupColor(c.accent); }}
                                    title={c.label}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${pendingGroupColor === c.accent ? 'border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c.accent }} />
                            ))}
                        </div>
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-1" />

                    <span className="text-sm text-white/60">
                        {selectedForMerge.size === 0
                            ? 'Click columns to select'
                            : `${selectedForMerge.size} column${selectedForMerge.size > 1 ? 's' : ''} selected`}
                    </span>

                    {selectedForMerge.size >= 2 && (
                        <button onClick={mergeSelected}
                            className="px-4 py-1.5 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110 shadow-md"
                            style={{ backgroundColor: pendingGroupColor }}>
                            Merge {selectedForMerge.size} Columns
                        </button>
                    )}

                    {/* Add to existing group */}
                    {existingGroups.length > 0 && selectedForMerge.size >= 1 && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white/40">Add to:</span>
                            {existingGroups.map(g => {
                                const cc = getColorConfig(g.groupColor);
                                return (
                                    <button key={g.groupId}
                                        onClick={() => addToGroup(g.groupId, g.groupTitle, g.groupColor)}
                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors"
                                        style={{ color: cc.accent, borderColor: cc.border, backgroundColor: cc.bg }}>
                                        "{g.groupTitle}"
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <button onClick={cancelMergeMode} className="ml-auto p-1.5 text-white/40 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* ── BOARD COLUMNS ── */}
            <div className="flex flex-1 overflow-x-auto gap-2 p-6 items-start pt-4">

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
                    const cc = getColorConfig(item.groupColor);
                    return (
                        <div key={item.groupId} className="shrink-0 flex flex-col rounded-xl overflow-hidden shadow-lg"
                            style={{ border: `2px solid ${cc.border}`, background: cc.bg }}
                            onClick={e => e.stopPropagation()}>

                            {/* Shared group header */}
                            <div className="flex items-center gap-2 px-3 py-2 relative"
                                style={{ backgroundColor: cc.accent + '28', borderBottom: `1px solid ${cc.border}` }}>

                                {/* Editable group name */}
                                <EditableInput
                                    disabled={!canManageBoard}
                                    className="font-bold text-base bg-transparent outline-none px-1 py-0.5 rounded border border-transparent focus:border-white/30 focus:bg-white/10 flex-1 min-w-0 transition-all"
                                    style={{ color: '#ffffff' }}
                                    value={item.groupTitle}
                                    onSave={(val) => renameGroup(item.groupId, val)}
                                />

                                {canManageBoard && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        {/* Color picker toggle */}
                                        <Tooltip content="Change group color">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setOpenColorPicker(openColorPicker === item.groupId ? null : item.groupId); }}
                                                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                                style={{ color: cc.accent }}>
                                                <Palette size={13} />
                                            </button>
                                        </Tooltip>
                                        <Tooltip content="Disband group">
                                            <button onClick={() => disbandGroup(item.groupId)}
                                                className="p-1.5 rounded-lg transition-colors text-white/40 hover:text-orange-400 hover:bg-white/10">
                                                <Ungroup size={13} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                )}

                                {/* Color palette dropdown */}
                                {openColorPicker === item.groupId && (
                                    <div className="absolute top-full right-0 mt-1 p-2 rounded-xl bg-slate-800 border border-white/20 shadow-2xl flex gap-2 z-30"
                                        onClick={e => e.stopPropagation()}>
                                        {GROUP_COLORS.map(c => (
                                            <button key={c.accent} onClick={() => updateGroupColor(item.groupId, c.accent)}
                                                title={c.label}
                                                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${item.groupColor === c.accent ? 'border-white scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: c.accent }} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sub-columns side by side */}
                            <div className="flex gap-2 p-2">
                                {item.sections.map(({ section, idx }) => renderColumn(section, idx, true))}
                            </div>
                        </div>
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

                {/* Merge entry button */}
                {canManageBoard && !isMergeMode && (
                    <div className="flex items-start h-full px-2 pt-1">
                        <Tooltip content="Merge columns together">
                            <button onClick={() => setIsMergeMode(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-300 border border-white/10 hover:border-blue-500/30 transition-all text-xs font-semibold">
                                <GitMerge size={14} />
                                Merge
                            </button>
                        </Tooltip>
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
                    onSave={(assignedIds, blurUnassigned) => {
                        updateBoard({
                            sections: activeSections.map(s => 
                                s.id === assigningSection ? { ...s, assignedStudentIds: assignedIds, blurUnassigned } : s
                            )
                        });
                    }}
                />
            )}
            </div>
        </div>
    );
};
