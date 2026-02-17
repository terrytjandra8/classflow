
import React, { useState, memo } from 'react';
import { AssessmentQuestion, AssessmentConfig } from '../../../../types';
import { Eye, BookOpen, AlertCircle, Send, AlertTriangle, RefreshCcw, Clock, Rocket, Check, PenTool, X, ShieldAlert, Unlock } from 'lucide-react';
import { DrawingCanvas } from '../../../ui/DrawingCanvas';
import { supabase } from '../../../../services/supabaseClient';
import { createPortal } from 'react-dom';
import { parseMath } from '../../../../utils/mappers';
import { countQualityWords } from '../../../../utils/validation';

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
    retryQuestions?: string[]; // New prop for revision mode
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- MEMOIZED QUESTION COMPONENT FOR PERFORMANCE ---
const QuestionItem = memo(({ 
    q, idx, answer, onAnswerChange, isReadingMode, allowInteractions, setActiveDrawingQId, questionNumber, isReadOnly
}: {
    q: AssessmentQuestion;
    idx: number;
    answer: string;
    onAnswerChange: (id: string, val: string) => void;
    isReadingMode: boolean;
    allowInteractions: boolean;
    setActiveDrawingQId: (id: string) => void;
    questionNumber: number;
    isReadOnly: boolean;
}) => {
    // Section Header Logic
    if (q.type === 'section') {
        return (
            <div className="pt-8 pb-2 border-b border-white/10 mb-4">
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">{q.text}</h3>
            </div>
        );
    }

    // Question Card Logic
    const isEssay = q.type === 'essay';
    const isDrawing = isEssay && answer && answer.startsWith('http');
    
    // SPAM CHECK LOGIC
    const wc = isEssay && !isDrawing ? countQualityWords(answer || '') : 0;
    const rawWc = isEssay && !isDrawing ? (answer || '').trim().split(/\s+/).filter(w => w.length > 0).length : 0;
    const isSpamming = isEssay && !isDrawing && (rawWc - wc > 5); // If >5 garbage words detected
    
    const isUnderWordLimit = isEssay && q.minWords && wc < q.minWords && !isDrawing;
    
    // Parse Math Symbols in Question Text
    const renderedText = parseMath(q.text);

    // Response Capability Logic
    const responseType = q.responseType || (q.allowDrawing ? 'both' : 'text');
    const allowText = responseType === 'text' || responseType === 'both';
    const allowDrawing = responseType === 'drawing' || responseType === 'both';

    return (
        <div className={`rounded-2xl p-6 shadow-lg transition-all ${isReadingMode ? 'bg-[#1a1a1a]/50 border border-white/5 opacity-80' : 'bg-[#1a1a1a] border border-white/10'}`}>
            <div className="flex justify-between mb-4">
                <span className="text-sm font-bold text-blue-400">Question {questionNumber}</span>
                <span className="text-xs font-bold text-gray-500">{q.points} pts</span>
            </div>
            
            <div 
                className={`text-lg font-medium mb-6 leading-relaxed rich-text-content ${allowInteractions && !isReadOnly ? 'select-text' : 'select-none'}`}
                dangerouslySetInnerHTML={{ __html: renderedText }}
            />

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
                            <span className="text-gray-200 select-none">{opt}</span>
                        </label>
                    ))}
                </div>
            )}

            {q.type === 'essay' && (
                <>
                    {allowDrawing && (
                        <div className="mb-4">
                            {isDrawing ? (
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

                    {allowText && !isDrawing && (
                        <div className="relative">
                            <textarea 
                                value={answer || ''}
                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                disabled={isReadingMode || isReadOnly}
                                className={`w-full bg-[#111] border rounded-xl p-4 text-white outline-none min-h-[150px] leading-relaxed transition-colors ${
                                    isReadingMode || isReadOnly ? 'border-transparent cursor-not-allowed opacity-50' : 
                                    (isUnderWordLimit && answer ? 'border-amber-500/50 focus:border-amber-500' : 'border-white/10 focus:border-blue-500')
                                }`}
                                placeholder={isReadingMode ? "Reading time active..." : (isReadOnly ? "Question is locked." : "Type your answer here...")}
                                onPaste={(e) => !allowInteractions && e.preventDefault()}
                            />
                            {isSpamming && (
                                <div className="absolute bottom-4 right-4 text-xs font-bold text-red-500 flex items-center gap-1 bg-black/50 backdrop-blur px-2 py-1 rounded">
                                    <ShieldAlert size={12} /> Spam Detected
                                </div>
                            )}
                        </div>
                    )}
                    
                    {q.minWords && q.minWords > 0 && !isDrawing && allowText && (
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
    boardTitle, questions, config, timeLeft, answers, onAnswerChange, onSubmit, onManualSync, meetsRequirements, isPreviewMode, onExitPreview, isReadingMode, isPracticeMode, retryQuestions
}) => {
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeDrawingQId, setActiveDrawingQId] = useState<string | null>(null);

    // In Practice Mode, we relax security restrictions
    const allowInteractions = !!isPracticeMode;
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

    const handleSaveDrawing = async (blob: Blob) => {
        if (!activeDrawingQId) return;
        
        try {
            const fileName = `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
            const { data, error } = await supabase.storage.from('uploads').upload(fileName, blob);
            
            if (error) throw error;
            
            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
            
            // FORCE IMMEDIATE SAVE for image uploads
            onAnswerChange(activeDrawingQId, publicUrl, true);
            setActiveDrawingQId(null);
        } catch (e) {
            console.error("Drawing upload failed", e);
            alert("Failed to save drawing. Please try again.");
        }
    };

    return (
        <div 
            className="h-full flex flex-col bg-[#111] text-white overflow-hidden relative" 
            onContextMenu={e => !allowInteractions && e.preventDefault()}
        >
            
            {isPreviewMode && (
                <div className="bg-indigo-600 text-white px-4 py-2 flex justify-between items-center z-50 sticky top-0 shadow-md shrink-0">
                    <span className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><Eye size={16} /> Student Preview Mode</span>
                    <button onClick={onExitPreview} className="bg-white text-indigo-600 px-4 py-1 rounded-full text-xs font-bold hover:bg-indigo-50">Exit Preview</button>
                </div>
            )}
            
            {/* Revision Banner */}
            {isRevision && (
                <div className="bg-orange-600 text-white px-4 py-2 flex justify-center items-center z-50 sticky top-0 shadow-md shrink-0 text-xs font-bold uppercase tracking-wider gap-2">
                    <Unlock size={14} /> Revision Mode: Only unlocked questions can be edited
                </div>
            )}

            {/* STICKY HEADER WITH TIMER */}
            <div className={`h-16 shrink-0 flex items-center justify-between px-6 border-b z-20 ${isReadingMode ? 'bg-blue-900/20 border-blue-500/30' : (isPracticeMode ? 'bg-teal-900/20 border-teal-500/30' : 'bg-[#161616] border-white/10')}`}>
                <div className="flex items-center gap-4">
                    <div className="font-bold truncate max-w-[200px]">{boardTitle}</div>
                    
                    {/* Manual Sync Button */}
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`}
                        title="Sync & Save answers manually"
                    >
                        <RefreshCcw size={14} />
                    </button>

                    {/* Deadline Display (Hide for Practice) */}
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

            {/* READING MODE WARNING OVERLAY (Non-intrusive) */}
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
                        // If in revision mode, only allow editing if q.id is in retryQuestions
                        const isQuestionReadOnly = isRevision && !retryQuestions?.includes(q.id);

                        return (
                            <QuestionItem 
                                key={q.id}
                                q={q}
                                idx={idx}
                                answer={answers[q.id]}
                                onAnswerChange={(id, val) => onAnswerChange(id, val, false)} // Text uses debounce (false)
                                isReadingMode={isReadingMode}
                                allowInteractions={allowInteractions}
                                setActiveDrawingQId={setActiveDrawingQId}
                                questionNumber={questionNumber}
                                isReadOnly={isQuestionReadOnly ?? false}
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
                                    <><Send size={20} /> {isRevision ? 'Submit Revision' : 'Submit Assessment'}</>
                                ) : (
                                    <><AlertTriangle size={20} /> Submit with Warnings</>
                                )
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Confirm Modal */}
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
                                {isPracticeMode ? 'Finish' : 'Confirm Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Drawing Modal */}
            {activeDrawingQId && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                     <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                         <button 
                            onClick={() => setActiveDrawingQId(null)}
                            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-50"
                         >
                             <X size={24}/>
                         </button>
                         <div className="flex-1 bg-white relative">
                            <DrawingCanvas 
                                onSave={handleSaveDrawing} 
                                manualSave={true} 
                            />
                         </div>
                     </div>
                </div>
            )}
        </div>
    );
};
