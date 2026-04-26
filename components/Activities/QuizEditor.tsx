
import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, Board } from '../../types';
import { 
    Plus, Trash2, Image as ImageIcon, Clock, Star, Type, CheckCircle2, 
    ChevronRight, ChevronLeft, Layout, Trash, Save, X, Layers, Settings2, 
    Trash2 as TrashIcon, ArrowLeft, Eye, EyeOff, Search, Film, Loader2, 
    Upload, GripVertical, Zap, Trophy, MinusCircle, Flame, Target 
} from 'lucide-react';
import { useSortableList } from './logic/useSortableList';

interface QuizEditorProps {
    questions: QuizQuestion[];
    onUpdateBoard: (updates: Partial<Board>) => void;
    onClose?: () => void;
}

const GIPHY_API_KEY = 'RKmBxWsi0EgRtMrBK79HE4hVXpeuTytn';
const SHAPES = ['▲', '◆', '●', '■'];
const COLORS = ['bg-[#e21b3c]', 'bg-[#1368ce]', 'bg-[#d89e00]', 'bg-[#26890c]'];

// --- Sub-Component: Question Card ---
interface QuestionCardProps {
    q: QuizQuestion;
    idx: number;
    activeIndex: number;
    draggedIndex: number | null;
    dragOverIndex: number | null;
    offset: { x: number, y: number };
    onSelect: (idx: number) => void;
    onDelete: (idx: number) => void;
    onDragStart: (e: React.DragEvent, idx: number) => void;
    onDragOver: (e: React.DragEvent, idx: number) => void;
    onDragEnter: (e: React.DragEvent, idx: number) => void;
    onDragEnd: () => void;
    onTouchStart: (idx: number) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
    q, idx, activeIndex, draggedIndex, dragOverIndex, offset, onSelect, onDelete, 
    onDragStart, onDragOver, onDragEnter, onDragEnd, onTouchStart, onTouchMove, onTouchEnd 
}) => {
    const isActive = activeIndex === idx;
    const isDragging = draggedIndex === idx;

    return (
        <div 
            className={`relative shrink-0 lg:shrink transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] ${isDragging ? 'opacity-60 z-30' : 'z-10'} touch-none`}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
            draggable="true"
            data-index={idx}
            onDragStart={(e) => onDragStart(e, idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDragEnter={(e) => onDragEnter(e, idx)}
            onDragEnd={onDragEnd}
            onTouchStart={() => onTouchStart(idx)}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div 
                onClick={() => onSelect(idx)} 
                className={`
                    relative group cursor-pointer p-0.5 rounded-xl lg:rounded-2xl transition-all duration-300
                    ${isActive ? 'z-10' : 'opacity-70 hover:opacity-100'} 
                `}
            >
                <div className={`bg-[#222] border-2 rounded-xl lg:rounded-2xl p-2 lg:p-3 h-24 lg:h-24 w-40 lg:w-full flex flex-col gap-1 lg:gap-1.5 overflow-hidden transition-all duration-300 ${isActive ? 'border-purple-500 ring-4 ring-purple-500/10' : 'border-white/5'} select-none`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            <GripVertical size={10} className="text-gray-600" />
                            <span className="text-[10px] lg:text-[10px] font-black text-gray-600">{idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {q.pointsType !== 'standard' && <Zap size={8} className="text-yellow-500" />}
                            <span className="text-[9px] lg:text-[8px] font-black text-gray-600 px-1 py-0.5 bg-black/30 rounded">{q.timeLimit}s</span>
                        </div>
                    </div>
                    <div className="text-[11px] lg:text-[10px] font-bold text-gray-300 line-clamp-2 leading-tight pointer-events-none" dangerouslySetInnerHTML={{ __html: q.question || "Untitled" }} />
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDelete(idx); }} className="absolute -right-1 -top-1 w-5 h-5 lg:w-6 lg:h-6 bg-red-600 border-2 border-[#161616] rounded-lg text-white shadow-xl flex items-center justify-center z-20 hover:scale-110 active:scale-90 transition-transform opacity-0 group-hover:opacity-100"><X size={10} /></button>
            </div>
        </div>
    );
};

export const QuizEditor: React.FC<QuizEditorProps> = ({ questions, onUpdateBoard, onClose }) => {
    const [localQuestions, setLocalQuestions] = useState<QuizQuestion[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [showGiphy, setShowGiphy] = useState(false);
    const [giphySearch, setGiphySearch] = useState('');
    const [giphyResults, setGiphyResults] = useState<any[]>([]);
    const [isSearchingGiphy, setIsSearchingGiphy] = useState(false);
    const [customTime, setCustomTime] = useState('');
    const [showCustomTime, setShowCustomTime] = useState(false);
    const [showConfig, setShowConfig] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Sync
    useEffect(() => {
        if (questions && questions.length > 0) {
            setLocalQuestions(JSON.parse(JSON.stringify(questions)));
        } else {
            addQuestion();
        }
    }, []);

    // Reusable Sortable Logic Hook
    const { 
        draggedIndex, 
        dragOverIndex, 
        onDragStart, 
        onDragOver, 
        onDragEnter,
        handleDragEnd, 
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        getOffset 
    } = useSortableList({
        items: localQuestions,
        onReorder: (newItems, newIndex) => {
            setLocalQuestions(newItems);
            setActiveIndex(newIndex);
        }
    });

    const updateCurrentQ = (updates: Partial<QuizQuestion>) => {
        const newQs = [...localQuestions];
        if (newQs[activeIndex]) {
            newQs[activeIndex] = { ...newQs[activeIndex], ...updates };
            setLocalQuestions(newQs);
        }
    };

    const addQuestion = () => {
        const newQ: QuizQuestion = {
            id: Math.random().toString(36).substr(2, 9),
            question: "",
            options: ["", "", "", ""],
            correctIndex: 0,
            timeLimit: 20,
            pointsType: 'standard'
        };
        setLocalQuestions(prev => [...prev, newQ]);
        setActiveIndex(localQuestions.length);
    };

    const deleteQuestion = (index: number) => {
        if (localQuestions.length <= 1) return;
        const newQuestions = localQuestions.filter((_, i) => i !== index);
        setLocalQuestions(newQuestions);
        setActiveIndex(prev => Math.min(prev, newQuestions.length - 1));
    };

    const handleSaveAndClose = () => {
        onUpdateBoard({ quizQuestions: localQuestions });
        if (onClose) onClose();
    };

    const searchGiphy = async () => {
        if (!giphySearch.trim()) return;
        setIsSearchingGiphy(true);
        try {
            const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(giphySearch)}&limit=20&rating=g`);
            const data = await response.json();
            setGiphyResults(data.data || []);
        } catch (error) { console.error(error); } finally { setIsSearchingGiphy(false); }
    };

    const currentQ = localQuestions[activeIndex];

    useEffect(() => {
        if (showConfig && typeof window !== 'undefined' && window.innerWidth < 1024) {
            setTimeout(() => {
                const section = document.getElementById('mobile-config-section');
                section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [showConfig]);

    return (
        <div className="fixed inset-0 z-[200] bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => updateCurrentQ({ mediaUrl: reader.result as string });
                    reader.readAsDataURL(file);
                }
            }} />
            
            {/* Header */}
            <header className="h-16 bg-[#161616] border-b border-white/5 flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-[210] shadow-2xl">
                <div className="flex items-center gap-2 lg:gap-4">
                    <button onClick={handleSaveAndClose} className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
                    <div className="hidden lg:block h-6 w-px bg-white/10 mx-2"></div>
                    <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-8 lg:w-10 h-8 lg:h-10 bg-purple-600 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg"><Layout size={18} /></div>
                        <div>
                            <h1 className="font-black text-xs lg:text-sm tracking-tight">Quiz Editor</h1>
                            <p className="text-[8px] lg:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Slide {activeIndex + 1}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all border ${isPreviewMode ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/5'}`}>
                        {isPreviewMode ? <EyeOff size={14} /> : <Eye size={14} />} <span>{isPreviewMode ? "Exit" : "Preview"}</span>
                    </button>
                    <button onClick={handleSaveAndClose} className="px-5 lg:px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl font-black text-xs lg:text-sm transition-all shadow-lg">Done</button>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-16 lg:pb-0 relative">
                {/* Left Sidebar - Top on Mobile, Left on Desktop */}
                <aside 
                    onDragOver={(e) => onDragOver(e)}
                    className="h-32 lg:h-auto lg:w-72 bg-[#161616] border-b lg:border-b-0 lg:border-r border-white/5 flex lg:flex-col shrink-0 overflow-x-auto lg:overflow-y-auto custom-scrollbar p-3 lg:p-4 gap-3 relative no-scrollbar"
                >
                    <div className="hidden lg:block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 px-2">Questions List</div>
                    {localQuestions.map((q, idx) => (
                        <QuestionCard 
                            key={q.id}
                            q={q}
                            idx={idx}
                            activeIndex={activeIndex}
                            draggedIndex={draggedIndex}
                            dragOverIndex={dragOverIndex}
                            offset={getOffset(idx, 172, 112)}
                            onSelect={(i) => { setActiveIndex(i); setIsPreviewMode(false); }}
                            onDelete={deleteQuestion}
                            onDragStart={onDragStart}
                            onDragOver={onDragOver}
                            onDragEnter={onDragEnter}
                            onDragEnd={handleDragEnd}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        />
                    ))}
                    <button onClick={addQuestion} className="h-24 lg:h-auto min-w-[3.5rem] lg:w-full lg:py-4 bg-white/5 border-2 border-dashed border-white/10 rounded-xl lg:rounded-2xl text-gray-500 hover:text-purple-400 flex items-center justify-center shrink-0 gap-2 font-black text-[10px] uppercase transition-all"><Plus size={16} /></button>
                </aside>

                {/* Main Workspace */}
                <main className="flex-1 bg-[#0a0a0a] overflow-y-auto p-4 lg:p-8 flex flex-col items-center custom-scrollbar relative">
                    <div className="w-full max-w-4xl flex flex-col gap-6 lg:animate-in lg:slide-in-from-bottom-5">
                        {isPreviewMode ? (
                            <div className="space-y-6">
                                <div className="bg-white text-gray-900 rounded-[2rem] p-8 text-center shadow-2xl border-b-8 border-gray-200">
                                    <h2 className="text-2xl md:text-4xl font-black leading-tight break-words" dangerouslySetInnerHTML={{ __html: currentQ?.question || "Question Text..." }} />
                                </div>
                                <div className="aspect-video max-h-[350px] w-full bg-white rounded-[2rem] border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden relative">
                                    {currentQ?.mediaUrl ? <img src={currentQ.mediaUrl} className="w-full h-full object-contain" alt="Preview" /> : <div className="text-gray-100 font-black text-6xl uppercase tracking-widest">QUIZ</div>}
                                </div>
                                <div className="grid grid-cols-2 gap-4 pb-8">
                                    {currentQ?.options.map((opt, i) => (
                                        <div key={i} className={`min-h-[80px] h-auto py-5 ${COLORS[i]} rounded-2xl flex items-center gap-5 px-8 shadow-[0_6px_0_rgba(0,0,0,0.2)]`}>
                                            <span className="text-2xl text-white/50 font-black shrink-0">{SHAPES[i]}</span>
                                            <span className="text-lg font-black text-white break-words" dangerouslySetInnerHTML={{ __html: opt || `Answer ${i+1}` }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Question Field */}
                                <div className="relative group mx-auto w-full max-w-3xl">
                                    {/* RTF Toolbar */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1a1a1a] border border-white/10 p-1 rounded-xl opacity-0 group-focus-within:opacity-100 transition-all shadow-2xl z-20">
                                        {[
                                            { cmd: 'bold', icon: <span className="font-black">B</span> },
                                            { cmd: 'italic', icon: <span className="italic font-serif">I</span> },
                                            { cmd: 'underline', icon: <span className="underline">U</span> },
                                        ].map(tool => (
                                            <button key={tool.cmd} onMouseDown={(e) => { e.preventDefault(); document.execCommand(tool.cmd, false); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all text-[10px]">{tool.icon}</button>
                                        ))}
                                    </div>
                                    <div className="bg-[#161616] rounded-xl lg:rounded-[3rem] shadow-2xl border border-white/5 p-4 lg:p-12 text-center transition-all">
                                        <div 
                                            contentEditable
                                            onBlur={(e) => updateCurrentQ({ question: e.currentTarget.innerHTML })}
                                            dangerouslySetInnerHTML={{ __html: currentQ?.question || "" }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); } }}
                                            className="w-full bg-transparent text-lg lg:text-4xl font-black text-center text-white outline-none leading-tight min-h-[1.2em]"
                                        />
                                        {!currentQ?.question && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/10 text-lg lg:text-4xl font-black italic">Type your question here...</div>}
                                    </div>
                                </div>

                                {/* Media Field */}
                                <div className="max-w-md mx-auto w-full">
                                    <div className="aspect-video w-full bg-[#161616] rounded-xl lg:rounded-3xl shadow-xl border border-white/5 flex flex-col items-center justify-center gap-3 group transition-all relative overflow-hidden">
                                        {currentQ?.mediaUrl ? (
                                            <div className="relative w-full h-full p-2">
                                                <img src={currentQ.mediaUrl} className="w-full h-full object-contain rounded-lg" alt="Media" />
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-blue-600/90 hover:bg-blue-500 rounded-lg text-white shadow-lg backdrop-blur-sm"><Upload size={12}/></button>
                                                    <button onClick={() => updateCurrentQ({ mediaUrl: undefined })} className="p-2 bg-red-600/90 hover:bg-red-500 rounded-lg text-white shadow-lg backdrop-blur-sm"><Trash2 size={12}/></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-4">
                                                <button onClick={() => setShowGiphy(true)} className="w-14 h-14 lg:w-20 lg:h-20 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-purple-400 transition-all group/btn">
                                                    <Film size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                    <span className="text-[7px] font-black mt-1 uppercase tracking-widest">Giphy</span>
                                                </button>
                                                <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 lg:w-20 lg:h-20 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-blue-400 transition-all group/btn">
                                                    <Upload size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                    <span className="text-[7px] font-black mt-1 uppercase tracking-widest">Upload</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Answers Grid */}
                                <div className="grid grid-cols-2 gap-2 lg:gap-4 max-w-4xl mx-auto w-full pb-20">
                                    {currentQ?.options.map((opt, i) => {
                                        const isCorrect = currentQ.correctIndex === i;
                                        return (
                                            <div key={i} className={`group relative flex items-center gap-2 lg:gap-3 p-2 lg:p-4 rounded-xl lg:rounded-2xl transition-all border min-h-[56px] ${isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-white/5 bg-[#161616]'}`}>
                                                <div className={`${COLORS[i]} w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center text-xs lg:text-lg text-white/90 font-black shrink-0 shadow-md`}>{SHAPES[i]}</div>
                                                <div className="flex-1 min-w-0 relative">
                                                    <div 
                                                        contentEditable
                                                        onBlur={(e) => { 
                                                            const newOpts = [...currentQ.options]; 
                                                            newOpts[i] = e.currentTarget.innerHTML; 
                                                            updateCurrentQ({ options: newOpts }); 
                                                        }}
                                                        dangerouslySetInnerHTML={{ __html: opt || "" }}
                                                        className="w-full bg-transparent text-[10px] lg:text-sm font-bold text-white outline-none leading-tight"
                                                    />
                                                    {!opt && <div className="absolute inset-0 flex items-center pointer-events-none text-white/5 text-[10px] lg:text-sm font-bold italic">Answer {i + 1}</div>}
                                                </div>
                                                <button onClick={() => updateCurrentQ({ correctIndex: i })} className={`w-6 h-6 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg lg:rounded-xl border transition-all shrink-0 ${isCorrect ? 'bg-green-500 border-green-500 text-white' : 'bg-white/5 border-white/10 text-gray-800'}`}><CheckCircle2 size={12} /></button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </main>

                {/* Right Toggle Config - Hidden on Mobile to prevent blocking */}
                <div className="relative hidden lg:flex h-full">
                    <button 
                        onClick={() => setShowConfig(!showConfig)}
                        className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full z-[215] w-6 h-24 bg-[#161616] border border-r-0 border-white/10 rounded-l-2xl flex-col items-center justify-center text-gray-500 hover:text-purple-400 transition-all shadow-[-10px_0_20px_rgba(0,0,0,0.5)]"
                    >
                        {showConfig ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        <div className="h-4 w-px bg-white/10 my-1"></div>
                        <Settings2 size={12} className="rotate-90" />
                    </button>

                    <aside className={`hidden lg:relative z-[250] lg:z-[205] bg-[#161616] border-l border-white/10 transition-all duration-500 ease-in-out flex flex-col shrink-0 h-full overflow-y-auto custom-scrollbar lg:w-auto ${showConfig ? 'lg:w-80 opacity-100' : 'lg:w-0 lg:border-l-0 opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto'}`}>
                        <div className={`p-6 flex flex-col gap-6 w-full lg:w-80 transition-opacity duration-300 ${showConfig ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
                            <div className="flex lg:hidden justify-center mb-2"><div className="w-12 h-1 bg-white/10 rounded-full" onClick={() => setShowConfig(false)}></div></div>
                            <h3 className="font-black text-[10px] lg:text-xs text-gray-500 uppercase tracking-[0.2em] flex items-center justify-between">
                                <span className="flex items-center gap-2"><Settings2 size={14} className="text-purple-500" /> Slide Config</span>
                                <button onClick={() => setShowConfig(false)} className="lg:hidden text-gray-400 hover:text-white"><X size={16} /></button>
                            </h3>
                            
                            <div className="space-y-6">
                                {/* Points Mode */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Points Mode</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'standard', name: 'Standard', icon: Trophy, desc: 'Normal + Streak' },
                                            { id: 'double', name: 'Double', icon: Zap, desc: '2x + Streak' },
                                            { id: 'streak_boost', name: 'Streak Boost', icon: Flame, desc: 'Massive Streak' },
                                            { id: 'competitive', name: 'Competitive', icon: Target, desc: 'High Risk' },
                                            { id: 'none', name: 'No points', icon: MinusCircle, desc: 'Survey' }
                                        ].map(p => (
                                            <button key={p.id} onClick={() => updateCurrentQ({ pointsType: p.id as any })} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${currentQ?.pointsType === p.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/5'}`}>
                                                <p.icon size={16} className={currentQ?.pointsType === p.id ? 'text-purple-400' : 'text-gray-500'} />
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black uppercase">{p.name}</p>
                                                    <p className="text-[8px] font-bold text-gray-500">{p.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Limit */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Time Limit</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[5, 10, 20, 30, 60, 120].map(s => (
                                            <button key={s} onClick={() => { updateCurrentQ({ timeLimit: s }); setShowCustomTime(false); }} className={`py-2 rounded-lg border-2 font-black text-[10px] transition-all ${currentQ?.timeLimit === s && !showCustomTime ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/5 bg-white/5 text-gray-500'}`}>{s}s</button>
                                        ))}
                                        <button onClick={() => setShowCustomTime(true)} className={`py-2 rounded-lg border-2 font-black text-[10px] transition-all ${showCustomTime ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/5 bg-white/5 text-gray-500'}`}>Custom</button>
                                    </div>
                                    {showCustomTime && (
                                        <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                                            <input type="number" value={customTime} onChange={(e) => setCustomTime(e.target.value)} placeholder="Seconds" className="flex-1 bg-white/5 border-2 border-white/10 rounded-lg px-3 py-2 text-white font-bold text-xs outline-none focus:border-purple-500" />
                                            <button onClick={() => { const val = parseInt(customTime); if (val > 0) { updateCurrentQ({ timeLimit: val }); setShowCustomTime(false); } }} className="px-3 py-2 bg-purple-600 rounded-lg font-black text-[10px]">Set</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Mobile Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#161616] border-t border-white/5 flex items-center justify-around px-6 z-[250]">
                <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`flex flex-col items-center gap-1 ${isPreviewMode ? 'text-blue-400' : 'text-gray-400'}`}><Eye size={18} /><span className="text-[8px] font-black uppercase">Preview</span></button>
                <button onClick={addQuestion} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-purple-400"><Plus size={24} /></button>
                <button onClick={() => setShowConfig(!showConfig)} className={`flex flex-col items-center gap-1 ${showConfig ? 'text-purple-400' : 'text-gray-400'}`}><Settings2 size={18} /><span className="text-[8px] font-black uppercase">Config</span></button>
            </nav>

            {/* Giphy Modal */}
            {showGiphy && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowGiphy(false)}>
                    <div className="w-full max-w-2xl bg-[#1a1a1a] rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/5 flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input autoFocus placeholder="Search GIPHY..." className="w-full bg-[#111] border border-white/10 rounded-2xl pl-12 pr-4 py-4 font-bold outline-none focus:border-purple-500" value={giphySearch} onChange={e => setGiphySearch(e.target.value)} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); searchGiphy(); } }} />
                            </div>
                            <button onClick={() => setShowGiphy(false)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {isSearchingGiphy ? <div className="h-64 flex flex-col items-center justify-center gap-4 text-gray-500"><Loader2 className="animate-spin" size={32} /><p className="font-black uppercase tracking-widest text-xs">Searching...</p></div> : giphyResults.length > 0 ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{giphyResults.map((gif, i) => <img key={i} src={gif.images.fixed_height.url} className="w-full h-32 object-cover rounded-2xl cursor-pointer hover:scale-105 transition-all shadow-lg" onClick={() => { updateCurrentQ({ mediaUrl: gif.images.original.url }); setShowGiphy(false); }} />)}</div> : <div className="h-64 flex flex-col items-center justify-center text-gray-600 gap-4"><Film size={48} className="opacity-20" /><p className="font-black uppercase tracking-widest text-xs">Search GIPHY</p></div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
