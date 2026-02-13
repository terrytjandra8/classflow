
import React from 'react';
import { Users, PieChart, TrendingUp, Award, GraduationCap, ChevronRight } from 'lucide-react';
import { Board, ClassGroup } from '../../types';
import { Gradebook } from './Gradebook';

interface OverviewProps {
    theme: 'light' | 'dark';
    totalStudents: number;
    activeBoards: number;
    avgParticipation: number;
    avgGPA: number;
    highEngagementCount: number;
    medEngagementCount: number;
    classes: ClassGroup[];
    // Gradebook Props passed down
    students: any[];
    grades: any[];
    boards: Board[];
    selectedClass: string;
    onSelectBoard: (boardId: string) => void;
    onUpdateGrade: (studentId: string, boardId: string, scoreStr: string) => void;
    onNavigateToGradebook: () => void;
}

export const Overview: React.FC<OverviewProps> = ({ 
    theme, totalStudents, activeBoards, avgParticipation, avgGPA, 
    highEngagementCount, medEngagementCount, classes,
    students, grades, boards, selectedClass, onSelectBoard, onUpdateGrade, onNavigateToGradebook
}) => {
    
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className={`p-4 md:p-5 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={20} /></div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold">{totalStudents}</h3>
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Total Students</p>
                </div>
                <div className={`p-4 md:p-5 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><PieChart size={20} /></div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold">{activeBoards}</h3>
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Active Boards</p>
                </div>
                <div className={`p-4 md:p-5 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg"><Award size={20} /></div>
                        <span className="text-[10px] md:text-xs font-bold text-green-500 flex items-center gap-1"><TrendingUp size={12} /> Live</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold">{avgParticipation}%</h3>
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Participation</p>
                </div>
                <div className={`p-4 md:p-5 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg"><GraduationCap size={20} /></div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold">{avgGPA > 0 ? `${avgGPA}%` : '-'}</h3>
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Avg. Score</p>
                </div>
            </div>

            {/* Middle Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Engagement Pie Chart */}
                <div className={`lg:col-span-1 p-6 rounded-xl border flex flex-col items-center justify-center ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                    <h3 className="w-full text-left font-bold mb-6 text-sm uppercase text-gray-500">Student Engagement</h3>
                    <div className="relative w-48 h-48 rounded-full" style={{ 
                        background: totalStudents > 0 ? `conic-gradient(#10b981 0% ${highEngagementCount/totalStudents * 100}%, #f59e0b ${highEngagementCount/totalStudents * 100}% ${(highEngagementCount + medEngagementCount)/totalStudents * 100}%, #ef4444 ${(highEngagementCount + medEngagementCount)/totalStudents * 100}% 100%)` : '#333'
                    }}>
                        <div className={`absolute inset-4 rounded-full flex items-center justify-center flex-col ${theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}`}>
                            <span className="text-3xl font-bold">{highEngagementCount}</span>
                            <span className="text-xs text-gray-400 font-bold uppercase">Highly Active</span>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-6 w-full justify-center">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> High</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Med</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><div className="w-2 h-2 rounded-full bg-red-500"></div> Low</div>
                    </div>
                </div>

                {/* Activity Histogram */}
                <div className={`lg:col-span-2 p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                    <h3 className="font-bold mb-6 text-sm uppercase text-gray-500">Activity by Class</h3>
                    <div className="h-48 flex items-end gap-4 px-4 pb-2 border-b border-gray-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
                        {classes.map((cls) => {
                            // Robust check: case-insensitive match for enrolled classes, trimmed
                            const classStudents = students.filter(s => {
                                if (s.role === 'teacher') return false;
                                const enrolled = s.enrolled_classes || [];
                                return enrolled.some((c: string) => c.trim().toLowerCase() === cls.name.trim().toLowerCase());
                            });
                            
                            const count = classStudents.length;
                            const heightPercent = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
                            const displayHeight = Math.max(heightPercent, 10); 

                            return (
                                <div key={cls.id} className="flex-1 flex flex-col justify-end items-center gap-2 group min-w-[60px]">
                                    <div className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">{count}</div>
                                    <div 
                                        className="w-full bg-blue-500/20 hover:bg-blue-500 rounded-t-lg transition-all duration-500 relative overflow-hidden" 
                                        style={{ height: `${displayHeight}%` }}
                                    >
                                        <div className="absolute inset-0 bg-blue-500 opacity-20"></div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 truncate w-full text-center" title={cls.name}>{cls.name}</span>
                                </div>
                            );
                        })}
                        {classes.length === 0 && <p className="w-full text-center text-gray-500 text-xs mt-10">No classes created yet.</p>}
                    </div>
                </div>
            </div>

            {/* Gradebook Preview */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Recent Grades</h3>
                    <button 
                        onClick={onNavigateToGradebook}
                        className="text-sm font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                    >
                        View Full Gradebook <ChevronRight size={16} />
                    </button>
                </div>
                
                <Gradebook 
                    theme={theme}
                    students={students.slice(0, 5)} 
                    grades={grades}
                    boards={boards}
                    selectedClass={selectedClass}
                    onSelectBoard={onSelectBoard}
                    onUpdateGrade={onUpdateGrade}
                />
            </div>
        </div>
    );
};
