
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AssessmentQuestion } from '../../../../types';
import { X, Printer, FileText, File, FileX, Code, Trash2, User, Check, Save, Bold, Italic, Underline, List, ListOrdered, ImagePlus, RefreshCcw, Upload, AlertTriangle, ShieldAlert } from 'lucide-react';
import { RichTextEditor, RichTextEditorRef, FormatState } from '../../../RichTextEditor';
import { PrintMode } from '../AssessmentPrintView';
import { parseMath } from '../../../../utils/mappers';
import { countQualityWords } from '../../../../utils/validation';
import { supabase } from '../../../../services/supabaseClient';

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

const FeedbackToolbar = ({ editorRef, onImageUpload, activeFormats }: { editorRef: React.RefObject<RichTextEditorRef>, onImageUpload: () => void, activeFormats: FormatState }) => {
    const getBtnClass = (isActive: boolean) => 
        `p-1.5 rounded transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`;
    
    const handleCommand = (cmd: string) => {
        editorRef.current?.execCommand(cmd);
    };

    return (
        <div className="flex items-center gap-1 p-1 border-b border-white/10 bg-[#111] rounded-t-xl">
            <button onMouseDown={e => { e.preventDefault(); handleCommand('bold'); }} className={getBtnClass(activeFormats.bold)} title="Bold"><Bold size={14}/></button>
            <button onMouseDown={e => { e.preventDefault(); handleCommand('italic'); }} className={getBtnClass(activeFormats.italic)} title="Italic"><Italic size={14}/></button>
            <button onMouseDown={e => { e.preventDefault(); handleCommand('underline'); }} className={getBtnClass(activeFormats.underline)} title="Underline"><Underline size={14}/></button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onMouseDown={e => { e.preventDefault(); handleCommand('insertUnorderedList'); }} className={getBtnClass(activeFormats.list)} title="Bulleted List"><List size={14}/></button>
            <button onMouseDown={e => { e.preventDefault(); handleCommand('insertOrderedList'); }} className={getBtnClass(activeFormats.orderedList)} title="Numbered List"><ListOrdered size={14}/></button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onMouseDown={e => { e.preventDefault(); onImageUpload(); }} className={getBtnClass(false)} title="Upload Image"><ImagePlus size={14}/></button>
        </div>
    );
};

interface GradingModalProps {
    isOpen: boolean;
    participant: any;
    onClose: () => void;
    questions: AssessmentQuestion[];
    onSave: (release: boolean, retryIds?: string[]) => void;
    onPrint: (mode: PrintMode, gradesSnapshot: Record<string, { score: number, feedback: string }>) => void;
    currentGrades: Record<string, { score: number, feedback: string }>;
    setCurrentGrades: (grades: Record<string, { score: number, feedback: string }>) => void;
    onAutoSave: (
        grades: Record<string, { score: number, feedback: string }>, 
        updatedAnswers?: Record<string, string>,
    ) => Promise<void>;
}

export const GradingModal: React.FC<GradingModalProps> = ({ 
    isOpen, participant, onClose, questions, onSave, onPrint, currentGrades, setCurrentGrades, onAutoSave 
}) => {
    const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});
    const [printMenuOpen, setPrintMenuOpen] = useState(false);
    const [rawView, setRawView] = useState<Record<string, boolean>>({});
    const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
    const feedbackEditorRefs = useRef<Record<string, RichTextEditorRef | null>>({});
    const [questionsToRevise, setQuestionsToRevise] = useState<Set<string>>(new Set());
    const [activeFeedbackFormats, setActiveFeedbackFormats] = useState<Record<string, FormatState>>({});

    useEffect(() => {
        if (isOpen && participant) {
            setCurrentAnswers(getInitialAnswers(participant));
            setCurrentGrades(getInitialGrades(participant, questions));
            setRawView({});
            setQuestionsToRevise(new Set(participant.data?.retryQuestions || []));
            setActiveFeedbackFormats({});
        }
    }, [isOpen, participant, questions, setCurrentGrades]);

    const debouncedAutoSave = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        return (grades: Record<string, { score: number, feedback: string }>, answers: Record<string, string>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                onAutoSave(grades, answers);
            }, 1500);
        };
    }, [onAutoSave]);

    const handleAnswerChange = (qId: string, value: string) => {
        const newAnswers = { ...currentAnswers, [qId]: value };
        setCurrentAnswers(newAnswers);
        debouncedAutoSave(currentGrades, newAnswers);
    };

    const handleGradeChange = (qId: string, score: number, feedback: string) => {
        const newGrades = { ...currentGrades, [qId]: { score, feedback } };
        setCurrentGrades(newGrades);
        debouncedAutoSave(newGrades, currentAnswers);
    };
    
    const handleClearAnswer = (qId: string) => {
        if (window.confirm('Are you sure you want to permanently erase this student\'s answer? This cannot be undone.')) {
            handleAnswerChange(qId, '');
            handleGradeChange(qId, 0, currentGrades[qId]?.feedback || '');
        }
    };

    const handleToggleQuestionToRevise = (qId: string) => {
        setQuestionsToRevise(prev => {
            const newSet = new Set(prev);
            if (newSet.has(qId)) {
                newSet.delete(qId);
            } else {
                newSet.add(qId);
            }
            return newSet;
        });
    };

    const handleAllowRevision = () => {
        if (questionsToRevise.size === 0) {
            alert('Please select which question(s) the student needs to revise.');
            return;
        }
        onSave(false, Array.from(questionsToRevise));
        onClose();
    };

    const handleImageUpload = async (file: File, onProgress: (html: string) => void, onSuccess: (html: string) => void, onFailure: (errorHtml: string) => void) => {
        const tempId = `temp-img-${Date.now()}`;
        const tempSrc = URL.createObjectURL(file);
        const placeholderHtml = `<img id="${tempId}" src="${tempSrc}" style="opacity: 0.5; max-width: 200px;" alt="Uploading..."/>`;
        onProgress(placeholderHtml);

        try {
            const fileName = `teacher-upload-${Date.now()}-${file.name}`;
            const { error } = await supabase.storage.from('uploads').upload(fileName, file);
            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
            const finalHtml = `<img src="${publicUrl}" style="max-width: 400px; border-radius: 8px;" alt="Uploaded image"/>`;
            onSuccess(finalHtml);
        } catch (err) {
            console.error('Upload failed', err);
            onFailure('<p style="color: red;">[Image upload failed]</p>');
        }
    };

    const handleStudentAnswerImageUpload = (qId: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            handleImageUpload(
                file,
                (placeholder) => handleAnswerChange(qId, placeholder),
                (finalUrl) => handleAnswerChange(qId, finalUrl),
                (errorHtml) => handleAnswerChange(qId, errorHtml)
            );
        };
        input.click();
    };

    const handleFeedbackImageUpload = (qId: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const editorRef = feedbackEditorRefs.current[qId];
            if (!editorRef) return;

            handleImageUpload(
                file,
                (placeholder) => editorRef.insertHTML(placeholder),
                (finalHtml) => {
                    const newFeedback = editorRef.getHTML().replace(/<img id="temp-img-.*?"[^>]*>/, finalHtml);
                    handleGradeChange(qId, currentGrades[qId].score, newFeedback);
                },
                (errorHtml) => {
                    const newFeedback = editorRef.getHTML().replace(/<img id="temp-img-.*?"[^>]*>/, errorHtml);
                    handleGradeChange(qId, currentGrades[qId].score, newFeedback);
                }
            );
        };
        input.click();
    };

    const totalScore = useMemo(() => {
        return Object.values(currentGrades).reduce((acc, curr) => acc + (curr?.score || 0), 0);
    }, [currentGrades]);

    if (!isOpen || !participant) return null;

    return (
        <>
            {lightboxImageUrl && (
                <div 
                    className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setLightboxImageUrl(null)}
                >
                    <img src={lightboxImageUrl} className="max-w-full max-h-full object-contain" alt="Student submission preview"/>
                     <button onClick={() => setLightboxImageUrl(null)} className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full"><X size={24}/></button>
                </div>
            )}
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl">
                    <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><User size={18}/> Grading: {participant.name}</h3>
                            <p className="text-xs text-gray-400">Student ID: {participant.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-right">
                                <span className="text-xs font-bold text-gray-500 uppercase">Total Score</span>
                                <p className="font-bold text-green-500 text-2xl leading-none">{totalScore}</p>
                            </div>
                            <button onClick={() => onSave(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2"><Save size={16}/> Save Grades</button>
                            <button onClick={handleAllowRevision} className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-sm hover:bg-amber-700 flex items-center gap-2"><RefreshCcw size={16}/> Allow Revision</button>
                            <button onClick={() => onSave(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 flex items-center gap-2"><Check size={16}/> Save & Release</button>
                            <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-red-600/20 rounded-lg text-gray-300 hover:text-red-500 border border-white/10 hover:border-red-600/30"><X size={16} /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {questions.map((q, index) => {
                            if (q.type === 'section') return null;

                            const qNum = questions.filter((item, i) => i <= index && item.type !== 'section').length;
                            const answer = currentAnswers[q.id] || '';
                            const grade = currentGrades[q.id] || { score: 0, feedback: '' };
                            const isRetry = participant.data?.retryQuestions?.includes(q.id);

                            const isTextAnswer = q.type === 'essay' && !answer.startsWith('http') && !answer.includes('<img');
                            const wordCount = isTextAnswer ? countQualityWords(answer) : 0;
                            const rawWordCount = isTextAnswer ? answer.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
                            const isSpamming = isTextAnswer && (rawWordCount - wordCount > 5);
                            const isUnderWordLimit = isTextAnswer && q.minWords && wordCount < q.minWords;

                            return (
                                <div key={q.id} className={`p-4 rounded-xl bg-[#111] border ${questionsToRevise.has(q.id) ? 'border-amber-500' : (isRetry ? 'border-orange-500/50' : 'border-white/10')}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={questionsToRevise.has(q.id)} onChange={() => handleToggleQuestionToRevise(q.id)} className="w-4 h-4 rounded bg-black/20 border-white/20 text-amber-500 focus:ring-amber-500"/>
                                            <span className="text-sm font-bold text-blue-400">Question {qNum}</span>
                                            {isRetry && <span className="text-xs font-bold text-orange-400 bg-orange-900/50 px-2 py-0.5 rounded-full border border-orange-500/50">Revision</span>}
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">{q.points} pts</span>
                                    </div>
                                    <div className="text-gray-300 mb-4 rich-text-content" dangerouslySetInnerHTML={{ __html: parseMath(q.text) }} />
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-sm font-bold text-gray-400">Student's Answer</h4>
                                                {q.type === 'essay' && (
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleStudentAnswerImageUpload(q.id)} className="text-xs flex items-center gap-1 text-gray-500 hover:text-white"><Upload size={12}/> Upload Answer</button>
                                                        <button onClick={() => setRawView(p => ({...p, [q.id]: !p[q.id]}))} className="text-xs flex items-center gap-1 text-gray-500 hover:text-white"><Code size={12}/> {rawView[q.id] ? 'Rich View' : 'Raw HTML'}</button>
                                                        <button onClick={() => handleClearAnswer(q.id)} className="text-xs flex items-center gap-1 text-red-600 hover:text-white"><Trash2 size={12}/> Clear</button>
                                                    </div>
                                                )}
                                            </div>
                                            {q.type === 'mcq' ? (
                                                <div className="space-y-2">{q.options?.map((opt, optIdx) => { const isSelected = answer === optIdx.toString(); const isCorrectOpt = q.correctAnswer === optIdx.toString(); let c = 'border-white/10 bg-black/20'; if (isSelected && isCorrectOpt) c = 'border-green-500 bg-green-900/30'; else if (isSelected && !isCorrectOpt) c = 'border-red-500 bg-red-900/30'; else if (isCorrectOpt) c = 'border-green-500/50'; return (<div key={optIdx} className={`p-3 rounded-lg border flex items-start gap-3 ${c}`}><div className="mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: isSelected ? '#3b82f6' : 'transparent', border: '2px solid ' + (isSelected ? '#3b82f6' : '#6b7280')}}>{isSelected && <Check size={10} className="text-white"/>}</div><div className="text-sm" dangerouslySetInnerHTML={{ __html: parseMath(opt) }} /></div>);})}</div>
                                            ) : (
                                                <div>
                                                    {(() => {
                                                        const isImageURL = answer.startsWith('http') && !answer.includes('<');
                                                        const isImageHTML = answer.includes('<img');

                                                        if (rawView[q.id]) {
                                                            return <pre className="bg-black/50 p-3 rounded-lg text-xs whitespace-pre-wrap break-all border border-white/10"><code>{answer}</code></pre>;
                                                        }

                                                        if (isImageURL) {
                                                            return (
                                                                <div className="bg-black/30 p-3 rounded-lg border border-white/10 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setLightboxImageUrl(answer)}>
                                                                    <img src={answer} className="max-w-full w-full rounded-lg bg-white" alt="Student submission"/>
                                                                </div>
                                                            );
                                                        }

                                                        if (isImageHTML) {
                                                            const imageUrl = (answer.match(/src="(.*?)"/) || [])[1];
                                                            return (
                                                                <div className="bg-black/30 p-3 rounded-lg border border-white/10 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => imageUrl && setLightboxImageUrl(imageUrl)}>
                                                                    <div className="w-full rich-text-content" dangerouslySetInnerHTML={{ __html: answer }} />
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div className="bg-black/30 p-3 rounded-lg text-sm whitespace-pre-wrap min-h-[100px] border border-white/10 rich-text-content" 
                                                                 dangerouslySetInnerHTML={{ __html: parseMath(answer || '<p class="text-gray-500">No answer submitted.</p>') }} />
                                                        );
                                                    })()}
                                                    {isTextAnswer && (
                                                        <div className={`text-right text-xs mt-1.5 font-bold flex items-center justify-end gap-1.5 ${isUnderWordLimit || isSpamming ? 'text-amber-500' : 'text-gray-400'}`}>
                                                            {isSpamming && <><ShieldAlert size={14} /><span>Spam Detected</span></>}
                                                            {isUnderWordLimit && !isSpamming && <><AlertTriangle size={14} /><span>Under Word Limit</span></>}
                                                            <span className="ml-2">{wordCount} / {q.minWords || '-'} words</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col h-full">
                                            <h4 className="text-sm font-bold text-gray-400 mb-1">Grade & Feedback</h4>
                                            <div className="flex items-center gap-2 mb-2">
                                                <input type="number" value={grade.score} onChange={e => handleGradeChange(q.id, parseInt(e.target.value) || 0, grade.feedback)} className="w-24 bg-black/50 border border-white/10 rounded-md px-2 py-1 text-lg font-bold" max={q.points} min={0}/>
                                                <button onClick={() => handleGradeChange(q.id, 0, grade.feedback)} className="text-xs font-bold text-gray-400 hover:text-white">0</button>
                                                <button onClick={() => handleGradeChange(q.id, q.points, grade.feedback)} className="text-xs font-bold text-green-400 hover:text-white">{q.points} pts</button>
                                            </div>
                                            <div className="flex-1 flex flex-col bg-black/30 rounded-xl border border-white/10">
                                                <FeedbackToolbar editorRef={{ current: feedbackEditorRefs.current[q.id] }} onImageUpload={() => handleFeedbackImageUpload(q.id)} activeFormats={activeFeedbackFormats[q.id] || { bold: false, italic: false, underline: false, strikeThrough: false, list: false, orderedList: false, subscript: false, superscript: false, blockquote: false, h1: false, h2: false, h3: false, h4: false, alignLeft: true, alignCenter: false, alignRight: false, alignJustify: false }}/>
                                                <RichTextEditor
                                                    ref={ref => feedbackEditorRefs.current[q.id] = ref}
                                                    value={grade.feedback}
                                                    onChange={text => handleGradeChange(q.id, grade.score, text)}
                                                    onFormatChange={formats => setActiveFeedbackFormats(prev => ({...prev, [q.id]: formats}))}
                                                    placeholder="Provide feedback..."
                                                    className="w-full flex-1 bg-transparent p-2 text-sm outline-none"
                                                />
                                            </div>
                                            {q.correctAnswer && (<div className="mt-2 text-xs"><h5 className="font-bold text-gray-500 mb-1">Correct Answer</h5><div className="p-2 rounded bg-green-900/30 border border-green-500/30 text-green-200" dangerouslySetInnerHTML={{ __html: q.type === 'mcq' ? parseMath(q.options?.[Number(q.correctAnswer)] ?? 'N/A') : parseMath(q.correctAnswer) }} /></div>)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};
