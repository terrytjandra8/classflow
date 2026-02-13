
import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface RetryModalProps {
    isOpen: boolean;
    participant: any;
    onClose: () => void;
    onConfirm: () => void;
}

export const RetryModal: React.FC<RetryModalProps> = ({ isOpen, participant, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 animate-in zoom-in-95">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-500/10 text-red-500 rounded-full shrink-0">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Wipe & Restart?</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Are you sure you want to completely reset <strong>{participant?.name}</strong>?
                            </p>
                            <div className="mt-3 bg-red-500/10 border border-red-500/20 p-2 rounded text-red-300 text-xs font-bold">
                                ⚠️ All answers will be deleted. This action cannot be undone.
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-[#111] border-t border-white/5 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg transition-colors"
                    >
                        Confirm Wipe
                    </button>
                </div>
            </div>
        </div>
    );
};
