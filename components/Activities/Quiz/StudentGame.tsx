
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
                
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                    <div className="w-32 h-32 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl border border-white/20 rotate-6 animate-bounce">
                        <Star size={64} className="text-yellow-400 fill-yellow-400" />
                    </div>
                    <h2 className="text-5xl font-black mb-4 tracking-tighter drop-shadow-xl">Get Ready!</h2>
                    <p className="text-white/60 text-xl font-bold uppercase tracking-widest animate-pulse">Waiting for host to start...</p>
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
                <div className="h-full flex flex-col items-center justify-center bg-[#1368ce] text-white p-6 relative overflow-hidden">
                    <div className="absolute top-4 right-4 z-50"><SoundControl /></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-10 border-4 border-white/40 shadow-2xl animate-bounce">
                            <CheckCircle size={64} className="text-white drop-shadow-lg" />
                        </div>
                        <h3 className="text-5xl font-black mb-3 tracking-tighter drop-shadow-xl">Got it!</h3>
                        <p className="text-white/70 text-xl font-bold uppercase tracking-widest">Waiting for others...</p>
                        
                        {myStreak > 1 && (
                            <div className="mt-12 flex items-center gap-3 bg-orange-500 px-6 py-3 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4">
                                <Flame size={24} className="fill-white" />
                                <span className="font-black text-2xl tracking-tighter">{myStreak}x STREAK!</span>
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
                <div className="flex justify-between items-center z-20 relative">
                    <div className="flex gap-2">
                        {myStreak > 1 && (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 rounded-2xl text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-bounce">
                                <Flame size={18} className="fill-white" />
                                <span className="text-lg font-black tracking-tighter">{myStreak}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <div className={`px-6 py-2 rounded-2xl font-black text-xl shadow-2xl backdrop-blur-md border transition-all ${timeLeft <= 5 ? 'bg-red-500 border-red-400 text-white animate-pulse' : 'bg-white/5 border-white/10 text-white'}`}>
                            {timeLeft}s
                        </div>
                        <SoundControl />
                    </div>
                </div>

                {/* Question Area */}
                {board.showQuestionOnStudentDevice && (
                    <div className="relative z-10 text-center animate-in slide-in-from-top-4 duration-500">
                        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-2xl">
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
                <div className="relative z-10 grid grid-cols-2 gap-4 md:gap-6 flex-1 min-h-0">
                    {currentQ?.options.map((opt, idx) => {
                        const isSelected = localSelectedIdx === idx;
                        const isDisabled = isSubmitting || hasAnswered;

                        return (
                            <button 
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                disabled={isDisabled}
                                className={`
                                    relative rounded-[2rem] flex flex-col items-center justify-center p-6 transition-all duration-200 active:scale-95 border-2 group
                                    ${idx === 0 ? (isSelected ? 'bg-red-500 border-red-300' : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 active:bg-red-500/40') : 
                                      idx === 1 ? (isSelected ? 'bg-blue-500 border-blue-300' : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 active:bg-blue-500/40') : 
                                      idx === 2 ? (isSelected ? 'bg-yellow-500 border-yellow-300' : 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 active:bg-yellow-500/40') : 
                                      (isSelected ? 'bg-green-500 border-green-300' : 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 active:bg-green-500/40')}
                                    ${isDisabled && !isSelected ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}
                                `}
                            >
                                {/* Shape Indicator (Subtle) */}
                                <div className={`absolute top-6 left-6 text-2xl opacity-40 font-black pointer-events-none ${idx === 0 ? 'text-red-400' : idx === 1 ? 'text-blue-400' : idx === 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {SHAPES[idx % 4]}
                                </div>

                                <span className="relative z-10 text-xl md:text-3xl font-black text-white text-center leading-tight drop-shadow-lg break-words w-full pointer-events-none">
                                    {isSelected && isSubmitting ? 'Submitting...' : opt}
                                </span>
                                
                                {/* Glow Effect */}
                                <div className={`absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity blur-xl -z-10 pointer-events-none ${idx === 0 ? 'bg-red-500/30' : idx === 1 ? 'bg-blue-500/30' : idx === 2 ? 'bg-yellow-500/30' : 'bg-green-500/30'}`}></div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- REVEAL SCREEN ---
    if (state === 'reveal') {
        const isCorrect = myAnswerNote?.content === currentQ?.correctIndex.toString();
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
