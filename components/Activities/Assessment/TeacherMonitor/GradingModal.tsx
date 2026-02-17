
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Printer, X, Save, Check, FileWarning, Loader2, Cloud, Eye, EyeOff, Bold, Italic, Subscript, Superscript, UploadCloud, RefreshCw, Lock, Unlock, ShieldCheck, ImagePlus } from 'lucide-react';
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
        bold: false, italic: false, list: false, subscript: false, superscript: false 
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

    const execCmd = (cmd: string) => {
        document.execCommand(cmd, false, undefined);
        
        setActiveFormats({
            bold: getActiveFormat('bold', ['B', 'STRONG']),
            italic: getActiveFormat('italic', ['I', 'EM']),
            list: document.queryCommandState('insertUnorderedList'),
            subscript: getActiveFormat('subscript', ['SUB']),
            superscript: getActiveFormat('superscript', ['SUP']),
        });
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
                    {/* ... header content ... */}
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
                                {/* Question Header */}
                                
                                <div className="bg-[#222] p-3 rounded-lg border border-white/5 mb-4 relative group/answer">
                                    {/* Student Answer */}
                                </div>

                                <div 
                                    className={`bg-black/20 rounded-lg border transition-colors ${isFocused ? 'border-blue-500/50' : 'border-white/5'}`}
                                    onFocus={() => setActiveFeedbackId(q.id)}
                                >
                                    {isFocused && (
                                        <div className="flex items-center gap-2 p-2 border-b border-white/5 bg-[#161616] rounded-t-lg animate-in fade-in slide-in-from-top-1">
                                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className={getBtnClass(activeFormats.bold)} title="Bold"><Bold size={14}/></button>
                                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className={getBtnClass(activeFormats.italic)} title="Italic"><Italic size={14}/></button>
                                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('subscript'); }} className={getBtnClass(activeFormats.subscript)} title="Subscript"><Subscript size={14}/></button>
                                            <button onMouseDown={(e) => { e.preventDefault(); execCmd('superscript'); }} className={getBtnClass(activeFormats.superscript)} title="Superscript"><Superscript size={14}/></button>
                                            
                                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                                            
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={(e) => {
                                                    if(e.target.files?.[0]) {
                                                        handleFeedbackUpload(q.id, e.target.files[0])
                                                    }
                                                }}
                                            />
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`${getBtnClass(false)} ${isFeedbackUploading === q.id ? 'text-yellow-500' : ''}`}
                                                title="Upload Image"
                                                disabled={isFeedbackUploading === q.id}
                                            >
                                                {isFeedbackUploading === q.id ? <Loader2 size={14} className="animate-spin"/> : <ImagePlus size={14}/>}
                                            </button>

                                            <span className="ml-auto text-[9px] text-gray-600 font-medium">Rich Text Enabled</span>
                                        </div>
                                    )}
                                    
                                    {!isFocused && <span className="text-[10px] font-bold text-blue-400 uppercase block p-3 pb-0">Feedback</span>}

                                    <div className="p-3">
                                        <div id={`feedback-editor-${q.id}`}>
                                            <RichTextEditor 
                                                value={parseMath(grade.feedback)} 
                                                onChange={(html) => handleUpdate(q.id, { feedback: html })}
                                                onFormatChange={setActiveFormats}
                                                placeholder="Enter teacher feedback here..."
                                                className="w-full text-xs text-blue-100 placeholder-white/20 min-h-[40px] focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
            </div>
        </div>
    );
};
