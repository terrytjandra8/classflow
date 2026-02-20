
import React from 'react';
import { User, Save, RefreshCcw, Check, X } from 'lucide-react';

interface GradingModalHeaderProps {
    participantName: string;
    participantId: string;
    totalScore: number;
    questionsToReviseCount: number;
    onSave: (release: boolean) => void;
    onAllowRevision: () => void;
    onClose: () => void;
}

export const GradingModalHeader: React.FC<GradingModalHeaderProps> = React.memo(({
    participantName, participantId, totalScore, questionsToReviseCount,
    onSave, onAllowRevision, onClose
}) => {
    return (
        <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0 bg-[#1a1a1a] rounded-t-2xl">
            <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><User size={18}/> Grading: {participantName}</h3>
                <p className="text-xs text-gray-400 mt-1">Student ID: {participantId}</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total Score</span>
                    <p className="font-bold text-green-500 text-2xl leading-none">{totalScore}</p>
                </div>
                
                <button 
                    onClick={() => onSave(false)} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
                    title="Save the current grades without releasing them to the student."
                >
                    <Save size={16}/> Save Grades
                </button>

                <button 
                    onClick={onAllowRevision}
                    className="relative px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-sm hover:bg-amber-700 transition-colors flex items-center gap-2 shadow-md"
                    title="Allow the student to revise the selected questions."
                >
                    <RefreshCcw size={16}/> Allow Revision
                    {questionsToReviseCount > 0 && 
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{questionsToReviseCount}</span>
                    }
                </button>

                <button 
                    onClick={() => onSave(true)} 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
                    title="Save the grades and make them visible to the student."
                >
                    <Check size={16}/> Save & Release
                </button>

                <button 
                    onClick={onClose} 
                    className="p-2.5 bg-white/5 hover:bg-red-600/20 rounded-lg text-gray-300 hover:text-red-500 border border-white/10 hover:border-red-600/30 transition-colors"
                    title="Close the grading window."
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
});
