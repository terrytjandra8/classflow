
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
                    className={`w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden ${theme === 'light' ? 'bg-white text-slate-900 border border-slate-300' : 'bg-[#1a1a1a] text-white border border-white/10'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className={`p-6 border-b flex justify-between items-center shrink-0 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#161616] border-white/10'}`}>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black tracking-tight">{selectedItem.boardTitle}</h2>
                                {selectedItem.passed ? (
                                    <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">Passed</span>
                                ) : (
                                    <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest border border-red-500/20">Needs Improvement</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1 font-medium italic">
                                <Clock size={14} /> Submitted on {new Date(selectedItem.submittedAt).toLocaleString()}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 leading-none">
                                    {selectedItem.score} <span className="text-sm text-gray-500 font-bold uppercase">/ {selectedItem.maxScore} marks</span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Final Performance</p>
                            </div>

                            <div className="h-10 w-px bg-white/10 mx-2 hidden sm:block"></div>

                            <div className="flex items-center gap-2">
                                <div className="relative" ref={printDropdownRef}>
                                    <button 
                                        onClick={() => setShowPrintDropdown(s => !s)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${theme === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-white border border-white/5 shadow-sm'}`}
                                    >
                                        <Printer size={18} /> <span className="hidden sm:inline">Export</span> <ChevronDown size={14} className={`transition-transform ${showPrintDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showPrintDropdown && (
                                         <div className={`absolute top-full right-0 mt-2 w-64 rounded-xl shadow-2xl border overflow-hidden z-20 animate-in fade-in zoom-in-95 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#2a2a2a] border-white/10'}`}>
                                            {isGraded && (
                                                <>
                                                    <button onClick={() => handlePrintRequest('WITH_ANSWERS_AND_FEEDBACK')} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}>
                                                        <MessageSquare size={16} /> Print with Feedback
                                                    </button>
                                                    <button onClick={() => handlePrintRequest('WITH_ANSWERS_MODEL')} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}>
                                                        <FileText size={16} /> Print with Model Answers
                                                    </button>
                                                    <button onClick={() => handlePrintRequest('MODEL_ANSWER_ONLY')} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}>
                                                        <CheckCircle size={16} /> Print Model Answer Key
                                                    </button>
                                                </>
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
                                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors rounded-full">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Question List Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
                        {
                         questions.map((q, idx) => {
                                if (q.type === 'section') {
                                    return (
                                        <div key={q.id} className="pt-8 first:pt-0">
                                             <div 
                                                className="text-xl font-black border-b-2 border-blue-500/30 pb-2 text-blue-500 uppercase tracking-widest mb-4 rich-text-content"
                                                dangerouslySetInnerHTML={{ __html: parseMath(q.text) }}
                                             />
                                        </div>
                                    );
                                }

                                const qGrade = grading[q.id];
                                const studentAnswer = answers[q.id];
                                const maxPoints = q.points;
                                const earnedPoints = qGrade?.score ?? (q.type === 'mcq' && q.correctAnswer === studentAnswer ? maxPoints : 0);
                                const feedback = qGrade?.feedback;
                                const qNum = questions.filter((item, i) => i <= idx && item.type !== 'section').length;

                                return (
                                    <div key={q.id} className={`rounded-2xl border transition-all ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-transparent border-white/5 overflow-hidden'}`}>
                                        <div className={`px-5 py-3 border-b flex justify-between items-center ${theme === 'light' ? 'bg-white' : 'bg-white/5 border-white/5'}`}>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">QUESTION {qNum}</span>
                                            <div className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${earnedPoints === maxPoints ? 'bg-green-500/10 text-green-500 border-green-500/20' : (earnedPoints === 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20')}`}>
                                                {earnedPoints} / {maxPoints} marks
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-6">
                                            {/* Question Text */}
                                            <div 
                                                className="text-lg font-bold leading-relaxed rich-text-content"
                                                dangerouslySetInnerHTML={{ __html: parseMath(q.text) }}
                                            />

                                            {/* Comparison Grid */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {/* Left: Student Answer */}
                                                <div className={`p-5 rounded-xl border flex flex-col h-full ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-black/30 border-white/5'}`}>
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Your Submission</span>
                                                    <div className="flex-1 text-sm">
                                                        {q.type === 'mcq' ? (
                                                            <div className="space-y-4">
                                                                {q.options?.map((opt, oIdx) => {
                                                                    const val = oIdx.toString();
                                                                    const isSelected = studentAnswer === val;
                                                                    const isCorrect = q.correctAnswer === val;
                                                                    return (
                                                                        <div key={oIdx} className={`p-3 rounded-lg border flex items-center gap-3 ${isSelected ? (isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5') : 'border-white/5 opacity-60'}`}>
                                                                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? (isCorrect ? 'border-green-500' : 'border-red-500') : 'border-gray-600'}`}>
                                                                                {isSelected && <div className={`w-2 h-2 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />}
                                                                            </div>
                                                                            <div className="rich-text-content prose-sm" dangerouslySetInnerHTML={{ __html: parseMath(opt) }} />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {studentAnswer && (studentAnswer.startsWith('data:image') || (studentAnswer.startsWith('http') && !studentAnswer.includes('{'))) ? (
                                                                    <div className="mb-3 p-2 bg-white rounded-lg inline-block border border-gray-200 max-w-full overflow-hidden shadow-sm">
                                                                        <img src={studentAnswer} alt="Answer Drawing" className="max-w-full h-auto rounded focus:scale-110 transition-transform cursor-zoom-in" />
                                                                    </div>
                                                                ) : (() => {
                                                                    let text = studentAnswer;
                                                                    let drawing = null;
                                                                    try {
                                                                        const parsed = JSON.parse(studentAnswer);
                                                                        if (parsed && typeof parsed === 'object') {
                                                                            text = parsed.t || parsed.text || '';
                                                                            drawing = parsed.d || parsed.drawing || null;
                                                                        }
                                                                    } catch { /* not json */ }
                                                                    
                                                                    return (
                                                                        <div className="space-y-3">
                                                                            {drawing && (
                                                                                <div className="p-2 bg-white rounded-lg inline-block border border-gray-200 max-w-full overflow-hidden shadow-sm">
                                                                                    <img src={drawing} alt="Student Drawing" className="max-w-full h-auto rounded" />
                                                                                </div>
                                                                            )}
                                                                            <div className={`prose prose-invert prose-sm max-w-none ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
                                                                                {text ? <div dangerouslySetInnerHTML={{ __html: text }} /> : <span className="italic opacity-50">No Answer</span>}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right: Model Answer */}
                                                <div className={`p-5 rounded-xl border flex flex-col h-full bg-emerald-500/5 ${theme === 'light' ? 'border-emerald-200' : 'border-emerald-500/20'}`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Model Answer</span>
                                                        <FileText size={14} className="text-emerald-500 opacity-50" />
                                                    </div>
                                                    <div className="flex-1">
                                                        {q.type === 'mcq' ? (
                                                            <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                                <span className="text-[10px] font-black text-emerald-500 uppercase block mb-1">Correct Option</span>
                                                                <div className="text-emerald-50 font-bold" dangerouslySetInnerHTML={{ __html: q.options?.[parseInt(q.correctAnswer || '0')] || '' }} />
                                                            </div>
                                                        ) : (
                                                            <div 
                                                                className={`text-sm rich-text-content leading-relaxed ${theme === 'light' ? 'text-emerald-900' : 'text-emerald-100'}`}
                                                                dangerouslySetInnerHTML={{ __html: parseMath(q.modelAnswer || q.notes || '<em>No reference answer provided.</em>') }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Feedback Section (Full Width below) */}
                                            {feedback && (
                                                <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-xl flex gap-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                                        <MessageSquare size={20} className="text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block mb-2">Teacher Feedback & Guidance</span>
                                                        <div 
                                                            className={`text-sm ${theme === 'light' ? 'text-blue-900' : 'text-blue-100'} rich-text-content leading-relaxed`}
                                                            dangerouslySetInnerHTML={{ __html: parseMath(feedback) }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                    
                    {/* Modal Footer */}
                    <div className={`p-6 border-t flex justify-between items-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#161616] border-white/10'}`}>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Released by Teacher
                        </div>
                        <button 
                            onClick={() => setSelectedItem(null)} 
                            className={`px-10 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-gray-200 shadow-white/5'}`}
                        >
                            Close Report
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
                        id: userId,
                        name: userName,
                        score: selectedItem.score,
                        submittedAt: selectedItem.submittedAt,
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
                        data-tooltip="Refresh Grades"
                        data-tooltip-placement="bottom"
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
                                            className={`group cursor-pointer transition-colors ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
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
