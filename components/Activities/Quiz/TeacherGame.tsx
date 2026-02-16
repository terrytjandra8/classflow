import React, { useState, useRef, useEffect } from 'react';
import { QuizState, QuizQuestion, Board } from '../../../types';
import { Play, SkipForward, Users, Trophy, CheckCircle, MonitorPlay, Minimize2, Music, Pause, Volume2, Gamepad2, Hourglass } from 'lucide-react';
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
}

const SHAPES = ['▲', '◆', '●', '■'];

export const TeacherGame: React.FC<TeacherGameProps> = ({
    state, board, currentQ, currentQIndex, questions, timeLeft, scores, onlineUsers, 
    startGame, nextStep, SoundControl, isPresenting, togglePresentation, onUpdateBoard
}) => {
    const [isMusicMenuOpen, setIsMusicMenuOpen] = useState(false);
    const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const currentMusicId = (board.settings?.quiz_music as string) || 'lofi';

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
                quiz_music: trackId
            }
        });
    };

    const quizBackground = {
        background: 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)',
        backgroundColor: '#050505'
    };

    return (
        <div className="flex-1 relative overflow-hidden flex flex-col font-sans" style={quizBackground}>
            
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute top-[50%] left-[50%] w-64 h-64 bg-pink-600/20 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
            </div>

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

            {isPresenting && (
                <div className="absolute top-6 right-6 z-50 flex gap-2">
                    <SoundControl />
                    <button onClick={() => togglePresentation(false)} className="bg-black/50 text-white p-3 rounded-full hover:bg-black/80 backdrop-blur-md border border-white/10 transition-colors">
                        <Minimize2 size={24} />
                    </button>
                </div>
            )}

            {state === 'lobby' && (
                <div className="flex-1 flex flex-col items-center justify-center p-10 relative z-10">
                    <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="text-left space-y-6">
                            <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tighter drop-shadow-2xl animate-in slide-in-from-left-10 duration-700">
                                JOIN<br/>THE<br/>GAME
                            </h1>
                            <div className="flex items-center gap-3 text-white/50 font-mono text-lg animate-in fade-in delay-300">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Waiting for players...
                            </div>
                        </div>

                        <div className="relative group perspective-1000">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-pink-600 rounded-3xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                            <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center w-80 transform transition-transform hover:scale-[1.02] shadow-2xl">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">Class Code</div>
                                <div className="text-6xl font-mono font-black text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                    {board.class_code}
                                </div>
                                <div className="mt-6 text-sm text-gray-400 border-t border-white/10 pt-4">
                                    Join at <span className="text-white font-bold">classboards.ai</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 w-full max-w-6xl">
                        <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-3 text-white">
                                <Users size={24} className="text-blue-400" />
                                <span className="text-2xl font-bold">{onlineUsers?.length || 0}</span>
                                <span className="text-sm text-gray-500 font-bold uppercase tracking-wide">Ready</span>
                            </div>
                            <button 
                                onClick={startGame} 
                                className="bg-white text-black px-12 py-4 rounded-full font-black text-xl shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] transition-all flex items-center gap-3"
                            >
                                START <Play fill="currentColor" size={20} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {onlineUsers?.map((u, i) => (
                                <div 
                                    key={i} 
                                    className="bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full font-bold text-sm text-white shadow-lg animate-in zoom-in duration-300 hover:bg-white/10 hover:scale-105 transition-all cursor-default" 
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    {u.user}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {(state === 'question' || state === 'reveal') && currentQ && (
                <div className="flex-1 flex flex-col relative z-10">
                    {state === 'question' && (
                        <div className="w-full h-2 bg-white/5 relative overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-200 ease-linear ${timeLeft <= 5 ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' : 'bg-blue-500 shadow-[0_0_20px_#3b82f6]'}`}
                                style={{ width: `${(timeLeft / (currentQ.time_limit || 30)) * 100}%` }}
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
                        <div className="w-full max-w-5xl text-center">
                            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl tracking-tight">
                                {currentQ.question}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl flex-1 max-h-[50vh]">
                            {currentQ.options.map((opt, idx) => {
                                const isCorrect = opt === currentQ.correct_answer;
                                const isReveal = state === 'reveal';
                                
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

            {(state === 'leaderboard' || state === 'finished') && (
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-10">
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 mb-12 tracking-tight drop-shadow-[0_0_30px_rgba(234,179,8,0.3)] uppercase">
                        {state === 'finished' ? 'Final Standings' : 'Top Players'}
                    </h1>

                    <div className="w-full max-w-4xl space-y-3">
                        {scores.slice(0, 5).map(({ name, score }, idx) => (
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
                        ))}
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
        </div>
    );
};
