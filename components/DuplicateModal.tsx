
import React, { useState } from 'react';
import { X, Copy, Pin } from 'lucide-react';

interface DuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { includeNotes: boolean; onlyPinned: boolean }) => void;
  boardTitle: string;
}

export const DuplicateModal: React.FC<DuplicateModalProps> = ({ 
  isOpen, onClose, onConfirm, boardTitle 
}) => {
  const [includeNotes, setIncludeNotes] = useState(true);
  const [onlyPinned, setOnlyPinned] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200 relative">
        
        <div className="p-6 border-b border-white/5 flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold text-white mb-1">Duplicate Board</h3>
                <p className="text-sm text-gray-400 truncate max-w-[250px]">"{boardTitle}"</p>
            </div>
            <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-4">
            {/* Main Toggle: Include Content */}
            <div 
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${includeNotes ? 'border-pink-600 bg-pink-600/10' : 'border-white/10 bg-[#111] hover:border-white/20'}`}
                onClick={() => setIncludeNotes(!includeNotes)}
            >
                <div className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${includeNotes ? 'bg-pink-600 border-pink-600' : 'border-gray-500 bg-transparent'}`}>
                    {includeNotes && <Copy size={12} className="text-white" />}
                </div>
                <div className="flex-1">
                    <h4 className={`text-sm font-bold mb-1 ${includeNotes ? 'text-pink-400' : 'text-gray-300'}`}>Include My Posts</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Copy the notes you created to the new board. <br/>
                        <span className="text-white/60">Student posts, comments, and likes will be removed.</span>
                    </p>
                </div>
            </div>

            {/* Sub Toggle: Only Pinned */}
            {includeNotes && (
                <div 
                    className={`ml-9 p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${onlyPinned ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-[#111] hover:border-white/20'}`}
                    onClick={() => setOnlyPinned(!onlyPinned)}
                >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${onlyPinned ? 'bg-orange-500 border-orange-500' : 'border-gray-500 bg-transparent'}`}>
                        {onlyPinned && <Pin size={10} className="text-white fill-white" />}
                    </div>
                    <div className="flex-1">
                        <h4 className={`text-xs font-bold ${onlyPinned ? 'text-orange-400' : 'text-gray-300'}`}>Only Pinned Posts</h4>
                        <p className="text-[10px] text-gray-500">
                            Limit copy to only the posts you have pinned (e.g. Instructions).
                        </p>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 bg-[#111] border-t border-white/5 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={() => onConfirm({ includeNotes, onlyPinned })}
                className="px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 bg-white text-black hover:bg-gray-200"
            >
                Duplicate
            </button>
        </div>
      </div>
    </div>
  );
};
