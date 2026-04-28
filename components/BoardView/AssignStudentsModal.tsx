import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Users, Check, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { Profile } from '../../types';

interface AssignStudentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionTitle: string;
    allStudents: Profile[];
    assignedIds: string[];
    blurUnassigned: boolean;
    targetGrade?: string;
    allAssignedOnBoard?: string[];
    onSave: (assignedIds: string[], blurUnassigned: boolean) => void;
}

export const AssignStudentsModal: React.FC<AssignStudentsModalProps> = ({
    isOpen, onClose, sectionTitle, allStudents, assignedIds, blurUnassigned, targetGrade, allAssignedOnBoard, onSave
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>(assignedIds);
    const [isBlurEnabled, setIsBlurEnabled] = useState(blurUnassigned);
    const [showAllStudents, setShowAllStudents] = useState(false);
    const [isBackdropBlurEnabled, setIsBackdropBlurEnabled] = useState(true);
    const [hideAssignedToOthers, setHideAssignedToOthers] = useState(false);
    
    // Draggable state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });

    // Filter students based on search and class targeting
    const filteredStudents = useMemo(() => {
        let list = allStudents;
        
        // 1. If not showing all, filter by class targeting (targetGrade)
        if (!showAllStudents && targetGrade && targetGrade !== 'All Boards') {
            list = list.filter(s => s.enrolled_classes?.includes(targetGrade));
        }

        // 1b. Hide students already assigned to other columns
        if (hideAssignedToOthers && allAssignedOnBoard) {
            list = list.filter(s => !allAssignedOnBoard.includes(s.id));
        }

        // 2. Apply search term
        if (searchTerm) {
            list = list.filter(s => 
                s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 3. Sort: Selected first, then alphabetical
        return [...list].sort((a, b) => {
            const aSelected = selectedIds.includes(a.id);
            const bSelected = selectedIds.includes(b.id);
            
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            
            // If both same selection state, sort alphabetically
            return a.full_name.localeCompare(b.full_name);
        });
    }, [allStudents, searchTerm, targetGrade, showAllStudents, selectedIds, hideAssignedToOthers, allAssignedOnBoard]);


    const toggleStudent = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === allStudents.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(allStudents.map(s => s.id));
        }
    };

    const handleSave = () => {
        onSave(selectedIds, isBlurEnabled);
        onClose();
    };

    // --- DRAG LOGIC ---
    const handleMouseDown = (e: React.MouseEvent) => {
        // Don't drag if clicking buttons
        if ((e.target as HTMLElement).closest('button')) return;
        
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - dragStartPos.current.x,
                y: e.clientY - dragStartPos.current.y
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 ${isBackdropBlurEnabled ? 'backdrop-blur-sm' : ''} transition-[backdrop-filter,background-color] duration-500`}>
            <div 
                style={{ 
                    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                    transition: isDragging ? 'none' : undefined 
                }}
                className={`bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden ${!isDragging ? 'animate-in zoom-in-95 duration-200' : ''}`}
            >
                
                {/* Header - Drag Handle */}
                <div 
                    onMouseDown={handleMouseDown}
                    className={`p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent cursor-move select-none ${isDragging ? 'brightness-125' : ''}`}
                >
                    <div className="flex items-center gap-3 pointer-events-none">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                            <Users className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-white font-bold">Assign Students</h2>
                            <p className="text-xs text-white/40 truncate max-w-[200px]">To: {sectionTitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsBackdropBlurEnabled(!isBackdropBlurEnabled)}
                            className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                            title={isBackdropBlurEnabled ? "Disable Background Blur" : "Enable Background Blur"}
                        >
                            {isBackdropBlurEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Privacy Toggle Section */}
                <div className="p-4 bg-white/5 border-b border-white/5 space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isBlurEnabled ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/40'}`}>
                                <ShieldAlert size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-white">Blur for unassigned</span>
                                <span className="text-[10px] text-white/40 italic">Focus mode for other students</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsBlurEnabled(!isBlurEnabled)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${isBlurEnabled ? 'bg-orange-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isBlurEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${hideAssignedToOthers ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                                <Users size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-white">Hide assigned students</span>
                                <span className="text-[10px] text-white/40 italic">Hide those assigned to other columns</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setHideAssignedToOthers(!hideAssignedToOthers)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${hideAssignedToOthers ? 'bg-blue-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hideAssignedToOthers ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>

                </div>

                {/* Search Bar */}
                <div className="p-4 space-y-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={16} />
                        <input 
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                        />
                    </div>

                    {targetGrade && targetGrade !== 'All Boards' && (
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] text-white/40 italic">
                                {showAllStudents ? "Showing everyone" : `Showing students in ${targetGrade}`}
                            </span>
                            <button 
                                onClick={() => setShowAllStudents(!showAllStudents)}
                                className="text-[10px] font-bold text-blue-400 hover:underline"
                            >
                                {showAllStudents ? "Switch to Class List" : "Show All Students"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto px-4 pb-2 custom-scrollbar space-y-1.5">
                    <div className="flex items-center justify-between px-2 pb-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-white/30">
                            {filteredStudents.length} Students {showAllStudents ? 'Global' : 'in Class'}
                        </span>
                        <button 
                            onClick={handleSelectAll}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {selectedIds.length === allStudents.length ? 'DESELECT ALL' : 'SELECT ALL'}
                        </button>
                    </div>

                    {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => {
                            const isSelected = selectedIds.includes(student.id);
                            return (
                                <button 
                                    key={student.id}
                                    onClick={() => toggleStudent(student.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border group ${
                                        isSelected 
                                        ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20' 
                                        : 'bg-white/5 border-transparent hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'}`}>
                                            {student.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className={`text-sm font-semibold transition-colors ${isSelected ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                                                {student.full_name}
                                            </span>
                                            <span className="text-[10px] text-white/30">{student.email}</span>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'bg-transparent border-white/10 text-transparent'}`}>
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-white/20">
                            <Users size={32} strokeWidth={1} />
                            <p className="mt-2 text-xs">No students found</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-900 border-t border-white/5 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                    >
                        Save Assignments
                    </button>
                </div>
            </div>
        </div>
    );
};
