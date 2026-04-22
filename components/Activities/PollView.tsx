import React, { useState, useMemo } from 'react';
import { Board, Note, ClassGroup } from '../../types';
import { BarChart2, Cloud, RefreshCw, Send, Check, Settings, Plus, X, MonitorPlay, Minimize2, Radio, EyeOff, ChevronRight, ChevronLeft, Trash2, Users, ChevronDown, Share2, Edit2, ArrowLeft } from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { usePollManager } from '../../hooks/usePollManager';
import { resolveBackgroundStyle } from '../../utils/theme';

interface PollViewProps {
    board: Board;
    notes: Note[];
    userId?: string;
    isStudent?: boolean;
    onUpdateBoard: (updates: Partial<Board>) => void;
    classList?: ClassGroup[];
    onActivity?: () => void;
    onOpenSettings?: () => void;
    onOpenShare?: () => void;
    onBack?: () => void;
    isPresentationMode?: boolean; // New Prop
}

export const PollView: React.FC<PollViewProps> = ({ board, notes, userId, isStudent, onUpdateBoard, classList, onActivity, onOpenSettings, onOpenShare, onBack, isPresentationMode }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isPresenting, setIsPresenting] = useState(false);
    const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Use Custom Hook
    const {
        polls, currentIndex, currentPoll, pollType, options, results, maxVotes,
        myVote, hasVoted,
        castVote, resetVotes, addSlide, deleteSlide, updatePoll, navigateSlide
    } = usePollManager(board, notes, userId, onUpdateBoard, onActivity);

    const openProjectorMode = () => {
        const url = `${window.location.origin}/?board=${board.id}&present=true`;
        window.open(url, 'ClassBoardProjector', 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no');
    };

    const togglePresentation = () => {
        if (!isPresenting) {
            document.documentElement.requestFullscreen().catch(e => console.error(e));
            setIsPresenting(true);
        } else {
            if (document.fullscreenElement) document.exitFullscreen();
            setIsPresenting(false);
        }
    };

    const handleConfirmReset = async () => {
        await resetVotes();
        setShowResetConfirm(false);
    };

    const backgroundStyle = useMemo(() => resolveBackgroundStyle(board.wallpaper), [board.wallpaper]);

    // --- STUDENT VIEW ---
    if (isStudent) {
        if (!currentPoll) return <div className="h-full flex items-center justify-center text-white">Connecting...</div>;

        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-white relative" style={backgroundStyle}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                <div className="max-w-md w-full space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 relative z-10">
                    <div>
                        <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 text-gray-300 border border-white/10">
                            Slide {currentIndex + 1} of {polls.length}
                        </div>
                        <h2 className="text-3xl font-bold mb-4 drop-shadow-md">{currentPoll.question}</h2>
                        <p className="text-gray-300 drop-shadow">{board.description || 'Cast your vote below'}</p>
                    </div>

                    {pollType === 'multiple_choice' && (
                        <div className="space-y-3">
                            {options.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => castVote(opt)}
                                    className={`w-full p-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 border-2 shadow-lg ${myVote?.content === opt ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'bg-black/40 border-white/10 hover:bg-black/60 backdrop-blur-md'}`}
                                >
                                    {opt}
                                    {myVote?.content === opt && <Check className="inline-block ml-2" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {pollType === 'word_cloud' && (
                        <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                            <label className="block text-sm font-bold text-gray-300 mb-2">Enter a word</label>
                            <form onSubmit={(e) => { e.preventDefault(); const val = (e.target as any).word.value; if(val) castVote(val); }}>
                                <div className="flex gap-2">
                                    <input 
                                        name="word"
                                        type="text" 
                                        maxLength={25}
                                        placeholder="Type here..."
                                        defaultValue={myVote?.content || ''}
                                        className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none placeholder-white/30"
                                    />
                                    <button type="submit" className="bg-blue-600 px-6 rounded-lg text-white font-bold hover:bg-blue-500">
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                            {hasVoted && <p className="text-green-400 text-xs mt-3 flex items-center justify-center gap-1"><Check size={12}/> Sent! You can update your answer.</p>}
                        </div>
                    )}

                    <div className="pt-8 text-white/50 text-xs">
                        Waiting for teacher to change slide...
                    </div>
                </div>
            </div>
        );
    }

    // --- TEACHER VIEW ---
    if (!currentPoll) return <div className="h-full bg-[#111] text-white flex items-center justify-center">Loading Polls...</div>;

    return (
        <div className={`h-full flex flex-col bg-[#111] text-white ${isPresenting ? 'fixed inset-0 z-[100]' : ''}`}>
            
            {/* Header - Hidden in Presentation Mode */}
            {!isPresentationMode && (
                <header className={`h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#161616] shrink-0 ${isPresenting ? 'hidden' : 'flex'}`}>
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h1 className="font-bold text-xl truncate max-w-[200px]">{board.title}</h1>
                        
                        {/* Class Selector */}
                        {!isStudent && (
                            <div className="relative z-50">
                                <button 
                                    onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold transition-colors text-white shadow-lg"
                                >
                                    {board.targetGrade || 'General'}
                                    <ChevronDown size={12} />
                                </button>
                                {isClassDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsClassDropdownOpen(false)}></div>
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-[#222] border border-white/20 rounded-lg shadow-xl z-50 py-1">
                                            {classList?.map((cls) => (
                                                <button
                                                    key={cls.id}
                                                    onClick={() => {
                                                        onUpdateBoard({ targetGrade: cls.name });
                                                        setIsClassDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors ${board.targetGrade === cls.name ? 'text-blue-400 font-bold' : 'text-gray-300'}`}
                                                >
                                                    {cls.name}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="h-6 w-px bg-white/10"></div>
                        <button 
                            onClick={() => onUpdateBoard({ isPublished: !board.isPublished })}
                            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full transition-all ${board.isPublished ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}
                        >
                            {board.isPublished ? <Radio size={12} className="animate-pulse" /> : <EyeOff size={12} />}
                            {board.isPublished ? 'Live' : 'Draft'}
                        </button>
                    </div>
                    
                    {/* Poll Navigation */}
                    <div className="flex items-center gap-2 bg-[#222] p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => navigateSlide(currentIndex - 1)}
                            disabled={currentIndex === 0}
                            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-mono font-bold w-16 text-center text-white">{currentIndex + 1} / {polls.length}</span>
                        <button 
                            onClick={() => navigateSlide(currentIndex + 1)}
                            disabled={currentIndex === polls.length - 1}
                            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {onOpenShare && (
                            <button 
                                onClick={onOpenShare}
                                className="p-2 rounded-full transition-colors text-gray-400 hover:text-white hover:bg-white/10"
                                title="Share"
                            >
                                <Share2 size={18} />
                            </button>
                        )}
                        {onOpenSettings && (
                            <button 
                                onClick={onOpenSettings}
                                className="p-2 rounded-full transition-colors text-gray-400 hover:text-white hover:bg-white/10"
                                title="Settings"
                            >
                                <Settings size={18} />
                            </button>
                        )}
                        <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-gray-400'}`} title="Edit Questions">
                            <Edit2 size={18} />
                        </button>
                        <div className="h-6 w-px bg-white/10 mx-2"></div>
                        <button onClick={openProjectorMode} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-xs transition-colors">
                            <MonitorPlay size={14} /> Projector
                        </button>
                    </div>
                </header>
            )}

            {/* Presentation Overlay */}
            {(isPresenting || isPresentationMode) && (
                <div className="fixed top-4 right-4 z-[110] flex gap-2">
                    <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-full text-white font-bold text-sm border border-white/10 flex items-center gap-2">
                        <Users size={14} /> {notes.filter(n => n.title === currentPoll.id).length} Votes
                    </div>
                    {isPresenting && (
                        <button onClick={togglePresentation} className="bg-white text-black p-3 rounded-full hover:bg-gray-200">
                            <Minimize2 size={20} />
                        </button>
                    )}
                </div>
            )}

            {/* Presentation Arrows */}
            {(isPresenting || isPresentationMode) && (
                <>
                    {currentIndex > 0 && (
                        <div 
                            className="fixed inset-y-0 left-0 w-20 z-[100] flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group"
                            onClick={() => navigateSlide(currentIndex - 1)}
                        >
                            <div className="bg-white/10 backdrop-blur p-4 rounded-full group-hover:bg-white/20"><ChevronLeft size={32}/></div>
                        </div>
                    )}
                    {currentIndex < polls.length - 1 && (
                        <div 
                            className="fixed inset-y-0 right-0 w-20 z-[100] flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group"
                            onClick={() => navigateSlide(currentIndex + 1)}
                        >
                            <div className="bg-white/10 backdrop-blur p-4 rounded-full group-hover:bg-white/20"><ChevronRight size={32}/></div>
                        </div>
                    )}
                </>
            )}

            <div className="flex-1 flex overflow-hidden relative">
                {/* Editor Sidebar */}
                {isEditing && !isPresenting && !isPresentationMode && (
                    <div className="w-80 bg-[#1a1a1a] border-r border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-left-10 duration-200 shrink-0 z-20">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="font-bold text-gray-400 uppercase text-xs">Slides</h3>
                            <button onClick={addSlide} className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white"><Plus size={14}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 border-b border-white/10">
                            {polls.map((poll, idx) => (
                                <div 
                                    key={poll.id}
                                    onClick={() => navigateSlide(idx)}
                                    className={`p-3 rounded-lg border cursor-pointer group flex items-center gap-3 transition-all ${idx === currentIndex ? 'bg-blue-900/20 border-blue-500/50' : 'bg-[#222] border-white/5 hover:bg-[#2a2a2a]'}`}
                                >
                                    <div className="text-xs font-bold text-gray-500">{idx + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-200 truncate">{poll.question}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">{poll.type.replace('_', ' ')}</div>
                                    </div>
                                    {polls.length > 1 && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Settings */}
                        <div className="p-4 space-y-6 overflow-y-auto bg-[#161616]">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Question</label>
                                <textarea 
                                    key={currentPoll.id + '_q'} // Force remount on slide change
                                    defaultValue={currentPoll.question} 
                                    onBlur={(e) => updatePoll({ question: e.target.value })}
                                    className="w-full bg-[#111] border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-blue-500 resize-none h-20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => updatePoll({ type: 'multiple_choice' })}
                                        className={`p-2 rounded-lg text-xs font-bold border transition-colors ${pollType === 'multiple_choice' ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/10 hover:bg-white/5 text-gray-400'}`}
                                    >
                                        <BarChart2 size={16} className="mx-auto mb-1" /> Bar Chart
                                    </button>
                                    <button 
                                        onClick={() => updatePoll({ type: 'word_cloud' })}
                                        className={`p-2 rounded-lg text-xs font-bold border transition-colors ${pollType === 'word_cloud' ? 'bg-purple-600 border-purple-600 text-white' : 'border-white/10 hover:bg-white/5 text-gray-400'}`}
                                    >
                                        <Cloud size={16} className="mx-auto mb-1" /> Word Cloud
                                    </button>
                                </div>
                            </div>

                            {pollType === 'multiple_choice' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                                        Options 
                                        <button onClick={() => updatePoll({ options: [...options, `Option ${options.length + 1}`] })} className="text-blue-400 hover:text-blue-300"><Plus size={14}/></button>
                                    </label>
                                    <div className="space-y-2">
                                        {options.map((opt, i) => (
                                            <div key={`${currentPoll.id}_opt_${i}`} className="flex gap-2">
                                                <input 
                                                    defaultValue={opt}
                                                    onBlur={(e) => {
                                                        const newOpts = [...options];
                                                        newOpts[i] = e.target.value;
                                                        updatePoll({ options: newOpts });
                                                    }}
                                                    className="flex-1 bg-[#111] border border-white/10 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                                                />
                                                <button onClick={() => updatePoll({ options: options.filter((_, idx) => idx !== i) })} className="text-gray-500 hover:text-red-500"><X size={14}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/10">
                                <button 
                                    onClick={() => setShowResetConfirm(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 p-2 rounded-lg text-xs font-bold transition-colors"
                                >
                                    <RefreshCw size={14} /> Clear Votes for Slide
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Visualization Background */}
                <div className="absolute inset-0 z-0" style={backgroundStyle}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                </div>

                <main className="flex-1 flex flex-col items-center justify-center p-10 relative overflow-hidden z-10">
                    {!isPresenting && board.isPublished && !isPresentationMode && (
                        <div className="absolute top-4 left-4 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-green-500/20">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Live
                        </div>
                    )}

                    <div className="mb-8 text-center max-w-4xl">
                        <h2 className="text-3xl md:text-5xl font-bold leading-tight drop-shadow-lg">{currentPoll.question}</h2>
                    </div>

                    {pollType === 'multiple_choice' ? (
                        <div className="w-full max-w-5xl h-[50vh] flex items-end justify-center gap-8 md:gap-12 px-10">
                            {options.map((opt) => {
                                const count = (results as any)[opt] || 0;
                                const height = maxVotes > 0 ? (count / maxVotes) * 100 : 0;
                                return (
                                    <div key={opt} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                                        <div className="mb-4 font-black text-4xl drop-shadow-md">{count}</div>
                                        <div 
                                            className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-2xl transition-all duration-700 ease-out relative shadow-[0_0_40px_rgba(59,130,246,0.3)] min-h-[10px] border-t border-white/20"
                                            style={{ height: `${Math.max(height, 2)}%` }} 
                                        ></div>
                                        <div className="mt-6 text-center font-bold text-xl md:text-2xl text-gray-200 break-words w-full drop-shadow">{opt}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="w-full max-w-6xl h-full flex flex-wrap content-center justify-center gap-6 p-10">
                            {Object.entries(results).map(([word, count]) => {
                                const size = 2 + (count as number) * 1; 
                                const fontSize = Math.min(size, 10) + 'rem';
                                const opacity = Math.min(0.4 + (count as number) * 0.1, 1);
                                
                                return (
                                    <span 
                                        key={word} 
                                        className="font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-500 animate-in zoom-in duration-500 leading-none drop-shadow-2xl"
                                        style={{ fontSize, opacity }}
                                    >
                                        {word}
                                    </span>
                                );
                            })}
                            {Object.keys(results).length === 0 && (
                                <div className="text-gray-400 text-3xl font-bold flex flex-col items-center gap-6 opacity-50">
                                    <Cloud size={80} />
                                    Waiting for responses...
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            <ConfirmModal 
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={handleConfirmReset}
                title="Reset Votes?"
                message="Are you sure you want to clear all votes for this slide? This action cannot be undone."
                confirmText="Clear Votes"
                isDangerous={true}
            />
        </div>
    );
};
