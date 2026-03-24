
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AssessmentQuestion, Board, AssessmentConfig } from '../../../../types';
import { supabase } from '../../../../services/supabaseClient';
import { ReportCard } from './ReportCard';
import { StatusViews } from './StatusViews';
import { ActiveTest } from './ActiveTest';
import { Cloud, Loader2, AlertCircle } from 'lucide-react';

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

const SaveStatusIndicator: React.FC<{ status: 'saved' | 'saving' | 'error' | 'idle'; onRetry: () => void }> = React.memo(({ status, onRetry }) => {
    if (status === 'idle') return null;

    return (
        <div className="absolute top-4 right-6 z-50 transition-opacity duration-300">
            {status === 'saving' && (
                <div className="flex items-center gap-2 text-yellow-500 bg-black/80 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 shadow-lg">
                    <Loader2 size={12} className="animate-spin" /> Saving...
                </div>
            )}
            {status === 'saved' && (
                <div className="flex items-center gap-2 text-green-400 bg-black/80 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 shadow-lg animate-in fade-in zoom-in">
                    <Cloud size={12} /> Progress saved
                </div>
            )}
            {status === 'error' && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-red-500/50 shadow-lg">
                    <AlertCircle size={12} /> 
                    <span>Sync Failed. <span className="font-bold underline cursor-pointer" onClick={onRetry}>Retry</span></span>
                </div>
            )}
        </div>
    );
});

export const StudentAssessment: React.FC<StudentAssessmentProps> = ({ board, questions, userId, config, timeLeft, isPreviewMode, onExitPreview }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [violationCount, setViolationCount] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [isDisqualified, setIsDisqualified] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
    const [retryQuestions, setRetryQuestions] = useState<string[]>([]);
    const [userName, setUserName] = useState('Student');
    
    const submissionIdRef = useRef<string | null>(null);
    const answersRef = useRef<Record<string, string>>({});
    const violationCountRef = useRef(0);
    const saveTimeoutRef = useRef<any>(null);
    const isCreatingRef = useRef(false);

    const [submissionData, setSubmissionData] = useState<any>(null);
    const submissionDataRef = useRef(submissionData);

    useEffect(() => {
        submissionDataRef.current = submissionData;
    }, [submissionData]);
    
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

    const backupKey = useMemo(() => `assessment_backup_${board.id}_${userId}`, [board.id, userId]);

    const saveToBackup = useCallback((data: any) => {
        try {
            localStorage.setItem(backupKey, JSON.stringify({
                ...data,
                timestamp: Date.now()
            }));
        } catch (e) { console.error("Backup failed", e); }
    }, [backupKey]);

    const fetchSubmission = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUserName(user?.user_metadata?.full_name || 'Student');

        const { data } = await supabase
            .from('notes')
            .select('*')
            .eq('board_id', board.id)
            .eq('author_id', userId)
            .eq('type', 'assessment_submission')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        let localBackup: any = null;
        try {
            const raw = localStorage.getItem(backupKey);
            if (raw) localBackup = JSON.parse(raw);
        } catch (e) {}

        let finalAnswers = {};
        let finalViolations = 0;
        let finalData: any = {};
        let dbId = null;

        if (data) {
            dbId = data.id;
            submissionIdRef.current = data.id;
            
            if (data.connections) {
                const submission = data.connections as any;
                finalData = Array.isArray(submission) ? {} : submission;
                
                if (finalData.submitted || finalData.disqualified || (isClosed && finalData.answers)) {
                    setSubmissionData(finalData);
                    setAnswers(finalData.answers || {});
                    answersRef.current = finalData.answers || {};
                    setViolationCount(finalData.violations || 0);
                    
                    const retries = finalData.retryQuestions || [];
                    setRetryQuestions(retries);

                    if (retries.length > 0) {
                        setSubmitted(false);
                        setHasStarted(true);
                    } else {
                        setSubmitted(true);
                        if (finalData.disqualified) setIsDisqualified(true);
                        else setIsDisqualified(false);
                        setHasStarted(true);
                    }
                    
                    localStorage.removeItem(backupKey);
                    return;
                }

                finalAnswers = finalData.answers || {};
                finalViolations = finalData.violations || 0;
            }
        }

        if (localBackup) {
            if (localBackup.status === 'submitted' || localBackup.status === 'disqualified') {
                finalAnswers = localBackup.answers || {};
                finalViolations = localBackup.violations || 0;
                setSubmitted(true);
                if (localBackup.status === 'disqualified') setIsDisqualified(true);
                setHasStarted(true);
                setAnswers(finalAnswers);
                answersRef.current = finalAnswers;
                setViolationCount(finalViolations);
                violationCountRef.current = finalViolations;
                return;
            }

            const localCount = Object.keys(localBackup.answers || {}).length;
            const serverCount = Object.keys(finalAnswers).length;

            if (localCount > serverCount) {
                finalAnswers = { ...finalAnswers, ...localBackup.answers };
                finalViolations = Math.max(finalViolations, localBackup.violations || 0);
            }
        }

        setSubmissionData(finalData);
        setAnswers(finalAnswers);
        answersRef.current = finalAnswers;
        setViolationCount(finalViolations);
        violationCountRef.current = finalViolations;
        setIsDisqualified(false);
        setSubmitted(false);

        if (Object.keys(finalAnswers).length > 0 || dbId) {
            setHasStarted(true);
        }
    }, [board.id, userId, isClosed, backupKey]);

    useEffect(() => {
        if (!isPreviewMode) fetchSubmission();
        else setHasStarted(true);
    }, [fetchSubmission, isPreviewMode]);

    useEffect(() => {
        if (!isPreviewMode && isClosed && !submitted && hasStarted && !isPracticeMode && retryQuestions.length === 0) {
            setSubmitted(true);
        }
    }, [isClosed, submitted, hasStarted, isPreviewMode, isPracticeMode, retryQuestions]);

    const persistToDB = useCallback(async (currentAnswers: Record<string, string>, currentViolations: number, disqualified: boolean, isFinalSubmit: boolean) => {
        if (isPreviewMode) return;
        if (!submissionIdRef.current && isCreatingRef.current) return;

        setSaveStatus('saving');
        const { data: { user } } = await supabase.auth.getUser();
        
        let autoScore = 0;
        if (!disqualified) {
            questions.forEach(q => {
                if (q.type === 'mcq' && q.correctAnswer === currentAnswers[q.id]) {
                    autoScore += q.points;
                }
            });
        }
        
        const existingRetries = submissionDataRef.current?.retryQuestions || [];

        const newSubmissionData = {
            ...submissionDataRef.current,
            answers: currentAnswers,
            violations: currentViolations,
            score: autoScore,
            submitted: isFinalSubmit || disqualified, 
            disqualified: disqualified,
            retryQuestions: existingRetries
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
                if (data && !error) submissionIdRef.current = data.id;
            }
            setSubmissionData(newSubmissionData);
            setSaveStatus('saved');
            if (isFinalSubmit) localStorage.removeItem(backupKey);
        } catch (e) {
            console.error("Save failed", e);
            setSaveStatus('error');
            isCreatingRef.current = false;
        }
    }, [board.id, userId, questions, isPreviewMode, backupKey]);

    const handleManualSync = useCallback(() => {
        persistToDB(answersRef.current, violationCountRef.current, false, false);
    }, [persistToDB]);

    const handleViolation = useCallback(async () => {
        if (isPracticeMode || (!isTestActive && !isReadingMode) || submitted || isDisqualified) return;
        
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }

        const newCount = violationCountRef.current + 1;
        violationCountRef.current = newCount;
        setViolationCount(newCount);
        setIsDisqualified(true);
        setSubmitted(true); 
        saveToBackup({ answers: answersRef.current, violations: newCount, status: 'disqualified' });
        await persistToDB(answersRef.current, newCount, true, true);
    }, [isPracticeMode, isTestActive, isReadingMode, submitted, isDisqualified, saveToBackup, persistToDB]);

    const handleAnswerChange = useCallback((qId: string, value: string, immediate = false) => {
        if (isDisqualified || submitted || isClosed || isReadingMode) return;
        answersRef.current = { ...answersRef.current, [qId]: value };
        setAnswers(prev => ({ ...prev, [qId]: value }));
        saveToBackup({ answers: answersRef.current, violations: violationCountRef.current, status: 'active' });
        
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSaveStatus('saving');
        
        if (immediate) {
             persistToDB(answersRef.current, violationCountRef.current, false, false);
        } else {
            const jitter = Math.floor(Math.random() * 1000); 
            const delay = 1500 + jitter;
            saveTimeoutRef.current = setTimeout(() => {
                persistToDB(answersRef.current, violationCountRef.current, false, false);
            }, delay);
        }
    }, [isDisqualified, submitted, isClosed, isReadingMode, persistToDB, saveToBackup]);

    const handleConfirmSubmit = useCallback(async () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (retryQuestions.length > 0) setRetryQuestions([]);
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
        setSubmitted(true);
        saveToBackup({ answers: answersRef.current, violations: violationCountRef.current, status: 'submitted' });
        await persistToDB(answersRef.current, violationCountRef.current, false, true);
    }, [retryQuestions, persistToDB, saveToBackup]);

    const startTest = useCallback(async () => {
        const isSecure = !isPreviewMode && !isPracticeMode;

        const beginTest = async () => {
            setHasStarted(true);
            await persistToDB(answersRef.current, violationCountRef.current, false, false);
        };

        if (isSecure) {
            try {
                await document.documentElement.requestFullscreen();
                const onFullscreenChange = () => {
                    if (document.fullscreenElement) {
                        beginTest();
                        document.removeEventListener('fullscreenchange', onFullscreenChange);
                    }
                };
                document.addEventListener('fullscreenchange', onFullscreenChange);
                if (document.fullscreenElement) {
                   onFullscreenChange();
                }

            } catch (e) {
                console.error("Fullscreen request failed:", e);
                alert("Fullscreen is required to start the test. Please enable it and try again.");
            }
        } else {
            beginTest();
        }
    }, [isPreviewMode, isPracticeMode, persistToDB]);

    const returnToHome = useCallback(() => {
        if (isPreviewMode && onExitPreview) onExitPreview();
        else window.location.href = '/';
    }, [isPreviewMode, onExitPreview]);

    const countWords = (text: string) => text ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

    const meetsRequirements = useMemo(() => {
        return !questions.some(q => {
            if (q.type !== 'essay' || !q.minWords) return false;
            return countWords(answers[q.id] || '') < q.minWords;
        });
    }, [questions, answers]);

    if (((isClosed && submissionData?.released) || (isPreviewMode && submitted && !isDisqualified)) && retryQuestions.length === 0) {
        return <ReportCard board={board} questions={questions} submissionData={submissionData} isPreviewMode={isPreviewMode} onExitPreview={onExitPreview} onReturnHome={returnToHome} />;
    }

    if (isDisqualified) return <StatusViews type="disqualified" isPreviewMode={isPreviewMode} onExitPreview={onExitPreview} onReturnHome={returnToHome} onCheckStatus={fetchSubmission} />;
    if (isClosed) return <StatusViews type="closed" isPreviewMode={isPreviewMode} onExitPreview={onExitPreview} onReturnHome={returnToHome} submissionData={submissionData} />;
    if (submitted && retryQuestions.length === 0) return <StatusViews type="submitted" isPreviewMode={isPreviewMode} onExitPreview={onExitPreview} onReturnHome={returnToHome} />;
    if (config.status === 'setup' && !isPreviewMode) {
        return <StatusViews type="setup" board={board} config={config} questions={questions} onManualRefresh={() => window.location.reload()} />;
    }
    if (!hasStarted && !isReadingMode) {
        return <StatusViews type="intro" board={board} isPreviewMode={isPreviewMode} onExitPreview={onExitPreview} onStartTest={startTest} config={config} />;
    }

    return (
        <div className="h-full relative">
            <SaveStatusIndicator status={saveStatus} onRetry={handleManualSync} />
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
                retryQuestions={retryQuestions}
                onViolation={handleViolation}
            />
        </div>
    );
};
