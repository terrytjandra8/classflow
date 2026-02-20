import React from 'react';
import { AlertTriangle, Check, Send } from 'lucide-react';

interface SubmitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    meetsRequirements: boolean;
    isPracticeMode?: boolean;
    isRevision?: boolean;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({ isOpen, onClose, onConfirm, meetsRequirements, isPracticeMode, isRevision }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className={`flex items-center gap-3 mb-4 ${meetsRequirements ? 'text-green-500' : 'text-amber-500'}`}>
                    <AlertTriangle size={24} />
                    <h3 className="text-lg font-bold text-white">{isPracticeMode ? 'Finish Practice?' : 'Submit Assessment?'}</h3>
                </div>
                
                {!meetsRequirements && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-amber-200 text-xs mb-4 leading-relaxed">
                        <strong>Warning:</strong> You have essay questions that do not meet the minimum word count requirement (spam detected or too short).
                    </div>
                )}

                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    {isPracticeMode ? "Are you sure you want to finish your practice session?" : "Are you sure you want to submit? You cannot change your answers after this point."}
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-colors shadow-lg ${meetsRequirements ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                    >
                        {isPracticeMode ? 'Finish' : (isRevision ? 'Resubmit Assessment' : 'Confirm Submit')}
                    </button>
                </div>
            </div>
        </div>
    );
};