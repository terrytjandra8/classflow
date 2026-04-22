
import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, Board } from '../../types';
import { Plus, Trash2, Image as ImageIcon, Clock, Star, Type, CheckCircle2, ChevronRight, Layout, Trash, Save, X, Layers, Settings2, Trash2 as TrashIcon, ArrowLeft, Eye, EyeOff, Search, Film, Loader2, Upload, GripVertical, Zap, Trophy, MinusCircle, Flame, Target } from 'lucide-react';

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

    // --- DRAG AND DROP LOGIC (FIXED) ---
    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Ghost effect
        const target = e.currentTarget as HTMLElement;
        setTimeout(() => { target.style.opacity = '0.3'; }, 0);
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDrop = (index: number) => {
        if (draggedIndex === null || draggedIndex === index) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newQs = [...localQuestions];
        const itemToMove = newQs[draggedIndex];
        newQs.splice(draggedIndex, 1);
        newQs.splice(index, 0, itemToMove);
        
        setLocalQuestions(newQs);
        setActiveIndex(index); // Focus the moved item
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).style.opacity = '1';
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

    const getSlideTransform = (idx: number) => {
        if (draggedIndex === null || dragOverIndex === null) return 'translateY(0)';
        if (idx === draggedIndex) return 'scale(0.9) opacity(0.2)';
        
        const SLIDE_HEIGHT = 104; 
        if (draggedIndex < dragOverIndex) {
            if (idx > draggedIndex && idx <= dragOverIndex) return `translateY(-${SLIDE_HEIGHT}px)`;
        } else {
            if (idx >= dragOverIndex && idx < draggedIndex) return `translateY(${SLIDE_HEIGHT}px)`;
        }
        return 'translateY(0)';
    };

    const [showConfigMobile, setShowConfigMobile] = useState(false);

    return (
        <div className="fixed inset-0 z-[200] bg-[#0a0a0a] flex flex-col font-sans text-white animate-in fade-in overflow-hidden">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            
            {/* Universal Header - Optimized for Space */}
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
                    <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all border ${isPreviewMode ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>{isPreviewMode ? <EyeOff size={14} /> : <Eye size={14} />} {isPreviewMode ? "Exit" : "Preview"}</button>
                    <button onClick={handleSaveAndClose} className="px-5 lg:px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl font-black text-xs lg:text-sm transition-all shadow-lg">Done</button>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-16 lg:pb-0">
                {/* Desktop Sidebar / Mobile Top Slide Nav */}
                <aside className="h-28 lg:h-auto lg:w-72 bg-[#161616] border-b lg:border-b-0 lg:border-r border-white/5 flex lg:flex-col shrink-0 overflow-x-auto lg:overflow-y-auto custom-scrollbar p-3 lg:p-4 gap-3 relative no-scrollbar touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="hidden lg:block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 px-2">Questions List</div>
                    {localQuestions.map((q, idx) => (
                        <div key={q.id} className="relative shrink-0 lg:shrink">
                            <div 
                                onClick={() => { setActiveIndex(idx); setIsPreviewMode(false); }} 
                                className={`relative group cursor-pointer p-0.5 rounded-xl lg:rounded-2xl ${activeIndex === idx ? 'z-10' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <div className={`bg-[#222] border-2 rounded-xl lg:rounded-2xl p-2 lg:p-3 h-20 lg:h-24 w-32 lg:w-full flex flex-col gap-1 lg:gap-1.5 overflow-hidden transition-all ${activeIndex === idx ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/5'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] lg:text-[10px] font-black text-gray-600">{idx + 1}</span>
                                        <div className="flex items-center gap-1">
                                            {q.pointsType !== 'standard' && <Zap size={8} className="text-yellow-500" />}
                                            <span className="text-[7px] lg:text-[8px] font-black text-gray-600 px-1 py-0.5 bg-black/30 rounded">{q.timeLimit}s</span>
                                        </div>
                                    </div>
                                    <div className="text-[9px] lg:text-[10px] font-bold text-gray-300 line-clamp-2 leading-tight">{q.question || "Untitled"}</div>
                                </div>
                                {localQuestions.length > 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteQuestion(idx); }} className="absolute -right-1 -top-1 w-5 h-5 lg:w-6 lg:h-6 bg-red-600 border-2 border-[#161616] rounded-lg text-white shadow-xl flex items-center justify-center z-20"><X size={10} /></button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button onClick={addQuestion} className="h-20 lg:h-auto min-w-[3rem] lg:w-full lg:py-4 bg-white/5 border-2 border-dashed border-white/10 rounded-xl lg:rounded-2xl text-gray-500 hover:text-purple-400 flex items-center justify-center shrink-0 gap-2 font-black text-[10px] uppercase transition-all"><Plus size={16} /></button>
                </aside>

                <main className="flex-1 bg-[#0a0a0a] overflow-y-auto p-8 md:p-12 flex flex-col items-center custom-scrollbar relative">
                    <div className="w-full max-w-4xl flex flex-col gap-6 animate-in slide-in-from-bottom-5">
                        {isPreviewMode ? (
                            <>
                                <div className="bg-white text-gray-900 rounded-[2.5rem] p-10 text-center shadow-2xl border-b-8 border-gray-200"><h2 className="text-3xl md:text-4xl font-black leading-tight break-words">{currentQ?.question || "Question Text..."}</h2></div>
                                <div className="aspect-video max-h-[400px] w-full bg-white rounded-[2.5rem] border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden relative">{currentQ?.mediaUrl ? <img src={currentQ.mediaUrl} className="w-full h-full object-contain" alt="Preview" /> : <div className="text-gray-100 font-black text-6xl uppercase tracking-widest">QUIZ</div>}</div>
                                <div className="grid grid-cols-2 gap-4 pb-8">{currentQ?.options.map((opt, i) => (<div key={i} className={`min-h-[90px] h-auto py-6 ${COLORS[i]} rounded-2xl flex items-center gap-6 px-8 shadow-[0_8px_0_rgba(0,0,0,0.2)]`}><span className="text-3xl text-white/50 font-black shrink-0">{SHAPES[i]}</span><span className="text-xl font-black text-white break-words">{opt || `Answer ${i+1}`}</span></div>))}</div>
                            </>
                        ) : (
                            <>
                                <div className="bg-[#161616] rounded-3xl lg:rounded-[2.5rem] shadow-2xl border border-white/5 p-6 lg:p-10 text-center">
                                    <textarea ref={questionTextareaRef} value={currentQ?.question} onChange={(e) => { updateCurrentQ({ question: e.target.value }); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} placeholder="Question Text..." className="w-full bg-transparent text-xl lg:text-4xl font-black text-center text-white placeholder-gray-800 outline-none resize-none overflow-hidden leading-tight" />
                                </div>
                                <div className="aspect-video max-w-md lg:max-w-lg mx-auto w-full bg-white/5 rounded-3xl lg:rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col items-center justify-center gap-4 group transition-all relative overflow-hidden shrink-0">
                                    {currentQ?.mediaUrl ? <div className="relative w-full h-full"><img src={currentQ.mediaUrl} className="w-full h-full object-contain" alt="Media" /><div className="absolute top-4 right-4 flex gap-2"><button onClick={() => fileInputRef.current?.click()} className="p-2 bg-blue-600 rounded-lg text-white"><Upload size={12}/></button><button onClick={() => updateCurrentQ({ mediaUrl: undefined })} className="p-2 bg-red-600 rounded-lg text-white"><Trash2 size={12}/></button></div></div> : <div className="flex flex-col items-center gap-4 lg:gap-6"><div className="flex gap-4"><button onClick={() => setShowGiphy(true)} className="w-16 h-16 lg:w-20 lg:h-20 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-purple-400 transition-all"><Film size={20} /><span className="text-[7px] font-black uppercase mt-1">Giphy</span></button><button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 lg:w-20 lg:h-20 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-blue-400 transition-all"><Upload size={20} /><span className="text-[7px] font-black uppercase mt-1">Upload</span></button></div></div>}
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 pb-20">{currentQ?.options.map((opt, i) => { const isActive = currentQ.correctIndex === i; return (<div key={i} className={`group relative flex items-start p-1.5 lg:p-2 rounded-xl lg:rounded-2xl transition-all border-2 ${isActive ? 'border-green-500 bg-green-500/5' : 'border-white/5 bg-white/5'}`}><div className={`${COLORS[i]} w-10 lg:w-14 h-10 lg:h-14 rounded-lg lg:rounded-xl flex items-center justify-center text-base lg:text-xl text-white/90 font-black shrink-0 mt-0.5 lg:mt-1`}>{SHAPES[i]}</div><div className="flex-1 min-h-[40px] h-auto flex items-center px-3 lg:px-4"><textarea rows={1} value={opt} onChange={(e) => { const newOpts = [...currentQ.options]; newOpts[i] = e.target.value; updateCurrentQ({ options: newOpts }); adjustTextareaHeight(e.target as HTMLTextAreaElement); }} placeholder={`Answer ${i + 1}`} className="answer-textarea w-full bg-transparent text-sm lg:text-lg font-bold text-white placeholder-gray-800 outline-none resize-none overflow-hidden" /></div><button onClick={() => updateCurrentQ({ correctIndex: i })} className={`mr-1 lg:mr-2 p-2 lg:p-3 rounded-lg lg:rounded-xl border-2 transition-all mt-0.5 lg:mt-1 ${isActive ? 'bg-green-500 border-green-500 text-white' : 'bg-white/5 border-white/10 text-gray-700'}`}><CheckCircle2 size={16} /></button></div>); })}</div>
                            </>
                        )}
                    </div>
                </main>

                {/* Desktop Aside / Mobile Bottom Sheet */}
                <aside className={`
                    fixed lg:relative inset-x-0 bottom-0 lg:inset-auto z-[220] lg:z-0
                    lg:w-80 lg:h-auto bg-[#161616] border-t lg:border-t-0 lg:border-l border-white/10
                    transition-transform duration-500 ease-in-out
                    ${showConfigMobile ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
                    p-6 flex flex-col gap-6 shrink-0 max-h-[80vh] overflow-y-auto custom-scrollbar rounded-t-[2.5rem] lg:rounded-none
                `}>
                    <div className="flex lg:hidden justify-center mb-2"><div className="w-12 h-1 bg-white/10 rounded-full" onClick={() => setShowConfigMobile(false)}></div></div>
                    <h3 className="font-black text-[10px] lg:text-xs text-gray-500 uppercase tracking-[0.2em] flex items-center justify-between">
                        <span className="flex items-center gap-2"><Settings2 size={14} className="text-purple-500" /> Slide Config</span>
                        <button onClick={() => setShowConfigMobile(false)} className="lg:hidden p-2 text-gray-500"><X size={16}/></button>
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Points Mode</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                                {[
                                    { id: 'standard', name: 'Standard', icon: Trophy, desc: 'Normal + Streak' },
                                    { id: 'double', name: 'Double', icon: Zap, desc: '2x + Streak' },
                                    { id: 'streak_boost', name: 'Streak Boost', icon: Flame, desc: 'Massive Streak', color: 'text-orange-400' },
                                    { id: 'competitive', name: 'Competitive', icon: Target, desc: 'No streak' },
                                    { id: 'none', name: 'No points', icon: MinusCircle, desc: 'Survey' }
                                ].map(p => (
                                    <button key={p.id} onClick={() => updateCurrentQ({ pointsType: p.id as any })} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${currentQ?.pointsType === p.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/5'}`}>
                                        <p.icon size={16} className={currentQ?.pointsType === p.id ? (p.color || 'text-purple-400') : 'text-gray-500'} />
                                        <div className="flex-1 leading-tight"><p className="text-[10px] font-black uppercase">{p.name}</p><p className="text-[8px] font-bold text-gray-500">{p.desc}</p></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3 pb-10 lg:pb-0">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Time limit</label>
                            <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
                                {[5, 10, 20, 30, 60, 120].map(s => (
                                    <button key={s} onClick={() => updateCurrentQ({ timeLimit: s })} className={`py-2 rounded-lg border-2 font-black text-[10px] transition-all ${currentQ?.timeLimit === s ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/5 bg-white/5 text-gray-500'}`}>{s}s</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Mobile Bottom Action Navbar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#161616]/90 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-4 z-[215]">
                <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`flex flex-col items-center gap-1 ${isPreviewMode ? 'text-blue-400' : 'text-gray-400'}`}>{isPreviewMode ? <EyeOff size={18} /> : <Eye size={18} />}<span className="text-[8px] font-black uppercase">Preview</span></button>
                <button onClick={addQuestion} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-purple-400 active:scale-90 transition-all"><Plus size={24} /></button>
                <button onClick={() => setShowConfigMobile(!showConfigMobile)} className={`flex flex-col items-center gap-1 ${showConfigMobile ? 'text-purple-400' : 'text-gray-400'}`}><Settings2 size={18} /><span className="text-[8px] font-black uppercase">Config</span></button>
            </nav>
            
            {showConfigMobile && <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[219]" onClick={() => setShowConfigMobile(false)}></div>}

            {showGiphy && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowGiphy(false)}>
                    <div className="w-full max-w-2xl bg-[#1a1a1a] rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col max-h-[80vh] shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/5 flex items-center gap-4">
                            <div className="flex-1 relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input autoFocus placeholder="Search GIPHY..." className="w-full bg-[#111] border border-white/10 rounded-2xl pl-12 pr-4 py-4 font-bold outline-none focus:border-purple-500 transition-all" value={giphySearch} onChange={e => setGiphySearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchGiphy()} /></div>
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
