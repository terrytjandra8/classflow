
import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { AssessmentQuestion, AssessmentConfig } from '../../../../types';
import { Eye, BookOpen, AlertCircle, Send, AlertTriangle, RefreshCcw, Clock, Rocket, Check, PenTool, X, ShieldAlert, Unlock, Bold, Italic, Underline, List, ListOrdered, Subscript, Superscript, Minus, Square } from 'lucide-react';
import { DrawingCanvas } from '../../../ui/DrawingCanvas';
import { supabase } from '../../../../services/supabaseClient';
import { parseMath } from '../../../../utils/mappers';
import { countQualityWords } from '../../../../utils/validation';
import { RichTextEditor, FormatState, getActiveFormat } from '../../../RichTextEditor';
import { debounce } from 'lodash';

interface ActiveTestProps {
    boardTitle: string;
    questions: AssessmentQuestion[];
    config: AssessmentConfig;
    timeLeft: number | null;
    answers: Record<string, string>;
    onAnswerChange: (qId: string, value: string, immediate?: boolean) => void;
    onSubmit: () => void;
    onManualSync: () => void;
    meetsRequirements: boolean;
    isPreviewMode?: boolean;
    onExitPreview?: () => void;
    isReadingMode: boolean;
    isPracticeMode?: boolean;
    retryQuestions?: string[];
    onViolation: () => void;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const QuestionItem = memo(({ 
    q, answer, onAnswerChange, isReadingMode, setActiveDrawingQId, questionNumber, isReadOnly, config
}: {
    q: AssessmentQuestion;
    answer: string;
    onAnswerChange: (id: string, val: string) => void;
    isReadingMode: boolean;
    setActiveDrawingQId: (id: string) => void;
    questionNumber: number;
    isReadOnly: boolean;
    config: AssessmentConfig
}) => {
    const [activeFormats, setActiveFormats] = useState<FormatState & { box: boolean }>({
        bold: false, italic: false, underline: false, strikeThrough: false, list: false, orderedList: false,
        subscript: false, superscript: false, blockquote: false, h1: false, h2: false, h3: false, h4: false,
        alignLeft: true, alignCenter: false, alignRight: false, alignJustify: false,
        box: false, // New format for the box
    });
    
    if (q.type === 'section') {
        return (
            <div className="pt-8 pb-2 border-b border-white/10 mb-4">
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">{q.text}</h3>
            </div>
        );
    }

    const isEssay = q.type === 'essay';
    const responseType = q.responseType || (q.allowDrawing ? 'both' : 'text');
    const allowText = responseType === 'text' || responseType === 'both';
    const allowDrawing = responseType === 'drawing' || responseType === 'both';
    
    const isDrawingAnswer = isEssay && (answer?.startsWith('http') || answer?.startsWith('blob'));
    const isTextAnswer = isEssay && !isDrawingAnswer;
    
    const isDrawingVisible = allowDrawing && isDrawingAnswer;
    const isTextVisible = allowText && !isDrawingAnswer;

    const wc = isTextAnswer ? countQualityWords(answer || '') : 0;
    const rawWc = isTextAnswer ? (answer || '').trim().split(/\s+/).filter(w => w.length > 0).length : 0;
    const isSpamming = isTextAnswer && (rawWc - wc > 5);
    const isUnderWordLimit = isTextAnswer && q.minWords && wc < q.minWords;
    
    const renderedText = parseMath(q.text);
    const renderedNotes = q.notes ? parseMath(q.notes) : null;

    const handleCommand = (cmd: string) => {
        if (cmd === 'formatBlock' && getActiveFormat('', ['SPAN.box'])) {
            document.execCommand('removeFormat'); 
        }

        if (cmd === 'insertHorizontalRule' && getActiveFormat('', ['SPAN.box'])) {
            return;
        }
        if (cmd === 'formatBlock' && getActiveFormat('insertHorizontalRule')) {
            return; 
        }

        if (cmd === 'formatBlock') {
            const isBox = getActiveFormat('', ['SPAN.box']);
            document.execCommand('removeFormat');
            if(!isBox) {
                document.execCommand('insertHTML', false, `<span class="box">${window.getSelection()?.toString()}</span>`);
            }
        } else {
            document.execCommand(cmd, false);
        }
    }

    const getBtnClass = (isActive: boolean) => 
        `p-1.5 rounded transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`;

    return (
        <div className={`rounded-2xl p-6 shadow-lg transition-all ${isReadingMode || isReadOnly ? 'bg-[#1a1a1a]/50 border border-white/5 opacity-80' : 'bg-[#1a1a1a] border border-white/10'}`}>
            <div className="flex justify-between mb-4">
                <span className="text-sm font-bold text-blue-400">Question {questionNumber}</span>
                <span className="text-xs font-bold text-gray-500">{q.points} pts</span>
            </div>
            
            <div 
                className="text-lg font-medium mb-4 leading-relaxed rich-text-content select-none"
                dangerouslySetInnerHTML={{ __html: renderedText }}
            />

            {renderedNotes && (
                <div 
                    className="text-sm text-gray-400 mb-6 leading-relaxed rich-text-content select-none bg-black/20 p-4 rounded-lg border border-white/5"
                    dangerouslySetInnerHTML={{ __html: renderedNotes }}
                />
            )}

            {q.type === 'mcq' && (
                <div className="space-y-3">
                    {q.options?.map((opt, optIdx) => (
                        <label 
                            key={optIdx} 
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                isReadingMode || isReadOnly ? 'cursor-not-allowed opacity-50 bg-[#111] border-transparent' : 
                                (answer === optIdx.toString() ? 'bg-blue-600/20 border-blue-500 cursor-pointer' : 'bg-[#111] border-white/10 hover:border-white/30 cursor-pointer')
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${answer === optIdx.toString() ? 'border-blue-500' : 'border-gray-500'}`}>
                                {answer === optIdx.toString() && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                            </div>
                            <input 
                                type="radio" 
                                name={q.id} 
                                value={optIdx} 
                                checked={answer === optIdx.toString()}
                                onChange={() => onAnswerChange(q.id, optIdx.toString())}
                                className="hidden"
                                disabled={isReadingMode || isReadOnly}
                            />
                            <div className="text-gray-200 select-none" dangerouslySetInnerHTML={{__html: parseMath(opt)}} />
                        </label>
                    ))}
                </div>
            )}

            {q.type === 'essay' && (
                <>
                    {allowDrawing && (
                        <div className="mb-4">
                            {isDrawingVisible ? (
                                <div className="relative group border border-white/10 rounded-xl overflow-hidden">
                                    <img src={answer} alt="Drawing Answer" className="w-full h-auto max-h-[400px] object-contain bg-white" />
                                    {!isReadingMode && !isReadOnly && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <button 
                                                onClick={() => setActiveDrawingQId(q.id)}
                                                className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                                            >
                                                <PenTool size={16}/> Edit Drawing
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex justify-end mb-2">
                                    <button 
                                        onClick={() => setActiveDrawingQId(q.id)}
                                        disabled={isReadingMode || isReadOnly}
                                        className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-white bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-colors disabled:opacity-50"
                                    >
                                        <PenTool size={14} /> Draw Answer
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {isTextVisible && (
                        <div className={`relative bg-[#111] border rounded-xl focus-within:border-blue-500 transition-colors ${isReadingMode || isReadOnly ? 'border-transparent opacity-70' : 'border-white/10'}`}>
                            {!(isReadingMode || isReadOnly) && (
                                <div className="flex items-center gap-1 p-1 border-b border-white/10 bg-[#111] sticky top-0 z-10 rounded-t-xl">
                                    <button onMouseDown={e => { e.preventDefault(); handleCommand('bold'); }} className={getBtnClass(activeFormats.bold)} title="Bold (Ctrl+B)"><Bold size={14}/></button>
                                    <button onMouseDown={e => { e.preventDefault(); handleCommand('italic'); }} className={getBtnClass(activeFormats.italic)} title="Italic (Ctrl+I)"><Italic size={14}/></button>
                                    <button onMouseDown={e => { e.preventDefault(); handleCommand('underline'); }} className={getBtnClass(activeFormats.underline)} title="Underline (Ctrl+U)"><Underline size={14}/></button>
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    <button onMouseDown={e => { e.preventDefault(); handleCommand('subscript'); }} className={getBtnClass(activeFormats.subscript)} title="Subscript"><Subscript size={14}/></button>
                                    <button onMouseDown={e => { e.preventDefault(); handleCommand('superscript'); }} className={getBtnClass(activeFormats.superscript)} title="Superscript"><Superscript size={14}/></button>
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    <button onMouseDown={e => { e.preventDefault(); handleCommand('insertUnorderedList'); }} className={getBtnClass(activeFormats.list)} title="Bulleted List"><List size={14}/></button>
                                    <button onMouseDown={e => { e.preventDefault(); handleCommand('insertOrderedList'); }} className={getBtnClass(activeFormats.orderedList)} title="Numbered List"><ListOrdered size={14}/></button>
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    <button onMouseDown={e => { e.preventDefault(); handleCommand('insertHorizontalRule'); }} className={getBtnClass(activeFormats.strikeThrough)} title="Line"><Minus size={14}/></button>
                                    <button onMouseDown={e => { e.preventDefault(); handleCommand('formatBlock'); }} className={getBtnClass(activeFormats.box)} title="Box"><Square size={14}/></button>
                                </div>
                            )}
                            <RichTextEditor 
                                value={answer || ''}
                                onChange={(val) => onAnswerChange(q.id, val)}
                                onFormatChange={(formats) => setActiveFormats({ ...formats, box: getActiveFormat('', ['SPAN.box']) })}
                                imageUploadDisabled={!config.allowStudentImages}
                                readOnly={isReadingMode || isReadOnly}
                                className={`w-full bg-transparent p-4 text-white outline-none min-h-[150px] leading-relaxed`}
                                placeholder={isReadingMode ? "Reading time active..." : (isReadOnly ? "This question is locked for revision." : "Type your answer here...")}
                            />
                            {isSpamming && (
                                <div className="absolute bottom-4 right-4 text-xs font-bold text-red-500 flex items-center gap-1 bg-black/50 backdrop-blur px-2 py-1 rounded">
                                    <ShieldAlert size={12} /> Spam Detected
                                </div>
                            )}
                        </div>
                    )}
                    
                    {q.minWords && q.minWords > 0 && isTextAnswer && (
                        <div className={`flex justify-end mt-2 text-xs font-bold ${isUnderWordLimit ? 'text-amber-500' : 'text-green-500'}`}>
                            {wc} / {q.minWords} valid words {isUnderWordLimit && '(Under Limit)'}
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

export const ActiveTest: React.FC<ActiveTestProps> = ({ 
    boardTitle, questions, config, timeLeft, answers, onAnswerChange, onSubmit, onManualSync, meetsRequirements, isPreviewMode, onExitPreview, isReadingMode, isPracticeMode, retryQuestions, onViolation
}) => {
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeDrawingQId, setActiveDrawingQId] = useState<string | null>(null);
    const [drawingSaveStatus, setDrawingSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [liveDrawingBlob, setLiveDrawingBlob] = useState<Blob | null>(null);

    const isRevision = retryQuestions && retryQuestions.length > 0;

    const handleConfirmSubmit = () => {
        setShowSubmitModal(false);
        onSubmit();
    };

    const handleSync = async () => {
        setIsSyncing(true);
        await onManualSync();
        setTimeout(() => setIsSyncing(false), 800);
    };
    
    const saveDrawing = useCallback(async (blob: Blob, qId: string): Promise<string | null> => {
        setDrawingSaveStatus('saving');
        try {
            const currentAnswer = answers[qId];
            let fileName;

            if (currentAnswer && currentAnswer.startsWith('http') && !currentAnswer.startsWith('blob:')) {
                const urlParts = currentAnswer.split('/');
                fileName = urlParts[urlParts.length - 1].split('?')[0];
            } else {
                fileName = `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
            }

            const { error } = await supabase.storage.from('uploads').upload(fileName, blob, { upsert: true });
            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
            const finalUrl = `${publicUrl}?t=${new Date().getTime()}`;
            
            setDrawingSaveStatus('saved');
            return finalUrl;
        } catch (e) {
            console.error("Drawing upload failed", e);
            setDrawingSaveStatus('error');
            return null;
        }
    }, [answers]);

    const debouncedSave = useMemo(() =>
        debounce((blob: Blob, qId: string) => {
            saveDrawing(blob, qId);
        }, 2500),
    [saveDrawing]);

    useEffect(() => {
        if (liveDrawingBlob && activeDrawingQId) {
            setDrawingSaveStatus('saving'); 
            debouncedSave(liveDrawingBlob, activeDrawingQId);
        }
        return () => {
            debouncedSave.cancel();
        };
    }, [liveDrawingBlob, activeDrawingQId, debouncedSave]);

    const handleCloseDrawingModal = useCallback(() => {
        debouncedSave.cancel();
        const qId = activeDrawingQId;

        if (qId && liveDrawingBlob) {
            const tempUrl = URL.createObjectURL(liveDrawingBlob);
            onAnswerChange(qId, tempUrl, false);
            
            saveDrawing(liveDrawingBlob, qId).then(finalUrl => {
                if (finalUrl) {
                    const img = new Image();
                    img.src = finalUrl;
                    img.onload = () => {
                        onAnswerChange(qId, finalUrl, true);
                        URL.revokeObjectURL(tempUrl);
                    };
                    img.onerror = () => {
                        console.error("Failed to preload final image, swapping directly.");
                        onAnswerChange(qId, finalUrl, true);
                        URL.revokeObjectURL(tempUrl);
                    }
                }
            });
        }
        
        setActiveDrawingQId(null);
        setLiveDrawingBlob(null);
        setDrawingSaveStatus('idle');
    }, [activeDrawingQId, liveDrawingBlob, onAnswerChange, saveDrawing, debouncedSave]);

    const activeDrawingInitialData = activeDrawingQId ? answers[activeDrawingQId] : undefined;

    return (
        <div 
            className="h-full flex flex-col bg-[#111] text-white overflow-hidden relative" 
            onContextMenu={e => { e.preventDefault(); onViolation(); }}
        >
            
            {isPreviewMode && (
                <div className="bg-indigo-600 text-white px-4 py-2 flex justify-between items-center z-50 sticky top-0 shadow-md shrink-0">
                    <span className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><Eye size={16} /> Student Preview Mode</span>
                    <button onClick={onExitPreview} className="bg-white text-indigo-600 px-4 py-1 rounded-full text-xs font-bold hover:bg-indigo-50">Exit Preview</button>
                </div>
            )}
            
            {isRevision && (
                <div className="bg-orange-600/20 border-b border-orange-500/30 p-3 text-center text-orange-200 text-sm font-medium leading-relaxed">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Unlock size={16} /> 
                        <h3 className="font-bold">You are in revision mode.</h3>
                    </div>
                    <p className="text-xs text-orange-300">Only questions marked for revision by your teacher can be edited. Once you are finished, you can re-submit your assessment.</p>
                </div>
            )}

            <div className={`h-16 shrink-0 flex items-center justify-between px-6 border-b z-20 ${isReadingMode ? 'bg-blue-900/20 border-blue-500/30' : (isPracticeMode ? 'bg-teal-900/20 border-teal-500/30' : 'bg-[#161616] border-white/10')}`}>
                <div className="flex items-center gap-4">
                    <div className="font-bold truncate max-w-[200px]">{boardTitle}</div>
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`}
                        title="Sync & Save answers manually"
                    >
                        <RefreshCcw size={14} />
                    </button>
                    {config.autoLockTime && !isPracticeMode && (
                        <div className="text-xs text-red-300 font-bold flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded border border-red-500/20 shadow-sm">
                            <Clock size={12} /> Due: {new Date(config.autoLockTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    )}
                </div>
                
                <div className={`flex flex-col items-center ${timeLeft !== null && timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    <span className="text-2xl font-mono font-bold leading-none">
                        {isPracticeMode ? 'Untimed' : (timeLeft !== null ? formatTime(timeLeft) : '--:--')}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-widest opacity-70">
                        {isReadingMode ? 'Reading Time' : (isPracticeMode ? 'Practice Mode' : 'Time Remaining')}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {isReadingMode ? (
                        <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            <BookOpen size={14} /> Reading Mode
                        </div>
                    ) : isPracticeMode ? (
                        <div className="flex items-center gap-2 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            <Rocket size={14} /> Practice
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-green-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div> Active
                        </div>
                    )}
                </div>
            </div>

            {isReadingMode && (
                <div className="bg-blue-600/20 border-b border-blue-500/30 p-2 text-center text-blue-200 text-xs font-bold">
                    <AlertCircle size={12} className="inline mr-2" />
                    Answering is disabled during reading time. Review the questions carefully.
                </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 relative">
                <div className="max-w-3xl mx-auto space-y-8 pb-20">
                    {questions.map((q, idx) => {
                        const questionNumber = questions.filter((item, i) => i <= idx && item.type !== 'section').length;
                        const isQuestionReadOnly = isRevision && !retryQuestions?.includes(q.id);

                        return (
                            <QuestionItem 
                                key={q.id}
                                q={q}
                                answer={answers[q.id]}
                                onAnswerChange={(id, val) => onAnswerChange(id, val, false)}
                                isReadingMode={isReadingMode}
                                setActiveDrawingQId={setActiveDrawingQId}
                                questionNumber={questionNumber}
                                isReadOnly={isQuestionReadOnly ?? false}
                                config={config}
                            />
                        );
                    })}

                    {!isReadingMode && (
                        <button 
                            onClick={() => setShowSubmitModal(true)}
                            className={`w-full font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 ${meetsRequirements ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                        >
                            {isPracticeMode ? (
                                <><Check size={20} /> Finish Practice</>
                            ) : (
                                meetsRequirements ? (
                                    <><Send size={20} /> {isRevision ? 'Resubmit Assessment' : 'Submit Assessment'}</>
                                ) : (
                                    <><AlertTriangle size={20} /> Submit with Warnings</>
                                )
                            )}
                        </button>
                    )}
                </div>
            </div>

            {showSubmitModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className={`flex items-center gap-3 mb-4 ${meetsRequirements ? 'text-green-500' : 'text-amber-500'}`}>
                            <AlertTriangle size={24} />
                            <h3 className="text-lg font-bold text-white">{isPracticeMode ? 'Finish Practice?' : 'Submit Assessment?'}</h3>
                        </div>
                        
                        {!meetsRequirements && (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-amber-200 text-xs mb-4 leading-relaxed">
                                <strong>Warning:</strong> You have essay questions that do not meet the minimum word count requirement (spam detected or too short).
                            </div>
                        )}

                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            {isPracticeMode ? "Are you sure you want to finish your practice session?" : "Are you sure you want to submit? You cannot change your answers after this point."}
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmSubmit}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-colors shadow-lg ${meetsRequirements ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                            >
                                {isPracticeMode ? 'Finish' : (isRevision ? 'Resubmit Assessment' : 'Confirm Submit')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeDrawingQId && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                     <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
                         <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-2">
                                <PenTool size={18} />
                                <h2 className="font-bold text-lg">Drawing Canvas</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                 <div className={`text-xs flex items-center gap-2 transition-opacity ${drawingSaveStatus === 'idle' ? 'opacity-50' : 'opacity-100'}`}>
                                    {drawingSaveStatus === 'idle' && <>Waiting for changes...</>}
                                    {drawingSaveStatus === 'saving' && <><RefreshCcw size={14} className="animate-spin"/> Saving...</>}
                                    {drawingSaveStatus === 'saved' && <><Check size={14} className="text-green-500"/> Saved</>}
                                    {drawingSaveStatus === 'error' && <><AlertTriangle size={14} className="text-red-500"/> Error</>}
                                </div>
                                <button 
                                    onClick={handleCloseDrawingModal}
                                    className="bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X size={20}/>
                                </button>
                            </div>
                         </div>
                         <div className="flex-1 bg-white relative p-1">
                            <DrawingCanvas
                                key={activeDrawingQId}
                                onDrawEnd={setLiveDrawingBlob} 
                                initialData={activeDrawingInitialData}
                            />
                         </div>
                     </div>
                </div>
            )}
        </div>
    );
};
