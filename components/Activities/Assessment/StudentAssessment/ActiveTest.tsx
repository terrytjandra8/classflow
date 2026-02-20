
import React, { useState, memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { AssessmentQuestion, AssessmentConfig } from '../../../../types';
import { Eye, BookOpen, AlertCircle, Send, AlertTriangle, RefreshCcw, Clock, Rocket, Check, PenTool, X, ShieldAlert, Unlock, Bold, Italic, Underline, List, ListOrdered, Subscript, Superscript } from 'lucide-react';
import { DrawingCanvas } from '../../../ui/DrawingCanvas';
import { supabase } from '../../../../services/supabaseClient';
import { parseMath } from '../../../../utils/mappers';
import { countQualityWords } from '../../../../utils/validation';
import { RichTextEditor, FormatState } from '../../../RichTextEditor';
import { debounce } from 'lodash';

// ... (Keep existing helper components like formatTime and QuestionItem the same)

export const ActiveTest: React.FC<ActiveTestProps> = ({ 
    boardTitle, questions, config, timeLeft, answers, onAnswerChange, onSubmit, onManualSync, meetsRequirements, isPreviewMode, onExitPreview, isReadingMode, isPracticeMode, retryQuestions, onViolation
}) => {
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeDrawingQId, setActiveDrawingQId] = useState<string | null>(null);
    const [drawingSaveStatus, setDrawingSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [liveDrawingBlob, setLiveDrawingBlob] = useState<Blob | null>(null);
    const [lastSavedUrl, setLastSavedUrl] = useState<string | null>(null);
    const [showViolationWarning, setShowViolationWarning] = useState(false);

    const isRevision = retryQuestions && retryQuestions.length > 0;
    const isZeroTolerance = !isPracticeMode && !isPreviewMode;

    // Ref to track if the violation has already been triggered in this session
    const violationTriggered = useRef(false);

    // Anti-cheat mechanism
    useEffect(() => {
        if (!isZeroTolerance) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && !violationTriggered.current) {
                violationTriggered.current = true;
                onViolation();
                setShowViolationWarning(true);
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !violationTriggered.current) {
                violationTriggered.current = true;
                onViolation();
                setShowViolationWarning(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [isZeroTolerance, onViolation]);

    // ... (rest of the component logic: drawing handlers, sync, submit, etc.)

    return (
        <div 
            className="h-full flex flex-col bg-[#111] text-white overflow-hidden relative" 
            onContextMenu={e => e.preventDefault()}
        >
            
            {/* ... (Preview and Revision mode banners) */}

            {isZeroTolerance && (
                <div className="bg-red-600 text-white px-4 py-1.5 flex justify-center items-center z-50 sticky top-0 shadow-md shrink-0 text-xs font-bold uppercase tracking-wider gap-2">
                    <ShieldAlert size={14} /> Zero Tolerance Mode Active
                </div>
            )}

            {/* Header */}
            <div className={`h-16 shrink-0 flex items-center justify-between px-6 border-b z-20 ${isReadingMode ? 'bg-blue-900/20 border-blue-500/30' : (isPracticeMode ? 'bg-teal-900/20 border-teal-500/30' : (isZeroTolerance ? 'bg-red-900/20 border-red-500/30' : 'bg-[#161616] border-white/10'))}`}>
                 {/* ... (header content: title, sync, timer) */}
            </div>

            {/* ... (Reading mode banner) */}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 relative">
                {/* ... (Question mapping) */}
            </div>

            {/* Modals */}
            {showViolationWarning && (
                 <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-red-900 border border-red-500 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4 text-red-300">
                            <ShieldAlert size={32} />
                            <h3 className="text-lg font-bold text-white">Assessment Rules Violated</h3>
                        </div>
                        <p className="text-red-200 text-sm mb-4 leading-relaxed">
                            You have either switched tabs or exited full-screen mode. This action has been recorded. Further violations may lead to disqualification.
                        </p>
                        <p className="text-gray-400 text-xs mb-6">
                            This is a zero-tolerance assessment. Please remain on this tab and in full-screen for the duration of the test.
                        </p>
                        <button 
                            onClick={() => setShowViolationWarning(false)}
                            className="w-full py-2.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            )}
            
            {/* ... (other modals: submit, drawing) */}

        </div>
    );
};
