
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Printer, X, Save, Check, FileWarning, Loader2, Cloud, Eye, EyeOff, Bold, Italic, Subscript, Superscript, UploadCloud, RefreshCw, Lock, Unlock, ShieldCheck, ImagePlus, Underline, Strikethrough, AlignCenter, AlignRight, AlignJustify, Pilcrow, Quote, Undo, Redo, Heading1, Heading2, Heading3, Heading4, AlignLeft, List, ListOrdered } from 'lucide-react';
import { AssessmentQuestion } from '../../../../types';
import { RichTextEditor, FormatState, getActiveFormat } from '../../../RichTextEditor';
import { DebouncedInput } from '../../../ui/DebouncedInput';
import { parseMath } from '../../../../utils/mappers';
import { countQualityWords } from '../../../../utils/validation';
import { supabase } from '../../../../services/supabaseClient';

interface GradingModalProps {
    isOpen: boolean;
    participant: any;
    onClose: () => void;
    questions: AssessmentQuestion[];
    currentGrades: Record<string, { score: number, feedback: string }>;
    setCurrentGrades: React.Dispatch<React.SetStateAction<Record<string, { score: number, feedback: string }>>>;
    onSave: (release: boolean) => void;
    onAutoSave: (grades: Record<string, { score: number, feedback: string }>, updatedAnswers?: Record<string, string>, retryQuestions?: string[], teacherOverrides?: Record<string, boolean>) => Promise<void>;
    onPrint: (includeFeedback: boolean, currentGradesSnapshot: Record<string, { score: number, feedback: string }>) => void;
}

export const GradingModal: React.FC<GradingModalProps> = ({ 
    isOpen, participant, onClose, questions, currentGrades, setCurrentGrades, onSave, onAutoSave, onPrint 
}) => {
    const [includeFeedback, setIncludeFeedback] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<string | null>(null);
    const [isFeedbackUploading, setIsFeedbackUploading] = useState<string | null>(null);
    
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [retryQuestions, setRetryQuestions] = useState<string[]>([]);
    const [teacherOverrides, setTeacherOverrides] = useState<Record<string, boolean>>({});
    
    const [activeFormats, setActiveFormats] = useState<FormatState>({
        bold: false, italic: false, underline: false, strikeThrough: false, list: false, orderedList: false,
        subscript: false, superscript: false, blockquote: false, h1: false, h2: false, h3: false, h4: false,
        alignLeft: true, alignCenter: false, alignRight: false, alignJustify: false,
    });
    
    const gradesRef = useRef(currentGrades);
    const answersRef = useRef(answers);
    const retryRef = useRef(retryQuestions);
    const overridesRef = useRef(teacherOverrides);
    const timeoutRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (participant?.data) {
            setAnswers(participant.data.answers || {});
            setRetryQuestions(participant.data.retryQuestions || []);
            setTeacherOverrides(participant.data.teacherOverrides || {});
            
            answersRef.current = participant.data.answers || {};
            retryRef.current = participant.data.retryQuestions || [];
            overridesRef.current = participant.data.teacherOverrides || {};
        }
    }, [participant]);

    useEffect(() => {
        gradesRef.current = currentGrades;
    }, [currentGrades]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const triggerSave = useCallback((overrideAnswers?: Record<string, string>, overrideRetries?: string[], overrideTeacherFlags?: Record<string, boolean>, immediate = false) => {
        setSaveStatus('saving');
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        const finalAnswers = overrideAnswers || answersRef.current;
        const finalRetries = overrideRetries || retryRef.current;
        const finalOverrides = overrideTeacherFlags || overridesRef.current;

        const performSave = async () => {
            try {
                await onAutoSave(gradesRef.current, finalAnswers, finalRetries, finalOverrides);
                setSaveStatus('saved');
                setTimeout(() => {
                   setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
                }, 3000);
            } catch (e) {
                setSaveStatus('error');
            }
        };

        if (immediate) {
            performSave();
        } else {
            timeoutRef.current = setTimeout(performSave, 1500);
        }
    }, [onAutoSave]);

    const handleUpdate = (qId: string, updates: Partial<{ score: number, feedback: string }>) => {
        setCurrentGrades(prev => {
            const newItem = { ...(prev[qId] || { score: 0, feedback: '' }), ...updates };
            return { ...prev, [qId]: newItem };
        });
        triggerSave();
    };

    const handleFileUpload = async (qId: string, file: File) => {
        setIsUploading(qId);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `manual-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);

            const newAnswers = { ...answers, [qId]: publicUrl };
            setAnswers(newAnswers);
            answersRef.current = newAnswers;
            
            const newOverrides = { ...teacherOverrides, [qId]: true };
            setTeacherOverrides(newOverrides);
            overridesRef.current = newOverrides;
            
            triggerSave(newAnswers, undefined, newOverrides, true);
        } catch (e) {
            console.error("Upload failed", e);
            alert("Upload failed. Please try again.");
        } finally {
            setIsUploading(null);
        }
    };
    
    const handleFeedbackUpload = async (qId: string, file: File) => {
        setIsFeedbackUploading(qId);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `feedback-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);

            const imageHtml = `<img src="${publicUrl}" alt="Feedback Image" style="max-width: 100%; border-radius: 8px;"/>`;
            
            const existingFeedback = currentGrades[qId]?.feedback || '';
            const newFeedback = `${existingFeedback}${imageHtml}`;

            handleUpdate(qId, { feedback: newFeedback });

        } catch (e) {
            console.error("Feedback upload failed", e);
            alert("Image upload failed. Please try again.");
        } finally {
            setIsFeedbackUploading(null);
        }
    };

    const toggleRetry = (qId: string) => {
        const current = new Set(retryQuestions);
        if (current.has(qId)) current.delete(qId);
        else current.add(qId);
        
        const newRetries = Array.from(current);
        setRetryQuestions(newRetries);
        retryRef.current = newRetries;
        
        triggerSave(undefined, newRetries);
    };

    const handleCommand = (cmd: string, value?: string) => {
        document.execCommand(cmd, false, value);
        if (activeFeedbackId) {
            const editor = document.getElementById(`feedback-editor-${activeFeedbackId}`)?.querySelector('.rich-text-content');
            if (editor) {
                handleUpdate(activeFeedbackId, { feedback: editor.innerHTML });
            }
        }
    };

    if (!isOpen || !participant) return null;

    const isReleased = participant?.data?.released === true;
    
    const isImageAnswer = (text: string) => {
        return text && typeof text === 'string' && (text.startsWith('data:image') || (text.startsWith('http') && /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(text)));
    };

    const getBtnClass = (isActive: boolean) => 
        `p-1.5 rounded transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#161616] border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#1a1a1a] rounded-t-2xl gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white mb-2 truncate" title={participant?.name}>
                            Grading: {participant?.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            {isReleased ? (
                                <span className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] font-bold border border-green-500/20 uppercase tracking-wide shrink-0">
                                    <Eye size={10} /> Released
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-500/20 uppercase tracking-wide shrink-0">
                                    <EyeOff size={10} /> Draft (Hidden)
                                </span>
                            )}
                            <span className="text-white/20 text-xs hidden sm:inline">•</span>
                            <p className="text-xs text-gray-400 truncate hidden sm:block">
                                {isReleased ? "Visible to student" : "Hidden from student"}
                            </p>
                            {saveStatus === 'saving' && <span className="text-[10px] text-yellow-500 flex items-center gap-1 font-bold animate-pulse ml-2"><Loader2 size={10} className="animate-spin" /> Saving...</span>}
                            {saveStatus === 'saved' && <span className="text-[10px] text-green-500 flex items-center gap-1 font-bold ml-2 animate-in fade-in"><Cloud size={10} /> Saved</span>}
                            {saveStatus === 'error' && <span className="text-[10px] text-red-500 flex items-center gap-1 font-bold ml-2">Error Saving</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 pt-1">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white cursor-pointer select-none transition-colors">
                            <input type="checkbox" checked={includeFeedback} onChange={(e) => setIncludeFeedback(e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-white/5 text-blue-500 focus:ring-0 focus:ring-offset-0" />
                            <span className="hidden sm:inline">Include Feedback</span>
                            <span className="sm:hidden">Feedback</span>
                        </label>
                        <div className="h-6 w-px bg-white/10"></div>
                        <button onClick={() => onPrint(includeFeedback, gradesRef.current)} className="p-2 hover:bg-white/10 rounded-full text-blue-400 hover:text-blue-300 transition-colors" title="Print / Export PDF"><Printer size={20} /></button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {questions.map((q, i) => {
                        if (q.type === 'section') return <h4 key={q.id} className="text-yellow-500 font-bold uppercase tracking-wide border-b border-white/10 pb-2 mt-4">{q.text}</h4>;

                        const questionNumber = questions.slice(0, i + 1).filter(item => item.type !== 'section').length;
                        const studentAns = answers[q.id];
                        const grade = currentGrades[q.id] || { score: 0, feedback: '' };
                        const isRetrying = retryQuestions.includes(q.id);
                        const isTeacherOverride = teacherOverrides[q.id];
                        const isEssay = q.type === 'essay';
                        const wordCount = isEssay && typeof studentAns === 'string' ? countQualityWords(studentAns) : 0;
                        const isUnderLimit = isEssay && (q.minWords || 0) > 0 && wordCount < (q.minWords || 0);
                        const isFocused = activeFeedbackId === q.id;
                        const canUpload = (q.responseType === 'drawing' || q.responseType === 'both' || q.allowDrawing) && (!studentAns || studentAns === '');

                        return (
                            <div key={q.id} className={`bg-[#111] border rounded-xl p-4 transition-colors ${isUnderLimit ? 'border-amber-500/30' : 'border-white/10'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-300">Question {questionNumber} ({q.points} pts)</span>
                                        {isUnderLimit && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wide"><FileWarning size={10} /> Word Count</span>}
                                        {isTeacherOverride && <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 uppercase tracking-wide"><ShieldCheck size={10} /> Teacher Upload</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => toggleRetry(q.id)} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase border transition-colors ${isRetrying ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-white/5 text-gray-500 border-transparent hover:text-white'}`} title={isRetrying ? "Student is redoing this question" : "Unlock for student to redo"}>
                                            {isRetrying ? <Unlock size={10} /> : <Lock size={10} />}
                                            {isRetrying ? 'Revising' : 'Locked'}
                                        </button>
                                        <div className="h-4 w-px bg-white/10"></div>
                                        <span className="text-xs text-gray-500 uppercase font-bold">Score:</span>
                                        <DebouncedInput type="number" min="0" max={q.points} value={grade.score} onChange={(val) => handleUpdate(q.id, { score: parseInt(val) || 0 })} onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()} className="w-16 bg-[#222] border border-white/20 rounded px-2 py-1 text-center font-bold text-white focus:border-blue-500 outline-none" />
                                    </div>
                                </div>
                                <div className="text-base font-medium text-white mb-4 rich-text-content" dangerouslySetInnerHTML={{ __html: parseMath(q.text) }} />
                                <div className="bg-[#222] p-3 rounded-lg border border-white/5 mb-4 relative group/answer">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Student Answer</span>
                                        {canUpload && (
                                            <div className="relative">
                                                <input type="file" id={`upload-${q.id}`} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(q.id, e.target.files[0])} />
                                                <label htmlFor={`upload-${q.id}`} className={`flex items-center gap-1.5 cursor-pointer text-[10px] font-bold px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all ${isUploading === q.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    {isUploading === q.id ? <Loader2 size={10} className="animate-spin" /> : <UploadCloud size={10} />}
                                                    Upload Answer
                                                </label>
                                            </div>
                                        )}
                                        {isEssay && q.minWords && q.minWords > 0 && <span className={`text-[10px] font-bold ${isUnderLimit ? 'text-amber-500' : 'text-green-500'}`}>{wordCount} / {q.minWords} valid words</span>}
                                    </div>
                                    {q.type === 'mcq' ? (
                                        <p className="text-sm text-gray-300">
                                            <span dangerouslySetInnerHTML={{ __html: studentAns != null ? parseMath(q.options?.[parseInt(studentAns)] || '') : '<span class="italic opacity-50">No Answer</span>' }} />
                                            {q.correctAnswer && studentAns != null &&
                                                <span className="ml-2 text-[10px] text-green-500 uppercase font-bold">
                                                    {studentAns === q.correctAnswer ? '(Correct)' : `(Expected: ${q.options?.[parseInt(q.correctAnswer)] || ''})`}
                                                </span>
                                            }
                                        </p>
                                    ) : (
                                        isImageAnswer(studentAns) ? (
                                            <div className="relative group">
                                                <img src={studentAns} alt="Student Drawing" className="max-w-full h-auto rounded border border-white/10 bg-white" />
                                                <a href={studentAns} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">View Full</a>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed rich-text-content" dangerouslySetInnerHTML={{ __html: studentAns ? parseMath(studentAns) : '<span class="italic opacity-50">No Answer</span>' }} />
                                        )
                                    )}
                                </div>
                                <div className={`bg-black/20 rounded-lg border transition-colors ${isFocused ? 'border-blue-500/50' : 'border-white/5'}`} onFocus={() => setActiveFeedbackId(q.id)}>
                                    {isFocused && (
                                        <div className="flex flex-wrap items-center gap-1 p-1 border-b border-white/5 bg-[#161616] rounded-t-lg animate-in fade-in slide-in-from-top-1">
                                            <button onMouseDown={e => { e.preventDefault(); handleCommand('bold'); }} className={getBtnClass(activeFormats.bold)} title="Bold"><Bold size={14}/></button>
                                            <button onMouseDown={e => { e.preventDefault(); handleCommand('italic'); }} className={getBtnClass(activeFormats.italic)} title="Italic"><Italic size={14}/></button>
                                            <button onMouseDown={e => { e.preventDefault(); handleCommand('underline'); }} className={getBtnClass(activeFormats.underline)} title="Underline"><Underline size={14}/></button>
                                            <button onMouseDown={e => { e.preventDefault(); handleCommand('strikeThrough'); }} className={getBtnClass(activeFormats.strikeThrough)} title="Strikethrough"><Strikethrough size={14}/></button>
                                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                                            <button onMouseDown={e => { e.preventDefault(); handleCommand('insertUnorderedList'); }} className={getBtnClass(activeFormats.list)} title="Bulleted List"><List size={14}/></button>
                                            <button onMouseDown={e => { e.preventDefault(); handleCommand('insertOrderedList'); }} className={getBtnClass(activeFormats.orderedList)} title="Numbered List"><ListOrdered size={14}/></button>
                                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { if(e.target.files?.[0]) { handleFeedbackUpload(q.id, e.target.files[0]) } }} />
                                            <button onClick={() => fileInputRef.current?.click()} className={`${getBtnClass(false)} ${isFeedbackUploading === q.id ? 'text-yellow-500' : ''}`} title="Upload Image" disabled={isFeedbackUploading === q.id}>
                                                {isFeedbackUploading === q.id ? <Loader2 size={14} className="animate-spin"/> : <ImagePlus size={14}/>}
                                            </button>
                                        </div>
                                    )}
                                    {!isFocused && <span className="text-[10px] font-bold text-blue-400 uppercase block p-3 pb-0">Feedback</span>}
                                    <div className="p-3" id={`feedback-editor-${q.id}`}>
                                        <RichTextEditor 
                                            value={grade.feedback}
                                            onChange={(html) => handleUpdate(q.id, { feedback: html })}
                                            onFormatChange={setActiveFormats}
                                            placeholder="Enter teacher feedback here..."
                                            className="w-full text-xs text-blue-100 placeholder-white/20 min-h-[40px] focus:outline-none bg-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 border-t border-white/10 bg-[#1a1a1a] flex justify-between items-center rounded-b-2xl">
                    <div className="text-sm text-gray-400">Total: <span className="text-white font-bold text-lg">{Object.values(currentGrades).reduce((a: number, b: any) => a + (b.score || 0), 0)}</span> pts</div>
                    <div className="flex gap-3">
                        {isReleased ? (
                            <>
                                <button onClick={() => onSave(false)} className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"><EyeOff size={14}/> Unpublish (Hide)</button>
                                <button onClick={() => onSave(true)} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors shadow-lg flex items-center gap-2"><Check size={14}/> Update Released Results</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => onSave(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2"><Save size={14}/> Save Draft</button>
                                <button onClick={() => onSave(true)} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors shadow-lg flex items-center gap-2"><Check size={14}/> Release Results</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
