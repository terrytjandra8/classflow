
import React from 'react';
import { Board, BoardFormat, SectionGroup } from '../../../types';
import { IconPlus, IconClose } from '../../../Icons';

interface LayoutSectionProps {
    board: Board;
    onUpdate: (updates: Partial<Board>) => void;
}

export const LayoutSection: React.FC<LayoutSectionProps> = ({ board, onUpdate }) => {
    
    const currentLayout = board.format;

    const handleFormatChange = (f: BoardFormat) => {
        onUpdate({ format: f });
    };

    // Section Group Handlers
    const addSectionGroup = () => {
        const newGroup: SectionGroup = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'New Group',
            span: 2,
        };
        const updatedGroups = [...(board.sectionGroups || []), newGroup];
        onUpdate({ sectionGroups: updatedGroups });
    };

    const updateSectionGroup = (id: string, updates: Partial<SectionGroup>) => {
        const updatedGroups = (board.sectionGroups || []).map(g => 
            g.id === id ? { ...g, ...updates } : g
        );
        onUpdate({ sectionGroups: updatedGroups });
    };

    const deleteSectionGroup = (id: string) => {
        const updatedGroups = (board.sectionGroups || []).filter(g => g.id !== id);
        onUpdate({ sectionGroups: updatedGroups });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Layout</h3>
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 space-y-4">
                {/* Format */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-200">Format</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['wall', 'grid', 'columns', 'timeline'].map(f => (
                            <button
                                key={f}
                                onClick={() => handleFormatChange(f as BoardFormat)}
                                className={`p-2 rounded-lg border text-xs font-bold capitalize ${
                                    currentLayout === f ? 'bg-pink-600 border-pink-500 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section Groups - Only for Columns View */}
                {currentLayout === 'columns' && (
                    <div className="space-y-3 pt-2 border-t border-white/10">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-gray-200">Merged Column Titles</label>
                            <button onClick={addSectionGroup} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-bold">
                                <IconPlus size={14}/>
                                Add Group
                            </button>
                        </div>
                        <div className="space-y-2">
                            {(board.sectionGroups || []).map(group => (
                                <div key={group.id} className="flex items-center gap-2 bg-[#111] p-2 rounded-lg border border-white/10">
                                    <input 
                                        type="text"
                                        value={group.title}
                                        onChange={e => updateSectionGroup(group.id, { title: e.target.value })}
                                        className="flex-grow bg-transparent text-white text-sm outline-none"
                                        placeholder="Group Title"
                                    />
                                    <input 
                                        type="number"
                                        value={group.span}
                                        onChange={e => updateSectionGroup(group.id, { span: parseInt(e.target.value, 10) || 1 })}
                                        className="w-16 bg-black/50 text-white text-center rounded p-1 outline-none"
                                        min="1"
                                    />
                                    <button onClick={() => deleteSectionGroup(group.id)} className="text-red-500 hover:text-red-400">
                                        <IconClose size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
            </div>
        </div>
    );
};
