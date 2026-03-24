
import React, { useState, useRef, useEffect } from 'react';
import { CheckSquare, Square, User, AlertTriangle, Printer, Edit, RotateCcw, Play, FileText, CheckCircle2, File, FileX } from 'lucide-react';
import { PrintMode } from '../AssessmentPrintView';

interface ParticipantCardProps {
    participant: any;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onReset: (participant: any) => void;
    onContinue: (participant: any) => void;
    onAllowRevision: (participant: any) => void;
    onPrint: (participant: any, mode: PrintMode) => void;
    onGrade: (participant: any) => void;
    totalPoints: number;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, isSelected, onToggleSelect, onReset, onContinue, onAllowRevision, onPrint, onGrade, totalPoints }) => {

    const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
    const printMenuRef = useRef<HTMLDivElement>(null);

    const isGraded = participant.status.includes('Graded');
    const isSubmitted = participant.status.includes('Submitted');
    const isReady = participant.status === 'Ready';

    const percentage = totalPoints > 0 ? (participant.score / totalPoints) * 100 : 0;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
                setIsPrintMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getStatusIcon = () => {
        switch (participant.status) {
            case 'Graded & Released': return <CheckCircle2 size={12} className="text-green-400"/>;
            case 'Graded': return <CheckCircle2 size={12} className="text-blue-400"/>;
            case 'Submitted': return <FileText size={12} className="text-gray-400"/>;
            case 'In Progress':
            case 'Revising': return <Edit size={12} className="text-yellow-400"/>;
            case 'Ready': return <Play size={12} className="text-gray-500"/>;
            default: return <User size={12} />;
        }
    };

    return (
        <div className={`bg-[#1a1a1a] border rounded-lg p-4 flex flex-col justify-between relative transition-all duration-300 ${isSelected ? 'border-blue-500 shadow-2xl scale-[1.02]' : 'border-white/5'}`}>
            {participant.noteId && (
                <button 
                    onClick={() => onToggleSelect(participant.id)}
                    className="absolute top-3 right-3 p-1 text-gray-600 hover:text-white transition-colors z-10"
                >
                    {isSelected ? <CheckSquare size={20} className="text-blue-500" /> : <Square size={20} />}
                </button>
            )}
            
            <div>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold uppercase px-2 py-1 rounded-full border border-blue-500/30">Student</span>
                
                <h3 className="font-bold mt-3 text-base text-white truncate">{participant.name}</h3>
                
                <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400"> 
                        {getStatusIcon()}
                        {participant.status}
                    </span>
                    {participant.hasLowWordCount && ( 
                        <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20"> 
                            <AlertTriangle size={12} /> Low WC
                        </span>
                    )}
                    {(participant.data?.secondChances || 0) > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20" title={`Student was granted a second chance ${participant.data.secondChances} time(s)`}> 
                            <RotateCcw size={12} /> {participant.data.secondChances}x Retry
                        </span>
                    )}
                    {participant.violations > 0 && (
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${participant.disqualified ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'} px-2 py-0.5 rounded-full border`} title={`Student has ${participant.violations} security violation(s)`}> 
                            <AlertTriangle size={12} /> {participant.violations} Violations
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Progress</span>
                    <span className="text-xs font-bold text-white">{Math.round(participant.progress * 100)}%</span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-1.5 border border-white/5 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{width: `${participant.progress * 100}%`}}></div>
                </div>
            </div>
            
            {(isGraded || isSubmitted) && (
                <div className="mt-4 pt-4 border-t border-white/5 text-center">
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Final Marks</p>
                    <p className="text-green-400 font-bold text-2xl mt-1">{participant.score} <span className="text-lg">marks</span></p>
                    <p className="text-gray-400 font-bold text-xs">{percentage.toFixed(1)}%</p>
                </div>
            )}

            <div className={`mt-4 pt-4 border-t border-white/5 flex items-center ${isReady ? 'justify-center' : 'justify-between'}`}>
                {!isReady && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onReset(participant); }}
                        className="px-4 py-2 bg-red-800/50 hover:bg-red-800/80 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                        Reset
                    </button>
                )}

                {(participant.status === 'In Progress' || participant.status === 'Revising' || participant.status === 'Disqualified') && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); onContinue(participant); }}
                        className={`px-4 py-2 ${participant.status === 'Disqualified' ? 'bg-orange-600 hover:bg-orange-700 shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg text-xs font-bold transition-colors`}
                    >
                        {participant.status === 'Disqualified' ? 'Second Chance' : 'Continue'}
                    </button>
                )}

                {isSubmitted ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onGrade(participant); }}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg"
                    >
                        Grade
                    </button>
                ) : isGraded ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onGrade(participant); }}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-sm transition-colors"
                    >
                        Review
                    </button>
                ) : null}

                {!isReady && 
                    <div className="flex gap-1">
                        {isGraded && (
                            <button onClick={(e) => { e.stopPropagation(); onAllowRevision(participant); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors" title="Allow Revision"><RotateCcw size={18}/></button>
                        )}
                        <div className="relative" ref={printMenuRef}>
                            <button 
                                onClick={() => setIsPrintMenuOpen(prev => !prev)}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                                title="Print Options"
                            >
                                <Printer size={18}/>
                            </button>
                            {isPrintMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-xl z-20 animate-in fade-in zoom-in-95">
                                    <button 
                                        onClick={() => { onPrint(participant, 'WITH_ANSWERS_AND_FEEDBACK'); setIsPrintMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/5 text-gray-300"
                                    >
                                        <FileText size={14} /> With Feedback
                                    </button>
                                    <button 
                                        onClick={() => { onPrint(participant, 'WITH_ANSWERS'); setIsPrintMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/5 text-gray-300"
                                    >
                                        <File size={14} /> Submission Only
                                    </button>
                                    <button 
                                        onClick={() => { onPrint(participant, 'BLANK'); setIsPrintMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/5 text-gray-300"
                                    >
                                        <FileX size={14} /> Blank Paper
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                }
            </div>
        </div>
    );
};
