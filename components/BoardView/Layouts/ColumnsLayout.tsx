import React, { useRef, useState, useEffect } from 'react';
import { useBoard } from '../BoardContext';
import { NoteCard } from '../../NoteCard';
import { EditableInput } from '../../ui/EditableInput';
import { 
    Plus, MoreVertical, Eye, EyeOff, Lock, Unlock, 
    Trash2, Ghost, GripHorizontal 
} from 'lucide-react';
import { Dropdown } from '../../ui/Dropdown'; // Ensure you have this or replace with your menu component

interface ColumnsLayoutProps {
    isStudent?: boolean;
}

export const ColumnsLayout: React.FC<ColumnsLayoutProps> = ({ isStudent }) => {
    const { 
        board, sections, notes, canManageBoard, 
        updateSection, deleteSection, addSection, openAddNote,
        updateNote // Needed for drag and drop
    } = useBoard();

    // 1. Get Active Sections (CamelCase safe)
    const activeSections = sections || [];

    // 2. Drag and Drop State
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

    // 3. Helper to filter notes
    const getNotesForSection = (sectionId: string) => {
        // Handle both snake_case and camelCase just in case
        return notes.filter((note: any) => {
            const nSectionId = note.sectionId || note.section_id;
            return nSectionId === sectionId;
        });
    };

    const handleAddColumn = async () => {
        await addSection({ 
            title: 'New Group', 
            orderIndex: activeSections.length // Use camelCase if your DB expects it
        });
    };

    return (
        <div className="flex h-full gap-4 overflow-x-auto p-4 md:p-6 items-start">
            {activeSections.map((section: any) => {
                // Safe Property Access (Camel vs Snake)
                const isHidden = section.isHidden ?? section.is_hidden;
                const isLocked = section.isLocked ?? section.is_locked;
                const isBlurred = section.isBlurred ?? section.is_blurred;
                const isAnon = section.anonymousMode ?? section.anonymous_mode;

                // Hide from students if hidden
                if (isHidden && isStudent) return null;

                return (
                    <div 
                        key={section.id} 
                        className={`flex-shrink-0 w-80 md:w-96 flex flex-col max-h-full rounded-xl transition-all border ${isHidden ? 'bg-slate-50 border-dashed border-slate-300 opacity-70' : 'bg-slate-100/50 border-transparent'}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, section.id)}
                    >
                        {/* --- HEADER --- */}
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

                            {/* --- CONTROLS --- */}
                            {canManageBoard && (
                                <Dropdown
                                    trigger={
                                        <button className="p-1.5 hover:bg-black/5 rounded text-slate-500 transition-colors">
                                            <MoreVertical size={18} />
                                        </button>
                                    }
                                    items={[
                                        {
                                            label: isLocked ? 'Unlock Group' : 'Lock Group',
                                            icon: isLocked ? <Unlock size={14}/> : <Lock size={14}/>,
                                            onClick: () => updateSection(section.id, { isLocked: !isLocked }), // Use camelCase for update
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

                        {/* --- CONTENT --- */}
                        <div className={`flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar ${isBlurred && isStudent ? 'blur-sm select-none pointer-events-none' : ''}`}>
                            
                            {/* Add Button */}
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
                                    <NoteCard 
                                        note={note} 
                                        isStudent={isStudent} 
                                        anonymousMode={isAnon}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* --- ADD NEW COLUMN BUTTON --- */}
            {canManageBoard && (
                <button
                    onClick={handleAddColumn}
                    className="flex-shrink-0 w-16 h-full min-h-[200px] bg-white/20 hover:bg-slate-100 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-300 flex items-center justify-center text-slate-400 hover:text-slate-600 group"
                >
                     <Plus size={24} className="group-hover:scale-110 transition-transform" />
                </button>
            )}
        </div>
    );
};