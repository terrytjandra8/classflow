
import React from 'react';
import { Layout, Sparkles, BarChart2, Gamepad2, ArrowRight, PlaySquare, Lock } from 'lucide-react';
import { BoardFormat, Board, Note, AiRecipe } from '../../types';

interface MakeProps {
    onCreateBoard: (format: BoardFormat, templateData?: Partial<Board>, initialNotes?: Note[]) => void;
    theme?: 'light' | 'dark';
}

export const Make: React.FC<MakeProps> = ({ onCreateBoard, theme }) => {
    return (
        <div className={`animate-fade-in max-w-7xl mx-auto p-6 md:p-10 min-h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-[#111111]'}`}>
            <h2 className={`text-3xl font-bold mb-8 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Make a board</h2>
            
            {/* Section 0: Interactive Activities (NEW) */}
            <div className="mb-10">
                <h3 className="text-yellow-500 font-bold text-sm uppercase mb-4 flex items-center gap-2 tracking-wide">
                    <Sparkles size={16} /> Interactive Activities <span className="text-[10px] bg-yellow-500/20 px-1.5 rounded text-yellow-500 border border-yellow-500/30">NEW</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Lesson Card */}
                    <button 
                        onClick={() => onCreateBoard('lesson', { title: 'New Lesson', icon: '📺' })}
                        className="bg-gradient-to-br from-green-900 to-green-700 rounded-xl p-6 relative overflow-hidden h-48 border border-white/10 group text-left w-full transition-all hover:scale-[1.02] hover:shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <PlaySquare size={100} className="text-white" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-2xl font-bold text-white">Lesson</h3>
                                    <div className="p-2 bg-white/10 rounded-lg"><PlaySquare className="text-green-200" /></div>
                                </div>
                                <p className="text-green-100 text-sm max-w-sm">Sequential slides with videos, polls, and content.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-green-200 group-hover:text-white">
                                Create Lesson <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Poll Card */}
                    <button 
                        onClick={() => onCreateBoard('poll', { title: 'New Poll', icon: '📊' })}
                        className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-6 relative overflow-hidden h-48 border border-white/10 group text-left w-full transition-all hover:scale-[1.02] hover:shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BarChart2 size={100} className="text-white" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-2xl font-bold text-white">Live Poll</h3>
                                    <div className="p-2 bg-white/10 rounded-lg"><BarChart2 className="text-blue-200" /></div>
                                </div>
                                <p className="text-blue-100 text-sm max-w-sm">Real-time voting, bar charts, and word clouds.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-200 group-hover:text-white">
                                Create Poll <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Quiz Card */}
                    <button 
                        onClick={() => onCreateBoard('quiz', { title: 'New Quiz', icon: '🏆' })}
                        className="bg-gradient-to-br from-purple-900 to-purple-700 rounded-xl p-6 relative overflow-hidden h-48 border border-white/10 group text-left w-full transition-all hover:scale-[1.02] hover:shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Gamepad2 size={100} className="text-white" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-2xl font-bold text-white">Game Quiz</h3>
                                    <div className="p-2 bg-white/10 rounded-lg"><Gamepad2 className="text-purple-200" /></div>
                                </div>
                                <p className="text-purple-100 text-sm max-w-sm">Competitive multiple-choice games with leaderboards.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-purple-200 group-hover:text-white">
                                Create Quiz <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Assessment Card (NEW) */}
                    <button 
                        onClick={() => onCreateBoard('assessment', { title: 'New Assessment', icon: '🔒' })}
                        className="bg-gradient-to-br from-red-900 to-red-700 rounded-xl p-6 relative overflow-hidden h-48 border border-white/10 group text-left w-full transition-all hover:scale-[1.02] hover:shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Lock size={100} className="text-white" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-2xl font-bold text-white">Assessment</h3>
                                    <div className="p-2 bg-white/10 rounded-lg"><Lock className="text-red-200" /></div>
                                </div>
                                <p className="text-red-100 text-sm max-w-sm">Secure test environment with Focus Guard.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-red-200 group-hover:text-white">
                                Create Assessment <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Section 1: Start from scratch */}
            <div className="mb-10">
                <h3 className={`font-bold text-sm uppercase mb-4 flex items-center gap-2 tracking-wide ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                    <Layout size={16} /> Boards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Blank Board Card */}
                    <div className="bg-gradient-to-r from-pink-800 to-pink-600 rounded-xl p-6 relative overflow-hidden h-48 border border-white/10 group">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Blank board</h3>
                                <p className="text-pink-100 text-sm max-w-sm">A collaborative digital board for collecting, organizing, and sharing thoughts.</p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => onCreateBoard('wall')} 
                                    className="bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors shadow-lg"
                                >
                                    Create new
                                </button>
                                <button className="text-xs font-bold text-pink-200 hover:text-white transition-colors">See examples</button>
                            </div>
                        </div>
                        {/* Decorative preview */}
                        <div className="absolute right-[-20px] top-10 opacity-30 rotate-3 scale-110 pointer-events-none group-hover:scale-115 group-hover:rotate-6 transition-transform duration-500">
                            <div className="grid grid-cols-2 gap-2 w-64">
                                <div className="bg-black/40 h-20 rounded-lg"></div>
                                <div className="bg-black/40 h-24 rounded-lg"></div>
                                <div className="bg-black/40 h-24 rounded-lg"></div>
                                <div className="bg-black/40 h-20 rounded-lg"></div>
                            </div>
                        </div>
                    </div>

                    {/* Blank Sandbox Card */}
                    <div className="bg-gradient-to-r from-orange-800 to-orange-600 rounded-xl p-6 relative overflow-hidden h-48 border border-white/10 group">
                        <div className="absolute top-6 right-6 px-2 py-0.5 border border-white/30 rounded text-[10px] font-bold text-white uppercase tracking-wider">Unlimited</div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Blank sandbox</h3>
                                <p className="text-orange-100 text-sm max-w-sm">A collaborative digital canvas with tools for drawing, writing, and adding media.</p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => onCreateBoard('canvas')} 
                                    className="bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors shadow-lg"
                                >
                                    Create new
                                </button>
                                <button className="text-xs font-bold text-orange-200 hover:text-white transition-colors">See examples</button>
                            </div>
                        </div>
                        {/* Decorative preview */}
                        <div className="absolute right-4 top-16 opacity-30 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                            <div className="relative w-40 h-32">
                                <div className="absolute top-0 right-10 text-white font-hand text-3xl rotate-[-10deg]">hello</div>
                                <div className="absolute bottom-5 left-0 w-8 h-8 rounded-full bg-purple-500"></div>
                                <div className="absolute top-5 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[15px] border-t-red-500 border-r-[10px] border-r-transparent rotate-12"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
