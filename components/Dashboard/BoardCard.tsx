
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Heart, MoreVertical, Trash2, Clock, ArrowUpCircle, RotateCcw, ChevronDown } from 'lucide-react';
import { Board, ClassGroup } from '../../types';
import { resolveBackgroundStyle } from '../../utils/theme';
import { EditableInput } from '../ui/EditableInput'; // REUSE EXISTING ROBUST COMPONENT
import { BoardRules } from '../../utils/boardRules'; // USE ENGINE FOR PERMISSIONS

interface BoardCardProps {
    board: Board;
    viewMode: 'recents' | 'madeByMe' | 'trashed' | 'favourites';
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onRestore: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onMenuOpen: (e: React.MouseEvent, id: string) => void;
    wallpapersMap: Record<string, string>; // Kept for interface compatibility
    theme: 'light' | 'dark';
    onUpdate?: (updates: Partial<Board>) => void;
    isRenaming?: boolean;
    onRenameClose?: () => void;
    isExiting?: boolean;
    classes?: ClassGroup[];
    userId?: string; // New Prop for Permission Check
}

export const BoardCard: React.FC<BoardCardProps> = ({ 
    board, viewMode, onSelect, onDelete, onRestore, onToggleFavorite, onMenuOpen, theme, onUpdate, isRenaming, onRenameClose, isExiting, classes, userId
}) => {
    // Permission Check from Engine
    const canEdit = onUpdate && BoardRules.canManageBoard(board, userId);

    // Edit State (Only relevant if canEdit is true, but hook state must be unconditional)
    const [titleVal, setTitleVal] = useState(board.title);
    const [descVal, setDescVal] = useState(board.description || '');
    const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    
    // Explicit editing state trigger from parent menu
    const [isExternalRenaming, setIsExternalRenaming] = useState(false);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Watch for external rename trigger
    useEffect(() => {
        if (isRenaming) {
            setIsExternalRenaming(true);
        } else {
            setIsExternalRenaming(false);
        }
    }, [isRenaming]);

    // Sync state when props change
    useEffect(() => {
        if (!isExternalRenaming) setTitleVal(board.title);
        setDescVal(board.description || '');
    }, [board.title, board.description, isExternalRenaming]);

    // Click Outside for Class Menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is outside both trigger and dropdown
            if (
                isClassMenuOpen &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
            )
            {
                setIsClassMenuOpen(false);
            }
        };

        const handleScroll = () => {
            if (isClassMenuOpen) setIsClassMenuOpen(false);
        };

        if (isClassMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true); // Capture phase to detect scroll in any container
            window.addEventListener('resize', handleScroll);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isClassMenuOpen]);

    const bgStyle = resolveBackgroundStyle(board.wallpaper, theme);

    const formatDateOnly = (ts: string) => {
        return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const hasUpdated = board.updatedAt && board.updatedAt > board.createdAt;
    const displayTs = hasUpdated ? board.updatedAt! : board.createdAt;
    
    const currentClass = board.targetGrade || 'General';
    const showClassBadge = true;

    // --- Interaction Handlers ---

    // Smart Click: Single click to open, but allows interaction with inner elements
    const handleCardClick = () => {
        if (viewMode === 'trashed') return;
        onSelect(board.id);
    };

    const saveTitle = (val: string) => {
        if (onRenameClose) onRenameClose(); // Clear parent state
        if (val.trim() !== board.title && onUpdate) {
            onUpdate({ title: val.trim() || 'Untitled' });
        }
    };

    const saveDesc = (val: string) => {
        if (val.trim() !== (board.description || '') && onUpdate) {
            onUpdate({ description: val.trim() });
        }
    };

    const handleToggleClassMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!canEdit) return;
        
        if (!isClassMenuOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 5,
                left: rect.left
            });
            setIsClassMenuOpen(true);
        } else {
            setIsClassMenuOpen(false);
        }
    };

    const handleClassChange = (className: string) => {
        if (onUpdate) {
            onUpdate({ targetGrade: className });
        }
        setIsClassMenuOpen(false);
    };

    return (
        <div 
            onClick={handleCardClick} 
            onContextMenu={(e) => onMenuOpen(e, board.id)}
            className={`group relative rounded-2xl overflow-hidden h-96 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border ${isExiting ? 'animate-exit-card' : 'animate-enter-card'} ${
                viewMode === 'trashed' 
                ? 'opacity-70 bg-[#111] border-white/5' 
                : (theme === 'light' ? 'bg-white border-slate-200 hover:border-blue-300 cursor-pointer' : 'bg-[#1a1a1a] hover:bg-[#202020] border-white/5 cursor-pointer')
            }`}
        >
            <div className={`h-32 relative overflow-hidden shrink-0 transition-all duration-500`} style={bgStyle}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent opacity-80" />
                
                {board.icon && (
                    <div className="absolute bottom-2 left-4 text-4xl shadow-xl filter drop-shadow-lg scale-100 group-hover:scale-110 transition-transform duration-300 font-emoji origin-bottom-left">
                        {board.icon}
                    </div>
                )}

                {/* Class Badge / Selector */}
                {showClassBadge && (
                    <>
                    <div className="absolute top-2 left-2 z-20" onClick={(e) => e.stopPropagation()}>
                        <button 
                            ref={triggerRef}
                            onClick={handleToggleClassMenu}
                            disabled={!canEdit}
                            className={`bg-black/60 backdrop-blur-md rounded-md px-2 py-1 text-[10px] font-bold text-white shadow-sm border border-white/10 uppercase tracking-wide flex items-center gap-1 ${canEdit ? 'hover:bg-black/80 hover:border-white/30 cursor-pointer' : ''}`}
                        >
                            {currentClass}
                            {canEdit && <ChevronDown size={10} className={`transition-transform ${isClassMenuOpen ? 'rotate-180' : ''}`} />}
                        </button>
                    </div>

                    {/* Portal Dropdown to escape card overflow:hidden */}
                    {isClassMenuOpen && classes && createPortal(
                        <div 
                            ref={dropdownRef}
                            className="fixed w-48 bg-[#222] border border-white/20 rounded-lg shadow-xl overflow-hidden z-[9999] animate-in fade-in zoom-in-95"
                            style={{ top: menuPos.top, left: menuPos.left, maxHeight: '200px' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                <button 
                                    onClick={() => handleClassChange('General')}
                                    className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/10 transition-colors ${currentClass === 'General' ? 'text-blue-400 bg-blue-500/10' : 'text-gray-300'}`}
                                >
                                    General
                                </button>
                                {classes.map(cls => (
                                    <button
                                        key={cls.id}
                                        onClick={() => handleClassChange(cls.name)}
                                        className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/10 transition-colors ${currentClass === cls.name ? 'text-blue-400 bg-blue-500/10' : 'text-gray-300'}`}
                                    >
                                        {cls.name}
                                    </button>
                                ))}
                            </div>
                        </div>,
                        document.body
                    )}
                    </>
                )}

                {viewMode !== 'trashed' && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(board.id); }}
                        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all z-10 hover:bg-black/40 backdrop-blur-sm ${board.isFavorite ? 'text-red-500 opacity-100' : 'text-white/50 opacity-0 group-hover:opacity-100'}`}
                    >
                        <Heart size={18} fill={board.isFavorite ? "currentColor" : "none"} />
                    </button>
                )}

                <button 
                    onClick={(e) => onMenuOpen(e, board.id)}
                    className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 text-white hover:bg-black/50 p-1.5 rounded-full transition-all z-10 md:hidden block backdrop-blur-sm"
                >
                    <MoreVertical size={18} />
                </button>
            </div>
            
            <div className="p-5 flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 min-h-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
                    
                    {/* Title with EditableInput (Fixes wrapping) */}
                    <div className="mb-1 shrink-0">
                        <EditableInput
                            value={titleVal}
                            onSave={saveTitle}
                            disabled={!canEdit}
                            className={`font-bold text-lg leading-tight bg-transparent border border-transparent rounded px-2 py-1 -ml-2 w-full transition-all 
                                ${theme === 'light' ? 'text-slate-800' : 'text-white'}
                                ${canEdit ? 'hover:border-white/10 hover:bg-white/5 focus:bg-white/10 focus:border-blue-500/30' : ''}
                            `}
                            placeholder="Untitled Board"
                        />
                    </div>

                    {/* Description with EditableInput */}
                    <div className="flex-1 min-h-0 mt-1">
                        <EditableInput
                            value={descVal}
                            onSave={saveDesc}
                            disabled={!canEdit}
                            className={`text-sm leading-relaxed bg-transparent border border-transparent rounded p-2 -ml-2 w-full h-full resize-none transition-all
                                ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}
                                ${!descVal && 'italic opacity-50'}
                                ${canEdit ? 'hover:border-white/10 hover:bg-white/5 focus:bg-white/10 focus:border-blue-500/30' : ''}
                            `}
                            placeholder="No description."
                        />
                    </div>
                </div>
                
                {/* Footer Info */}
                <div className={`pt-4 mt-2 relative shrink-0 border-t flex items-center justify-between min-h-[40px] ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                    {viewMode === 'trashed' ? (
                        <>
                             <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                                <Trash2 size={12} /> Deleted
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); onRestore(board.id); }} className="text-green-500 hover:text-green-400 font-bold text-xs flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                                <RotateCcw size={12} /> Restore
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="font-medium flex items-center gap-1.5 text-xs text-gray-500">
                                {hasUpdated ? <ArrowUpCircle size={12} className="text-blue-400" /> : <Clock size={12} />} 
                                {formatDateOnly(displayTs)}
                            </span>
                            
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-gray-500'}`}>
                                {board.format}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
