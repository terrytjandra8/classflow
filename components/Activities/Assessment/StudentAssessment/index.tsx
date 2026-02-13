
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AssessmentQuestion, Board, AssessmentConfig } from '../../../../types';
import { useFocusMode } from '../../../../hooks/useFocusMode';
import { supabase } from '../../../../services/supabaseClient';
import { ReportCard } from './ReportCard';
import { StatusViews } from './StatusViews';
import { ActiveTest } from './ActiveTest';
import { Cloud, Check, Loader2, AlertCircle, Save } from 'lucide-react';

interface StudentAssessmentProps {
    board: Board;
    questions: AssessmentQuestion[];
    userId: string;
    onUpdateBoard: (updates: Partial<Board>) => void; 
    config: AssessmentConfig;
    timeLeft: number | null;
    isPreviewMode?: boolean;
    onExitPreview?: () => void;
}

export const StudentAssessment: React.FC<StudentAssessmentProps> = ({ board, questions, userId, config, timeLeft, isPreviewMode, onExitPreview }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [violationCount, setViolationCount] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [isDisqualified, setIsDisqualified] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
    const [retryQuestions, setRetryQuestions] = useState<string[]>([]);
    
    // Critical: Use Ref for ID to avoid closure staleness during rapid saves
    const submissionIdRef = useRef<string | null>(null);
    const answersRef = useRef<Record<string, string>>({});
    const violationCountRef = useRef(0);
    const saveTimeoutRef = useRef<any>(null);
    const isCreatingRef = useRef(false); // Lock for creation

    // Initial State Sync
    const [submissionData, setSubmissionData] = useState<any>(null);
    
    // Timer & Status Logic (Client-Side Enforcement)
    // We force a check every second to ensure the UI updates exactly when the deadline passes
    const [now, setNow] = useState(Date.now());
    
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const isTimeExpired = config.autoLockTime ? now >= config.autoLockTime : false;
    const isClosed = config.status === 'closed' || isTimeExpired;

    const isReadingMode = config.status === 'reading' && !isTimeExpired;
    const isTestActive = config.status === 'active' && !isTimeExpired;
    const isPracticeMode = config.status === 'practice';

    // Backup Key
    const backupKey = useMemo(() => `assessment_backup_${board.id}_${userId}`, [board.id, userId]);

    // Helper: Save to Local Storage
    const saveToBackup = (data: any) => {
        try {
            localStorage.setItem(backupKey, JSON.stringify({
                ...data,
                timestamp: Date.now()
            }));
        } catch (e) { console.error("Backup failed", e); }
    };

    // 1. Initial Load (DB + Local Storage Merge)
    const fetchSubmission = useCallback(async () => {
        // A. Fetch Server Data
        const { data } = await supabase
            .from('notes')
            .select('*')
            .eq('board_id', board.id)
            .eq('author_id', userId)
            .eq('type', 'assessment_submission')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        // B. Fetch Local Backup
        let localBackup: any = null;
        try {
            const raw = localStorage.getItem(backupKey);
            if (raw) localBackup = JSON.parse(raw);
        } catch (e) {}

        let finalAnswers = {};
        let finalViolations = 0;
        let finalData: any = {};
        let dbId = null;

        // --- STRATEGY: Server Authority > Local Fallback ---
        
        // 1. Check Server State
        if (data) {
            dbId = data.id;
            submissionIdRef.current = data.id;
            
            if (data.connections) {
                const submission = data.connections as any;
                finalData = Array.isArray(submission) ? {} : submission;
                
                // If Server says finished, trust it absolutely
                if (finalData.submitted || finalData.disqualified || (isClosed && finalData.answers)) {
                    setSubmissionData(finalData);
                    setAnswers(finalData.answers || {});
                    answersRef.current = finalData.answers || {};
                    setViolationCount(finalData.violations || 0);
                    
                    // REVISION LOGIC: If retryQuestions are present, enable re-entry
                    const retries = finalData.retryQuestions || [];
                    setRetryQuestions(retries);

                    // Only set submitted to true if NO retries are pending
                    if (retries.length > 0) {
                        setSubmitted(false); // Re-open
                        setHasStarted(true);
                    } else {
                        setSubmitted(true);
                        if (finalData.disqualified) setIsDisqualified(true);
                        setHasStarted(true);
                    }
                    
                    // Clear local backup as server has final state
                    localStorage.removeItem(backupKey);
                    return;
                }

                finalAnswers = finalData.answers || {};
                finalViolations = finalData.violations || 0;
            }
        }

        // 2. Check Local Backup (If Server is not finished)
        if (localBackup) {
            // If local says finished (e.g. offline submit), trust local
            if (localBackup.status === 'submitted' || localBackup.status === 'disqualified') {
                console.log("Restoring FINAL state from local backup");
                finalAnswers = localBackup.answers || {};
                finalViolations = localBackup.violations || 0;
                
                setSubmitted(true);
                if (localBackup.status === 'disqualified') setIsDisqualified(true);
                setHasStarted(true);
                
                setAnswers(finalAnswers);
                answersRef.current = finalAnswers;
                setViolationCount(finalViolations);
                violationCountRef.current = finalViolations;
                
                // Trigger a sync to DB to ensure server knows (self-healing)
                // We don't await this, just fire it
                persistToDB(finalAnswers, finalViolations, localBackup.status === 'disqualified', true);
                return;
            }

            // If both in progress, check if local has MORE data than server
            const localCount = Object.keys(localBackup.answers || {}).length;
            const serverCount = Object.keys(finalAnswers).length;

            if (localCount > serverCount) {
                console.log("Restoring DRAFT from local backup (Newer Data Found)");
                finalAnswers = { ...finalAnswers, ...localBackup.answers };
                finalViolations = Math.max(finalViolations, localBackup.violations || 0);
                
                // Self-Heal: Push local data to server silently
                persistToDB(finalAnswers, finalViolations, false, false);
            }
        }

        // 3. Apply Merged State
        setSubmissionData(finalData);
        setAnswers(finalAnswers);
        answersRef.current = finalAnswers;
        
        setViolationCount(finalViolations);
        violationCountRef.current = finalViolations;

        if (Object.keys(finalAnswers).length > 0 || dbId) {
            setHasStarted(true);
        }
    }, [board.id, userId, isClosed, backupKey]);

    useEffect(() => {
        if (!isPreviewMode) fetchSubmission();
        else setHasStarted(true);
    }, [fetchSubmission, isPreviewMode]);

    // 2. Auto-Submit when closed (Unless in Practice Mode, then it might stay open or handle differently)
    useEffect(() => {
        // Don't auto-submit if in revision mode (retryQuestions present)
        if (!isPreviewMode && isClosed && !submitted && hasStarted && !isPracticeMode && retryQuestions.length === 0) {
            setSubmitted(true);
        }
    }, [isClosed, submitted, hasStarted, isPreviewMode, isPracticeMode, retryQuestions]);

    // Robust Save Function
    const persistToDB = useCallback(async (currentAnswers: Record<string, string>, currentViolations: number, disqualified: boolean, isFinalSubmit: boolean) => {
        if (isPreviewMode) return;
        
        // Prevent concurrent creations
        if (!submissionIdRef.current && isCreatingRef.current) return;

        setSaveStatus('saving');
        const { data: { user } } = await supabase.auth.getUser();
        
        // Calculate Auto Score for MCQs
        let autoScore = 0;
        if (!disqualified) {
            questions.forEach(q => {
                if (q.type === 'mcq' && q.correctAnswer === currentAnswers[q.id]) {
                    autoScore += q.points;
                }
            });
        }
        
        // Preserve retries in case teacher added them
        const existingRetries = submissionData?.retryQuestions || [];

        const newSubmissionData = {
            ...submissionData,
            answers: currentAnswers,
            violations: currentViolations,
            score: autoScore,
            submitted: isFinalSubmit || disqualified, 
            disqualified: disqualified,
            retryQuestions: existingRetries // Preserve this
        };

        const payload = {
            board_id: board.id,
            author_id: userId,
            title: 'Assessment Submission',
            type: 'assessment_submission',
            content: disqualified ? 'Disqualified (Violation)' : (isFinalSubmit ? 'Submitted' : 'In Progress'),
            author: user?.user_metadata?.full_name || 'Student',
            color: disqualified ? 'bg-red-500' : 'bg-white',
            connections: newSubmissionData as any 
        };

        try {
            if (submissionIdRef.current) {
                await supabase.from('notes').update(payload).eq('id', submissionIdRef.current);
            } else {
                isCreatingRef.current = true;
                const { data, error } = await supabase.from('notes').insert({ ...payload, x: 0, y: 0 }).select().single();
                isCreatingRef.current = false;
                
                if (data && !error) {
                    submissionIdRef.current = data.id;
                }
            }
            setSubmissionData(newSubmissionData);
            setSaveStatus('saved');
            
            // Clear backup ONLY if successfully saved final state
            if (isFinalSubmit) {
                localStorage.removeItem(backupKey);
            }
        } catch (e) {
            console.error("Save failed", e);
            setSaveStatus('error');
            isCreatingRef.current = false;
        }
    }, [board.id, userId, questions, isPreviewMode, submissionData, backupKey]);

    // --- MANUAL SYNC HANDLER ---
    const handleManualSync = async () => {
        // 1. Force Save Current State
        await persistToDB(answersRef.current, violationCountRef.current, false, false);
        // 2. Re-fetch from DB to verify sync and update UI
        await fetchSubmission();
    };

    const handleViolation = async () => {
        // Enforce anti-cheating during BOTH active test AND reading time
        // BUT SKIP IF PRACTICE MODE
        if (isPracticeMode) return; 

        if ((!isTestActive && !isReadingMode) || submitted || isDisqualified) return;

        const newCount = violationCountRef.current + 1;
        
        // Update State & Refs
        setViolationCount(newCount);
        violationCountRef.current = newCount;
        
        setIsDisqualified(true);
        setSubmitted(true); 
        
        // Immediate Backup
        saveToBackup({
            answers: answersRef.current,
            violations: newCount,
            status: 'disqualified'
        });
        
        // Immediate Persist on Violation
        await persistToDB(answersRef.current, newCount, true, true);
    };

    // Activate Focus Guard (Disabled in Practice Mode)
    useFocusMode(((isTestActive || isReadingMode) && !submitted && !isDisqualified && !isPreviewMode && !isPracticeMode), handleViolation);

    // OPTIMIZED: Stable callback that doesn't depend on 'answers' state
    const handleAnswerChange = useCallback((qId: string, value: string, immediate = false) => {
        if (isDisqualified || submitted || isClosed || isReadingMode) return;
        
        // Update ref immediately for backup consistency
        answersRef.current = { ...answersRef.current, [qId]: value };
        
        // Update React State (functional update to avoid dependency)
        setAnswers(prev => ({ ...prev, [qId]: value }));
        
        // Instant Local Backup using Ref
        saveToBackup({
            answers: answersRef.current,
            violations: violationCountRef.current,
            status: 'active'
        });
        
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSaveStatus('saving');
        
        if (immediate) {
             // Force immediate save for critical updates (like image uploads)
             persistToDB(answersRef.current, violationCountRef.current, false, false);
        } else {
            // Debounced DB Save with Random Jitter (Scalability Fix)
            const jitter = Math.floor(Math.random() * 1000); 
            const delay = 1500 + jitter;

            saveTimeoutRef.current = setTimeout(() => {
                persistToDB(answersRef.current, violationCountRef.current, false, false);
            }, delay);
        }
    }, [isDisqualified, submitted, isClosed, isReadingMode, persistToDB]);

    const handleConfirmSubmit = async () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        // If retrying, remove questions from retry list in local state (optimistic)
        // The next fetch or logic will handle DB sync naturally via persistToDB
        if (retryQuestions.length > 0) {
            setRetryQuestions([]); 
        }

        setSubmitted(true);
        
        // Backup final state locally first (safety net)
        saveToBackup({
            answers: answersRef.current,
            violations: violationCountRef.current,
            status: 'submitted'
        });

        await persistToDB(answersRef.current, violationCountRef.current, false, true);
    };

    const startTest = async () => {
        if (!isPreviewMode && !isPracticeMode) {
            try {
                await document.documentElement.requestFullscreen();
            } catch (e) {
                console.log("Fullscreen optional");
            }
        }
        setHasStarted(true);
        // Initial save
        await persistToDB(answers, 0, false, false);
    };

    const returnToHome = () => {
        if (isPreviewMode && onExitPreview) {
            onExitPreview();
        } else {
            window.location.href = '/';
        }
    };

    const countWords = (text: string) => {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(w => w.length > 0).length;
    };

    const meetsRequirements = useMemo(() => {
        return !questions.some(q => {
            if (q.type !== 'essay' || !q.minWords) return false;
            const wc = countWords(answers[q.id] || '');
            return wc < q.minWords;
        });
    }, [questions, answers]);

    // --- VIEW ROUTING ---

    // Show Report Card ONLY if: 
    // 1. Closed AND grades released
    // 2. OR Preview mode AND submitted (with no DQ)
    // 3. AND user is NOT currently revising (retryQuestions empty)
    if (((isClosed && submissionData?.released) || (isPreviewMode && submitted && !isDisqualified)) && retryQuestions.length === 0) {
        return <ReportCard board={board} questions={questions} submissionData={submissionData} isPreviewMode={isPreviewMode} onExitPreview={onExitPreview} onReturnHome={returnToHome} />;
    }

    // Status overrides (DQ > Closed > Submitted)
    if (isDisqualified) return <StatusViews type="disqualified" isPreviewMode={isPreviewMode} onExitPreview={onExitPreview} onReturnHome={returnToHome} />;
    if (isClosed) return <StatusViews type="closed" isPreviewMode={isPreviewMode} onExitPreview={onExitPreview} onReturnHome={returnToHome} submissionData={submissionData} />;
    
    // Show Submitted screen ONLY if genuinely submitted AND no retries pending
    if (submitted && retryQuestions.length === 0) return <StatusViews type="submitted" isPreviewMode={isPreviewMode} onExitPreview={onExitPreview} onReturnHome={returnToHome} />;
    
    if (config.status === 'setup' && !isPreviewMode) {
        return <StatusViews type="setup" board={board} config={config} questions={questions} onManualRefresh={() => window.location.reload()} />;
    }

    if (!hasStarted && !isReadingMode) {
        return <StatusViews type="intro" board={board} isPreviewMode={isPreviewMode} onExitPreview={onExitPreview} onStartTest={startTest} config={config} />;
    }

    return (
        <div className="h-full relative">
            {/* Save Status Indicator */}
            <div className="absolute top-20 right-6 z-50 pointer-events-none transition-opacity duration-300">
                {saveStatus === 'saving' && (
                    <div className="flex items-center gap-2 text-yellow-500 bg-black/80 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 shadow-lg">
                        <Loader2 size={12} className="animate-spin" /> Saving...
                    </div>
                )}
                {saveStatus === 'saved' && (
                    <div className="flex items-center gap-2 text-green-400 bg-black/80 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 shadow-lg animate-in fade-in zoom-in">
                        <Cloud size={12} /> Saved
                    </div>
                )}
                {saveStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-400 bg-black/80 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-red-500/50 shadow-lg">
                        <AlertCircle size={12} /> Saving to Cloud Failed (Local Backup Active)
                    </div>
                )}
            </div>

            <ActiveTest 
                boardTitle={board.title}
                questions={questions}
                config={config}
                timeLeft={timeLeft}
                answers={answers}
                onAnswerChange={handleAnswerChange}
                onSubmit={handleConfirmSubmit}
                onManualSync={handleManualSync}
                meetsRequirements={meetsRequirements}
                isPreviewMode={isPreviewMode}
                onExitPreview={onExitPreview}
                isReadingMode={isReadingMode}
                isPracticeMode={isPracticeMode}
                retryQuestions={retryQuestions} // New Prop
            />
        </div>
    );
};
