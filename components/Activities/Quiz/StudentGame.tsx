
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
    state, board, currentQ, timeLeft, hasAnswered, myStreak, myAnswerNote, scores, userId, submitAnswer, SoundControl, backgroundStyle
}) => {
    
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
            <div className="h-full flex flex-col bg-[#f2f2f2] p-4 md:p-6 gap-4 md:gap-6 relative overflow-hidden font-sans">
                {/* Status Bar */}
                <div className="flex justify-between items-center z-20">
                    <div className="flex gap-2">
                        {myStreak > 1 && (
                            <div className="flex items-center gap-1 bg-orange-500 px-3 py-1.5 rounded-xl text-white shadow-lg">
                                <Flame size={16} className="fill-white" />
                                <span className="text-sm font-black tracking-tighter">{myStreak}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <div className={`px-6 py-2 rounded-2xl font-black text-lg shadow-xl transition-all ${timeLeft <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-gray-800'}`}>
                            {timeLeft}s
                        </div>
                        <SoundControl />
                    </div>
                </div>

                {/* Optional Question Area */}
                {board.showQuestionOnStudentDevice && (
                    <div className="bg-white rounded-2xl shadow-lg border-b-4 border-gray-200 p-6 text-center animate-in slide-in-from-top-4">
                        <h2 className="text-xl font-black text-gray-800 leading-tight">
                            {currentQ?.question}
                        </h2>
                    </div>
                )}

                {/* Large Answer Tiles */}
                <div className="flex-1 grid grid-cols-2 gap-4 md:gap-6 pb-4">
                    {currentQ?.options.map((opt, idx) => (
                        <button 
                            key={idx}
                            onClick={() => submitAnswer(idx)}
                            className={`
                                ${BTN_COLORS[idx % 4]} 
                                rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-75 active:translate-y-2 active:shadow-none
                            `}
                        >
                            <span className="text-6xl md:text-8xl text-white opacity-40 font-black select-none pointer-events-none transform group-hover:scale-110 transition-transform">
                                {SHAPES[idx % 4]}
                            </span>
                            
                            {board.showQuestionOnStudentDevice && (
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-black/10 backdrop-blur-sm border-t border-white/10">
                                    <span className="text-sm md:text-lg font-black text-white line-clamp-2 drop-shadow-md">{opt}</span>
                                </div>
                            )}
                        </button>
                    ))}
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
