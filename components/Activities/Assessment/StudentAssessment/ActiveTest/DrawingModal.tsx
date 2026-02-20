import React from 'react';
import { X, PenTool, RefreshCcw, Check, AlertTriangle } from 'lucide-react';
import { DrawingCanvas } from '../../../ui/DrawingCanvas';

interface DrawingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDrawEnd: (blob: Blob) => void;
    initialData?: string;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

export const DrawingModal: React.FC<DrawingModalProps> = ({ isOpen, onClose, onDrawEnd, initialData, saveStatus }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
             <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
                 <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <PenTool size={18} />
                        <h2 className="font-bold text-lg">Drawing Canvas</h2>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className={`text-xs flex items-center gap-2 transition-opacity ${saveStatus === 'idle' ? 'opacity-50' : 'opacity-100'}`}>
                            {saveStatus === 'idle' && <>Waiting for changes...</>}
                            {saveStatus === 'saving' && <><RefreshCcw size={14} className="animate-spin"/> Saving...</>}
                            {saveStatus === 'saved' && <><Check size={14} className="text-green-500"/> Saved</>}
                            {saveStatus === 'error' && <><AlertTriangle size={14} className="text-red-500"/> Error</>}
                        </div>
                        <button 
                            onClick={onClose}
                            className="bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        >
                            <X size={20}/>
                        </button>
                    </div>
                 </div>
                 <div className="flex-1 bg-white relative p-1">
                    <DrawingCanvas
                        onDrawEnd={onDrawEnd} 
                        initialData={initialData}
                    />
                 </div>
             </div>
        </div>
    );
};