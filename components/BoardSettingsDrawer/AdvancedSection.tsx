
import React, { useState, useRef } from 'react';
import { Unlock, MessageSquare, Lock, Eye, Database, RefreshCw, CheckCircle, AlertTriangle, CalendarClock, Radio } from 'lucide-react';
import { Board } from '../../types';
import { boardService } from '../../services/boardService';

interface AdvancedSectionProps {
    board: Board;
    onUpdate: (updates: Partial<Board>) => void;
}

export const AdvancedSection: React.FC<AdvancedSectionProps> = ({ board, onUpdate }) => {
    const [isRepairing, setIsRepairing] = useState(false);
    const [repairStatus, setRepairStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [fixedCount, setFixedCount] = useState(0);

    const autoLiveInputRef = useRef<HTMLInputElement>(null);
    const autoLockInputRef = useRef<HTMLInputElement>(null);

    const handleRepair = async () => {
        if (!confirm("This will scan all notes and attempt to fix missing assessment data types. Continue?")) return;
        
        setIsRepairing(true);
        setRepairStatus('idle');
        try {
            const count = await boardService.repairAssessmentData(board.id);
            setFixedCount(count || 0);
            setRepairStatus('success');
        } catch (e) {
            console.error(e);
            setRepairStatus('error');
        } finally {
            setIsRepairing(false);
        }
    };

    // Helper to handle the local timezone shift for datetime-local input
    const getLocalISOString = (timestamp: number) => {
        const date = new Date(timestamp);
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Advanced</h3>
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 space-y-6">
                
                {board.format === 'quiz' && (
                    <div className="space-y-3 pb-6 border-b border-white/5">
                        <label className="text-sm font-bold text-gray-200">Game Settings</label>
                        <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg border border-white/5">
                            <div className="text-xs text-gray-300 flex items-center gap-2">
                                <Eye size={14} className="text-blue-400" /> Show Question on Devices
                            </div>
                            <button 
                                onClick={() => onUpdate({ showQuestionOnStudentDevice: !board.showQuestionOnStudentDevice })}
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${board.showQuestionOnStudentDevice ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${board.showQuestionOnStudentDevice ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 px-1">
                            When enabled, students can see the full question text on their screens.
                        </p>
                    </div>
                )}

                {/* Custom Slug */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-200">Custom URL Slug</label>
                    <div className="flex bg-[#111] border border-white/10 rounded-lg overflow-hidden">
                        <span className="px-3 py-2 text-xs text-gray-500 bg-white/5 flex items-center">classboard.ai/</span>
                        <input 
                            type="text" 
                            value={board.customSlug || board.id}
                            onChange={(e) => onUpdate({ customSlug: e.target.value })}
                            className="flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none"
                        />
                    </div>
                </div>

                {/* Auto Live Timer */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                        <Radio size={16} className="text-green-500"/> Schedule Auto-Live
                    </label>
                    <div className="flex gap-2 items-center">
                        <input 
                            ref={autoLiveInputRef}
                            onClick={() => autoLiveInputRef.current?.showPicker()}
                            type="datetime-local"
                            value={board.autoLiveTime ? getLocalISOString(board.autoLiveTime) : ''}
                            onChange={(e) => onUpdate({ autoLiveTime: e.target.value ? new Date(e.target.value).getTime() : null })}
                            className="flex-1 bg-[#111] border border-white/10 rounded-lg p-2 text-white outline-none text-xs font-mono cursor-pointer"
                        />
                        {board.autoLiveTime && (
                            <button 
                                onClick={() => onUpdate({ autoLiveTime: null })} 
                                className="text-xs text-red-400 hover:text-white px-3 py-2 bg-red-900/20 hover:bg-red-900/40 rounded-lg transition-colors border border-red-500/20"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                        Board will automatically switch from <strong>Draft</strong> to <strong>Live</strong> at this time.
                    </p>
                </div>

                {/* Auto Lock Timer */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                        <CalendarClock size={16} className="text-red-500"/> Schedule Auto-Lock
                    </label>
                    <div className="flex gap-2 items-center">
                        <input 
                            ref={autoLockInputRef}
                            onClick={() => autoLockInputRef.current?.showPicker()}
                            type="datetime-local"
                            value={board.autoLockTime ? getLocalISOString(board.autoLockTime) : ''}
                            onChange={(e) => onUpdate({ autoLockTime: e.target.value ? new Date(e.target.value).getTime() : null })}
                            className="flex-1 bg-[#111] border border-white/10 rounded-lg p-2 text-white outline-none text-xs font-mono cursor-pointer"
                        />
                        {board.autoLockTime && (
                            <button 
                                onClick={() => onUpdate({ autoLockTime: null })} 
                                className="text-xs text-red-400 hover:text-white px-3 py-2 bg-red-900/20 hover:bg-red-900/40 rounded-lg transition-colors border border-red-500/20"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                        Board will automatically switch to <strong>Read Only</strong> at this time.
                    </p>
                </div>

                {/* Lock State */}
                <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-200">Board Status</label>
                     <div className="grid grid-cols-1 gap-2">
                         <button 
                            onClick={() => onUpdate({ lockMode: 'unlocked' })}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${board.lockMode !== 'comments_only' && board.lockMode !== 'readonly' ? 'bg-green-500/10 border-green-500 text-green-400' : 'border-white/10 hover:bg-white/5'}`}
                         >
                             <div className="p-2 bg-white/10 rounded-full"><Unlock size={16}/></div>
                             <div>
                                 <div className="text-sm font-bold">Unlocked</div>
                                 <div className="text-[10px] opacity-70">Students can post and comment</div>
                             </div>
                         </button>
                         <button 
                            onClick={() => onUpdate({ lockMode: 'comments_only' })}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${board.lockMode === 'comments_only' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400' : 'border-white/10 hover:bg-white/5'}`}
                         >
                             <div className="p-2 bg-white/10 rounded-full"><MessageSquare size={16}/></div>
                             <div>
                                 <div className="text-sm font-bold">Comments Only</div>
                                 <div className="text-[10px] opacity-70">Students can only comment on existing posts</div>
                             </div>
                         </button>
                         <button 
                            onClick={() => onUpdate({ lockMode: 'readonly' })}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${board.lockMode === 'readonly' ? 'bg-red-500/10 border-red-500 text-red-400' : 'border-white/10 hover:bg-white/5'}`}
                         >
                             <div className="p-2 bg-white/10 rounded-full"><Lock size={16}/></div>
                             <div>
                                 <div className="text-sm font-bold">Read Only</div>
                                 <div className="text-[10px] opacity-70">No interactions allowed</div>
                             </div>
                         </button>
                     </div>
                </div>

                {/* REPAIR SECTION */}
                <div className="pt-6 border-t border-white/5">
                    <label className="text-sm font-bold text-gray-200 flex items-center gap-2 mb-3">
                        <Database size={16} className="text-blue-400"/> Data Management
                    </label>
                    
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                        <p className="text-xs text-gray-400 mb-3">
                            If old assessments are not showing as "Submitted", try repairing legacy data types.
                        </p>
                        <button 
                            onClick={handleRepair}
                            disabled={isRepairing}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isRepairing ? <RefreshCw size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                            {isRepairing ? 'Scanning...' : 'Repair Legacy Data'}
                        </button>
                        
                        {repairStatus === 'success' && (
                            <div className="mt-3 flex items-center gap-2 text-green-400 text-xs font-bold animate-in fade-in">
                                <CheckCircle size={14} /> Fixed {fixedCount} records. Please refresh page.
                            </div>
                        )}
                        {repairStatus === 'error' && (
                            <div className="mt-3 flex items-center gap-2 text-red-400 text-xs font-bold animate-in fade-in">
                                <AlertTriangle size={14} /> Repair failed. Check console.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
