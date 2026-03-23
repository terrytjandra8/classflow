import React from 'react';
import { X, Layout, MousePointer2, Grid, Map, Kanban, Calendar, AlignLeft, Boxes, Loader2 } from 'lucide-react';
import { BoardFormat } from '../types';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (format: BoardFormat) => void;
  isCreating?: boolean;
}

const FORMAT_OPTIONS = [
    { id: 'wall', label: 'Wall', desc: 'Pack content in a brick-like layout.', icon: Layout },
    { id: 'freeform', label: 'Freeform', desc: 'Scatter content anywhere. Fully draggable.', icon: Boxes },
    { id: 'columns', label: 'Columns', desc: 'Stack content into vertical columns.', icon: Kanban },
    { id: 'grid', label: 'Grid', desc: 'Arrange content in rows of boxes.', icon: Grid },
    { id: 'canvas', label: 'Canvas', desc: 'Group and connect content with lines.', icon: MousePointer2 },
    { id: 'stream', label: 'Stream', desc: 'Streamline content in an easy to read, top-to-bottom feed.', icon: AlignLeft },
    { id: 'timeline', label: 'Timeline', desc: 'Arrange content on a line to highlight chronological order.', icon: Calendar },
    { id: 'map', label: 'Map', desc: 'Add content to points on a map.', icon: Map },
];


export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ isOpen, onClose, onCreate, isCreating }) => {
  if (!isOpen) return null;

  const handleSelectFormat = (format: BoardFormat) => {
    if (isCreating) return;
    onCreate(format);
    // Modal stays open to show loading via parent isCreating prop
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white">
      <div className="bg-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden border border-white/10 relative">
        
        {/* Loading Overlay */}
        {isCreating && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                <Loader2 className="animate-spin text-pink-500 mb-4" size={48} />
                <p className="text-xl font-bold text-white animate-pulse">Creating your board...</p>
                <p className="text-gray-400 text-sm mt-2">Setting up permissions and layout</p>
            </div>
        )}

        <button 
            onClick={onClose} 
            disabled={isCreating}
            className="absolute top-6 right-6 p-2 bg-black/50 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors z-40 disabled:opacity-0"
        >
            <X size={24} />
        </button>
        
        {/* Sidebar */}
        <div className="w-64 bg-[#111111] border-r border-white/5 p-6 flex flex-col gap-6 hidden md:flex shrink-0">
            <div><h2 className="text-xl font-bold mb-1">Make a board</h2></div>
            <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-yellow-500 font-bold text-sm bg-white/5 rounded-lg border border-white/5">
                    <Layout size={18} /> Start from scratch
                </button>
                {/* AI recipes removed */}
            </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            
            <h3 className="text-gray-500 font-bold text-sm uppercase mb-4 flex items-center gap-2">
                <Layout size={16} /> Boards
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {FORMAT_OPTIONS.map((format) => (
                    <button 
                        key={format.id}
                        onClick={() => handleSelectFormat(format.id as BoardFormat)}
                        className="bg-[#2a2a2a] p-4 rounded-xl border border-transparent hover:border-pink-500 hover:bg-[#333] transition-all text-left group flex flex-col gap-3 relative overflow-hidden h-40"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <format.icon size={80} />
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-pink-600/20 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform mb-auto">
                            <format.icon size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-1">{format.label}</h4>
                            <p className="text-xs text-gray-400 leading-snug line-clamp-2">{format.desc}</p>
                        </div>
                    </button>
                ))}
            </div>

        </div>
      </div>
    </div>
  );
};
