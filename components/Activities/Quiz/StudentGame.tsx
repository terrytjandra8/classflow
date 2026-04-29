
import React from 'react';
import { QuizState, QuizQuestion, Note, Board } from '../../../types';
import { Settings, CheckCircle, XCircle, Flame, Music, Trophy, Star, Zap } from 'lucide-react';

interface StudentGameProps {
    state: QuizState | 'setup';
    board: Board;
    currentQ: QuizQuestion | undefined;
    timeLeft: number;
    hasAnswered: boolean;
    myStreak: number;
    myAnswerNote: Note | undefined;
    scores: any[];
    userId?: string;
    submitAnswer: (index: number) => void;
    SoundControl: React.FC;
    backgroundStyle: any;
    isSubmitting: boolean;
}

const SHAPES = ['▲', '◆', '●', '■'];

export const StudentGame: React.FC<StudentGameProps> = ({
    state, board, currentQ, timeLeft, hasAnswered, myStreak, myAnswerNote, scores, userId, submitAnswer, SoundControl, backgroundStyle, isSubmitting
}) => {

    // Local state for immediate feedback
    const [localSelectedIdx, setLocalSelectedIdx] = React.useState<number | null>(null);
    const [revealMessage, setRevealMessage] = React.useState('');

    // Zoom Logic
    const [zoomScale, setZoomScale] = React.useState(1);
    const [zoomPos, setZoomPos] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartPos = React.useRef({ x: 0, y: 0 });

    const handleZoom = (delta: number) => {
        setZoomScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
    };

    const handleDragStart = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX - zoomPos.x, y: e.clientY - zoomPos.y };
    };

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setZoomPos({
                x: e.clientX - dragStartPos.current.x,
                y: e.clientY - dragStartPos.current.y
            });
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Reset local selection when question changes
    React.useEffect(() => {
        setLocalSelectedIdx(null);
        setZoomScale(1);
        setZoomPos({ x: 0, y: 0 });
    }, [currentQ?.id]);

    React.useEffect(() => {
        if (state === 'reveal') {
            const correctMsgs = [
                "Genius move!", "On fire! 🔥", "Unstoppable!",
                "Pure brilliance!", "Perfectly executed!", "Absolute legend!"
            ];
            const incorrectMsgs = [
                "Almost had it!", "Stay focused, you got this!",
                "Shake it off, next one's yours!", "Nice try! Keep pushing!",
                "Mistakes are lessons! Go again!", "So close! Don't give up!"
            ];

            const submittedIndex = myAnswerNote ? Number(myAnswerNote.content) : localSelectedIdx;
            const isCorrect = submittedIndex !== null && currentQ && Number(submittedIndex) === Number(currentQ.correctIndex);

            const list = isCorrect ? correctMsgs : incorrectMsgs;
            setRevealMessage(list[Math.floor(Math.random() * list.length)]);
        }
    }, [state]);

    const handleAnswer = (idx: number) => {
        if (isSubmitting || hasAnswered) return;
        setLocalSelectedIdx(idx);
        submitAnswer(idx);
    };

    // --- SETUP SCREEN ---
    if (state === 'setup') {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#46178f] text-white p-6 text-center relative overflow-hidden font-sans">
                <div className="absolute top-4 right-4 z-50"><SoundControl /></div>

                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-400/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                    <div className="w-40 h-40 bg-white/5 backdrop-blur-3xl rounded-[3rem] flex items-center justify-center mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 rotate-6 animate-bounce">
                        <Star size={80} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                    </div>
                    <h2 className="text-6xl font-black mb-6 tracking-tighter drop-shadow-2xl">Get Ready!</h2>
                    <div className="bg-black/20 px-8 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                        <p className="text-white/80 text-lg font-black uppercase tracking-widest animate-pulse">Waiting for host...</p>
                    </div>
                </div>
            </div>
        );
    }

    // --- LOBBY SCREEN ---
    if (state === 'lobby') {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#46178f] text-white p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 z-50"><SoundControl /></div>

                <div className="z-10 flex flex-col items-center text-center animate-in zoom-in duration-500">
                    <div className="w-40 h-40 bg-white rounded-[3rem] flex items-center justify-center mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-white/50 rotate-3 transition-transform hover:rotate-0">
                        <span className="text-8xl select-none">🎮</span>
                    </div>
                    <h2 className="text-5xl font-black mb-4 tracking-tighter drop-shadow-2xl">You're In!</h2>
                    <p className="text-white/80 text-lg font-black mb-8 bg-black/20 px-6 py-2 rounded-full backdrop-blur-md border border-white/10 uppercase tracking-widest">
                        See your name on screen?
                    </p>
                    <div className="flex items-center gap-2 animate-bounce">
                        <Zap size={20} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-black uppercase tracking-widest">Waiting for Question 1</span>
                    </div>
                </div>
            </div>
        );
    }

    // --- QUESTION SCREEN ---
    if (state === 'question') {
        if (hasAnswered) {
            return (
                <div className="h-full flex flex-col items-center justify-center bg-[#1368ce] text-white p-8 relative overflow-hidden">
                    <div className="absolute top-6 right-6 z-50 scale-125 origin-top-right"><SoundControl /></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-40 h-40 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center mb-12 border-4 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] animate-bounce">
                            <CheckCircle size={80} className="text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)]" />
                        </div>
                        <h3 className="text-6xl font-black mb-4 tracking-tighter drop-shadow-2xl">Answered!</h3>
                        <p className="text-white/60 text-xl font-bold uppercase tracking-widest bg-black/20 px-8 py-2 rounded-full border border-white/10">Waiting for others...</p>

                        {myStreak > 1 && (
                            <div className="mt-16 flex items-center gap-4 bg-gradient-to-r from-orange-500 to-red-600 px-10 py-5 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                                <Flame size={32} className="fill-white" />
                                <span className="font-black text-3xl tracking-tighter">{myStreak}x STREAK!</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col bg-[#0a0a0a] relative overflow-hidden font-sans text-white">
                {/* Background Decoration */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
                
                {/* Status Bar - Fixed at top */}
                <div className="flex justify-between items-center z-20 relative p-4 bg-black/40 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-3">
                        {myStreak > 1 && (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1.5 rounded-xl text-white shadow-lg animate-bounce">
                                <Flame size={16} className="fill-white" />
                                <span className="text-sm font-black tracking-tighter">{myStreak}</span>
                            </div>
                        )}
                        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/50">Q{(board.currentQuestionIndex ?? 0) + 1}</div>
                    </div>

                    <div className="flex gap-2">
                        <div className={`px-4 py-1.5 rounded-xl font-black text-lg shadow-lg backdrop-blur-xl border transition-all ${timeLeft <= 5 ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-white/5 border-white/10 text-white'}`}>
                            {timeLeft}s
                        </div>
                        <SoundControl />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-3 pb-24">
                    <div 
                        className="flex flex-col gap-4 max-w-2xl mx-auto transition-transform duration-300 ease-out"
                        style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
                    >
                        {/* Question Area */}
                        <div className="text-center animate-in slide-in-from-top-6 duration-500">
                            <h2 className="text-[clamp(1rem,3vw,1.8rem)] font-black text-white leading-tight drop-shadow-2xl px-2">
                                {currentQ?.question}
                            </h2>
                        </div>

                        {/* Media Area */}
                        {currentQ?.mediaUrl && (
                            <div className="w-full max-h-[30vh] aspect-video bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shrink-0">
                                {currentQ.mediaUrl.includes('youtube.com') || currentQ.mediaUrl.includes('youtu.be') ? (
                                    <iframe
                                        src={currentQ.mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                        className="w-full h-full border-0 min-h-[150px]"
                                    />
                                ) : (
                                    <img
                                        src={currentQ.mediaUrl}
                                        alt="Media"
                                        className="w-full h-full object-contain max-h-[30vh]"
                                        onError={(e) => {
                                            (e.target as any).style.display = 'none';
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Answer Grid */}
                        <div className="grid grid-cols-2 gap-2 lg:gap-4">
                            {currentQ?.options.map((opt, idx) => {
                                const isSelected = localSelectedIdx === idx;
                                const isDisabled = isSubmitting || hasAnswered;

                                return (
                                    <button
                                        key={idx}
                                        onPointerDown={() => handleAnswer(idx)}
                                        disabled={isDisabled}
                                        className={`
                                            relative min-h-[80px] lg:min-h-[140px] rounded-xl lg:rounded-3xl flex flex-col items-center justify-center p-2 lg:p-6 transition-[transform,background-color,border-color] duration-150 active:scale-95 border-t-2 border-x-2 border-b-4 lg:border-b-8 group touch-none select-none
                                            ${idx === 0 ? (isSelected ? 'bg-[#e21b3c] border-white/60' : 'bg-[#e21b3c] border-[#9a1229]') :
                                                idx === 1 ? (isSelected ? 'bg-[#1368ce] border-white/60' : 'bg-[#1368ce] border-[#0a4182]') :
                                                    idx === 2 ? (isSelected ? 'bg-[#d89e00] border-white/60' : 'bg-[#d89e00] border-[#8c6a00]') :
                                                        (isSelected ? 'bg-[#26890c] border-white/60' : 'bg-[#26890c] border-[#144a06]')}
                                            ${isDisabled && !isSelected ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}
                                            ${isSelected ? 'translate-y-0.5 border-b-2 brightness-110 ring-2 ring-white/30' : 'translate-y-0 active:translate-y-1 active:border-b-2'}
                                        `}
                                    >
                                        <div className="absolute top-1 left-1 lg:top-4 lg:left-4 text-sm lg:text-2xl opacity-40 font-black text-white pointer-events-none">
                                            {SHAPES[idx % 4]}
                                        </div>

                                        <span className={`relative z-10 font-black text-white text-center leading-tight break-words w-full px-2 transition-all pointer-events-none ${opt.length > 40 ? 'text-[8px] lg:text-sm' : opt.length > 20 ? 'text-[10px] lg:text-lg' : 'text-xs lg:text-2xl'}`}>
                                            {isSelected && isSubmitting ? '...' : opt || SHAPES[idx]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Draggable Floating Zoom Controls */}
                <div 
                    className="fixed top-20 right-4 z-[200] flex items-center gap-3 select-none"
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
                            <span className="text-xs">⠿</span>
                        </div>
                        <button onClick={() => handleZoom(-0.1)} className="p-2 text-white/60 hover:text-white transition-colors" title="Zoom Out">
                            -
                        </button>
                        <div className="h-4 w-px bg-white/10 mx-1"></div>
                        <span className="text-[10px] font-black text-white/40 w-10 text-center uppercase tracking-tighter tabular-nums">
                            {Math.round(zoomScale * 100)}%
                        </span>
                        <div className="h-4 w-px bg-white/10 mx-1"></div>
                        <button onClick={() => handleZoom(0.1)} className="p-2 text-white/60 hover:text-white transition-colors" title="Zoom In">
                            +
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (state === 'reveal') {
        const submittedIndex = myAnswerNote ? Number(myAnswerNote.content) : localSelectedIdx;
        const isCorrect = submittedIndex !== null && currentQ && Number(submittedIndex) === Number(currentQ.correctIndex);

        return (
            <div className={`h-full flex flex-col items-center justify-center ${isCorrect ? 'bg-[#26890c]' : 'bg-[#e21b3c]'} text-white transition-colors duration-300 relative overflow-hidden`}>
                <div className="absolute top-4 right-4 z-50"><SoundControl /></div>

                <div className="z-10 flex flex-col items-center text-center animate-in zoom-in duration-300">
                    <div className="mb-8 p-6 bg-white/20 rounded-full backdrop-blur-xl border-4 border-white/40 shadow-2xl">
                        {isCorrect ? <CheckCircle size={100} className="text-white" /> : <XCircle size={100} className="text-white" />}
                    </div>

                    <h3 className="text-6xl font-black mb-4 tracking-tighter drop-shadow-2xl uppercase">
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                    </h3>

                    <div className="bg-black/20 px-10 py-4 rounded-3xl border-2 border-white/20 backdrop-blur-md shadow-2xl">
                        <div className="space-y-1">
                            <p className="text-xl font-black text-white/80">{revealMessage}</p>
                            {isCorrect && myStreak > 1 && <p className="text-yellow-300 text-sm font-black tracking-[0.2em] uppercase">Streak Saved! 🔥</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- LEADERBOARD / FINISHED ---
    const rankIndex = scores.findIndex(s => s.id === userId);
    const myRank = rankIndex !== -1 ? rankIndex + 1 : '-';
    const myScore = scores.find(s => s.id === userId)?.score || 0;

    return (
        <div className="h-full flex flex-col bg-[#46178f] text-white relative overflow-hidden font-sans">
            <div className="absolute top-4 right-4 z-50"><SoundControl /></div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 text-center">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-10 border-2 border-white/20">
                    <Trophy size={48} className="text-yellow-400" />
                </div>

                <h2 className="text-2xl font-black text-white/50 uppercase tracking-[0.2em] mb-12">
                    {state === 'finished' ? 'Game Finished' : 'You are at'}
                </h2>

                <div className="bg-white text-black p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] w-full max-w-sm relative mb-12">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#1368ce] text-white px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest shadow-xl">
                        Current Rank
                    </div>

                    <div className="text-8xl font-black tracking-tighter mb-4">#{myRank}</div>
                    <div className="h-1 w-20 bg-gray-100 mx-auto mb-6 rounded-full"></div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Score</div>
                    <div className="text-4xl font-black text-purple-700 font-mono tracking-tight">{myScore.toLocaleString()}</div>
                </div>

                <button
                    onClick={() => window.location.href = '/'}
                    className="group bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white px-10 py-5 rounded-[2rem] font-black text-xl transition-all active:scale-95 shadow-2xl flex items-center gap-3"
                >
                    EXIT TO HOME
                </button>
            </div>
        </div>
    );
};
