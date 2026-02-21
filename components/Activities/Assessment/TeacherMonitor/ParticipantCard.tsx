
import React from 'react';
import { CheckSquare, Square, User, AlertTriangle, Printer, Edit, RotateCcw, Play, FileText, CheckCircle2 } from 'lucide-react';
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

    const isGraded = participant.status.includes('Graded');
    const isSubmitted = participant.status.includes('Submitted');
    const isReady = participant.status === 'Ready';

    const percentage = totalPoints > 0 ? (participant.score / totalPoints) * 100 : 0;

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
                        onClick={() => onReset(participant)}
                        className="px-4 py-2 bg-red-800/50 hover:bg-red-800/80 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                        Reset
                    </button>
                )}

                {(participant.status === 'In Progress' || participant.status === 'Revising') && (
                     <button 
                        onClick={() => onContinue(participant)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                        Continue
                    </button>
                )}

                {isSubmitted ? (
                    <button 
                        onClick={() => onGrade(participant)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg"
                    >
                        Grade
                    </button>
                ) : isGraded ? (
                    <button 
                        onClick={() => onGrade(participant)}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-sm transition-colors"
                    >
                        Review
                    </button>
                ) : null}

                {!isReady && 
                    <div className="flex gap-1">
                        {isGraded && (
                            <button onClick={() => onAllowRevision(participant)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors" title="Allow Revision"><RotateCcw size={18}/></button>
                        )}
                        <button onClick={() => onPrint(participant, 'WITH_ANSWERS_AND_FEEDBACK')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors" title="Print Submission"><Printer size={18}/></button>
                    </div>
                }
            </div>
        </div>
    );
};
