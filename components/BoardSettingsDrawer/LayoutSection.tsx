
import React from 'react';
import { Board, BoardFormat } from '../../types';

interface LayoutSectionProps {
    board: Board;
    onUpdate: (updates: Partial<Board>) => void;
}

export const LayoutSection: React.FC<LayoutSectionProps> = ({ board, onUpdate }) => {
    
    const currentLayout = board.format;

    const handleFormatChange = (f: BoardFormat) => {
        onUpdate({ format: f });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Layout</h3>
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 space-y-4">
                {/* Format */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-200">
                        Format
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {['wall', 'grid', 'canvas', 'stream', 'columns', 'timeline'].map(f => (
                            <button
                                key={f}
                                onClick={() => handleFormatChange(f as BoardFormat)}
                                className={`p-2 rounded-lg border text-xs font-bold capitalize ${currentLayout === f ? 'bg-pink-600 border-pink-500 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Sort Order */}
                <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-200">Sort by</label>
                     <select
                        value={board.sortOrder || 'manual'}
                        onChange={(e) => onUpdate({ sortOrder: e.target.value as any })}
                        className="w-full bg-[#111] border border-white/10 rounded-lg p-2 text-sm text-white outline-none"
                     >
                         <option value="manual">Drag and Drop (Manual)</option>
                         <option value="date_desc">Newest First</option>
                         <option value="date_asc">Oldest First</option>
                         <option value="likes">Most Liked</option>
                     </select>
                </div>
                {/* New Post Position */}
                <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-200">New post position</label>
                     <div className="flex gap-2">
                         <button onClick={() => onUpdate({ newPostPosition: 'first' })} className={`flex-1 p-2 rounded-lg border text-xs font-bold ${board.newPostPosition === 'first' ? 'bg-pink-600 border-pink-500 text-white' : 'border-white/10 text-gray-400'}`}>First</button>
                         <button onClick={() => onUpdate({ newPostPosition: 'last' })} className={`flex-1 p-2 rounded-lg border text-xs font-bold ${board.newPostPosition === 'last' ? 'bg-pink-600 border-pink-500 text-white' : 'border-white/10 text-gray-400'}`}>Last</button>
                     </div>
                </div>
            </div>
        </div>
    );
};
