
import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, Home, Printer, Eye, MessageSquare, ChevronDown, File, FileText, FileX } from 'lucide-react';
import { AssessmentQuestion, Board } from '../../../../types';
import { useBoard } from '../../../BoardView/BoardContext';
import { supabase } from '../../../../services/supabaseClient';
import { AssessmentPrintView, PrintMode } from '../AssessmentPrintView';
import { parseMath } from '../../../../utils/mappers';

interface ReportCardProps {
    board: Board;
    questions: AssessmentQuestion[];
    submissionData: any;
    isPreviewMode?: boolean;
    onExitPreview?: () => void;
    onReturnHome: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ 
    board, questions, submissionData, isPreviewMode, onExitPreview, onReturnHome 
}) => {
    const { username } = useBoard();
    const [printInfo, setPrintInfo] = useState<{mode: PrintMode, isPrinting: boolean} | null>(null);
    const [showPrintDropdown, setShowPrintDropdown] = useState(false);
    const printDropdownRef = useRef<HTMLDivElement>(null);
    
    const ipekaLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/ipeka.png').data.publicUrl;
    const ibLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/IB.png').data.publicUrl;

    const totalMaxScore = questions.reduce((acc, q) => acc + (q.points || 0), 0);
    const answers = submissionData?.answers || {};
    const isGraded = submissionData?.graded || submissionData?.released;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (printDropdownRef.current && !printDropdownRef.current.contains(event.target as Node)) {
                setShowPrintDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePrintRequest = (mode: PrintMode) => {
        setPrintInfo({ mode, isPrinting: true });
        setShowPrintDropdown(false);
    };

    const getAnswerParts = (answer: string) => {
        let drawing: string | undefined;
        let text: string | undefined;
        if (!answer) return { drawing, text };

        try {
            const parsed = JSON.parse(answer);
            drawing = parsed.drawing;
            text = parsed.text;
        } catch (e) {
            if (answer.startsWith('http') || answer.startsWith('data:image')) {
                drawing = answer;
            } else {
                text = answer;
            }
        }
        return { drawing, text };
    };

    return (
        <div className="h-full overflow-y-auto bg-[#111] text-white p-6 font-sans relative">
            {isPreviewMode && (
                <div className="bg-indigo-600 text-white px-4 py-2 flex justify-between items-center z-50 sticky top-0 -mt-6 -mx-6 mb-6 shadow-md">
                    <span className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><Eye size={16} /> Preview Mode</span>
                    <button onClick={onExitPreview} className="bg-white text-indigo-600 px-4 py-1 rounded-full text-xs font-bold hover:bg-indigo-50">Exit</button>
                </div>
            )}

            {printInfo?.isPrinting && (
                <AssessmentPrintView 
                    participants={[{
                        id: 'student-self', 
                        name: username || 'Student',
                        score: submissionData?.score || 0,
                        data: submissionData
                    }]}
                    questions={questions}
                    ipekaLogoUrl={ipekaLogoUrl}
                    ibLogoUrl={ibLogoUrl}
                    className={board.targetGrade}
                    onAfterPrint={() => setPrintInfo(null)}
                    printMode={printInfo.mode}
                />
            )}

            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <div className="flex justify-between items-center pt-4">
                    <button onClick={onReturnHome} className="bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors flex items-center gap-2"><Home size={16} /> Dashboard</button>
                    <div className="relative" ref={printDropdownRef}>
                        <button 
                            onClick={() => setShowPrintDropdown(s => !s)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Printer size={18} /> Export to PDF <ChevronDown size={16} className={`transition-transform ${showPrintDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showPrintDropdown && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-[#282828] border border-white/10 rounded-lg shadow-2xl z-10 text-left overflow-hidden animate-in fade-in zoom-in-95">
                                {isGraded && (
                                    <button onClick={() => handlePrintRequest('WITH_ANSWERS_AND_FEEDBACK')} className="w-full text-sm px-4 py-3 hover:bg-white/5 flex items-center gap-3">
                                        <FileText size={16} /> Print with Feedback
                                    </button>
                                )}
                                <button onClick={() => handlePrintRequest('WITH_ANSWERS')} className="w-full text-sm px-4 py-3 hover:bg-white/5 flex items-center gap-3">
                                    <File size={16} /> Print My Submission
                                </button>
                                <button onClick={() => handlePrintRequest('BLANK')} className="w-full text-sm px-4 py-3 hover:bg-white/5 flex items-center gap-3">
                                    <FileX size={16} /> Print Blank Paper
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center space-y-4 pt-4 border-b border-white/10 pb-8">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-black shadow-lg"><CheckCircle size={40} /></div>
                    <h2 className="text-3xl font-bold text-white">{board.title}</h2>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                        {submissionData?.score || 0} <span className="text-xl text-gray-500 font-medium">/ {totalMaxScore}</span>
                    </div>
                    <p className="text-gray-400">Assessment Graded & Released</p>
                </div>

                {questions.map((q, idx) => {
                    if (q.type === 'section') {
                        return <h3 key={q.id} className="text-xl font-bold border-b border-white/10 pb-2 mt-8 text-yellow-500 uppercase">{q.text}</h3>;
                    }

                    const grading = submissionData?.grading?.[q.id];
                    const score = grading?.score ?? (q.type === 'mcq' && q.correctAnswer === answers[q.id] ? q.points : 0);
                    const feedback = grading?.feedback;
                    const studentAns = answers[q.id];
                    const { drawing: drawingUrl, text: textContent } = getAnswerParts(studentAns);
                    const qNum = questions.filter((item, i) => i <= idx && item.type !== 'section').length;

                    return (
                        <div key={q.id} className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
                            <div className="p-4 bg-[#222] border-b border-white/5 flex justify-between items-center">
                                <h4 className="font-bold text-sm text-gray-300">Question {qNum}</h4>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${score === q.points ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {score} / {q.points} pts
                                </span>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="font-medium text-lg rich-text-content" dangerouslySetInnerHTML={{ __html: parseMath(q.text) }} />
                                <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                                    <span className="block text-xs font-bold text-gray-500 uppercase mb-2">Your Answer</span>
                                    {q.type === 'mcq' ? (
                                        <div className="text-gray-300">
                                            {q.options && studentAns ? q.options[parseInt(studentAns)] : <span className="italic text-gray-500">No Answer</span>}
                                            {q.correctAnswer && <span className="ml-2 text-xs text-gray-500">(Correct: {q.options?.[parseInt(q.correctAnswer)]})</span>}
                                        </div>
                                    ) : (
                                        <>
                                            {drawingUrl && <img src={drawingUrl} alt="Drawing" className="max-w-full h-auto rounded border border-white/10 bg-white mb-2" />}
                                            {textContent && <p className="whitespace-pre-wrap text-gray-300">{textContent}</p>}
                                            {!drawingUrl && !textContent && <span className="italic text-gray-500">No Answer</span>}
                                        </>
                                    )}
                                </div>

                                {feedback && (
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-2">
                                        <MessageSquare size={18} className="text-blue-400 shrink-0 mt-1" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-bold text-blue-400 uppercase block mb-1">Teacher Feedback</span>
                                            <div className="text-sm text-blue-100 rich-text-content leading-relaxed" dangerouslySetInnerHTML={{ __html: parseMath(feedback) }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                <button onClick={onReturnHome} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <Home size={18} /> Return to Dashboard
                </button>
            </div>
        </div>
    );
};
