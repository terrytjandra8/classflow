
import React, { useState, useRef, useEffect } from 'react';
import { Board, QuizQuestion } from '../../../types';
import { ArrowLeft, Share2, Settings, Play, Plus, Edit2, Trash2, Music, Pause, Volume2, Gamepad2, Layout, Sparkles, CheckCircle2, MonitorPlay, Save, X, Check, GripHorizontal, Move, Zap, Trophy, MinusCircle, Flame, Target } from 'lucide-react';
import { QuizEditor } from '../QuizEditor';
import { MUSIC_TRACKS } from '../../../hooks/useQuizAudio';

interface QuizSetupProps {
    board: Board;
    questions: QuizQuestion[];
    onUpdateBoard: (updates: Partial<Board>) => void;
    onBack?: () => void;
    onOpenSettings?: () => void;
    onOpenShare?: () => void;
    enterLobby: () => void;
    backgroundStyle: any;
    isPresentationMode?: boolean;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({ 
    board, questions, onUpdateBoard, onBack, onOpenSettings, onOpenShare, enterLobby, backgroundStyle, isPresentationMode 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [quickEditId, setQuickEditId] = useState<string | null>(null);
    const [quickEditData, setQuickEditData] = useState<QuizQuestion | null>(null);

    // LOCAL question state for instant reordering (same pattern as QuizEditor)
    const [localQuestions, setLocalQuestions] = useState<QuizQuestion[]>(questions);

    // Sync from parent when questions prop changes (e.g. from Visual Editor save)
    useEffect(() => {
        setLocalQuestions(questions);
    }, [questions]);

    // Persist local changes to parent/DB
    const persistQuestions = (newQs: QuizQuestion[]) => {
        setLocalQuestions(newQs); // Instant local update
        onUpdateBoard({ quizQuestions: newQs }); // Async DB persist
    };

    // Drag and Drop State
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const draggedIndexRef = useRef<number | null>(null);

    const boardState = board.settings?.state || 'setup';
    const stateLabels: Record<string, string> = {
        'setup': 'Setup Mode', 'lobby': 'Lobby Active', 'question': 'Live Question', 'results': 'Results', 'leaderboard': 'Leaderboard', 'final_leaderboard': 'Finished'
    };

    const getStateColor = (state: string) => {
        switch(state) {
            case 'setup': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'lobby': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    const startQuickEdit = (q: QuizQuestion) => {
        setQuickEditId(q.id);
        setQuickEditData({ ...q, pointsType: q.pointsType || 'standard' });
    };

    const saveQuickEdit = () => {
        if (!quickEditData) return;
        const newQs = localQuestions.map(q => q.id === quickEditId ? quickEditData : q);
        persistQuestions(newQs);
        setQuickEditId(null);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        draggedIndexRef.current = index;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
        // Ghost effect for better visual feedback
        const target = e.currentTarget as HTMLElement;
        setTimeout(() => { target.style.opacity = '0.4'; }, 0);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        if (e.currentTarget) (e.currentTarget as HTMLElement).style.opacity = '1';
        setDraggedIndex(null);
        setDragOverIndex(null);
        draggedIndexRef.current = null;
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        
        // Use Ref as primary source of truth for the dragged item during drop
        const sourceIndex = draggedIndexRef.current;

        if (sourceIndex === null || sourceIndex === dropIndex) {
            handleDragEnd(e);
            return;
        }

        const newQs = [...localQuestions];
        const itemToMove = newQs[sourceIndex];
        newQs.splice(sourceIndex, 1);
        newQs.splice(dropIndex, 0, itemToMove);
        
        persistQuestions(newQs);
        handleDragEnd(e);
    };

    // Compute visual shift for animation
    const getGridShift = (idx: number) => {
        if (draggedIndex === null || dragOverIndex === null) return {};
        if (idx === draggedIndex) return { opacity: 0.15, transform: 'scale(0.85)' };

        // Items between dragged and target should visually shift
        if (draggedIndex < dragOverIndex) {
            if (idx > draggedIndex && idx <= dragOverIndex) {
                return { transform: 'translateX(-24px)' };
            }
        } else {
            if (idx >= dragOverIndex && idx < draggedIndex) {
                return { transform: 'translateX(24px)' };
            }
        }
        return {};
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a] text-white relative overflow-hidden font-sans">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10"></div>

            {!isPresentationMode && !isEditing && (
                <header className="h-20 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl border-b border-white/5 relative z-50">
                    <div className="flex items-center gap-6">
                        {onBack && <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl transition-all border border-white/5"><ArrowLeft size={20} /></button>}
                        <div>
                            <div className="flex items-center gap-3 mb-0.5"><h1 className="font-black text-2xl tracking-tight">{board.title}</h1><span className={`${getStateColor(boardState)} px-2.5 py-1 rounded-lg text-[9px] uppercase font-black border animate-pulse`}>{stateLabels[boardState] || boardState}</span></div>
                            <div className="flex items-center gap-3 text-gray-500 text-xs font-bold"><span className="flex items-center gap-1"><Layout size={12} /> {localQuestions.length} Slides</span><span className="flex items-center gap-1 text-green-500/80"><CheckCircle2 size={12} /> Ready</span></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onOpenSettings} className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all"><Settings size={20} /></button>
                        <button onClick={enterLobby} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-[0_10px_30px_rgba(168,85,247,0.3)] flex items-center gap-3 hover:scale-105 transition-all tracking-widest border border-white/10"><MonitorPlay size={18} fill="currentColor" /> Host Live</button>
                    </div>
                </header>
            )}

            <div className="flex-1 flex overflow-hidden relative z-10">
                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-10">
                        {!isEditing && (
                            <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl backdrop-blur-sm animate-in slide-in-from-top-4">
                                <h2 className="text-3xl font-black mb-2 tracking-tight">Visual Quiz Editor</h2>
                                <p className="text-gray-400 max-w-md font-medium text-lg leading-relaxed mb-8">Craft beautiful, interactive questions in full-screen dark mode.</p>
                                <button onClick={() => setIsEditing(true)} className="bg-white text-black px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-gray-100 transition-all flex items-center gap-2"><Edit2 size={18} /> Open Visual Editor</button>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div><h2 className="text-2xl font-black tracking-tight mb-1">Curated Questions</h2><p className="text-gray-500 text-sm font-medium">Drag to reorder. Double-click to quick edit.</p></div>
                                <button onClick={() => {
                                    const newQ: QuizQuestion = { id: Math.random().toString(36).substr(2, 9), question: "", options: ["", "", "", ""], correctIndex: 0, timeLimit: 20, pointsType: 'standard' };
                                    persistQuestions([...localQuestions, newQ]);
                                    startQuickEdit(newQ);
                                }} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold flex items-center gap-2 active:scale-95 transition-all"><Plus size={18} /> Add Slide</button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
                                {localQuestions.map((q, idx) => {
                                    if (quickEditId === q.id && quickEditData) {
                                        return (
                                            <div key={q.id} className="bg-[#1a1a1a] border-2 border-purple-500 p-6 rounded-[2.5rem] shadow-2xl space-y-4 animate-in zoom-in-95 z-50">
                                                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Quick Editing</span><div className="flex gap-2"><button onClick={() => setQuickEditId(null)} className="p-2 hover:bg-white/5 rounded-xl text-gray-500"><X size={16}/></button><button onClick={saveQuickEdit} className="p-2 bg-green-600 rounded-xl text-white shadow-lg"><Check size={16}/></button></div></div>
                                                <textarea autoFocus className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-purple-500 min-h-[100px] resize-none" value={quickEditData.question} onChange={e => setQuickEditData({ ...quickEditData, question: e.target.value })} />
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { id: 'standard', icon: Trophy }, { id: 'double', icon: Zap }, { id: 'streak_boost', icon: Flame }, { id: 'competitive', icon: Target }, { id: 'none', icon: MinusCircle }
                                                    ].map(p => (
                                                        <button key={p.id} onClick={() => setQuickEditData({ ...quickEditData, pointsType: p.id as any })} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${quickEditData.pointsType === p.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/5'}`}>
                                                            <p.icon size={12} className={quickEditData.pointsType === p.id ? 'text-purple-400' : 'text-gray-600'} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {quickEditData.options.map((opt, i) => (
                                                        <div key={i} className={`relative flex items-center p-1 rounded-xl border ${quickEditData.correctIndex === i ? 'bg-green-500/10 border-green-500/50' : 'bg-black/20 border-white/5'}`}>
                                                            <input className="w-full bg-transparent p-2 text-[10px] font-bold text-white outline-none" value={opt} onChange={e => { const n = [...quickEditData.options]; n[i] = e.target.value; setQuickEditData({ ...quickEditData, options: n }); }} />
                                                            <button onClick={() => setQuickEditData({ ...quickEditData, correctIndex: i })} className={`p-1 rounded-md ${quickEditData.correctIndex === i ? 'text-green-500' : 'text-gray-700'}`}><CheckCircle2 size={12} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={saveQuickEdit} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-xs shadow-xl transition-all">Update Slide</button>
                                            </div>
                                        );
                                    }

                                    const shiftStyle = getGridShift(idx);

                                    return (
                                        <div
                                            key={q.id}
                                            onDragOver={(e) => handleDragOver(e, idx)}
                                            onDrop={(e) => handleDrop(e, idx)}
                                            className="relative h-full w-full"
                                        >
                                            <div 
                                                draggable={!quickEditId}
                                                onDragStart={(e) => handleDragStart(e, idx)}
                                                onDragEnd={handleDragEnd}
                                                onDoubleClick={(e) => { e.stopPropagation(); startQuickEdit(q); }}
                                                style={{ 
                                                    ...shiftStyle,
                                                    transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease'
                                                }}
                                                className={`bg-[#1a1a1a] border-2 rounded-[2.5rem] flex flex-col gap-4 group cursor-grab active:cursor-grabbing relative overflow-hidden shadow-2xl h-full w-full ${dragOverIndex === idx && draggedIndex !== idx ? 'border-purple-500 ring-4 ring-purple-500/10 z-20' : 'border-white/5 hover:border-purple-500/30'}`}
                                            >
                                            <div className="p-6 pb-0 flex justify-between items-center relative z-10">
                                                <div className="w-10 h-10 bg-black/40 rounded-2xl flex items-center justify-center font-black text-gray-500 text-sm border border-white/5">{idx + 1}</div>
                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                    {q.pointsType === 'streak_boost' && <Flame size={14} className="text-orange-500" />}
                                                    {q.pointsType === 'double' && <Zap size={14} className="text-yellow-500" />}
                                                    {q.pointsType === 'competitive' && <Target size={14} className="text-blue-500" />}
                                                    <button onClick={(e) => { e.stopPropagation(); startQuickEdit(q); }} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-blue-400 border border-white/5"><Edit2 size={14}/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); persistQuestions(localQuestions.filter(item => item.id !== q.id)); }} className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-xl text-red-400 border border-white/5"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                            <div className="px-6 flex-1 relative z-10">
                                                <h4 className="font-bold text-sm text-gray-200 line-clamp-3 leading-relaxed mb-6 h-12">{q.question || "Untitled Question"}</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {q.options.map((opt, i) => <div key={i} className={`h-2 rounded-full ${q.correctIndex === i ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-white/5'}`}></div>)}
                                                </div>
                                            </div>
                                            <div className="p-6 pt-4 mt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest bg-black/20">
                                                <span>{q.timeLimit}s</span>
                                                <span className="flex items-center gap-1 uppercase">{q.pointsType || 'Standard'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                {isEditing && <QuizEditor questions={localQuestions} onUpdateBoard={onUpdateBoard} onClose={() => setIsEditing(false)} />}
            </div>
        </div>
    );
};
