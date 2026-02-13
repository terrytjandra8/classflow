
import React, { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { Board } from '../../types';
import { ICONS } from './constants';
import { DebouncedInput } from '../ui/DebouncedInput';

interface HeadingSectionProps {
    board: Board;
    onUpdate: (updates: Partial<Board>) => void;
}

export const HeadingSection: React.FC<HeadingSectionProps> = ({ board, onUpdate }) => {
    const [showIconPicker, setShowIconPicker] = useState(false);

    return (
        <div className="space-y-4">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Heading</h3>
            
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-200">Title</label>
                    <DebouncedInput 
                        type="text" 
                        value={board.title}
                        onChange={(val) => onUpdate({ title: val })}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-3 md:py-2 text-base md:text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                        placeholder="Board Title"
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-200">Description</label>
                    <DebouncedInput 
                        type="text" 
                        value={board.description || ''}
                        onChange={(val) => onUpdate({ description: val })}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-3 md:py-2 text-base md:text-sm text-gray-300 focus:outline-none focus:border-yellow-500 transition-colors"
                        placeholder="Add a description..."
                    />
                </div>

                <div className="relative">
                    <div 
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className="flex items-center justify-between pt-2 border-t border-white/5 cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors"
                    >
                        <span className="text-sm font-bold text-gray-200">Icon</span>
                        <div className="flex items-center gap-2 text-gray-400 font-emoji">
                            <span>{board.icon || 'None'}</span>
                            <ChevronRight size={16} className={`transition-transform ${showIconPicker ? 'rotate-90' : ''}`} />
                        </div>
                    </div>
                    {showIconPicker && (
                        <div className="absolute top-full right-0 mt-2 bg-[#222] border border-white/10 rounded-xl shadow-2xl p-3 z-50 w-72 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                <button 
                                    onClick={() => { onUpdate({ icon: undefined }); setShowIconPicker(false); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 text-xs border border-white/5"
                                    title="No Icon"
                                >
                                    <X size={14}/>
                                </button>
                                {ICONS.map(icon => (
                                    <button 
                                        key={icon} 
                                        onClick={() => { onUpdate({ icon }); setShowIconPicker(false); }}
                                        className="w-8 h-8 flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-colors font-emoji"
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
