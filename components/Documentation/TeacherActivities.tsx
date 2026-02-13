
import React from 'react';
import { Sparkles, Gamepad2, BarChart2, PlaySquare } from 'lucide-react';

export const TeacherActivities: React.FC = () => (
    <div className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8 last:border-0">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                <Sparkles size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Interactive Activities</h2>
        </div>
        <div className="space-y-4 text-slate-600 dark:text-gray-300 leading-relaxed">
            <p>Gamify your classroom with real-time modules:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400"><Gamepad2 size={18}/> Live Quiz</h4>
                    <p className="text-sm">Create competitive multiple-choice quizzes. Launch "Lobby Mode" to let students join via code, then run the game on a projector. Features a live leaderboard.</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400"><BarChart2 size={18}/> Live Polls</h4>
                    <p className="text-sm">Ask questions and get instant feedback. Supports bar charts and word clouds. Perfect for exit tickets and sentiment checks.</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 md:col-span-2 bg-green-500/5 hover:bg-green-500/10 transition-colors">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-green-600 dark:text-green-400"><PlaySquare size={18}/> Lesson Mode</h4>
                    <p className="text-sm">Combine slides, videos (YouTube), websites, Canva embeds, and ClassBoards into a sequential lesson flow. Guide students through the content step-by-step.</p>
                </div>
            </div>
        </div>
    </div>
);
