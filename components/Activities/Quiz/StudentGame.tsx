
import React from 'react';
import { QuizState, QuizQuestion, Note, Board } from '../../../types';
import { Settings, CheckCircle, XCircle, Flame, Music } from 'lucide-react';

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
    submitAnswer: (index: string) => void;
    SoundControl: React.FC;
    backgroundStyle: any;
}

const SHAPES = ['▲', '◆', '●', '■'];
const BTN_STYLES = [
    'border-red-500/50 bg-red-500/10 text-red-100 hover:bg-red-500/20 active:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
    'border-blue-500/50 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20 active:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    'border-yellow-500/50 bg-yellow-500/10 text-yellow-100 hover:bg-yellow-500/20 active:bg-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]',
    'border-green-500/50 bg-green-500/10 text-green-100 hover:bg-green-500/20 active:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
];

export const StudentGame: React.FC<StudentGameProps> = ({
    state, board, currentQ, timeLeft, hasAnswered, myStreak, myAnswerNote, scores, userId, submitAnswer, SoundControl, backgroundStyle
}) => {
    
    if (state === 'setup') {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#050505] text-white p-6 text-center relative overflow-hidden">
                <div className="absolute top-4 right-4"><SoundControl /></div>
                
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] animate-pulse"></div>
                </div>

                <div className="relative z-10 bg-white/5 backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 shadow-2xl max-w-sm w-full animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner border border-white/5">
                        <Settings size={32} className="text-gray-400 animate-spin-slow" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Get Ready</h2>
                    <p className="text-gray-400 text-sm">The game will begin shortly...</p>
                </div>
            </div>
        );
    }

    if (state === 'lobby') {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#050505] text-white p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 z-50"><SoundControl /></div>
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[500px] h-[500px] bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-full blur-[100px] animate-pulse"></div>
                </div>

                <div className="z-10 flex flex-col items-center animate-in zoom-in duration-500">
                    <div className="w-32 h-32 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(168,85,247,0.4)] rotate-6 animate-blob border border-white/20">
                        <span className="text-6xl drop-shadow-md">🚀</span>
                    </div>
                    <h2 className="text-4xl font-black mb-3 tracking-tight drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">You're In!</h2>
                    <div className="flex items-center gap-2 bg-white/5 px-5 py-2 rounded-full border border-white/10 backdrop-blur-md">
                        <Music size={14} className="text-pink-400 animate-bounce" />
                        <span className="text-sm font-bold text-gray-300">Waiting for start...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (state === 'question') {
        if (hasAnswered) {
            return (
                <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 relative overflow-hidden">
                    <div className="absolute top-4 right-4 z-50"><SoundControl /></div>
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-black pointer-events-none"></div>

                    {myStreak > 1 && (
                        <div className="absolute top-6 left-6 z-50 animate-in slide-in-from-left-4 fade-in">
                            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-4 py-2 rounded-full backdrop-blur-md">
                                <Flame size={20} className="text-orange-500 fill-orange-500 animate-fire" />
                                <span className="font-black text-orange-400 uppercase tracking-wider text-sm">{myStreak}x Streak</span>
                            </div>
                        </div>
                    )}

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-28 h-28 bg-white/5 rounded-full flex items-center justify-center mb-8 animate-bounce border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            <CheckCircle size={56} className="text-green-400 drop-shadow-lg" />
                        </div>
                        <h3 className="text-3xl font-black mb-2 tracking-tight">Answer Sent</h3>
                        <p className="text-gray-400 font-medium">Fingers crossed 🤞</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col bg-[#050505] p-6 gap-6 relative overflow-hidden">
                <div className="flex justify-between items-start z-20">
                    {myStreak > 1 ? (
                        <div className="flex items-center gap-1 bg-orange-900/20 px-3 py-1 rounded-full border border-orange-500/30">
                            <Flame size={14} className="text-orange-500 fill-orange-500" />
                            <span className="text-xs font-bold text-orange-400">{myStreak}</span>
                        </div>
                    ) : <div></div>}
                    
                    <div className="flex gap-3">
                        <div className={`px-4 py-1.5 rounded-full border font-mono font-bold text-sm flex items-center justify-center backdrop-blur-md shadow-lg transition-colors ${timeLeft <= 5 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-white/5 border-white/20 text-white'}`}>
                            {timeLeft}s
                        </div>
                        <SoundControl />
                    </div>
                </div>

                {board.showQuestionOnStudentDevice && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white/5 rounded-3xl border border-white/10 overflow-y-auto shadow-inner backdrop-blur-sm">
                        <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                            {currentQ?.question}
                        </h2>
                    </div>
                )}

                <div className={`grid grid-cols-2 gap-4 ${board.showQuestionOnStudentDevice ? 'h-auto pb-4' : 'flex-1'}`}>
                    {currentQ?.options.map((opt, idx) => (
                        <button 
                            key={idx}
                            onClick={() => submitAnswer(opt)}
                            className={`
                                ${BTN_STYLES[idx % 4]} 
                                border-2 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-100 active:scale-95
                                ${!board.showQuestionOnStudentDevice ? 'h-full' : 'h-32'}
                            `}
                        >
                            <span className="text-4xl mb-2 drop-shadow-md transform group-active:scale-90 transition-transform text-white/90">{SHAPES[idx % 4]}</span>
                            
                            {board.showQuestionOnStudentDevice && (
                                <span className="text-xs font-bold text-white/80 px-4 text-center line-clamp-2 w-full">{opt}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (state === 'reveal') {
        const isCorrect = myAnswerNote?.content === currentQ?.correct_answer;
        return (
            <div className={`h-full flex flex-col items-center justify-center ${isCorrect ? 'bg-green-600' : 'bg-red-600'} text-white transition-colors duration-500 relative overflow-hidden`}>
                <div className="absolute top-4 right-4 z-50"><SoundControl /></div>
                
                {isCorrect && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-white rounded-full animate-ping [animation-delay:0.2s]"></div>
                        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-300 rounded-full animate-ping [animation-delay:0.5s]"></div>
                    </div>
                )}

                <div className="scale-150 mb-8 transform transition-transform duration-500 hover:scale-175">
                    {isCorrect ? <CheckCircle size={80} className="animate-bounce drop-shadow-2xl text-white" /> : <XCircle size={80} className="animate-pulse drop-shadow-2xl text-white" />}
                </div>
                
                <div className="text-5xl font-black mb-6 tracking-tight drop-shadow-lg text-center uppercase">
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                </div>
                
                {isCorrect ? (
                    <div className="text-lg font-bold bg-black/20 px-8 py-3 rounded-full border border-white/20 backdrop-blur-md animate-in slide-in-from-bottom-4 shadow-xl">
                        +1000 Pts
                        {myStreak > 1 && <span className="ml-2 text-yellow-300 font-black tracking-wide">COMBO x{Math.min(myStreak, 5)}</span>}
                    </div>
                ) : (
                    <div className="text-lg font-medium opacity-80 bg-black/20 px-6 py-2 rounded-full">Keep going!</div>
                )}
            </div>
        );
    }

    const rankIndex = scores.findIndex(s => s.id === userId);
    const myRank = rankIndex !== -1 ? rankIndex + 1 : '-';
    const myScore = scores.find(s => s.id === userId)?.score || 0;
    const leaderScore = scores[0]?.score || 0;
    const diff = leaderScore - myScore;
    
    return (
        <div className="h-full flex flex-col bg-[#050505] text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 z-50"><SoundControl /></div>
            
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black"></div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-widest mb-10">
                    {state === 'finished' ? 'Final Result' : 'Current Rank'}
                </h2>
                
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 w-full max-w-xs shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    
                    <div className="text-center">
                        <div className="text-xs text-gray-400 uppercase font-bold mb-2">Rank</div>
                        <div className="text-7xl font-black text-white mb-6 tabular-nums tracking-tighter">#{myRank}</div>
                        
                        <div className="w-full h-px bg-white/10 mb-6"></div>
                        
                        <div className="text-xs text-gray-400 uppercase font-bold mb-1">Score</div>
                        <div className="text-3xl text-yellow-400 font-mono font-bold">{myScore}</div>
                    </div>
                </div>

                {rankIndex > 0 && (
                    <div className="mt-8 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full text-red-300 text-sm font-bold flex items-center gap-2 animate-pulse">
                        <span>-{diff}</span>
                        <span className="text-red-500/50">pts to lead</span>
                    </div>
                )}
            </div>
        </div>
    );
};
