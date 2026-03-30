
import React, { useState, useRef, useEffect } from 'react';
import { CheckSquare, Square, Printer, RotateCcw, Send, FileText, File, FileCheck } from 'lucide-react';
import { PrintMode } from '../AssessmentPrintView';

interface BulkActionsSectionProps {
    hasStudents: boolean;
    selectedCount: number;
    totalCount: number;
    onSelectAll: () => void;
    onPrintSelected: (mode: PrintMode) => void;
    onAllowRevisionSelected: () => void;
    onReleaseGradesSelected: () => void;
}

export const BulkActionsSection: React.FC<BulkActionsSectionProps> = ({ 
    hasStudents, selectedCount, totalCount, onSelectAll, 
    onPrintSelected, onAllowRevisionSelected, onReleaseGradesSelected 
}) => {
    const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
    const printMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
                setIsPrintMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!hasStudents) return null;

    return (
        <div className="flex items-center gap-4 mb-4 animate-in fade-in slide-in-from-top-1 bg-[#1a1a1a] p-2 rounded-lg border border-white/5 w-fit">
            <button 
                onClick={onSelectAll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-bold text-gray-300 transition-colors"
            >
                {selectedCount === totalCount ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                {selectedCount === totalCount ? "Deselect All" : "Select All"}
            </button>
            
            {selectedCount > 0 && (
                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                    <span className="text-xs font-bold text-blue-400 mr-2">{selectedCount} Selected</span>
                    
                    <button 
                        onClick={onReleaseGradesSelected}
                        className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg"
                        data-tooltip="Release grades to selected students"
                    >
                        <Send size={14} /> Release Grades
                    </button>

                    <button 
                        onClick={onAllowRevisionSelected}
                        className="flex items-center gap-2 px-4 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg"
                        data-tooltip="Allow revision for selected students"
                    >
                        <RotateCcw size={14} /> Allow Revision
                    </button>

                    <div className="relative" ref={printMenuRef}>
                        <button 
                            onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg"
                        >
                            <Printer size={14} /> Print Selected
                        </button>
                        
                        {isPrintMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-2xl z-30 animate-in fade-in zoom-in-95 origin-top-right overflow-hidden">
                                <button 
                                    onClick={() => { onPrintSelected('WITH_ANSWERS_AND_FEEDBACK'); setIsPrintMenuOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/5 text-gray-300 transition-colors"
                                >
                                    <FileCheck size={14} className="text-green-400" /> With Feedback
                                </button>
                                <button 
                                    onClick={() => { onPrintSelected('WITH_ANSWERS_MODEL'); setIsPrintMenuOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/5 text-gray-300 transition-colors"
                                >
                                    <FileText size={14} className="text-blue-400" /> With Model Answers
                                </button>
                                <button 
                                    onClick={() => { onPrintSelected('WITH_ANSWERS'); setIsPrintMenuOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/5 text-gray-300 transition-colors"
                                >
                                    <File size={14} className="text-gray-400" /> Submission Only
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
