
import React from 'react';
import { Users, ChevronDown, Plus, EyeOff } from 'lucide-react';
import { useHeaderLogic } from './useHeaderLogic';

export const HeaderBadges: React.FC = () => {
    const { 
        board, canManageBoard, updateBoard, classList, 
        isClassMenuOpen, setIsClassMenuOpen, handleCreateClass, isLive 
    } = useHeaderLogic();

    return (
        <div className="flex items-center gap-2 shrink-0 mt-1.5 pointer-events-auto relative z-[200]">
            {/* Custom Class Group Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => canManageBoard && setIsClassMenuOpen(!isClassMenuOpen)}
                    disabled={!canManageBoard}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border max-w-[200px] ${
                        canManageBoard 
                        ? 'bg-blue-500/20 border-blue-400/30 text-blue-100 hover:bg-blue-500/30 cursor-pointer' 
                        : 'bg-gray-800/50 border-white/10 text-gray-400 cursor-default'
                    }`}
                >
                    <Users size={10} className="shrink-0" /> 
                    <span className="truncate">{board.targetGrade || 'General'}</span>
                    {canManageBoard && <ChevronDown size={10} className={`transition-transform shrink-0 ${isClassMenuOpen ? 'rotate-180' : ''}`} />}
                </button>

                {isClassMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsClassMenuOpen(false)}></div>
                        <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 flex flex-col">
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {classList && classList.length > 0 ? (
                                    classList.map(cls => (
                                        <button
                                            key={cls}
                                            onClick={() => {
                                                updateBoard({ targetGrade: cls });
                                                setIsClassMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors truncate ${board.targetGrade === cls ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-gray-300'}`}
                                            title={cls}
                                        >
                                            {cls}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-xs text-gray-500 italic">No classes available</div>
                                )}
                            </div>
                            <div className="border-t border-white/10 mt-1 pt-1">
                                <button 
                                    onClick={handleCreateClass}
                                    className="w-full text-left px-3 py-2 text-xs font-bold text-green-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={12} /> New Class Group
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Live Status Toggle */}
            {canManageBoard && (
                <button 
                    onClick={() => updateBoard({ isPublished: !isLive })}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                        isLive 
                        ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30' 
                        : 'bg-gray-800/50 border-white/10 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                >
                    {isLive ? (
                        <>
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                            </span>
                            Live
                        </>
                    ) : (
                        <>
                            <EyeOff size={10} /> Draft
                        </>
                    )}
                </button>
            )}
        </div>
    );
};
