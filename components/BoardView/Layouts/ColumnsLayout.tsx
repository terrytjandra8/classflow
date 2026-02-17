import React, { useRef, useState, useEffect } from 'react';
import { useBoard } from '../BoardContext';
import NoteCard from '../../NoteCard'; 
import { EditableInput } from '../../ui/EditableInput';
import { 
    Plus, MoreVertical, Eye, EyeOff, Lock, Unlock, 
    Trash2, Ghost, GripVertical
} from 'lucide-react';

// --- Helper: Simple Dropdown ---
const SimpleDropdown = ({ trigger, items }: any) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (ref.current && !ref.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <div onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="cursor-pointer">
                {trigger}
            </div>
            {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-50 border border-slate-200 py-1 animate-in fade-in zoom-in-95 duration-100">
                    {items.map((item: any, idx: number) => (
                        item.divider ? <div key={idx} className="h-[1px] bg-slate-100 my-1"/> :
                        <button 
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); item.onClick(); setOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${item.className || 'text-slate-700'}`}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Helper: Add Column Divider (The "Gap" Button) ---
const AddColumnDivider = ({ onAdd }: { onAdd: () => void }) => (
    <div className="w-4 hover:w-12 transition-all duration-300 flex flex-col items-center justify-center group h-auto min-h-[200px] -mx-2 z-10 relative">
        <div className="h-full w-[2px] bg-transparent group-hover:bg-indigo-500/30 transition-colors absolute top-0 bottom-0 left-1/2 -translate-x-1/2" />
        <button 
            onClick={onAdd}
            className="w-8 h-8 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-600 transition-all transform scale-0 group-hover:scale-100 z-20"
            title="Insert Column Here"
        >
            <Plus size={16} />
        </button>
    </div>
);

interface ColumnsLayoutProps {
    isStudent?: boolean;
}

export const ColumnsLayout: React.FC<ColumnsLayoutProps> = ({ isStudent }) => {
    const { 
        board, notes, canManageBoard, updateBoard, openAddNote, updateNote 
    } = useBoard();

    const sections = board.sections || [];

    // --- Actions ---
    const updateSection = (id: string, data: any) => {
        const newSections = sections.map((s: any) => s.id === id ? { ...s, ...data } : s);
        updateBoard({ sections: newSections });
    };

    const deleteSection = (id: string) => {
        const newSections = sections.filter((s: any) => s.id !== id);
        updateBoard({ sections: newSections });
    };

    const addSectionAt = (index: number) => {
        const newSection = { 
            id: Math.random().toString(36).substr(2, 9), 
            title: 'New Group',
            isLocked: false,
            isHidden: false
        };
        const newSections = [...sections];
        newSections.splice(index, 0, newSection);
        updateBoard({ sections: newSections });
    };

    // --- Drag & Drop ---
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const dragItemRef = useRef<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggingId(id);
        dragItemRef.current = id;
    };

    const handleDrop = async (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        const noteId = dragItemRef.current;
        if (noteId) {
            // FIX: Only using 'sectionId' to satisfy TypeScript.
            await updateNote(noteId, { sectionId: sectionId });
        }
        setDraggingId(null);
        dragItemRef.current = null;
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const getNotesForSection = (sectionId: string) => {
        return notes.filter((note: any) => {
            const nSectionId = note.sectionId || note.section_id;
            return nSectionId === sectionId;
        });
    };

    return (
        <div className="flex h-full overflow-x-auto p-4 md:p-6 items-start">
            {/* If empty, show big add button */}
            {canManageBoard && sections.length === 0 && (
                <button 
                    onClick={() => addSectionAt(0)}
                    className="w-80 h-40 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                >
                    <Plus size={20} className="mr-2"/> Add First Group
                </button>
            )}

            {sections.map((section: any, idx: number) => {
                const isHidden = section.isHidden || section.is_hidden;
                const isLocked = section.isLocked || section.is_locked;
                const isBlurred = section.isBlurred || section.is_blurred;
                const isAnon = section.anonymousMode || section.anonymous_mode;
                const sectionNotes = getNotesForSection(section.id);

                if (isHidden && isStudent) return null;

                return (
                    <React.Fragment key={section.id}>
                        {/* Insert Divider Before Column (if enabled) */}
                        {canManageBoard && idx > 0 && (
                            <AddColumnDivider onAdd={() => addSectionAt(idx)} />
                        )}

                        <div 
                            className={`flex-shrink-0 w-80 md:w-[320px] lg:w-[350px] flex flex-col max-h-full rounded-xl transition-all border shadow-sm mx-2
                                ${isHidden 
                                    ? 'bg-slate-50 border-dashed border-slate-300 opacity-75' 
                                    : 'bg-slate-100/80 border-slate-200/60 dark:bg-white/5 backdrop-blur-sm'
                                }`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, section.id)}
                        >
                            {/* --- HEADER --- */}
                            <div className={`p-3 border-b border-black/5 flex items-start gap-2 ${section.headerColor ? `bg-${section.headerColor}-100` : ''}`}>
                                {canManageBoard && (
                                    <div className="mt-1.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                                        <GripVertical size={14} />
                                    </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                    {/* Title Input: min-w-0 prevents clipping flex items */}
                                    <div className="min-w-0">
                                        <EditableInput
                                            value={section.title}
                                            onSave={(val) => updateSection(section.id, { title: val })}
                                            disabled={!canManageBoard}
                                            className="font-bold text-slate-800 text-lg bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 px-1 -ml-1 rounded w-full block break-words leading-tight"
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-1 px-0.5">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-200/50 px-1.5 py-0.5 rounded">
                                            {sectionNotes.length} Notes
                                        </span>
                                        <div className="flex gap-1">
                                            {isLocked && <Lock size={12} className="text-red-500" />}
                                            {isAnon && <Ghost size={12} className="text-purple-500" />}
                                            {isBlurred && <EyeOff size={12} className="text-slate-400" />}
                                        </div>
                                    </div>
                                </div>

                                {canManageBoard && (
                                    <SimpleDropdown
                                        trigger={
                                            <button className="p-1.5 hover:bg-black/5 rounded-md text-slate-500 transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                        }
                                        items={[
                                            {
                                                label: isLocked ? 'Unlock Group' : 'Lock Group',
                                                icon: isLocked ? <Unlock size={14}/> : <Lock size={14}/>,
                                                onClick: () => updateSection(section.id, { isLocked: !isLocked }),
                                                className: isLocked ? 'text-green-600' : ''
                                            },
                                            {
                                                label: isAnon ? 'Show Names' : 'Make Anonymous',
                                                icon: <Ghost size={14}/>,
                                                onClick: () => updateSection(section.id, { anonymousMode: !isAnon }),
                                                className: isAnon ? 'text-purple-600' : ''
                                            },
                                            {
                                                label: isBlurred ? 'Unblur Content' : 'Blur Content',
                                                icon: isBlurred ? <Eye size={14}/> : <EyeOff size={14}/>,
                                                onClick: () => updateSection(section.id, { isBlurred: !isBlurred })
                                            },
                                            {
                                                label: isHidden ? 'Show Group' : 'Hide Group',
                                                icon: isHidden ? <Eye size={14}/> : <EyeOff size={14}/>,
                                                onClick: () => updateSection(section.id, { isHidden: !isHidden })
                                            },
                                            { divider: true },
                                            {
                                                label: 'Delete Group',
                                                icon: <Trash2 size={14}/>,
                                                onClick: () => {
                                                    if(confirm('Delete this group?')) deleteSection(section.id);
                                                },
                                                className: 'text-red-600'
                                            }
                                        ]}
                                    />
                                )}
                            </div>

                            {/* --- CONTENT --- */}
                            <div className={`flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar ${isBlurred && isStudent ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                {!isLocked && (!isStudent || !isHidden) && (
                                    <button
                                        onClick={() => openAddNote(section.id)}
                                        className="w-full py-3 bg-white/60 hover:bg-white border-2 border-transparent hover:border-indigo-200 shadow-sm hover:shadow text-slate-500 hover:text-indigo-600 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
                                    >
                                        <Plus size={16} /> Add Post
                                    </button>
                                )}

                                {sectionNotes.map((note: any) => (
                                    <div 
                                        key={note.id}
                                        draggable={!isLocked && !isStudent}
                                        onDragStart={(e) => handleDragStart(e, note.id)}
                                        className={`transform transition-all duration-200 ${draggingId === note.id ? 'opacity-40 scale-95' : 'opacity-100'}`}
                                    >
                                        <NoteCard 
                                            note={note} 
                                            isStudent={isStudent} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}

            {/* Final Add Button at the end */}
            {canManageBoard && sections.length > 0 && (
                 <AddColumnDivider onAdd={() => addSectionAt(sections.length)} />
            )}
        </div>
    );
};