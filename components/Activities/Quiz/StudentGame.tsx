
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
// Kahoot-style bold colors
const BTN_COLORS = [
    'bg-[#e21b3c] active:bg-[#c61734] shadow-[0_8px_0_#9a1229]', // Red
    'bg-[#1368ce] active:bg-[#0f54a8] shadow-[0_8px_0_#0a4182]', // Blue
    'bg-[#d89e00] active:bg-[#b88600] shadow-[0_8px_0_#8c6a00]', // Yellow
    'bg-[#26890c] active:bg-[#1d6b09] shadow-[0_8px_0_#144a06]'  // Green
];

export const StudentGame: React.FC<StudentGameProps> = ({
    state, board, currentQ, timeLeft, hasAnswered, myStreak, myAnswerNote, scores, userId, submitAnswer, SoundControl, backgroundStyle, isSubmitting
}) => {
    
    // Local state for immediate feedback
    const [localSelectedIdx, setLocalSelectedIdx] = React.useState<number | null>(null);

    // Reset local selection when question changes
    React.useEffect(() => {
        setLocalSelectedIdx(null);
    }, [currentQ?.id]);

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
            <div className="h-full flex flex-col bg-[#0a0a0a] p-4 md:p-8 gap-6 relative overflow-hidden font-sans text-white">
                {/* Background Decoration */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>

                {/* Status Bar */}
                <div className="flex justify-between items-center z-20 relative px-2">
                    <div className="flex items-center gap-3">
                        {myStreak > 1 && (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 rounded-2xl text-white shadow-2xl ring-4 ring-orange-500/20 animate-bounce">
                                <Flame size={20} className="fill-white" />
                                <span className="text-xl font-black tracking-tighter">{myStreak}</span>
                            </div>
                        )}
                        <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Question {(board.currentQuestionIndex ?? 0) + 1}</div>
                    </div>
                    
                    <div className="flex gap-3 scale-110 origin-right">
                        <div className={`px-6 py-2.5 rounded-2xl font-black text-2xl shadow-2xl backdrop-blur-xl border-2 transition-all ${timeLeft <= 5 ? 'bg-red-600 border-red-400 text-white animate-pulse scale-110' : 'bg-black/40 border-white/10 text-white'}`}>
                            {timeLeft}s
                        </div>
                        <SoundControl />
                    </div>
                </div>

                {/* Question Area */}
                {board.showQuestionOnStudentDevice && (
                    <div className="relative z-10 text-center animate-in slide-in-from-top-6 duration-500 px-2">
                        <h2 className="text-2xl lg:text-4xl font-black text-white leading-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            {currentQ?.question}
                        </h2>
                    </div>
                )}
                
                {/* Media Area (Prominent) */}
                {board.showQuestionOnStudentDevice && currentQ?.mediaUrl && (
                    <div className="relative z-10 w-full flex-1 max-h-[35vh] min-h-[20vh] bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group">
                        {currentQ.mediaUrl.includes('youtube.com') || currentQ.mediaUrl.includes('youtu.be') ? (
                            <iframe 
                                src={currentQ.mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                                className="w-full h-full border-0"
                            />
                        ) : (
                            <img 
                                src={currentQ.mediaUrl} 
                                alt="Media" 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    (e.target as any).style.display = 'none';
                                    (e.target as any).nextSibling.style.display = 'flex';
                                }}
                            />
                        )}
                        <div className="hidden absolute inset-0 items-center justify-center text-gray-500 font-bold text-xs italic bg-white/5">
                            Unsupported Media
                        </div>
                    </div>
                )}
                
                {/* Large Answer Tiles - Modern Grid */}
                <div className="relative z-10 grid grid-cols-2 gap-3 lg:gap-6 flex-1 min-h-0 pb-4">
                    {currentQ?.options.map((opt, idx) => {
                        const isSelected = localSelectedIdx === idx;
                        const isDisabled = isSubmitting || hasAnswered;

                        return (
                            <button 
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                disabled={isDisabled}
                                className={`
                                    relative rounded-[1.5rem] lg:rounded-[2.5rem] flex flex-col items-center justify-center p-4 lg:p-8 transition-all duration-150 active:scale-90 border-t-2 border-x-2 border-b-8 group
                                    ${idx === 0 ? (isSelected ? 'bg-[#e21b3c] border-white/40' : 'bg-[#e21b3c] border-[#9a1229] hover:brightness-110') : 
                                      idx === 1 ? (isSelected ? 'bg-[#1368ce] border-white/40' : 'bg-[#1368ce] border-[#0a4182] hover:brightness-110') : 
                                      idx === 2 ? (isSelected ? 'bg-[#d89e00] border-white/40' : 'bg-[#d89e00] border-[#8c6a00] hover:brightness-110') : 
                                      (isSelected ? 'bg-[#26890c] border-white/40' : 'bg-[#26890c] border-[#144a06] hover:brightness-110')}
                                    ${isDisabled && !isSelected ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}
                                    ${isSelected ? 'translate-y-1 border-b-4' : 'translate-y-0'}
                                `}
                            >
                                <div className={`absolute top-4 left-4 lg:top-8 lg:left-8 text-2xl lg:text-4xl opacity-50 font-black pointer-events-none text-white drop-shadow-lg`}>
                                    {SHAPES[idx % 4]}
                                </div>

                                <span className={`relative z-10 font-black text-white text-center leading-tight drop-shadow-lg break-words w-full pointer-events-none transition-all ${opt.length > 50 ? 'text-sm lg:text-lg' : opt.length > 20 ? 'text-lg lg:text-2xl' : 'text-2xl lg:text-4xl'}`}>
                                    {isSelected && isSubmitting ? '...' : opt || SHAPES[idx]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- REVEAL SCREEN ---
    if (state === 'reveal') {
        const isCorrect = myAnswerNote && currentQ && Number(myAnswerNote.content) === Number(currentQ.correctIndex);
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
                        {isCorrect ? (
                            <div className="space-y-1">
                                <p className="text-xl font-black text-white/80">Great job!</p>
                                {myStreak > 1 && <p className="text-yellow-300 text-sm font-black tracking-[0.2em] uppercase">Streak Saved! 🔥</p>}
                            </div>
                        ) : (
                            <p className="text-xl font-bold text-white/70">Better luck next time!</p>
                        )}
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
                
                <div className="bg-white text-black p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] w-full max-w-sm relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#1368ce] text-white px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest shadow-xl">
                        Current Rank
                    </div>
                    
                    <div className="text-8xl font-black tracking-tighter mb-4">#{myRank}</div>
                    <div className="h-1 w-20 bg-gray-100 mx-auto mb-6 rounded-full"></div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Score</div>
                    <div className="text-4xl font-black text-purple-700 font-mono tracking-tight">{myScore.toLocaleString()}</div>
                </div>
            </div>
        </div>
    );
};
