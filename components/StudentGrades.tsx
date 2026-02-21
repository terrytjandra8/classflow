
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabaseClient';
import { Award, ChevronRight, Clock, MessageSquare, X, Search, Filter, ChevronDown, Eye, Printer, FileText, CheckCircle, RefreshCw, File, FileX } from 'lucide-react';
import { AssessmentQuestion, Board } from '../types';
import { AssessmentPrintView, PrintMode } from './Activities/Assessment/AssessmentPrintView';
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
    
    const [printRequest, setPrintRequest] = useState<{ mode: PrintMode } | null>(null);
    const [showPrintDropdown, setShowPrintDropdown] = useState(false);
    const printDropdownRef = useRef<HTMLDivElement>(null);

    const ipekaLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/ipeka.png').data.publicUrl;
    const ibLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/IB.png').data.publicUrl;

    useEffect(() => {
        fetchGrades();
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (printDropdownRef.current && !printDropdownRef.current.contains(event.target as Node)) {
                setShowPrintDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            const { data: submissions, error } = await supabase
                .from('notes')
                .select('board_id, connections, created_at')
                .eq('author_id', userId)
                .eq('type', 'assessment_submission');

            if (error || !submissions) throw error;

            const releasedSubmissions = submissions.filter((sub: any) => {
                const data = sub.connections || {};
                return data.graded === true && data.released === true;
            });

            if (releasedSubmissions.length === 0) {
                setGrades([]);
                setLoading(false);
                return;
            }

            const boardIds = releasedSubmissions.map((s: any) => s.board_id);
            const { data: boards } = await supabase.from('boards').select('*').in('id', boardIds);

            const mappedBoards: Board[] = (boards || []).map((b: any) => mapBoard(b));
            const boardMap = new Map<string, Board>(mappedBoards.map(b => [b.id, b]));

            const parsedGrades: GradedItem[] = releasedSubmissions.map((sub: any) => {
                const data = sub.connections;
                const board = boardMap.get(sub.board_id);
                const questions = board?.assessmentQuestions || [];
                let maxScore = questions.reduce((acc: number, q: any) => acc + (q.points || 0), 0) || board?.gradingConfig?.maxScore || 100;
                const feedbackCount = data.grading ? Object.values(data.grading).filter((g: any) => g.feedback && g.feedback.trim() !== '').length : 0;

                return {
                    boardId: sub.board_id,
                    boardTitle: board?.title || 'Unknown Assessment',
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

            parsedGrades.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
            setGrades(parsedGrades);
        } catch (e) {
            console.error("Error fetching grades", e);
        } finally {
            setLoading(false);
        }
    };
    
    const handlePrintRequest = (mode: PrintMode) => {
        setPrintRequest({ mode });
        setShowPrintDropdown(false);
    };

    const filteredGrades = grades.filter(g => 
        g.boardTitle.toLowerCase().includes(searchTerm.toLowerCase()) && 
        (selectedClass === 'All Classes' || g.className === selectedClass)
    );

    const renderDetailModal = () => {
        if (!selectedItem) return null;

        const { questions, submissionData } = selectedItem;
        const answers = submissionData.answers || {};
        const grading = submissionData.grading || {};
        const isGraded = submissionData.graded || submissionData.released;

        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div 
                    className={`w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden ${theme === 'light' ? 'bg-white text-slate-900' : 'bg-[#1a1a1a] text-white border border-white/10'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`p-6 border-b flex justify-between items-start shrink-0 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#161616] border-white/10'}`}>
                        <div>
                            <h2 className="text-2xl font-bold">{selectedItem.boardTitle}</h2>
                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                <Clock size={14} /> Submitted on {new Date(selectedItem.submittedAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative" ref={printDropdownRef}>
                                <button 
                                    onClick={() => setShowPrintDropdown(s => !s)}
                                    className={`p-2.5 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-gray-400'}`}
                                    title="Print / PDF"
                                >
                                    <Printer size={20} />
                                </button>
                                {showPrintDropdown && (
                                     <div className={`absolute top-full right-0 mt-2 w-64 rounded-xl shadow-xl border overflow-hidden z-20 animate-in fade-in zoom-in-95 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#2a2a2a] border-white/10'}`}>
                                        {isGraded && (
                                            <button onClick={() => handlePrintRequest('WITH_ANSWERS_AND_FEEDBACK')} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}>
                                                <FileText size={16} /> Print with Feedback
                                            </button>
                                        )}
                                        <button onClick={() => handlePrintRequest('WITH_ANSWERS')} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}>
                                            <File size={16} /> Print My Submission
                                        </button>
                                        <button onClick={() => handlePrintRequest('BLANK')} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}>
                                            <FileX size={16} /> Print Blank Paper
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="text-right border-l pl-4 border-gray-200 dark:border-white/10">
                                <div className="text-3xl font-black">{selectedItem.score} <span className="text-lg text-gray-400 font-medium">/ {selectedItem.maxScore} marks</span></div>
                                <div className={`text-xs font-bold uppercase tracking-wider ${selectedItem.passed ? 'text-green-500' : 'text-red-500'}`}>
                                    {selectedItem.passed ? 'Passed' : 'Needs Improvement'}
                                </div>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {
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
                                                {earnedPoints} / {maxPoints} marks
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
                        }
                    </div>
                    <div className={`p-4 border-t flex justify-end ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#161616] border-white/10'}`}>
                        <button onClick={() => setSelectedItem(null)} className={`px-6 py-2 rounded-lg font-bold transition-colors ${theme === 'light' ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300' : 'bg-white text-black hover:bg-gray-200'}`}>
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
            {printRequest && selectedItem && (
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
                    onAfterPrint={() => setPrintRequest(null)}
                    printMode={printRequest.mode}
                />
            )}
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
                                            className={`group cursor-pointer transition-colors ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold group-hover:text-green-400">{item.boardTitle}</div>
                                                <div className="text-xs text-gray-500">{item.className}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{new Date(item.submittedAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4"><span className="bg-green-500/10 text-green-400 text-[10px] font-bold uppercase px-2 py-1 rounded-full">RELEASED</span></td>
                                            <td className="px-6 py-4 text-gray-500 text-xs font-bold">{item.feedbackCount > 0 ? `${item.feedbackCount} Comments` : 'None'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-bold text-lg">{percentage}%</div>
                                                <div className="text-xs text-gray-500">{item.score}/{item.maxScore} marks</div>
                                            </td>
                                            <td className="px-6 py-4 text-right"><ChevronRight size={18} className="text-gray-500"/></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {renderDetailModal()}
        </div>
    );
};
