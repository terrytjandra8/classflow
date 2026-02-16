
import React, { useState } from 'react';
import { ExternalLink, Save, Gamepad2, BarChart2, Layout, PlaySquare, Award, Check, X } from 'lucide-react';
import { Board } from '../../types';

interface GradebookProps {
    theme: 'light' | 'dark';
    students: any[];
    grades: any[];
    boards: Board[];
    selectedClass: string;
    onSelectBoard: (boardId: string) => void;
    onUpdateGrade: (studentId: string, boardId: string, scoreStr: string) => void;
}

export const Gradebook: React.FC<GradebookProps> = ({ 
    theme, students, grades, boards, selectedClass, onSelectBoard, onUpdateGrade 
}) => {
    const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const handleMouseEnter = (e: React.MouseEvent, boardId: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
        setHoveredBoardId(boardId);
    };

    const handleMouseLeave = () => {
        setHoveredBoardId(null);
    };
    
    const relevantBoards = boards.filter(b => {
        if (selectedClass === 'All Classes') return true;
        return b.target_grade === selectedClass || b.target_grade === 'General' || !b.target_grade;
    });

    // Helper to normalize score for averages (converts to percentage 0-100 for consistent aggregate stats)
    const normalizeScore = (score: number, maxScore: number) => {
        if (maxScore <= 0) return 0;
        return (score / maxScore) * 100;
    };

    const getBoardAverage = (boardId: string) => {
        const board = boards.find(b => b.id === boardId);
        const maxScore = board?.grading_config?.max_score || 100;
        
        const boardGrades = grades.filter(g => g.board_id === boardId && students.some(s => s.id === g.student_id && s.role !== 'teacher'));
        if (boardGrades.length === 0) return null;
        
        const sum = boardGrades.reduce((acc, curr) => acc + normalizeScore(curr.score, maxScore), 0);
        return Math.round(sum / boardGrades.length);
    };

    const getStudentRowAverage = (studentId: string) => {
        const relevantGradeValues = relevantBoards
            .map(b => {
                const g = grades.find(g => g.student_id === studentId && g.board_id === b.id);
                if (!g || g.score === null) return null;
                const max = b.grading_config?.max_score || 100;
                return normalizeScore(g.score, max);
            })
            .filter(score => score !== null) as number[];
        
        if (relevantGradeValues.length === 0) return null;
        const sum = relevantGradeValues.reduce((a, b) => a + b, 0);
        return Math.round(sum / relevantGradeValues.length);
    };

    const hoveredBoard = boards.find(b => b.id === hoveredBoardId);

    const getBoardIcon = (format: string) => {
        switch (format) {
            case 'quiz': return <Gamepad2 size={12} className="text-purple-500" />;
            case 'poll': return <BarChart2 size={12} className="text-blue-500" />;
            case 'lesson': return <PlaySquare size={12} className="text-green-500" />;
            default: return <Layout size={12} className="text-gray-400" />;
        }
    };

    const getColumnStyle = (format: string) => {
        const isDark = theme === 'dark';
        switch (format) {
            case 'quiz': 
                return isDark 
                    ? 'bg-purple-900/10 border-b-2 border-b-purple-600' 
                    : 'bg-purple-50 border-b-2 border-b-purple-300';
            case 'poll': 
                return isDark 
                    ? 'bg-blue-900/10 border-b-2 border-b-blue-600' 
                    : 'bg-blue-50 border-b-2 border-b-blue-300';
            case 'lesson':
                return isDark
                    ? 'bg-green-900/10 border-b-2 border-b-green-600'
                    : 'bg-green-50 border-b-2 border-b-green-300';
            default: return '';
        }
    };

    const getBadge = (format: string) => {
        if (format === 'quiz') return <span className="text-[9px] font-bold bg-purple-500 text-white px-1.5 py-0.5 rounded ml-1 uppercase">Quiz</span>;
        if (format === 'poll') return <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded ml-1 uppercase">Poll</span>;
        if (format === 'lesson') return <span className="text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded ml-1 uppercase">Lesson</span>;
        return null;
    };

    const handleBinaryToggle = (studentId: string, boardId: string, currentScore: number | null | undefined, maxScore: number) => {
        // Toggle logic: If currently Pass (Max), set Fail (0). If Fail (0), set Pass (Max). If Null, set Pass.
        // Actually typical toggle: Null -> Pass -> Fail -> Null ? Or just Pass/Fail toggles.
        // Let's implement simplified buttons in render instead of complex toggle logic here.
        // But for direct row updates:
        const newScore = (currentScore === maxScore) ? '0' : maxScore.toString();
        onUpdateGrade(studentId, boardId, newScore);
    };

    return (
        <div className={`rounded-xl border overflow-hidden animate-fade-in ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg">Gradebook - {selectedClass}</h3>
                    <p className="text-xs text-gray-500">Grading for {relevantBoards.length} items and {students.length} students.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-xs font-bold bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-2">
                        Live Data
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto pb-24"> 
                 <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className={`text-xs uppercase font-bold text-gray-500 ${theme === 'light' ? 'bg-gray-50' : 'bg-[#1a1a1a]'}`}>
                            <th className={`px-4 py-3 border-r border-b border-gray-200 dark:border-white/5 sticky left-0 z-10 min-w-[200px] ${theme === 'light' ? 'bg-gray-50' : 'bg-[#1a1a1a]'}`}>
                                Student
                            </th>
                            {relevantBoards.map(b => (
                                <th 
                                    key={b.id} 
                                    onClick={() => onSelectBoard(b.id)}
                                    onMouseEnter={(e) => handleMouseEnter(e, b.id)}
                                    onMouseLeave={handleMouseLeave}
                                    className={`px-4 py-3 border-b border-gray-200 dark:border-white/5 min-w-[180px] max-w-[220px] cursor-pointer hover:opacity-80 transition-all group align-top ${getColumnStyle(b.format)}`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            {getBoardIcon(b.format)}
                                            <div className="truncate w-full font-bold flex items-center">
                                                <span className="truncate">{b.title}</span>
                                            </div>
                                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 shrink-0"/>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            {getBadge(b.format)}
                                            <span className="text-[9px] text-gray-400 font-normal">
                                                Max: {b.grading_config?.max_score || 100}
                                            </span>
                                        </div>
                                    </div>
                                </th>
                            ))}
                            <th className="px-4 py-3 border-b border-l border-gray-200 dark:border-white/5 bg-blue-500/5 text-blue-500 text-center w-[80px] align-middle">
                                Total Avg
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {students.length === 0 ? (
                            <tr><td colSpan={relevantBoards.length + 2} className="text-center py-8 text-gray-500">No students found in {selectedClass}.</td></tr>
                        ) : (
                            students.map(student => {
                                 if (student.role === 'teacher') return null;
                                 const rowAvg = getStudentRowAverage(student.id);
                                 
                                 return (
                                    <tr key={student.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className={`px-4 py-3 font-bold border-r border-gray-200 dark:border-white/5 sticky left-0 z-10 ${theme === 'light' ? 'bg-white group-hover:bg-gray-50' : 'bg-[#1a1a1a] group-hover:bg-[#222]'}`}>
                                            <div className="flex flex-col">
                                                <span>{student.full_name}</span>
                                                <span className="text-[10px] text-gray-400 font-normal">{student.email}</span>
                                            </div>
                                        </td>
                                        {relevantBoards.map(b => {
                                            const grade = grades.find(g => g.student_id === student.id && g.board_id === b.id);
                                            const config = b.grading_config || { mode: 'numeric', max_score: 100 };
                                            
                                            return (
                                                <td key={b.id} className={`px-4 py-3 p-0 relative group/cell border-r border-gray-100 dark:border-white/5 last:border-r-0 align-middle ${b.format === 'quiz' ? (theme === 'light' ? 'bg-purple-50/30' : 'bg-purple-900/5') : ''}`}>
                                                    <div className="relative w-full h-full flex items-center justify-center p-2">
                                                        {config.mode === 'binary' ? (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => onUpdateGrade(student.id, b.id, config.max_score.toString())}
                                                                    className={`w-8 h-8 rounded flex items-center justify-center transition-all ${grade?.score === config.max_score ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                                                                    title="Pass"
                                                                >
                                                                    <Check size={14} strokeWidth={3} />
                                                                </button>
                                                                <button
                                                                    onClick={() => onUpdateGrade(student.id, b.id, '0')}
                                                                    className={`w-8 h-8 rounded flex items-center justify-center transition-all ${grade?.score === 0 ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                                                                    title="Fail"
                                                                >
                                                                    <X size={14} strokeWidth={3} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <input 
                                                                    type="number" 
                                                                    min="0" 
                                                                    max={config.max_score}
                                                                    value={grade?.score ?? ''}
                                                                    onChange={(e) => onUpdateGrade(student.id, b.id, e.target.value)} 
                                                                    placeholder="-" 
                                                                    className="w-full h-full bg-transparent text-center outline-none focus:bg-blue-500/10 focus:font-bold transition-colors py-2 rounded appearance-none"
                                                                />
                                                                {grade?.score !== undefined ? (
                                                                    <div className="absolute right-2 opacity-0 group-hover/cell:opacity-100 pointer-events-none">
                                                                        {grade.score >= (config.max_score * 0.75) ? <Award size={12} className="text-green-500" /> : <Save size={10} className="text-gray-400"/>}
                                                                    </div>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 font-bold text-center bg-blue-500/5 text-blue-500 border-l border-gray-200 dark:border-white/5 align-middle">
                                            {rowAvg !== null ? `${rowAvg}%` : '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {students.length > 0 && (
                        <tfoot className={`text-xs font-bold uppercase ${theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-[#222] text-gray-300'}`}>
                            <tr>
                                <td className={`px-4 py-3 border-r border-gray-200 dark:border-white/10 sticky left-0 z-10 text-right ${theme === 'light' ? 'bg-gray-100' : 'bg-[#222]'}`}>
                                    Board Average
                                </td>
                                {relevantBoards.map(b => {
                                    const avg = getBoardAverage(b.id);
                                    return (
                                        <td key={b.id} className="px-4 py-3 text-center border-r border-gray-200 dark:border-white/10 last:border-r-0">
                                            {avg !== null ? `${avg}%` : '-'}
                                        </td>
                                    );
                                })}
                                <td className="px-4 py-3 text-center bg-blue-500/10 text-blue-500 border-l border-gray-200 dark:border-white/10">
                                    -
                                </td>
                            </tr>
                        </tfoot>
                    )}
                 </table>
            </div>

            {hoveredBoard && (
                <div 
                    className="fixed z-[9999] pointer-events-none"
                    style={{ 
                        top: tooltipPos.y, 
                        left: Math.min(Math.max(tooltipPos.x, 140), window.innerWidth - 140), 
                        transform: 'translateX(-50%)' 
                    }}
                >
                    <div className="relative mt-2 w-64 p-4 bg-[#1a1a1a] border border-white/10 text-white text-xs rounded-xl shadow-2xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a1a] border-l border-t border-white/10 rotate-45"></div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                            {getBoardIcon(hoveredBoard.format)}
                            {hoveredBoard.title}
                        </div>
                        <p className="text-gray-300 leading-relaxed font-normal normal-case whitespace-normal">
                            {hoveredBoard.description || 'No description provided.'}
                        </p>
                        <div className="flex gap-2 mt-1">
                            {getBadge(hoveredBoard.format)}
                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-gray-400">{hoveredBoard.format}</span>
                            <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                                Max: {hoveredBoard.grading_config?.max_score || 100}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
