import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger'
}) => {
    if (!isOpen) return null;

    const colorClass = type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-900/20' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-900/20';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-8 text-center">
                    <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        <AlertTriangle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3 tracking-tight">{title}</h2>
                    <p className="text-sm text-white/40 mb-8 leading-relaxed px-2">{message}</p>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={onClose} 
                            className="flex-1 py-4 text-sm font-black uppercase tracking-widest text-white/30 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={onConfirm} 
                            className={`flex-1 py-4 text-sm font-black uppercase tracking-widest text-white rounded-2xl transition-all shadow-xl active:scale-[0.98] ${colorClass}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
