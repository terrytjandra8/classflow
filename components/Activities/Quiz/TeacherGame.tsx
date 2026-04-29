import React, { useState, useRef, useEffect } from 'react';
import { QuizState, QuizQuestion, Board, Note } from '../../../types';
import { Users, Play, Trophy, CheckCircle2, XCircle, Hourglass, SkipForward, Timer, LayoutPanelTop, Info, Minimize2, ZoomIn, ZoomOut, Search, Music, Volume2, Pause, ShieldAlert, Flame, GripVertical } from 'lucide-react';
import { QuizEditor } from '../QuizEditor';
import { MUSIC_TRACKS } from '../../../hooks/useQuizAudio';
import { noteService } from '../../../services/noteService';
import { calculatePoints } from '../../../utils/quizUtils';
import { Logo } from '../../Logo';

interface TeacherGameProps {
    state: QuizState | 'setup';
    board: Board;
    currentQ: QuizQuestion | undefined;
    currentQIndex: number;
    questions: QuizQuestion[];
    timeLeft: number;
    scores: any[];
    onlineUsers?: any[];
    enterLobby: () => void;
    startGame: () => void;
    nextStep: () => void;
    openProjectorMode: () => void;
    SoundControl: React.FC;
    backgroundStyle: any;
    isPresenting: boolean;
    togglePresentation: (val: boolean) => void;
    onUpdateBoard: (updates: Partial<Board>) => void; 
    resetGame: () => void;
    notes: Note[];
}

const SHAPES = ['▲', '◆', '●', '■'];
// New Neon Palette: Red, Blue, Yellow, Green but with glowing effects
const NEON_COLORS = [
    'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-red-400',
    'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] text-blue-400',
    'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] text-yellow-400',
    'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] text-green-400'
];

export const TeacherGame: React.FC<TeacherGameProps> = ({
    state, board, currentQ, currentQIndex, questions, timeLeft, scores, onlineUsers, notes,
    startGame, nextStep, openProjectorMode, SoundControl, backgroundStyle, isPresenting, togglePresentation, onUpdateBoard, resetGame, enterLobby
}) => {
    const [isMusicMenuOpen, setIsMusicMenuOpen] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [zoomScale, setZoomScale] = useState(1);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 }); // Relative offset from initial position
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    const handleZoom = (delta: number) => {
        setZoomScale(prev => Math.min(Math.max(prev + delta, 0.5), 2.5));
    };

    const handleDragStart = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - zoomPos.x,
            y: e.clientY - zoomPos.y
        };
    };

    useEffect(() => {
        const handleDrag = (e: MouseEvent) => {
            if (!isDragging) return;
            setZoomPos({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            });
        };
        const handleDragEnd = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleDrag);
            window.addEventListener('mouseup', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDrag);
            window.removeEventListener('mouseup', handleDragEnd);
        };
    }, [isDragging]);
    const [showHistory, setShowHistory] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false); // Added confirmation state
    const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const currentMusicId = (board.settings?.quizMusic as string) || 'lofi';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMusicMenuOpen(false);
                stopPreview();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => stopPreview();
    }, []);

    const stopPreview = () => {
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
        }
        setPreviewTrackId(null);
    };

    const handlePreview = (trackId: string, url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (previewTrackId === trackId) {
            stopPreview();
        } else {
            stopPreview();
            const audio = new Audio(url);
            audio.volume = 0.5;
            audio.play().catch(e => console.error("Preview failed", e));
            previewAudioRef.current = audio;
            setPreviewTrackId(trackId);
            audio.onended = () => setPreviewTrackId(null);
        }
    };

    const handleSelectMusic = (trackId: string) => {
        onUpdateBoard({
            settings: {
                ...board.settings,
                quizMusic: trackId
            }
        });
    };

    // Dynamic Mesh Gradient for "2026" feel
    const quizBackground = {
        background: 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)',
        backgroundColor: '#050505'
    };

    return (
        <div className="flex-1 relative overflow-hidden flex flex-col font-sans" style={quizBackground}>
            
            {/* Animated Mesh Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute top-[50%] left-[50%] w-64 h-64 bg-pink-600/20 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
            </div>

            {/* Music Controls (Floating) */}
            {!isPresenting && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[90]">
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsMusicMenuOpen(!isMusicMenuOpen)}
                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl"
                        >
                            <Music size={12} className="text-pink-400" />
                            <span>{MUSIC_TRACKS.find(t => t.id === currentMusicId)?.label || 'Music'}</span>
                        </button>

                        {isMusicMenuOpen && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 z-[100]">
                                <div className="p-3 border-b border-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">
                                    Vibe Selection
                                </div>
                                <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
                                    {MUSIC_TRACKS.map((track) => (
                                        <div 
                                            key={track.id} 
                                            onClick={() => handleSelectMusic(track.id)}
                                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors group ${currentMusicId === track.id ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentMusicId === track.id ? 'bg-pink-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                                                    <Volume2 size={14} />
                                                </div>
                                                <span className={`text-xs font-bold truncate ${currentMusicId === track.id ? 'text-white' : 'text-gray-400'}`}>
                                                    {track.label}
                                                </span>
                                            </div>
                                            
                                            <button
                                                onClick={(e) => handlePreview(track.id, track.url, e)}
                                                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${previewTrackId === track.id ? 'text-green-400' : 'text-gray-500 group-hover:text-white'}`}
                                            >
                                                {previewTrackId === track.id ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Top Actions - Simplified */}
            {(state === 'lobby' || state === 'leaderboard' || state === 'finished') && (
                <div className="absolute top-6 left-6 z-50 flex gap-2 items-center">
                    <button 
                        onClick={() => setShowHistory(true)}
                        className="bg-black/50 text-white px-5 py-2.5 rounded-full hover:bg-yellow-600 backdrop-blur-md border border-white/10 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95"
                        title="View History"
                    >
                        <Trophy size={14} /> History
                    </button>
                </div>
            )}


            {/* SCENE: LOBBY - Optimized for All Screens */}
            {state === 'lobby' && (
                <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-10">
                        <div 
                            className="flex flex-col items-center gap-6 lg:gap-12 max-w-7xl mx-auto w-full pt-4 pb-32 lg:pt-8 transition-transform duration-300 ease-out"
                            style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
                        >
                            <div className="text-center flex flex-col items-center gap-2 lg:gap-6 animate-in slide-in-from-top-10 duration-700">
                                <Logo size="lg" className="drop-shadow-2xl h-10 lg:h-16" />
                                <h1 className="text-3xl sm:text-5xl lg:text-[clamp(3rem,6vw,7rem)] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tighter drop-shadow-2xl leading-tight py-1 uppercase">
                                    join the game
                                </h1>
                                <div className="flex items-center justify-center gap-3 text-white/30 font-mono animate-in fade-in delay-300">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse delay-75"></span>
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse delay-150"></span>
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-[9px] lg:text-xs">Waiting for players...</span>
                                </div>
                            </div>

                            {/* Holographic Ticket */}
                            <div className="relative group perspective-1000 animate-in zoom-in duration-700 delay-200">
                                <div className="absolute -inset-10 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-[4rem] blur-3xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl lg:rounded-[3rem] p-4 lg:p-10 text-center w-full max-w-[18rem] lg:max-w-[30rem] transform transition-all hover:scale-[1.01] shadow-2xl ring-1 ring-white/5">
                                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                    <div className="text-[7px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 lg:mb-4">Access Code</div>
                                    <div className="text-4xl lg:text-7xl font-mono font-black text-white tracking-[0.05em] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] mb-2 lg:mb-8">
                                        {board.classCode}
                                    </div>
                                    <div className="flex flex-col items-center gap-1 pt-3 lg:pt-6 border-t border-white/5">
                                        <div className="text-[7px] lg:text-[8px] text-gray-400 font-black uppercase tracking-widest">Step 1: Go to</div>
                                        <div className="text-lg lg:text-2xl text-white font-black tracking-tight bg-white/5 px-4 lg:px-6 py-1 lg:py-2 rounded-lg lg:rounded-2xl border border-white/5 lowercase">
                                            {typeof window !== 'undefined' ? window.location.host : 'classboards.ai'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Players List (In scrollable area) */}
                            <div className="w-full max-w-5xl">
                                <div className="flex flex-wrap justify-center gap-3 lg:gap-4 p-2">
                                    {onlineUsers?.map((u, i) => (
                                        <div 
                                            key={i} 
                                            className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl font-bold text-sm lg:text-lg text-white shadow-xl animate-in zoom-in duration-300 hover:bg-white/10 hover:scale-105 transition-all cursor-default flex items-center gap-3" 
                                            style={{ animationDelay: `${i * 30}ms` }}
                                        >
                                            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
                                            {u.user}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Action Footer - Always Visible */}
                    <div className="flex-none p-3 lg:p-5 bg-black/60 backdrop-blur-2xl border-t border-white/10 relative z-20">
                        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 lg:p-3 bg-blue-500/10 rounded-lg lg:rounded-xl border border-blue-500/20">
                                    <Users size={16} className="text-blue-400 lg:w-6 lg:h-6" />
                                </div>
                                <div>
                                    <div className="text-xl lg:text-3xl font-black text-white tabular-nums leading-none">{onlineUsers?.length || 0}</div>
                                    <div className="text-[7px] lg:text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Players Joined</div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={startGame} 
                                className="group relative bg-white text-black px-6 lg:px-12 py-2.5 lg:py-4 rounded-lg lg:rounded-2xl font-black text-sm lg:text-xl shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 lg:gap-3 overflow-hidden ring-1 lg:ring-2 ring-white/10"
                            >
                                <span className="relative z-10">START GAME</span>
                                <Play fill="currentColor" size={14} className="relative z-10 lg:w-5 lg:h-5" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* SCENE: QUESTION & REVEAL */}
            {(state === 'question' || state === 'reveal') && currentQ && (
                <div className="flex-1 flex flex-col relative z-10">
                    {/* Timer Bar */}
                    {state === 'question' && (
                        <div className="w-full h-2 bg-white/5 relative overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-200 ease-linear ${timeLeft <= 5 ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' : 'bg-blue-500 shadow-[0_0_20px_#3b82f6]'}`}
                                style={{ width: `${(timeLeft / currentQ.timeLimit) * 100}%` }}
                            ></div>
                        </div>
                    )}

                    <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-white font-bold">
                                {currentQIndex + 1}
                            </div>
                            <span className="text-gray-500 font-bold text-sm uppercase tracking-wide">Question {currentQIndex + 1} of {questions.length}</span>
                        </div>
                        {state === 'question' ? (
                            <div className="flex items-center gap-2 text-white font-mono font-bold bg-white/5 px-4 py-1 rounded-full border border-white/10">
                                <Hourglass size={16} className={timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'} />
                                {timeLeft}s
                            </div>
                        ) : (
                            <button onClick={nextStep} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2">
                                Next <SkipForward size={16} fill="currentColor"/>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                        <div 
                            className="flex flex-col items-center p-4 lg:p-8 gap-4 lg:gap-10 pb-40 transition-transform duration-300 ease-out"
                            style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
                        >
                            {/* Question Card */}
                            <div className="w-full max-w-5xl text-center px-4 animate-in slide-in-from-top-6 duration-500">
                                <h2 className="text-[clamp(1rem,2.5vw,2rem)] font-black text-white leading-tight drop-shadow-2xl tracking-tight">
                                    {currentQ.question}
                                </h2>
                            </div>
                            
                            {/* Question Media */}
                            {currentQ.mediaUrl && (
                                <div className="w-full max-w-xl min-h-[100px] max-h-[30vh] bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group shrink-0">
                                    {currentQ.mediaUrl.includes('youtube.com') || currentQ.mediaUrl.includes('youtu.be') ? (
                                        <iframe 
                                            src={currentQ.mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                                            className="w-full h-full border-0 min-h-[180px]"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowFullScreen
                                        />
                                    ) : (
                                        <img 
                                            src={currentQ.mediaUrl} 
                                            alt="Question Media" 
                                            className="w-full h-full object-contain max-h-[30vh]"
                                            onError={(e) => {
                                                (e.target as any).style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                            )}
 
                            {/* Answer Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4 w-full max-w-6xl">
                                {currentQ.options.map((opt, idx) => {
                                    const isCorrect = idx === currentQ.correctIndex;
                                    const isReveal = state === 'reveal';
                                    
                                    const dim = isReveal && !isCorrect;
                                    const highlight = isReveal && isCorrect;
 
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`
                                                relative rounded-xl lg:rounded-2xl flex items-center p-3 lg:p-5 transition-all duration-500 border-2
                                                ${dim ? 'opacity-30 scale-95 grayscale border-transparent bg-white/5' : 'opacity-100 scale-100'}
                                                ${highlight ? 'bg-green-500/20 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]' : (!isReveal ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/5 border-transparent')}
                                            `}
                                        >
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 lg:w-3 rounded-l-xl lg:rounded-l-2xl ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                            
                                            <div className="ml-3 lg:ml-6 flex items-center gap-3 lg:gap-6 w-full">
                                                <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center text-lg lg:text-xl font-black shrink-0 ${idx === 0 ? 'text-red-400 bg-red-500/10' : idx === 1 ? 'text-blue-400 bg-blue-500/10' : idx === 2 ? 'text-yellow-400 bg-yellow-500/10' : 'text-green-400 bg-green-500/10'}`}>
                                                    {SHAPES[idx % 4]}
                                                </div>
                                                <span className="text-sm lg:text-[clamp(0.9rem,1.8vw,1.6rem)] font-bold text-white drop-shadow-md leading-tight">{opt}</span>
                                            </div>
 
                                            {isReveal && isCorrect && (
                                                <div className="absolute right-3 lg:right-6 bg-green-500 text-black p-1 lg:p-1.5 rounded-full shadow-xl animate-bounce">
                                                    <CheckCircle2 size={18} className="lg:w-6 lg:h-6" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SCENE: LEADERBOARD */}
            {(state === 'leaderboard' || state === 'finished') && (
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-10">
                    <div className="flex flex-col items-center gap-4 mb-8">
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                            <button 
                                onClick={() => setShowHistory(false)}
                                className={`px-8 py-2 rounded-xl font-bold text-sm transition-all ${!showHistory ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Leaderboard
                            </button>
                            <button 
                                onClick={() => setShowHistory(true)}
                                className={`px-8 py-2 rounded-xl font-bold text-sm transition-all ${showHistory ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Session History
                            </button>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 tracking-tight drop-shadow-[0_0_30px_rgba(234,179,8,0.3)] uppercase">
                            {showHistory ? 'All-Time Results' : (state === 'finished' ? 'Final Standings' : 'Top Players')}
                        </h1>
                    </div>

                    <div className="w-full max-w-4xl space-y-3">
                        {!showHistory ? (
                            scores.slice(0, 5).map(({ name, score, streak }, idx) => (
                                <div 
                                    key={idx} 
                                    className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl transform transition-all hover:scale-105 hover:bg-white/10 animate-in slide-in-from-bottom-10 fade-in duration-500 group"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-orange-400 text-black' : 'bg-white/10 text-white'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-bold text-white group-hover:text-pink-200 transition-colors flex items-center gap-3">
                                                {name}
                                                {streak > 1 && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-[10px] font-black animate-pulse border border-orange-500/30">
                                                        <Flame size={12} fill="currentColor" /> {streak} STREAK
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-white/50 group-hover:text-white transition-colors tabular-nums">{score}</div>
                                </div>
                            ))
                        ) : (
                            // Render History
                            Object.entries(
                                notes.filter(n => n.type === 'quiz_answer' && (n.title?.includes('_Q') || n.title?.includes('Q_')))
                                    .reduce((acc: any, n) => {
                                        const sId = n.title?.includes('_Q') ? n.title?.split('_')[0] : 'legacy';
                                        if (!acc[sId]) acc[sId] = [];
                                        acc[sId].push(n);
                                        return acc;
                                    }, {})
                            )
                            .sort((a: any, b: any) => b[0].localeCompare(a[0])) // Newest sessions first
                            .map(([sId, sNotes]: [string, any]) => {
                                    const sessionAnswers = sNotes.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
                                    const playerMap: Record<string, { name: string, score: number }> = {};
                                    
                                    // Process question by question for Rank Bonus
                                    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
                                        const q = questions[qIdx];
                                        const qAnswers = sessionAnswers.filter((n: any) => n.title === `${sId}_Q${qIdx}`);
                                        
                                        let correctRank = 0;
                                        qAnswers.forEach((n: any) => {
                                            if (!playerMap[n.author_id]) playerMap[n.author_id] = { name: n.author, score: 0 };
                                            
                                            const isCorrect = Number(n.content) === Number(q.correctIndex);
                                            
                                            // Calculate streak up to this question
                                            let streak = 0;
                                            for (let prev = qIdx - 1; prev >= 0; prev--) {
                                                const prevQ = questions[prev];
                                                const prevAns = sessionAnswers.find((pa: any) => pa.author_id === n.author_id && pa.title === `${sId}_Q${prev}`);
                                                if (prevAns && Number(prevAns.content) === Number(prevQ.correctIndex)) streak++;
                                                else break;
                                            }

                                            const points = calculatePoints(
                                                q.pointsType || 'standard',
                                                0, // Time remaining (not stored in history)
                                                q.timeLimit * 1000,
                                                isCorrect,
                                                streak,
                                                correctRank
                                            );

                                            playerMap[n.author_id].score += points.total;
                                            if (isCorrect) correctRank++;
                                        });
                                    }
                                    const winner = Object.values(playerMap).sort((a: any, b: any) => b.score - a.score)[0] as any;
                                const date = sId.startsWith('S') ? new Date(parseInt(sId.substring(1))).toLocaleTimeString() : 'Legacy';

                                return (
                                    <div key={sId} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-colors">
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Session {date}</div>
                                            <div className="text-lg font-bold text-white">Winner: {winner?.name || 'Unknown'}</div>
                                        </div>
                                        <div className="text-xl font-black text-yellow-500">{winner?.score || 0} pts</div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="mt-16 flex gap-4">
                        {state === 'finished' ? (
                            <div className="flex flex-col items-center animate-bounce">
                                <Trophy size={80} className="text-yellow-400 mb-4 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
                                <div className="text-2xl font-bold text-yellow-200">Well Played!</div>
                            </div>
                        ) : (
                            <button 
                                onClick={nextStep} 
                                className="bg-white text-black px-12 py-4 rounded-full font-black text-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform flex items-center gap-3"
                            >
                                NEXT QUESTION <SkipForward fill="currentColor" size={24} />
                            </button>
                        )}
                    </div>
                </div>
            )}
            {/* History Modal (Overlay for Lobby/Questions) */}
            {showHistory && state !== 'leaderboard' && state !== 'finished' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <Trophy size={20} className="text-yellow-500" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Session History</h2>
                            </div>
                            <button 
                                onClick={() => setShowHistory(false)}
                                className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {Object.entries(
                                notes.filter(n => n.type === 'quiz_answer' && (n.title?.includes('_Q') || n.title?.includes('Q_')))
                                    .reduce((acc: any, n) => {
                                        const sId = n.title?.includes('_Q') ? n.title?.split('_')[0] : 'legacy';
                                        if (!acc[sId]) acc[sId] = [];
                                        acc[sId].push(n);
                                        return acc;
                                    }, {})
                            )
                            .sort((a: any, b: any) => b[0].localeCompare(a[0]))
                            .map(([sId, sNotes]: [string, any]) => {
                                const sessionAnswers = sNotes.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
                                const playerMap: Record<string, { name: string, score: number }> = {};
                                
                                for (let qIdx = 0; qIdx < questions.length; qIdx++) {
                                    const q = questions[qIdx];
                                    const qAnswers = sessionAnswers.filter((n: any) => n.title === `${sId}_Q${qIdx}`);
                                    
                                    let correctRank = 0;
                                    qAnswers.forEach((n: any) => {
                                        if (!playerMap[n.author_id]) playerMap[n.author_id] = { name: n.author, score: 0 };
                                        
                                        const isCorrect = Number(n.content) === Number(q.correctIndex);
                                        
                                        let streak = 0;
                                        for (let prev = qIdx - 1; prev >= 0; prev--) {
                                            const prevQ = questions[prev];
                                            const prevAns = sessionAnswers.find((pa: any) => pa.author_id === n.author_id && pa.title === `${sId}_Q${prev}`);
                                            if (prevAns && Number(prevAns.content) === Number(prevQ.correctIndex)) streak++;
                                            else break;
                                        }

                                        const points = calculatePoints(
                                            q.pointsType || 'standard',
                                            0,
                                            q.timeLimit * 1000,
                                            isCorrect,
                                            streak,
                                            correctRank
                                        );

                                        playerMap[n.author_id].score += points.total;
                                        if (isCorrect) correctRank++;
                                    });
                                }
                                const winner = Object.values(playerMap).sort((a: any, b: any) => b.score - a.score)[0] as any;
                                const date = sId.startsWith('S') ? new Date(parseInt(sId.substring(1))).toLocaleString() : 'Legacy Session';

                                return (
                                    <div key={sId} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-colors group">
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{date}</div>
                                            <div className="text-lg font-bold text-white group-hover:text-yellow-200 transition-colors">
                                                Winner: {winner?.name || 'Unknown'}
                                            </div>
                                        </div>
                                        <div className="text-2xl font-black text-yellow-500 tabular-nums">
                                            {winner?.score || 0} <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">pts</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {notes.filter(n => n.type === 'quiz_answer').length === 0 && (
                                <div className="text-center py-20">
                                    <div className="text-gray-500 font-bold mb-2">No game history yet.</div>
                                    <div className="text-gray-600 text-sm">Start a game to see results here!</div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-black/20 border-t border-white/5">
                            <button 
                                onClick={() => setShowHistory(false)}
                                className="w-full py-3 rounded-xl font-bold bg-white text-black hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <ShieldAlert size={32} className="text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">End Game?</h2>
                        <p className="text-gray-400 text-sm mb-8">This will return you to the setup screen. Session data will be saved in history.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowResetConfirm(false)} className="flex-1 px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
                            <button onClick={() => { setShowResetConfirm(false); resetGame(); }} className="flex-1 px-6 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 transition-colors">End Game</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Draggable Floating Zoom Controls */}
            <div 
                className="fixed top-24 right-8 z-[200] flex items-center gap-3 select-none"
                style={{ 
                    transform: `translate(${zoomPos.x}px, ${zoomPos.y}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
            >
                <div className="flex items-center gap-1 bg-black/80 backdrop-blur-2xl border border-white/20 rounded-full pl-1 pr-2 py-1 shadow-2xl ring-1 ring-white/10 group">
                    <div 
                        onMouseDown={handleDragStart}
                        className="p-2 cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 transition-colors"
                    >
                        <GripVertical size={16} />
                    </div>
                    <button onClick={() => handleZoom(-0.1)} className="p-2 text-white/60 hover:text-white transition-colors" title="Zoom Out">
                        <ZoomOut size={18} />
                    </button>
                    <div className="h-4 w-px bg-white/10 mx-1"></div>
                    <span className="text-[10px] font-black text-white/40 w-12 text-center uppercase tracking-tighter tabular-nums">
                        {Math.round(zoomScale * 100)}%
                    </span>
                    <div className="h-4 w-px bg-white/10 mx-1"></div>
                    <button onClick={() => handleZoom(0.1)} className="p-2 text-white/60 hover:text-white transition-colors" title="Zoom In">
                        <ZoomIn size={18} />
                    </button>
                    <button onClick={() => setZoomScale(1)} className="p-2 text-white/40 hover:text-white border-l border-white/10 ml-1 hover:bg-white/5 rounded-full transition-all" title="Reset Zoom">
                        <Search size={14} />
                    </button>
                </div>
                {isPresenting && (
                    <button onClick={() => togglePresentation(false)} className="bg-black/60 text-white p-4 rounded-full hover:bg-black/80 backdrop-blur-md border border-white/20 shadow-2xl transition-all hover:scale-110 active:scale-95">
                        <Minimize2 size={24} />
                    </button>
                )}
            </div>
        </div>
    );
};
