
import React, { useState, useEffect } from 'react';
import { User, Save, RefreshCcw, Check, X, Loader2, CheckCircle, UploadCloud } from 'lucide-react';

interface GradingModalHeaderProps {
    participantName: string;
    participantId: string;
    totalScore: number;
    questionsToReviseCount: number;
    isReleased: boolean;
    isDirty: boolean;
    onSave: (release: boolean) => Promise<boolean>;
    onAllowRevision: () => void;
    onClose: () => void;
}

export const GradingModalHeader: React.FC<GradingModalHeaderProps> = React.memo(({
    participantName, participantId, totalScore, questionsToReviseCount,
    isReleased, isDirty, onSave, onAllowRevision, onClose
}) => {
    
    const [status, setStatus] = useState<'idle' | 'saving' | 'releasing'>('idle');
    const [localIsReleased, setLocalIsReleased] = useState(isReleased);

    useEffect(() => {
        setLocalIsReleased(isReleased);
    }, [isReleased]);

    const handleSaveGrades = async () => {
        setStatus('saving');
        const success = await onSave(false);
        if (success) {
            // The parent component will close the modal, no need for a 'saved' state here
        } else {
            setStatus('idle'); // Stay open on failure
        }
    };

    const handleSaveAndRelease = async () => {
        setStatus('releasing');
        const success = await onSave(true);
        if (success) {
            setLocalIsReleased(true);
        } 
        // Keep the modal open to show status, reset button state
        setStatus('idle');
    };

    const isActionInProgress = status === 'saving' || status === 'releasing';
    const isPublished = localIsReleased && !isDirty;

    const getReleaseButtonContent = () => {
        if (isActionInProgress) return <><Loader2 size={16} className="animate-spin"/> Releasing...</>;
        if (isPublished) return <><CheckCircle size={16}/> Released</>;
        if (localIsReleased && isDirty) return <><UploadCloud size={16}/> Republish</>;
        return <><Check size={16}/> Save & Release</>;
    };

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
                    onClick={handleSaveGrades} 
                    disabled={isActionInProgress || !isDirty}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md disabled:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    title="Save the current grades without releasing them to the student."
                >
                    {status === 'saving' ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : <><Save size={16}/> Save Grades</>}
                </button>

                <button 
                    onClick={onAllowRevision}
                    disabled={isActionInProgress}
                    className="relative px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-sm hover:bg-amber-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
                    title="Allow the student to revise the selected questions."
                >
                    <RefreshCcw size={16}/> Allow Revision
                    {questionsToReviseCount > 0 && 
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{questionsToReviseCount}</span>
                    }
                </button>

                <button 
                    onClick={handleSaveAndRelease} 
                    disabled={isActionInProgress || isPublished}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md disabled:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    title={isPublished ? "Grades have been released and are up to date." : (localIsReleased && isDirty) ? "Republish the updated grades to the student." : "Save the grades and make them visible to the student."}
                >
                    {getReleaseButtonContent()}
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
