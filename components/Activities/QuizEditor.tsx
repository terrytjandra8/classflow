
import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, Board } from '../../types';
import { Plus, Trash2, Image as ImageIcon, Clock, Star, Type, CheckCircle2, ChevronRight, ChevronLeft, Layout, Trash, Save, X, Layers, Settings2, Trash2 as TrashIcon, ArrowLeft, Eye, EyeOff, Search, Film, Loader2, Upload, GripVertical, Zap, Trophy, MinusCircle, Flame, Target } from 'lucide-react';

interface QuizEditorProps {
    questions: QuizQuestion[];
    onUpdateBoard: (updates: Partial<Board>) => void;
    onClose?: () => void;
}

const GIPHY_API_KEY = 'RKmBxWsi0EgRtMrBK79HE4hVXpeuTytn';

export const QuizEditor: React.FC<QuizEditorProps> = ({ questions, onUpdateBoard, onClose }) => {
    const [localQuestions, setLocalQuestions] = useState<QuizQuestion[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [showGiphy, setShowGiphy] = useState(false);
    const [giphySearch, setGiphySearch] = useState('');
    const [giphyResults, setGiphyResults] = useState<any[]>([]);
    const [isSearchingGiphy, setIsSearchingGiphy] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [customTime, setCustomTime] = useState('');
    const [showCustomTime, setShowCustomTime] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const questionTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Initial Sync
    useEffect(() => {
        setLocalQuestions(JSON.parse(JSON.stringify(questions)));
    }, []);

    // Auto-resize for all textareas
    const adjustTextareaHeight = (el: HTMLTextAreaElement | null) => {
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    };

    // Auto-resize on load/change
    useEffect(() => {
        // Delay slightly to ensure DOM is ready
        const timer = setTimeout(() => {
            if (questionTextareaRef.current) adjustTextareaHeight(questionTextareaRef.current);
            const textareas = document.querySelectorAll('.answer-textarea');
            textareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));
        }, 50);
        return () => clearTimeout(timer);
    }, [activeIndex, localQuestions]);

    const handleSaveAndClose = () => {
        onUpdateBoard({ quizQuestions: localQuestions });
        if (onClose) onClose();
    };

    const updateCurrentQ = (updates: Partial<QuizQuestion>) => {
        const newQs = [...localQuestions];
        newQs[activeIndex] = { ...newQs[activeIndex], ...updates };
        setLocalQuestions(newQs);
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
        const newQs = [...localQuestions, newQ];
        setLocalQuestions(newQs);
        setActiveIndex(newQs.length - 1);
    };

    const deleteQuestion = (index: number) => {
        const newQuestions = localQuestions.filter((_, i) => i !== index);
        setLocalQuestions(newQuestions);
        if (activeIndex >= newQuestions.length) {
            setActiveIndex(Math.max(0, newQuestions.length - 1));
        } else if (activeIndex === index) {
            setActiveIndex(Math.max(0, index - 1));
        }
    };

    // --- DRAG AND DROP LOGIC (Deep-copy safe) ---
    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (index: number) => {
        if (draggedIndex === null || draggedIndex === index) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        // Deep copy ALL questions so no data is shared or mutated
        const deepCopy: QuizQuestion[] = JSON.parse(JSON.stringify(localQuestions));
        const [moved] = deepCopy.splice(draggedIndex, 1);
        deepCopy.splice(index, 0, moved);
        
        setLocalQuestions(deepCopy);
        setActiveIndex(index);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => updateCurrentQ({ mediaUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
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
    const SHAPES = ['▲', '◆', '●', '■'];
    const COLORS = ['bg-[#e21b3c]', 'bg-[#1368ce]', 'bg-[#d89e00]', 'bg-[#26890c]'];

    const [showConfig, setShowConfig] = useState(true); // Default to open for visibility

    return (
        <div className="fixed inset-0 z-[200] bg-[#0a0a0a] flex flex-col font-sans text-white animate-in fade-in overflow-hidden">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            
            {/* Universal Header - Clean & Focused */}
            <header className="h-16 bg-[#161616] border-b border-white/5 flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-[210] shadow-2xl">
                <div className="flex items-center gap-2 lg:gap-4">
                    <button onClick={handleSaveAndClose} className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
                    <div className="hidden lg:block h-6 w-px bg-white/10 mx-2"></div>
                    <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-8 lg:w-10 h-8 lg:h-10 bg-purple-600 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg"><Layout size={18} /></div>
                        <div>
                            <h1 className="font-black text-xs lg:text-sm tracking-tight truncate max-w-[100px] lg:max-w-none">Quiz Editor</h1>
                            <p className="text-[8px] lg:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Slide {activeIndex + 1}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all border ${isPreviewMode ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>{isPreviewMode ? <EyeOff size={14} /> : <Eye size={14} />} <span className="hidden sm:inline">{isPreviewMode ? "Exit" : "Preview"}</span></button>
                    <button onClick={handleSaveAndClose} className="px-5 lg:px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl font-black text-xs lg:text-sm transition-all shadow-lg">Done</button>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-16 lg:pb-0 relative">
                {/* Desktop Sidebar - Left */}
                <aside className="h-28 lg:h-auto lg:w-72 bg-[#161616] border-b lg:border-b-0 lg:border-r border-white/5 flex lg:flex-col shrink-0 overflow-x-auto lg:overflow-y-auto custom-scrollbar p-3 lg:p-4 gap-3 relative no-scrollbar touch-pan-x">
                    <div className="hidden lg:block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 px-2">Questions List</div>
                    {localQuestions.map((q, idx) => (
                        <div key={q.id} className="relative shrink-0 lg:shrink">
                            <div 
                                onClick={() => { setActiveIndex(idx); setIsPreviewMode(false); }} 
                                className={`
                                    relative group cursor-pointer p-0.5 rounded-xl lg:rounded-2xl transition-all duration-300
                                    ${activeIndex === idx ? 'z-10' : 'opacity-70 hover:opacity-100'} 
                                `}
                            >
                                <div className={`bg-[#222] border-2 rounded-xl lg:rounded-2xl p-2 lg:p-3 h-20 lg:h-24 w-32 lg:w-full flex flex-col gap-1 lg:gap-1.5 overflow-hidden transition-all duration-300 ${activeIndex === idx ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/5'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] lg:text-[10px] font-black text-gray-600">{idx + 1}</span>
                                        <div className="flex items-center gap-1">
                                            {q.pointsType !== 'standard' && <Zap size={8} className="text-yellow-500" />}
                                            <span className="text-[7px] lg:text-[8px] font-black text-gray-600 px-1 py-0.5 bg-black/30 rounded">{q.timeLimit}s</span>
                                        </div>
                                    </div>
                                    <div className="text-[9px] lg:text-[10px] font-bold text-gray-300 line-clamp-2 leading-tight" dangerouslySetInnerHTML={{ __html: q.question || "Untitled" }} />
                                </div>
                                {localQuestions.length > 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteQuestion(idx); }} className="absolute -right-1 -top-1 w-5 h-5 lg:w-6 lg:h-6 bg-red-600 border-2 border-[#161616] rounded-lg text-white shadow-xl flex items-center justify-center z-20 hover:scale-110 active:scale-90 transition-transform"><X size={10} /></button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button onClick={addQuestion} className="h-20 lg:h-auto min-w-[3rem] lg:w-full lg:py-4 bg-white/5 border-2 border-dashed border-white/10 rounded-xl lg:rounded-2xl text-gray-500 hover:text-purple-400 flex items-center justify-center shrink-0 gap-2 font-black text-[10px] uppercase transition-all hover:bg-purple-500/5 hover:border-purple-500/20"><Plus size={16} /></button>
                </aside>

                {/* Main Workspace - Elastic Width */}
                <main className="flex-1 bg-[#0a0a0a] overflow-y-auto p-4 lg:p-8 flex flex-col items-center custom-scrollbar relative transition-all duration-500 ease-in-out">
                    <div className="w-full max-w-4xl flex flex-col gap-6 animate-in slide-in-from-bottom-5">
                        {isPreviewMode ? (
                            <>
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
                            </>
                        ) : (
                            <>
                                <div className="relative group mx-auto w-full max-w-3xl">
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1a1a1a] border border-white/10 p-1 rounded-xl opacity-0 group-focus-within:opacity-100 transition-all shadow-2xl z-20">
                                        {[
                                            { label: 'B', cmd: 'bold', icon: <span className="font-black">B</span> },
                                            { label: 'I', cmd: 'italic', icon: <span className="italic font-serif">I</span> },
                                            { label: 'U', cmd: 'underline', icon: <span className="underline">U</span> },
                                        ].map(tool => (
                                            <button 
                                                key={tool.cmd}
                                                onMouseDown={(e) => { e.preventDefault(); document.execCommand(tool.cmd, false); }}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all text-[10px]"
                                            >
                                                {tool.icon}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-[#161616] rounded-2xl lg:rounded-[2rem] shadow-2xl border border-white/5 p-6 lg:p-8 text-center group-focus-within:border-purple-500/30 transition-all">
                                        <div 
                                            contentEditable
                                            onBlur={(e) => updateCurrentQ({ question: e.currentTarget.innerHTML })}
                                            dangerouslySetInnerHTML={{ __html: currentQ?.question || "" }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); } }}
                                            className="w-full bg-transparent text-lg lg:text-3xl font-black text-center text-white outline-none leading-snug min-h-[1.2em]"
                                        />
                                        {!currentQ?.question && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-800 text-lg lg:text-3xl font-black">Question Text...</div>}
                                    </div>
                                </div>

                                <div className="max-w-xl mx-auto w-full">
                                    <div className="aspect-video w-full bg-[#161616] rounded-2xl lg:rounded-3xl shadow-xl border border-white/5 flex flex-col items-center justify-center gap-3 group transition-all relative overflow-hidden">
                                        {currentQ?.mediaUrl ? (
                                            <div className="relative w-full h-full p-2">
                                                <img src={currentQ.mediaUrl} className="w-full h-full object-contain rounded-xl" alt="Media" />
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-blue-600/90 hover:bg-blue-500 rounded-lg text-white shadow-lg backdrop-blur-sm"><Upload size={12}/></button>
                                                    <button onClick={() => updateCurrentQ({ mediaUrl: undefined })} className="p-2 bg-red-600/90 hover:bg-red-500 rounded-lg text-white shadow-lg backdrop-blur-sm"><Trash2 size={12}/></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="flex gap-4">
                                                    <button onClick={() => setShowGiphy(true)} className="w-16 h-16 lg:w-20 lg:h-20 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group/btn">
                                                        <Film size={20} className="group-hover/btn:scale-110 transition-transform" />
                                                        <span className="text-[8px] font-black uppercase mt-1 tracking-widest">Giphy</span>
                                                    </button>
                                                    <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 lg:w-20 lg:h-20 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group/btn">
                                                        <Upload size={20} className="group-hover/btn:scale-110 transition-transform" />
                                                        <span className="text-[8px] font-black uppercase mt-1 tracking-widest">Upload</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 lg:gap-4 max-w-4xl mx-auto w-full pb-20">
                                    {currentQ?.options.map((opt, i) => {
                                        const isActive = currentQ.correctIndex === i;
                                        return (
                                            <div key={i} className={`group relative flex items-center gap-3 p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all border min-h-[64px] ${isActive ? 'border-green-500/50 bg-green-500/5' : 'border-white/5 bg-[#161616]'}`}>
                                                <div className={`${COLORS[i]} w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center text-sm lg:text-lg text-white/90 font-black shrink-0 shadow-md`}>{SHAPES[i]}</div>
                                                <div className="flex-1 min-w-0 relative">
                                                    <div 
                                                        contentEditable
                                                        onBlur={(e) => { 
                                                            const newOpts = [...currentQ.options]; 
                                                            newOpts[i] = e.currentTarget.innerHTML; 
                                                            updateCurrentQ({ options: newOpts }); 
                                                        }}
                                                        dangerouslySetInnerHTML={{ __html: opt || "" }}
                                                        className="w-full bg-transparent text-xs lg:text-sm font-bold text-white outline-none leading-relaxed"
                                                    />
                                                    {!opt && <div className="absolute inset-0 flex items-center pointer-events-none text-gray-800 text-xs lg:text-sm font-bold">Answer {i + 1}</div>}
                                                </div>
                                                <button 
                                                    onClick={() => updateCurrentQ({ correctIndex: i })} 
                                                    className={`w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg lg:rounded-xl border transition-all shrink-0 ${isActive ? 'bg-green-500 border-green-500 text-white' : 'bg-white/5 border-white/10 text-gray-800'}`}
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </main>

                {/* Desktop Aside - Slide Config with Toggle Arrow */}
                <div className="relative flex h-full">
                    {/* The Hidden Toggle Bar (Desktop Only) */}
                    <button 
                        onClick={() => setShowConfig(!showConfig)}
                        className={`
                            hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full z-[215]
                            w-6 h-24 bg-[#161616] border border-r-0 border-white/10 rounded-l-2xl
                            flex-col items-center justify-center text-gray-500 hover:text-purple-400 transition-all shadow-[-10px_0_20px_rgba(0,0,0,0.5)]
                        `}
                    >
                        {showConfig ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        <div className="h-4 w-px bg-white/10 my-1"></div>
                        <Settings2 size={12} className="rotate-90" />
                    </button>

                    <aside className={`
                        fixed lg:relative inset-y-0 right-0 lg:right-auto z-[220] lg:z-[205]
                        bg-[#161616] border-l border-white/10
                        transition-all duration-500 ease-in-out shadow-2xl lg:shadow-none
                        ${showConfig ? 'w-80 translate-x-0' : 'w-0 translate-x-full lg:translate-x-0 lg:border-l-0'}
                        flex flex-col shrink-0 h-full overflow-y-auto custom-scrollbar lg:rounded-l-none
                    `}>
                        <div className={`p-6 flex flex-col gap-6 w-80 transition-opacity duration-300 ${showConfig ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <div className="flex lg:hidden justify-center mb-2"><div className="w-12 h-1 bg-white/10 rounded-full" onClick={() => setShowConfig(false)}></div></div>
                            <h3 className="font-black text-[10px] lg:text-xs text-gray-500 uppercase tracking-[0.2em] flex items-center justify-between">
                                <span className="flex items-center gap-2"><Settings2 size={14} className="text-purple-500" /> Slide Config</span>
                                <button onClick={() => setShowConfig(false)} className="lg:hidden p-2 text-gray-500"><X size={16}/></button>
                            </h3>
                            <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Points Mode</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                                {[
                                    { id: 'standard', name: 'Standard', icon: Trophy, desc: 'Normal + Streak', fullDesc: 'Earn up to 1000 base points. Speed & Streak bonuses included. No penalty for wrong answers.' },
                                    { id: 'double', name: 'Double', icon: Zap, desc: '2x + Streak', fullDesc: 'Double everything (2000 max)! But watch out: a -100 penalty if you miss.' },
                                    { id: 'streak_boost', name: 'Streak Boost', icon: Flame, desc: 'Massive Streak', fullDesc: 'Massive points for long streaks! Streak resets to zero on any miss.', color: 'text-orange-400' },
                                    { id: 'competitive', name: 'Competitive', icon: Target, desc: 'High Risk', fullDesc: 'Fixed 1000 points if right. CRIPPLING -500 penalty if wrong! No timer, no streak.' },
                                    { id: 'none', name: 'No points', icon: MinusCircle, desc: 'Survey', fullDesc: 'No scores tracked. Perfect for quick polls or icebreakers.' }
                                ].map(p => (
                                    <div key={p.id} className="relative group/mode">
                                        <button 
                                            onClick={() => updateCurrentQ({ pointsType: p.id as any })} 
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${currentQ?.pointsType === p.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/5'}`}
                                        >
                                            <p.icon size={16} className={currentQ?.pointsType === p.id ? (p.color || 'text-purple-400') : 'text-gray-500'} />
                                            <div className="flex-1 leading-tight">
                                                <p className="text-[10px] font-black uppercase">{p.name}</p>
                                                <p className="text-[8px] font-bold text-gray-500">{p.desc}</p>
                                            </div>
                                        </button>
                                        
                                        {/* Hover Description Tooltip - positioned to the LEFT */}
                                        <div className="absolute right-full mr-4 top-0 w-56 bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl opacity-0 group-hover/mode:opacity-100 pointer-events-none transition-all z-[300] -translate-x-2 group-hover/mode:translate-x-0 hidden lg:block">
                                            <div className="flex items-center gap-2 mb-2">
                                                <p.icon size={14} className={p.color || 'text-purple-400'} />
                                                <span className="text-[10px] font-black uppercase text-white">{p.name} Rules</span>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-gray-400 font-medium">{p.fullDesc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3 pb-10 lg:pb-0">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Time limit</label>
                            <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
                                {[5, 10, 20, 30, 60, 120].map(s => (
                                    <button key={s} onClick={() => { updateCurrentQ({ timeLimit: s }); setShowCustomTime(false); }} className={`py-2 rounded-lg border-2 font-black text-[10px] transition-all ${currentQ?.timeLimit === s && !showCustomTime ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/5 bg-white/5 text-gray-500'}`}>{s}s</button>
                                ))}
                                {/* Custom duration button */}
                                <button 
                                    onClick={() => { setShowCustomTime(true); setCustomTime(currentQ?.timeLimit?.toString() || ''); }}
                                    className={`py-2 rounded-lg border-2 font-black text-[10px] transition-all ${showCustomTime || ![5, 10, 20, 30, 60, 120].includes(currentQ?.timeLimit || 0) ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/5 bg-white/5 text-gray-500'}`}
                                >
                                    {![5, 10, 20, 30, 60, 120].includes(currentQ?.timeLimit || 0) ? `${currentQ?.timeLimit}s` : 'Custom'}
                                </button>
                            </div>
                            {/* Custom time input */}
                            {showCustomTime && (
                                <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                                    <input
                                        type="number"
                                        min="1"
                                        max="300"
                                        value={customTime}
                                        onChange={(e) => setCustomTime(e.target.value)}
                                        placeholder="Seconds"
                                        className="flex-1 bg-white/5 border-2 border-white/10 rounded-lg px-3 py-2 text-white font-bold text-xs outline-none focus:border-purple-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = parseInt(customTime);
                                                if (val > 0 && val <= 300) {
                                                    updateCurrentQ({ timeLimit: val });
                                                    setShowCustomTime(false);
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const val = parseInt(customTime);
                                            if (val > 0 && val <= 300) {
                                                updateCurrentQ({ timeLimit: val });
                                                setShowCustomTime(false);
                                            }
                                        }}
                                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-black text-[10px] text-white transition-all"
                                    >Set</button>
                                    <span className="text-[9px] text-gray-500 font-bold">1–300s</span>
                                </div>
                            )}
                        </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Mobile Bottom Action Navbar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#161616]/90 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-4 z-[215]">
                <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`flex flex-col items-center gap-1 ${isPreviewMode ? 'text-blue-400' : 'text-gray-400'}`}>{isPreviewMode ? <EyeOff size={18} /> : <Eye size={18} />}<span className="text-[8px] font-black uppercase">Preview</span></button>
                <button onClick={addQuestion} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-purple-400 active:scale-90 transition-all"><Plus size={24} /></button>
                <button onClick={() => setShowConfig(!showConfig)} className={`flex flex-col items-center gap-1 ${showConfig ? 'text-purple-400' : 'text-gray-400'}`}><Settings2 size={18} /><span className="text-[8px] font-black uppercase">Config</span></button>
            </nav>
            
            {showConfig && <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[219]" onClick={() => setShowConfig(false)}></div>}

            {showGiphy && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowGiphy(false)}>
                    <div className="w-full max-w-2xl bg-[#1a1a1a] rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col max-h-[80vh] shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/5 flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    autoFocus 
                                    placeholder="Search GIPHY..." 
                                    className="w-full bg-[#111] border border-white/10 rounded-2xl pl-12 pr-4 py-4 font-bold outline-none focus:border-purple-500 transition-all" 
                                    value={giphySearch} 
                                    onChange={e => setGiphySearch(e.target.value)} 
                                    onKeyDown={e => {
                                        e.stopPropagation(); // Stop bubbling to prevent closing dialog
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            searchGiphy();
                                        }
                                    }} 
                                />
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
