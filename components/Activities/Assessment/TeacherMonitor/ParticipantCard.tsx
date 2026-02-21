import React, { memo, useState } from 'react';
import { CheckSquare, Square, ShieldCheck, User, Ban, ShieldAlert, FileWarning, Activity, CheckCircle, Clock, Users, RefreshCw, Printer, ExternalLink, PlayCircle, Unlock, RotateCcw, ChevronDown, Eye } from 'lucide-react';
import { PrintMode } from '../AssessmentPrintView';

interface ParticipantCardProps {
    participant: any;
    onReset: (participant: any) => void;
    onContinue: (participant: any) => void;
    onAllowRevision: (participant: any) => void;
    onPrint: (participant: any, mode: PrintMode) => void;
    onGrade: (participant: any) => void;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
}

const ParticipantCardComponent: React.FC<ParticipantCardProps> = ({ participant, onReset, onContinue, onAllowRevision, onPrint, onGrade, isSelected, onToggleSelect }) => {
    const [isPrintMenuOpen, setPrintMenuOpen] = useState(false);
    
    const isTeacher = participant.role === 'teacher';
    const isDQ = participant.disqualified;
    const hasScore = participant.score != null;

    // --- START: Refined State Logic ---
    // The participant's state is determined by a clear hierarchy.
    const isReleased = participant.status === 'Graded & Released';
    const isGraded = hasScore && !isReleased;
    const isSubmitted = participant.status === 'Submitted' && !isGraded && !isReleased;
    const isInProgress = ['In Progress', 'Revising'].includes(participant.status) && !hasScore;
    // Any other state is considered Ready.
    const isReady = !isReleased && !isGraded && !isSubmitted && !isInProgress && !isTeacher;

    const showActionButtons = isGraded || isReleased || isSubmitted || isDQ;
    const isInteractive = !isTeacher && (showActionButtons || isInProgress);

    const getStatus = () => {
        if (isTeacher) return { icon: <Activity size={10} />, text: 'Monitoring', color: 'text-green-500' };
        if (isReleased) return { icon: <CheckCircle size={10} />, text: 'Graded & Released', color: 'text-purple-400' };
        if (isGraded) return { icon: <CheckCircle size={10} />, text: 'Graded', color: 'text-green-400' };
        if (isSubmitted) return { icon: <CheckCircle size={10} />, text: 'Submitted', color: 'text-gray-400' };
        if (isInProgress) return { icon: <Clock size={10} />, text: participant.status, color: 'text-blue-400' };
        return { icon: <Users size={10} />, text: 'Ready', color: 'text-gray-500' };
    };
    const status = getStatus();
    // --- END: Refined State Logic ---

    const handleInteraction = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.selection-checkbox')) return;
        if (isInteractive) onGrade(participant);
    };

    const handlePrintClick = (e: React.MouseEvent, mode: PrintMode) => {
        e.stopPropagation();
        onPrint(participant, mode);
        setPrintMenuOpen(false);
    };
    console.log(`Data for ${participant.name}:`, { 
        status: participant.status, 
        score: participant.score, 
        isReleased, 
        isGraded,
        showActionButtons
    });
    return (
        <div 
            onClick={handleInteraction}
            onDoubleClick={handleInteraction}
            className={`relative overflow-hidden rounded-xl p-4 border transition-all group flex flex-col gap-3 select-none ${isDQ ? 'bg-red-900/10 border-red-500/50' : (isReleased ? 'bg-purple-500/10 border-purple-500/30' : (isGraded ? 'bg-green-500/10 border-green-500/30' : (isInProgress ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10')))} ${isInteractive ? 'hover:bg-opacity-20 cursor-pointer' : 'cursor-default'} ${isSelected ? 'ring-2 ring-blue-500' : ''} ${hasScore ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black' : ''}`}>
             {!isTeacher && (
                <div className="absolute top-2 right-2 z-20 selection-checkbox p-1" onClick={(e) => { e.stopPropagation(); onToggleSelect(participant.id); }}>
                    {isSelected ? <CheckSquare className="text-blue-500 fill-blue-500/20 cursor-pointer" size={20} /> : <Square className="text-gray-600 hover:text-white cursor-pointer" size={20} />}
                </div>
            )}

            <div className="flex justify-between items-start">
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border w-fit ${isTeacher ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                    {isTeacher ? <span className="flex items-center gap-1"><ShieldCheck size={10}/> Teacher</span> : <span className="flex items-center gap-1"><User size={10}/> Student</span>}
                </div>
                {!isTeacher && (isDQ ? <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 mr-6"><Ban size={10} /> DQ</div> : participant.violations > 0 ? <div className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500/30 flex items-center gap-1 mr-6"><ShieldAlert size={10} /> {participant.violations} Flags</div> : participant.hasLowWordCount ? <div className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 mr-6"><FileWarning size={10} /> Short</div> : null)}
            </div>
            
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 shrink-0 ${isDQ ? 'bg-red-600 text-white border-red-400' : 'bg-white/5 border-white/10 text-gray-300'}`}>{participant.name.charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                    <div className={`font-bold truncate ${isDQ ? 'text-red-400' : 'text-white'}`}>{participant.name}</div>
                    <div className={`text-xs flex items-center gap-1.5 ${isDQ ? 'text-red-500 font-bold' : status.color}`}>{status.icon} {status.text}</div>
                </div>
            </div>
            
            {isInProgress && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none backdrop-blur-[1px]"><div className="bg-blue-600/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-in zoom-in duration-200"><ExternalLink size={12} /> View Live</div></div>}

            {!isTeacher && showActionButtons && (
                <div className="flex gap-2 mt-2 relative z-10" onClick={e => e.stopPropagation()}>
                     {(isGraded || isReleased) && !isDQ && (
                         <button onClick={() => onGrade(participant)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${isReleased ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'}`} title={isReleased ? 'View Submission' : 'View or Grade Submission'}>
                             <Eye size={12} /> {isReleased ? 'View' : 'View / Grade'}
                         </button>
                    )}
                    {isSubmitted && !isDQ && (
                         <button onClick={() => onGrade(participant)} className="flex-1 py-1.5 bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 border border-gray-500/20 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1" title="Grade Submission">
                             <Eye size={12} /> Grade
                         </button>
                    )}
                    {isDQ && <button onClick={() => onContinue(participant)} className="flex-1 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1" title="Unlock student to continue"><Unlock size={12} /> Continue</button>}
                    {isDQ && <button onClick={() => onGrade(participant)} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1" title="View Submission"><Eye size={12} /> View</button>}
                    
                    {(isGraded || isReleased) && !isDQ && (
                       <button onClick={() => onAllowRevision(participant)} className="py-1.5 px-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1" title="Unlock for revision"><RotateCcw size={12} /></button>
                    )}
                    
                    <button onClick={() => onReset(participant)} className="py-1.5 px-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded-lg text-xs font-bold transition-colors flex items-center justify-center" title="Wipe data and restart"><RefreshCw size={12} /></button>
                    
                    {(isGraded || isReleased) && !isDQ && (
                        <div className="relative">
                             <button 
                                onClick={() => setPrintMenuOpen(prev => !prev)}
                                className="w-full py-1.5 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                title="Export to PDF"
                            >
                                <Printer size={12} />
                            </button>
                            {isPrintMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-1 w-40 bg-[#222] border border-white/10 rounded-lg shadow-xl z-10 animate-in fade-in slide-in-from-bottom-2" onMouseLeave={() => setPrintMenuOpen(false)}>
                                    <button onClick={(e) => handlePrintClick(e, 'WITH_ANSWERS_AND_FEEDBACK')} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">With Feedback</button>
                                    <button onClick={(e) => handlePrintClick(e, 'WITH_ANSWERS')} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">Answers Only</button>
                                    <button onClick={(e) => handlePrintClick(e, 'BLANK')} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">Blank Paper</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {!isTeacher && (participant.progress > 0 && isInProgress) && (
                 <div className="space-y-1 mt-auto relative z-0">
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider"><span>Progress</span><span>{Math.round(participant.progress * 100)}%</span></div>
                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${isDQ ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${participant.progress * 100}%` }}></div>
                    </div>
                </div>
            )}
           
            {hasScore && <div className="pt-3 border-t border-white/5 flex justify-between items-center relative z-0"><span className="text-xs text-gray-500 font-medium">Final Score</span><span className={`font-mono font-bold text-xl ${isDQ ? 'text-red-500' : (isReleased ? 'text-purple-400' : 'text-green-400')}`}>{participant.score} <span className="text-xs text-gray-500 font-normal">pts</span></span></div>}
        </div>
    );
};

export const ParticipantCard = memo(ParticipantCardComponent);
