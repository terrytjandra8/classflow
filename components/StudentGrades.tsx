
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabaseClient';
import { Award, ChevronRight, Clock, MessageSquare, X, Search, Filter, ChevronDown, Eye, Printer, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { AssessmentQuestion, Board } from '../types';
import { AssessmentPrintView } from './Activities/Assessment/AssessmentPrintView';
import { parseMath, mapBoard } from '../utils/mappers';

interface StudentGradesProps {
    userId: string;
    onSelectBoard: (boardId: string) => void;
    theme: 'light' | 'dark';
    userClasses: string[]; 
    userName?: string;
}

interface GradedItem {
    boardId: string;
    boardTitle: string;
    className: string; 
    score: number;
    maxScore: number;
    submittedAt: string;
    feedbackCount: number;
    passed: boolean;
    questions: AssessmentQuestion[];
    submissionData: any;
}

export const StudentGrades: React.FC<StudentGradesProps> = ({ userId, onSelectBoard, theme, userClasses, userName = 'Student' }) => {
    const [grades, setGrades] = useState<GradedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<GradedItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('All Classes');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Print State
    const [isPrinting, setIsPrinting] = useState(false);
    const ipekaLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/ipeka.png').data.publicUrl;
    const ibLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/IB.png').data.publicUrl;

    useEffect(() => {
        fetchGrades();
    }, [userId]);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            // 1. Fetch all submissions by this student
            const { data: submissions, error } = await supabase
                .from('notes')
                .select('board_id, connections, created_at')
                .eq('author_id', userId)
                .eq('type', 'assessment_submission');

            if (error || !submissions) throw error;

            // 2. Filter for released grades only
            const releasedSubmissions = submissions.filter((sub: any) => {
                const data = sub.connections || {};
                // Check if graded OR manually released
                return data.graded === true && data.released === true;
            });

            if (releasedSubmissions.length === 0) {
                setGrades([]);
                setLoading(false);
                return;
            }

            // 3. Fetch board details for these submissions
            const boardIds = releasedSubmissions.map((s: any) => s.board_id);
            const { data: boards } = await supabase
                .from('boards')
                .select('*') 
                .in('id', boardIds);

            // Use mapBoard to correctly parse settings JSON and extract assessmentQuestions
            const mappedBoards: Board[] = (boards || []).map((b: any) => mapBoard(b));
            const boardMap = new Map<string, Board>(mappedBoards.map(b => [b.id, b]));

            // 4. Construct Grade Items
            const parsedGrades: GradedItem[] = releasedSubmissions.map((sub: any) => {
                const data = sub.connections;
                const board = boardMap.get(sub.board_id);
                
                // Extract questions from mapped board object
                const questions = board?.assessmentQuestions || [];
                
                // Calculate Max Score dynamically from QUESTIONS
                // Fallback to 100 only if questions are completely missing (which implies board fetch failure)
                let maxScore = 0;
                if (questions.length > 0) {
                    maxScore = questions.reduce((acc: number, q: any) => acc + (q.points || 0), 0);
                } else if (board?.gradingConfig?.maxScore) {
                    maxScore = board.gradingConfig.maxScore;
                } else {
                    maxScore = 100; // Final fallback
                }

                // Count feedback items
                const feedbackCount = data.grading 
                    ? Object.values(data.grading).filter((g: any) => g.feedback && g.feedback.trim() !== '').length 
                    : 0;

                return {
                    boardId: sub.board_id,
                    boardTitle: board?.title || 'Unknown Assessment (Board Hidden)',
                    className: board?.targetGrade || 'General',
                    score: data.score || 0,
                    maxScore: maxScore,
                    submittedAt: sub.created_at,
                    feedbackCount: feedbackCount,
                    passed: (data.score || 0) >= (maxScore * 0.6),
                    questions: questions,
                    submissionData: data
                };
            });

            // Sort by newest
            parsedGrades.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

            setGrades(parsedGrades);
        } catch (e) {
            console.error("Error fetching grades", e);
        } finally {
            setLoading(false);
        }
    };

    const filteredGrades = grades.filter(g => {
        const matchesSearch = g.boardTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = selectedClass === 'All Classes' || g.className === selectedClass;
        return matchesSearch && matchesClass;
    });

    // --- RENDER DETAIL MODAL ---
    const renderDetailModal = () => {
        if (!selectedItem) return null;

        const { questions, submissionData } = selectedItem;
        const answers = submissionData.answers || {};
        const grading = submissionData.grading || {};

        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div 
                    className={`w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden ${theme === 'light' ? 'bg-white text-slate-900' : 'bg-[#1a1a1a] text-white border border-white/10'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    
                    {/* Header */}
                    <div className={`p-6 border-b flex justify-between items-start shrink-0 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#161616] border-white/10'}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-bold">{selectedItem.boardTitle}</h2>
                                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${theme === 'light' ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-white/10 text-gray-400 border-white/10'}`}>
                                    {selectedItem.className}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Clock size={14} /> Submitted on {new Date(selectedItem.submittedAt).toLocaleDateString()} at {new Date(selectedItem.submittedAt).toLocaleTimeString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsPrinting(true)}
                                className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-gray-400'}`}
                                title="Print / PDF"
                            >
                                <Printer size={20} />
                            </button>
                            <div className="text-right border-l pl-4 border-gray-200 dark:border-white/10">
                                <div className="text-3xl font-black">{selectedItem.score} <span className="text-lg text-gray-400 font-medium">/ {selectedItem.maxScore}</span></div>
                                <div className={`text-xs font-bold uppercase tracking-wider ${selectedItem.passed ? 'text-green-500' : 'text-red-500'}`}>
                                    {selectedItem.passed ? 'Passed' : 'Needs Improvement'}
                                </div>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {questions.length === 0 ? (
                            <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                                <FileText size={40} className="mb-4 opacity-50"/>
                                <p>No questions data available.</p>
                                <p className="text-xs mt-2 text-gray-400">
                                    The board might be set to "Draft" without the proper permissions.<br/>
                                    Ask your teacher to update the system settings.
                                </p>
                            </div>
                        ) : (
                            questions.map((q, idx) => {
                                if (q.type === 'section') {
                                    return <h3 key={q.id} className="text-lg font-bold border-b border-gray-200 dark:border-white/10 pb-2 mt-6 text-blue-500 uppercase tracking-wide">{q.text}</h3>;
                                }

                                const qGrade = grading[q.id];
                                const studentAnswer = answers[q.id];
                                const maxPoints = q.points;
                                const earnedPoints = qGrade?.score ?? 0;
                                const feedback = qGrade?.feedback;

                                return (
                                    <div key={q.id} className={`p-5 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#111] border-white/5'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="text-xs font-bold text-gray-400 uppercase mb-1 block">Question {idx + 1}</span>
                                                <div 
                                                    className="text-base font-medium rich-text-content"
                                                    dangerouslySetInnerHTML={{ __html: parseMath(q.text) }}
                                                />
                                            </div>
                                            <div className={`px-3 py-1 rounded text-sm font-bold border ${earnedPoints === maxPoints ? 'bg-green-500/10 text-green-500 border-green-500/20' : (earnedPoints === 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20')}`}>
                                                {earnedPoints} / {maxPoints} pts
                                            </div>
                                        </div>

                                        <div className={`p-4 rounded-lg mb-4 ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-[#222] border border-white/5'}`}>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Your Answer</span>
                                            {q.type === 'mcq' ? (
                                                <p className={theme === 'light' ? 'text-slate-700' : 'text-gray-300'}>
                                                    {studentAnswer ? q.options?.[parseInt(studentAnswer)] : <span className="italic opacity-50">No Answer</span>}
                                                    {q.type === 'mcq' && q.correctAnswer && (
                                                        <span className="ml-2 text-xs text-gray-500">
                                                            (Correct Answer: {q.options?.[parseInt(q.correctAnswer)]})
                                                        </span>
                                                    )}
                                                </p>
                                            ) : (
                                                studentAnswer && (studentAnswer.startsWith('data:image') || studentAnswer.startsWith('http')) ? (
                                                    <img src={studentAnswer} alt="Answer" className="max-w-full h-auto rounded border border-white/10" />
                                                ) : (
                                                    <p className={`whitespace-pre-wrap ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
                                                        {studentAnswer || <span className="italic opacity-50">No Answer</span>}
                                                    </p>
                                                )
                                            )}
                                        </div>

                                        {feedback && (
                                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-2">
                                                <MessageSquare size={18} className="text-blue-400 shrink-0 mt-1" />
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-xs font-bold text-blue-400 uppercase block mb-1">Teacher Feedback</span>
                                                    <div 
                                                        className={`text-sm ${theme === 'light' ? 'text-blue-900' : 'text-blue-100'} rich-text-content leading-relaxed`}
                                                        dangerouslySetInnerHTML={{ __html: parseMath(feedback) }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`p-4 border-t flex justify-end ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#161616] border-white/10'}`}>
                        <button 
                            onClick={() => setSelectedItem(null)}
                            className={`px-6 py-2 rounded-lg font-bold transition-colors ${theme === 'light' ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300' : 'bg-white text-black hover:bg-gray-200'}`}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    if (loading) {
        return <div className="p-10 text-center text-gray-500 flex items-center justify-center h-full"><Award className="animate-spin mr-2" size={24}/> Loading grades...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in">
            {/* Hidden Print Container */}
            {isPrinting && selectedItem && (
                <AssessmentPrintView 
                    participants={[{
                        name: userName,
                        score: selectedItem.score,
                        data: selectedItem.submissionData
                    }]}
                    questions={selectedItem.questions}
                    ipekaLogoUrl={ipekaLogoUrl}
                    ibLogoUrl={ibLogoUrl}
                    className={selectedItem.className}
                    onAfterPrint={() => setIsPrinting(false)}
                />
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500 text-black rounded-xl shadow-lg shadow-green-900/20">
                        <Award size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black tracking-tight ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Gradebook</h2>
                        <p className="text-gray-500 text-sm font-medium">Review your performance and feedback.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={fetchGrades} 
                        className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-gray-400'}`}
                        title="Refresh"
                    >
                        <RefreshCw size={18} />
                    </button>

                    {/* Class Filter Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-[#1a1a1a] border-white/10 text-white hover:bg-white/5'}`}
                        >
                            <Filter size={14} className="text-gray-400"/>
                            {selectedClass}
                            <ChevronDown size={14} className="text-gray-500"/>
                        </button>
                        
                        {isFilterOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                                <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-20 animate-in fade-in zoom-in-95 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/10'}`}>
                                    <button 
                                        onClick={() => { setSelectedClass('All Classes'); setIsFilterOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 ${selectedClass === 'All Classes' ? 'text-green-500 font-bold' : 'text-gray-400'}`}
                                    >
                                        All Classes
                                    </button>
                                    {userClasses.map(cls => (
                                        <button 
                                            key={cls}
                                            onClick={() => { setSelectedClass(cls); setIsFilterOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 ${selectedClass === cls ? 'text-green-500 font-bold' : 'text-gray-400'}`}
                                        >
                                            {cls}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="relative flex-1 md:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                        <input 
                        type="text" 
                        placeholder="Search assessments..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`pl-9 pr-4 py-2 w-full rounded-lg text-sm outline-none focus:border-green-500 border transition-colors ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/10 text-white'}`}
                        />
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            {grades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 border rounded-xl border-dashed border-gray-500/20">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${theme === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}>
                        <Award size={40} className="text-gray-400" />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>No Grades Yet</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                        Once your teacher grades and releases your assessments, they will appear here.
                    </p>
                </div>
            ) : (
                <div className={`rounded-xl border overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1a1a1a] border-white/5'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className={`text-xs uppercase font-bold text-gray-500 ${theme === 'light' ? 'bg-gray-50' : 'bg-[#111]'}`}>
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">Assessment Name</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Submitted Date</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Feedback</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right">Score</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-100' : 'divide-white/5'}`}>
                                {filteredGrades.map((item) => {
                                    const percentage = item.maxScore > 0 ? Math.round((item.score / item.maxScore) * 100) : 0;
                                    
                                    return (
                                        <tr 
                                            key={item.boardId} 
                                            onClick={() => setSelectedItem(item)}
                                            onDoubleClick={() => setSelectedItem(item)}
                                            className={`group cursor-pointer transition-colors ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{item.boardTitle}</div>
                                                        <div className="text-[10px] text-gray-500">{item.className}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-500 font-medium font-mono text-xs">
                                                    {new Date(item.submittedAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-green-500/10 text-green-500 border-green-500/20`}>
                                                    <CheckCircle size={12}/> RELEASED
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                                                    <MessageSquare size={14} /> 
                                                    {item.feedbackCount > 0 ? `${item.feedbackCount} Comments` : 'None'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-lg font-black ${item.passed ? 'text-green-500' : 'text-red-500'}`}>
                                                        {percentage}%
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium">
                                                        {item.score} / {item.maxScore} pts
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className={`p-2 rounded-full transition-colors bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-white`}>
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredGrades.length === 0 && (
                            <div className="p-16 text-center text-gray-500 border-t border-white/5">
                                <p>No grades found matching your filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {renderDetailModal()}
        </div>
    );
};
