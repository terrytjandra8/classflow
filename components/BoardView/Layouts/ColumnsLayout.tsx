import React, { useRef, useState, useEffect } from 'react';
import { useBoard } from '../BoardContext';
import NoteCard from '../../NoteCard'; 
import { EditableInput } from '../../ui/EditableInput';
import { 
    Plus, MoreVertical, Eye, EyeOff, Lock, Unlock, 
    Trash2, Ghost
} from 'lucide-react';

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
            <div onClick={() => setOpen(!open)}>{trigger}</div>
            {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-slate-100 py-1">
                    {items.map((item: any, idx: number) => (
                        item.divider ? <div key={idx} className="h-[1px] bg-slate-100 my-1"/> :
                        <button 
                            key={idx} 
                            onClick={() => { item.onClick(); setOpen(false); }}
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

interface ColumnsLayoutProps {
    isStudent?: boolean;
}

export const ColumnsLayout: React.FC<ColumnsLayoutProps> = ({ isStudent }) => {
    const { 
        board, notes, canManageBoard, updateBoard, openAddNote, updateNote 
    } = useBoard();

    const sections = board.sections || [];

    const updateSection = (id: string, data: any) => {
        const newSections = sections.map((s: any) => s.id === id ? { ...s, ...data } : s);
        updateBoard({ sections: newSections });
    };

    const deleteSection = (id: string) => {
        const newSections = sections.filter((s: any) => s.id !== id);
        updateBoard({ sections: newSections });
    };

    const addSection = (data: any) => {
        const newSection = { 
            id: Math.random().toString(36).substr(2, 9), 
            ...data 
        };
        updateBoard({ sections: [...sections, newSection] });
    };

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
        <div className="flex h-full gap-4 overflow-x-auto p-4 md:p-6 items-start">
            {sections.map((section: any) => {
                const isHidden = section.isHidden ?? section.is_hidden;
                const isLocked = section.isLocked ?? section.is_locked;
                const isBlurred = section.isBlurred ?? section.is_blurred;
                const isAnon = section.anonymousMode ?? section.anonymous_mode;

                if (isHidden && isStudent) return null;

                return (
                    <div 
                        key={section.id} 
                        className={`flex-shrink-0 w-80 md:w-96 flex flex-col max-h-full rounded-xl transition-all border ${isHidden ? 'bg-slate-50 border-dashed border-slate-300 opacity-70' : 'bg-slate-100/50 border-transparent'}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, section.id)}
                    >
                        <div className="p-3 flex items-start justify-between group">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <EditableInput
                                        value={section.title}
                                        onSave={(val) => updateSection(section.id, { title: val })}
                                        disabled={!canManageBoard}
                                        className="font-bold text-slate-800 text-lg bg-transparent border-none focus:bg-white px-1 rounded w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-1 mt-1">
                                    <span className="text-xs font-medium text-slate-500">
                                        {getNotesForSection(section.id).length} notes
                                    </span>
                                    {isLocked && <Lock size={12} className="text-red-500" />}
                                    {isAnon && <Ghost size={12} className="text-purple-500" />}
                                    {isBlurred && <EyeOff size={12} className="text-slate-400" />}
                                </div>
                            </div>

                            {canManageBoard && (
                                <SimpleDropdown
                                    trigger={
                                        <button className="p-1.5 hover:bg-black/5 rounded text-slate-500 transition-colors">
                                            <MoreVertical size={18} />
                                        </button>
                                    }
                                    items={[
                                        {
                                            label: isLocked ? 'Unlock Group' : 'Lock Group',
                                            icon: isLocked ? <Unlock size={14}/> : <Lock size={14}/>,
                                            onClick: () => updateSection(section.id, { isLocked: !isLocked }),
                                            className: isLocked ? 'text-green-600' : 'text-slate-700'
                                        },
                                        {
                                            label: isAnon ? 'Show Names' : 'Make Anonymous',
                                            icon: <Ghost size={14}/>,
                                            onClick: () => updateSection(section.id, { anonymousMode: !isAnon }),
                                            className: isAnon ? 'text-purple-600' : 'text-slate-700'
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

                        <div className={`flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar ${isBlurred && isStudent ? 'blur-sm select-none pointer-events-none' : ''}`}>
                            {!isLocked && (!isStudent || !isHidden) && (
                                <button
                                    onClick={() => openAddNote(section.id)}
                                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-white/50 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                                >
                                    <Plus size={16} /> Add Post
                                </button>
                            )}

                            {getNotesForSection(section.id).map((note: any) => (
                                <div 
                                    key={note.id}
                                    draggable={!isLocked && !isStudent}
                                    onDragStart={(e) => handleDragStart(e, note.id)}
                                    className={draggingId === note.id ? 'opacity-50' : ''}
                                >
                                    {/* FIX: Removed anonymousMode prop which does not exist on NoteCard */}
                                    <NoteCard 
                                        note={note} 
                                        isStudent={isStudent} 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {canManageBoard && (
                <button
                    onClick={() => addSection({ title: 'New Group', orderIndex: sections.length })}
                    className="flex-shrink-0 w-16 h-full min-h-[200px] bg-white/20 hover:bg-slate-100 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-300 flex items-center justify-center text-slate-400 hover:text-slate-600 group"
                >
                     <Plus size={24} className="group-hover:scale-110 transition-transform" />
                </button>
            )}
        </div>
    );
};