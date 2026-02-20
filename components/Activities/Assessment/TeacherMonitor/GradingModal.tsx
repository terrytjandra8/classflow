
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AssessmentQuestion } from '../../../../types';
import { X, Printer, FileText, File, FileX, Code, Trash2, AlertTriangle, User, ChevronDown, Check, Save } from 'lucide-react';
import { RichTextEditor, FormatState, getActiveFormat } from '../../../RichTextEditor';
import { PrintMode } from '../AssessmentPrintView';
import { parseMath } from '../../../../utils/mappers';

const getInitialAnswers = (participant: any) => participant?.data?.answers || {};
const getInitialGrades = (participant: any, questions: AssessmentQuestion[]) => {
    const initialGrades: Record<string, { score: number, feedback: string }> = {};
    const answers = participant?.data?.answers || {};
    questions.forEach(q => {
        if (q.type === 'section') return;
        const existingGrade = participant?.data?.grading?.[q.id];
        if (existingGrade) {
            initialGrades[q.id] = existingGrade;
        } else {
            const isCorrect = q.type === 'mcq' && answers[q.id] === q.correctAnswer;
            initialGrades[q.id] = { score: isCorrect ? q.points : 0, feedback: '' };
        }
    });
    return initialGrades;
};

interface GradingModalProps {
    isOpen: boolean;
    participant: any;
    onClose: () => void;
    questions: AssessmentQuestion[];
    onSave: (release: boolean) => void;
    onPrint: (mode: PrintMode, gradesSnapshot: Record<string, { score: number, feedback: string }>) => void;
    currentGrades: Record<string, { score: number, feedback: string }>;
    setCurrentGrades: (grades: Record<string, { score: number, feedback: string }>) => void;
    onAutoSave: (
        grades: Record<string, { score: number, feedback: string }>, 
        updatedAnswers?: Record<string, string>,
        retryQuestions?: string[],
        teacherOverrides?: Record<string, any>
    ) => Promise<void>;
}

export const GradingModal: React.FC<GradingModalProps> = ({ 
    isOpen, participant, onClose, questions, onSave, onPrint, currentGrades, setCurrentGrades, onAutoSave 
}) => {
    const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [printMenuOpen, setPrintMenuOpen] = useState(false);
    const [rawView, setRawView] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isOpen && participant) {
            setCurrentAnswers(getInitialAnswers(participant));
            setCurrentGrades(getInitialGrades(participant, questions));
            setIsDirty(false);
            setRawView({});
        }
    }, [isOpen, participant, questions, setCurrentGrades]);

    const debouncedAutoSave = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        return (grades: Record<string, { score: number, feedback: string }>, answers: Record<string, string>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                onAutoSave(grades, answers).then(() => setIsDirty(false));
            }, 1500);
        };
    }, [onAutoSave]);

    const handleAnswerChange = (qId: string, value: string) => {
        const newAnswers = { ...currentAnswers, [qId]: value };
        setCurrentAnswers(newAnswers);
        setIsDirty(true);
        debouncedAutoSave(currentGrades, newAnswers);
    };

    const handleGradeChange = (qId: string, score: number, feedback: string) => {
        const newGrades = { ...currentGrades, [qId]: { score, feedback } };
        setCurrentGrades(newGrades);
        setIsDirty(true);
        debouncedAutoSave(newGrades, currentAnswers);
    };
    
    const handleClearAnswer = (qId: string) => {
        if (window.confirm('Are you sure you want to permanently erase this student\'s answer? This cannot be undone.')) {
            const newAnswers = { ...currentAnswers, [qId]: '' };
            setCurrentAnswers(newAnswers);

            const newGrades = { ...currentGrades };
            if(newGrades[qId]) {
                newGrades[qId].score = 0;
            }
            setCurrentGrades(newGrades);
            
            setIsDirty(true);
            onAutoSave(newGrades, newAnswers);
        }
    };

    const totalScore = useMemo(() => {
        return Object.values(currentGrades).reduce((acc, curr) => acc + (curr?.score || 0), 0);
    }, [currentGrades]);

    if (!isOpen || !participant) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <User size={18}/> Grading: {participant.name}
                        </h3>
                        <p className="text-xs text-gray-400">Student ID: {participant.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                             <span className="text-xs font-bold text-gray-500 uppercase">Total Score</span>
                            <p className="font-bold text-green-500 text-2xl leading-none">{totalScore}</p>
                        </div>
                        <button onClick={() => onSave(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2">
                           <Save size={16}/> Save Grades
                        </button>
                        <button onClick={() => onSave(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 flex items-center gap-2">
                           <Check size={16}/> Save & Release
                        </button>
                        <div className="relative">
                            <button onClick={() => setPrintMenuOpen(p => !p)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 border border-white/10">
                                <Printer size={16} />
                            </button>
                            {printMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg shadow-xl border overflow-hidden z-50 bg-[#2a2a2a] border-white/10" onMouseLeave={() => setPrintMenuOpen(false)}>
                                    <button onClick={() => { onPrint('WITH_ANSWERS_AND_FEEDBACK', currentGrades); setPrintMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 flex items-center gap-2"><FileText size={14} /> Print Graded Paper</button>
                                    <button onClick={() => { onPrint('WITH_ANSWERS', currentGrades); setPrintMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 flex items-center gap-2"><File size={14} /> Print Student Submission</button>
                                    <button onClick={() => { onPrint('BLANK', currentGrades); setPrintMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 flex items-center gap-2"><FileX size={14} /> Print Blank Paper</button>
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-red-600/20 rounded-lg text-gray-300 hover:text-red-500 border border-white/10 hover:border-red-600/30">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {questions.map((q, index) => {
                        if (q.type === 'section') {
                            return <h3 key={q.id} className="text-xl font-bold text-white uppercase tracking-tight border-b border-white/10 pb-2 mt-8">{q.text}</h3>;
                        }

                        const qNum = questions.filter((item, i) => i <= index && item.type !== 'section').length;
                        const answer = currentAnswers[q.id];
                        const grade = currentGrades[q.id] || { score: 0, feedback: '' };
                        const isCorrect = q.type === 'mcq' && answer === q.correctAnswer;
                        const isRetry = participant.data?.retryQuestions?.includes(q.id);

                        return (
                            <div key={q.id} className={`p-4 rounded-xl bg-[#111] border ${isRetry ? 'border-orange-500/50' : 'border-white/10'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-blue-400">Question {qNum}</span>
                                        {isRetry && <span className="text-xs font-bold text-orange-400 bg-orange-900/50 px-2 py-0.5 rounded-full border border-orange-500/50">Revision</span>}
                                    </div>
                                    <span className="text-xs font-bold text-gray-500">{q.points} pts</span>
                                </div>
                                <div className="text-gray-300 mb-4 rich-text-content" dangerouslySetInnerHTML={{ __html: parseMath(q.text) }} />
                                
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Left Side: Student Answer */}
                                    <div>
                                        {q.type === 'mcq' ? (
                                            <div className="space-y-2">
                                                {q.options?.map((opt, optIdx) => {
                                                    const isSelected = answer === optIdx.toString();
                                                    const isCorrectOpt = q.correctAnswer === optIdx.toString();
                                                    let className = 'border-white/10 bg-black/20';
                                                    if (isSelected && isCorrectOpt) className = 'border-green-500 bg-green-900/30';
                                                    else if (isSelected && !isCorrectOpt) className = 'border-red-500 bg-red-900/30';
                                                    else if (isCorrectOpt) className = 'border-green-500/50';
                                                    
                                                    return (
                                                        <div key={optIdx} className={`p-3 rounded-lg border flex items-start gap-3 ${className}`}>
                                                            <div className="mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: isSelected ? '#3b82f6' : 'transparent', border: '2px solid ' + (isSelected ? '#3b82f6' : '#6b7280')}}>
                                                                {isSelected && <Check size={10} className="text-white"/>}
                                                            </div>
                                                            <div className="text-sm" dangerouslySetInnerHTML={{ __html: parseMath(opt) }} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-bold text-gray-400">Student's Answer</h4>
                                                    <button onClick={() => setRawView(p => ({...p, [q.id]: !p[q.id]}))} className="text-xs flex items-center gap-1 text-gray-500 hover:text-white">
                                                        <Code size={12}/> {rawView[q.id] ? 'Rich View' : 'Raw HTML'}
                                                    </button>
                                                    <button onClick={() => handleClearAnswer(q.id)} className="text-xs flex items-center gap-1 text-red-600 hover:text-white">
                                                        <Trash2 size={12}/> Clear
                                                    </button>
                                                </div>
                                                {rawView[q.id] ? (
                                                    <pre className="bg-black/50 p-3 rounded-lg text-xs whitespace-pre-wrap break-all border border-white/10"><code>{answer || ''}</code></pre>
                                                ) : (
                                                    (answer && answer.startsWith('http')) ? (
                                                        <img src={answer} className="max-w-full rounded-lg bg-white" alt="Student Drawing"/>
                                                    ) : (
                                                        <div 
                                                            className="bg-black/30 p-3 rounded-lg text-sm whitespace-pre-wrap min-h-[100px] border border-white/10 rich-text-content"
                                                            dangerouslySetInnerHTML={{__html: parseMath(answer || '<p class="text-gray-500">No answer submitted.</p>')}}
                                                        ></div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Right Side: Grading */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 mb-1">Grade & Feedback</h4>
                                        <div className="flex items-center gap-2 mb-2">
                                            <input 
                                                type="number"
                                                value={grade.score}
                                                onChange={e => handleGradeChange(q.id, parseInt(e.target.value) || 0, grade.feedback)}
                                                className="w-24 bg-black/50 border border-white/10 rounded-md px-2 py-1 text-lg font-bold"
                                                max={q.points}
                                                min={0}
                                            />
                                            <button onClick={() => handleGradeChange(q.id, 0, grade.feedback)} className="text-xs font-bold text-gray-400 hover:text-white">0</button>
                                            <button onClick={() => handleGradeChange(q.id, q.points, grade.feedback)} className="text-xs font-bold text-green-400 hover:text-white">{q.points} pts</button>
                                        </div>
                                        <textarea
                                            value={grade.feedback}
                                            onChange={e => handleGradeChange(q.id, grade.score, e.target.value)}
                                            placeholder="Provide feedback..."
                                            className="w-full bg-black/50 border border-white/10 rounded-md px-2 py-1 text-sm min-h-[100px]"
                                        />
                                        {q.correctAnswer && (
                                             <div className="mt-2 text-xs">
                                                <h5 className="font-bold text-gray-500 mb-1">Correct Answer</h5>
                                                <div className="p-2 rounded bg-green-900/30 border border-green-500/30 text-green-200" dangerouslySetInnerHTML={{ __html: q.type === 'mcq' ? parseMath(q.options?.[Number(q.correctAnswer)] ?? 'N/A') : parseMath(q.correctAnswer) }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
