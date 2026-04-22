
import React, { useState, useRef, useEffect } from 'react';
import { QuizState, QuizQuestion, Board, Note } from '../../../types';
import { Play, SkipForward, Users, Trophy, CheckCircle, MonitorPlay, Minimize2, Music, Pause, Volume2, Gamepad2, Hourglass, XCircle, ShieldAlert, Edit2 } from 'lucide-react';
import { MUSIC_TRACKS } from '../../../hooks/useQuizAudio';

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
                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/20 transition-colors text-xs font-bold shadow-lg"
                        >
                            <Music size={14} className="text-pink-400" />
                            <span>{MUSIC_TRACKS.find(t => t.id === currentMusicId)?.label || 'Music'}</span>
                        </button>

                        {isMusicMenuOpen && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 z-[60]">
                                <div className="p-3 border-b border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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

            {/* Action Bar - Only show in Lobby or Results to avoid clutter during questions */}
            {(state === 'lobby' || state === 'leaderboard' || state === 'finished') && (
                <div className="absolute top-6 left-6 z-50 flex gap-2 items-center">
                <button 
                    onClick={() => {
                        if (window.confirm("Return to Setup? This will end the current session.")) {
                            resetGame();
                        }
                    }}
                    className="bg-black/50 text-white px-4 py-2 rounded-full hover:bg-purple-600 backdrop-blur-md border border-white/10 transition-colors flex items-center gap-2 font-bold text-xs shadow-xl"
                    title="Edit Quiz"
                >
                    <Edit2 size={16} /> Edit Quiz
                </button>
                <button 
                    onClick={() => setShowHistory(true)}
                    className="bg-black/50 text-white px-4 py-2 rounded-full hover:bg-yellow-600 backdrop-blur-md border border-white/10 transition-colors flex items-center gap-2 font-bold text-xs shadow-xl"
                    title="View History"
                >
                    <Trophy size={16} /> History
                </button>
                <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="bg-black/50 text-white p-2 rounded-full hover:bg-red-600 backdrop-blur-md border border-white/10 transition-colors shadow-xl"
                    title="End Game"
                >
                    <XCircle size={20} />
                </button>
            </div>
            )}

            {isPresenting && (
                <div className="absolute top-6 right-6 z-50 flex gap-2">
                    <SoundControl />
                    <button onClick={() => togglePresentation(false)} className="bg-black/50 text-white p-3 rounded-full hover:bg-black/80 backdrop-blur-md border border-white/10 transition-colors">
                        <Minimize2 size={24} />
                    </button>
                </div>
            )}

            {/* SCENE: LOBBY */}
            {state === 'lobby' && (
                <div className="flex-1 flex flex-col p-10 relative z-10">
                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-20 max-w-7xl mx-auto w-full">
                        <div className="flex-1 text-left space-y-8 animate-in slide-in-from-left-10 duration-700">
                            <h1 className="text-8xl md:text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tighter drop-shadow-2xl leading-[0.8]">
                                JOIN<br/>THE<br/>GAME
                            </h1>
                            <div className="flex items-center gap-4 text-white/50 font-mono text-xl animate-in fade-in delay-300">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></span>
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></span>
                                </div>
                                Waiting for players to join...
                            </div>
                        </div>

                        {/* Holographic Ticket */}
                        <div className="relative group perspective-1000 animate-in slide-in-from-right-10 duration-700">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 to-pink-600/30 rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                            <div className="relative bg-black/40 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-12 text-center w-96 transform transition-all hover:scale-[1.05] shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                <div className="text-sm font-black text-gray-500 uppercase tracking-[0.4em] mb-4">Class Code</div>
                                <div className="text-7xl font-mono font-black text-white tracking-widest drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] mb-8">
                                    {board.classCode}
                                </div>
                                <div className="flex flex-col items-center gap-2 pt-6 border-t border-white/10">
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Join now at</div>
                                    <div className="text-2xl text-white font-black tracking-tight">classboards.ai</div>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto w-full max-w-7xl mx-auto pt-10">
                        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                    <Users size={32} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-white tabular-nums">{onlineUsers?.length || 0}</div>
                                    <div className="text-xs text-gray-500 font-black uppercase tracking-[0.2em]">Players Ready</div>
                                </div>
                            </div>
                            <button 
                                onClick={startGame} 
                                className="group relative bg-white text-black px-16 py-6 rounded-2xl font-black text-2xl shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 overflow-hidden"
                            >
                                <span className="relative z-10">START GAME</span>
                                <Play fill="currentColor" size={24} className="relative z-10" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-4 max-h-48 overflow-y-auto custom-scrollbar p-2">
                            {onlineUsers?.map((u, i) => (
                                <div 
                                    key={i} 
                                    className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl font-bold text-lg text-white shadow-xl animate-in zoom-in duration-300 hover:bg-white/10 hover:scale-110 hover:border-white/20 transition-all cursor-default flex items-center gap-3" 
                                    style={{ animationDelay: `${i * 30}ms` }}
                                >
                                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
                                    {u.user}
                                </div>
                            ))}
                            {(!onlineUsers || onlineUsers.length === 0) && (
                                <div className="w-full text-center py-10 text-gray-600 font-bold italic">
                                    Tell your students to enter the code to join!
                                </div>
                            )}
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

                    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-10">
                        {/* Question Card */}
                        <div className="w-full max-w-5xl text-center">
                            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl tracking-tight">
                                {currentQ.question}
                            </h2>
                        </div>
                        
                        {/* Question Media */}
                        {currentQ.mediaUrl && (
                            <div className="w-full max-w-2xl h-64 md:h-80 bg-white/5 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
                                {currentQ.mediaUrl.includes('youtube.com') || currentQ.mediaUrl.includes('youtu.be') ? (
                                    <iframe 
                                        src={currentQ.mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                    />
                                ) : (
                                    <img 
                                        src={currentQ.mediaUrl} 
                                        alt="Question Media" 
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            (e.target as any).style.display = 'none';
                                            (e.target as any).nextSibling.style.display = 'flex';
                                        }}
                                    />
                                )}
                                <div className="hidden absolute inset-0 items-center justify-center text-gray-500 font-bold italic bg-white/5">
                                    Unsupported Media Format
                                </div>
                            </div>
                        )}

                        {/* Answer Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl flex-1 max-h-[50vh]">
                            {currentQ.options.map((opt, idx) => {
                                const isCorrect = idx === currentQ.correctIndex;
                                const isReveal = state === 'reveal';
                                
                                // Reveal Styling
                                const dim = isReveal && !isCorrect;
                                const highlight = isReveal && isCorrect;

                                return (
                                    <div 
                                        key={idx} 
                                        className={`
                                            relative rounded-3xl flex items-center p-8 transition-all duration-500 border-2
                                            ${dim ? 'opacity-30 scale-95 grayscale border-transparent bg-white/5' : 'opacity-100 scale-100'}
                                            ${highlight ? 'bg-green-500/20 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]' : (!isReveal ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/5 border-transparent')}
                                        `}
                                    >
                                        {/* Color Indicator Bar */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-3 rounded-l-3xl ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                        
                                        <div className="ml-6 flex items-center gap-6 w-full">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shrink-0 ${idx === 0 ? 'text-red-400 bg-red-500/10' : idx === 1 ? 'text-blue-400 bg-blue-500/10' : idx === 2 ? 'text-yellow-400 bg-yellow-500/10' : 'text-green-400 bg-green-500/10'}`}>
                                                {SHAPES[idx]}
                                            </div>
                                            <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">{opt}</span>
                                        </div>

                                        {isReveal && isCorrect && (
                                            <div className="absolute right-6 bg-green-500 text-black p-2 rounded-full shadow-xl animate-bounce">
                                                <CheckCircle size={32} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
                            scores.slice(0, 5).map(({ name, score }, idx) => (
                                <div 
                                    key={idx} 
                                    className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl transform transition-all hover:scale-105 hover:bg-white/10 animate-in slide-in-from-bottom-10 fade-in duration-500 group"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-orange-400 text-black' : 'bg-white/10 text-white'}`}>
                                            {idx + 1}
                                        </div>
                                        <span className="text-2xl font-bold text-white group-hover:text-pink-200 transition-colors">{name}</span>
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
                                // Calculate winner for this session
                                const sessionScores: any = {};
                                sNotes.forEach((n: any) => {
                                    if (!sessionScores[n.author_id]) sessionScores[n.author_id] = { name: n.author, score: 0 };
                                    
                                    // Robust correctness check for history
                                    const qIdx = n.title?.includes('_Q') ? parseInt(n.title.split('_Q')[1]) : -1;
                                    const q = questions[qIdx];
                                    const isCorrect = q && Number(n.content) === Number(q.correctIndex);
                                    
                                    if (isCorrect) {
                                        sessionScores[n.author_id].score += 1000; 
                                    }
                                });
                                const winner = Object.values(sessionScores).sort((a: any, b: any) => b.score - a.score)[0] as any;
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
                                const sessionScores: any = {};
                                sNotes.forEach((n: any) => {
                                    if (!sessionScores[n.author_id]) sessionScores[n.author_id] = { name: n.author, score: 0 };
                                    
                                    // Robust correctness check for history
                                    const qIdx = n.title?.includes('_Q') ? parseInt(n.title.split('_Q')[1]) : -1;
                                    const q = questions[qIdx];
                                    const isCorrect = q && Number(n.content) === Number(q.correctIndex);
                                    
                                    if (isCorrect) {
                                        sessionScores[n.author_id].score += 1000; 
                                    }
                                });
                                const winner = Object.values(sessionScores).sort((a: any, b: any) => b.score - a.score)[0] as any;
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
        </div>
    );
};
