import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Edit3, Palette, Pin, ArrowUp, ArrowDown, Link as LinkIcon, Layers, MoveUp, MoveDown, Check, CameraOff } from 'lucide-react';
import { Note, NoteColor } from '../../types';
import { getColorName, NOTE_COLORS } from '../../utils/theme';
import { supabase } from '../../services/supabaseClient';

interface NoteMenuProps {
    note: Note;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: () => void;
    onDelete: (id: string) => void;
    onColorChange: (color: NoteColor) => void;
    onPin?: (id: string) => void;
    onDuplicate?: (note: Note) => void;
    onAddBefore?: () => void;
    onAddAfter?: () => void;
    onMove?: (direction: 'up' | 'down') => void;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement>;
    isTeacher?: boolean; // New Prop
}

export const NoteMenu: React.FC<NoteMenuProps> = ({
    note, canEdit, canDelete, onEdit, onDelete, onColorChange, onPin, onDuplicate, onAddBefore, onAddAfter, onMove, onClose, triggerRef, isTeacher
}) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (triggerRef.current && menuRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const menuRect = menuRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            // Default: Align top-right of menu to bottom-right of trigger
            let top = rect.bottom + scrollY + 4;
            let left = rect.right + scrollX - menuRect.width;

            // Flip if going off bottom edge
            if (rect.bottom + menuRect.height > window.innerHeight) {
                top = rect.top + scrollY - menuRect.height - 4;
            }

            // Flip if going off left edge (rare given default is right-aligned, but good safety)
            if (left < 0) {
                left = rect.left + scrollX;
            }

            setPosition({ top, left });
        }
    }, [triggerRef]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current && 
                !menuRef.current.contains(event.target as Node) &&
                triggerRef.current && 
                !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };
        
        // Handle scroll to close to prevent detached menu
        const handleScroll = () => onClose();

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [onClose]);
    
    const handleCopyLink = () => {
        const url = `${window.location.origin}/?board=${new URLSearchParams(window.location.search).get('board') || ''}&note=${note.id}`;
        navigator.clipboard.writeText(url);
        onClose();
    };

    const handleToggleWatermark = async () => {
        const newValue = !note.is_watermarked;
        await supabase.from('notes').update({ is_watermarked: newValue }).eq('id', note.id);
        onClose();
    };

    return createPortal(
        <div 
            ref={menuRef}
            style={{ top: position.top, left: position.left }}
            className="fixed w-[280px] bg-[#222] text-white rounded-xl shadow-2xl z-[9999] overflow-visible border border-white/10 animate-in fade-in zoom-in-95 origin-top-right"
            onClick={(e) => e.stopPropagation()}
        >
            
            {/* Actions Section */}
            <div className="p-1 space-y-0.5">
                <button 
                    onClick={handleCopyLink}
                    className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/10 rounded-lg flex items-center gap-2 transition-colors text-gray-300"
                >
                    <LinkIcon size={14} /> Copy link to post
                </button>

                {canEdit && (
                    <>
                        {/* Grid Color Picker Inline */}
                        <div className="px-3 py-2 bg-black/20 rounded-lg mx-1 mb-1 mt-1 border border-white/5">
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                <Palette size={10} /> Color
                            </div>
                            <div className="flex flex-wrap gap-1.5 justify-start w-full">
                                {Object.values(NOTE_COLORS).filter(c => c !== NOTE_COLORS.TRANSPARENT).map((color) => (
                                    <div key={color} className="group relative flex flex-col items-center">
                                        {/* Styled Tooltip on Hover */}
                                        <div className="absolute -top-10 z-50 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap">
                                            <div className="bg-black/90 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1.5 rounded-full shadow-2xl border border-white/10">
                                                {getColorName(color)}
                                                {/* Tiny Arrow */}
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/10"></div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onColorChange(color as NoteColor)}
                                            className={`
                                                w-6 h-6 rounded-full border border-white/10 transition-all duration-200 relative shrink-0
                                                ${color} 
                                                ${note.color === color 
                                                    ? 'ring-2 ring-white scale-110 z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                                                    : 'hover:scale-110 hover:ring-2 hover:ring-white/20 hover:z-10'
                                                }
                                            `}
                                        >
                                            {note.color === color && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Check size={12} className="text-slate-900" strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => { onEdit(); onClose(); }}
                            className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/10 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Edit3 size={14} /> Edit post
                        </button>
                        
                        {/* Toggle Watermark (Teachers Only) */}
                        {isTeacher && (
                            <button 
                                onClick={handleToggleWatermark}
                                className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/10 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <CameraOff size={14} className={note.is_watermarked ? "text-yellow-500" : ""} /> 
                                {note.is_watermarked ? 'Remove Watermark' : 'Apply Watermark'}
                            </button>
                        )}

                        {/* Add Before/After */}
                        {onAddBefore && (
                            <button 
                                onClick={() => { onAddBefore(); onClose(); }}
                                className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/10 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <ArrowUp size={14} /> Add post before
                            </button>
                        )}
                        {onAddAfter && (
                            <button 
                                onClick={() => { onAddAfter(); onClose(); }}
                                className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/10 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <ArrowDown size={14} /> Add post after
                            </button>
                        )}

                        {/* Move Up/Down */}
                        {onMove && (
                            <div className="grid grid-cols-2 gap-1 px-1">
                                <button 
                                    onClick={() => { onMove('up'); onClose(); }}
                                    className="text-left px-2 py-2 text-xs font-bold hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/5"
                                    title="Move Up"
                                >
                                    <MoveUp size={14} /> Up
                                </button>
                                <button 
                                    onClick={() => { onMove('down'); onClose(); }}
                                    className="text-left px-2 py-2 text-xs font-bold hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/5"
                                    title="Move Down"
                                >
                                    <MoveDown size={14} /> Down
                                </button>
                            </div>
                        )}

                        {/* Duplicate */}
                        {onDuplicate && (
                            <button 
                                onClick={() => { onDuplicate(note); onClose(); }}
                                className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/10 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Layers size={14} /> Duplicate post
                            </button>
                        )}

                        {/* Pin */}
                        {onPin && (
                            <button 
                                onClick={() => { onPin(note.id); onClose(); }}
                                className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/10 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Pin size={14} className={note.is_pinned ? "fill-white" : ""} /> {note.is_pinned ? 'Unpin post' : 'Pin post'}
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Delete Section */}
            {canDelete && (
                <div className="p-1 border-t border-white/10">
                    <button 
                        onClick={() => { onDelete(note.id); onClose(); }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Trash2 size={14} /> Delete post
                    </button>
                </div>
            )}
        </div>,
        document.body
    );
};
