import React, { useState, useEffect } from 'react';
import { Board, Note, AssessmentConfig, AssessmentState } from '../../../../types';
import { Editor } from '../Editor';
import { StudentAssessment } from '../StudentAssessment/index';
import { TeacherMonitor } from '../TeacherMonitor';
import { ControlHeader } from './ControlHeader';
import { AssessmentPrintView } from '../AssessmentPrintView';
import { supabase } from '../../../../services/supabaseClient';
import { classService } from '../../../../services/classService';

interface AssessmentManagerProps {
    board: Board;
    notes: Note[];
    userId?: string;
    isStudent: boolean;
    onUpdateBoard: (updates: Partial<Board>) => void;
    onBack: () => void;
    onlineUsers?: { id: string, name: string, avatar: string }[];
    onOpenSettings?: () => void;
    onOpenShare?: () => void;
}

export const AssessmentManager: React.FC<AssessmentManagerProps> = ({ 
    board, notes, userId, isStudent, onUpdateBoard, onBack, onlineUsers,
    onOpenSettings, onOpenShare
}) => {
    const questions = board.assessmentQuestions || [];
    
    const config: AssessmentConfig = board.assessmentConfig || {
        status: 'setup',
        startTime: 0,
    };

    const [view, setView] = useState<'editor' | 'monitor'>(() => {
        return (localStorage.getItem('cb_assessment_view') as 'editor' | 'monitor') || 'editor';
    });

    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const [classList, setClassList] = useState<string[]>([]);

    useEffect(() => {
        const fetchClasses = async () => {
            if (!isStudent) {
                try {
                    const classes = await classService.getClasses();
                    setClassList(['General', ...classes.map(c => c.name)]);
                } catch (e) {
                    console.error("Failed to load classes", e);
                }
            }
        };
        fetchClasses();
    }, [isStudent]);

    const setViewWithPersistence = (v: 'editor' | 'monitor') => {
        setView(v);
        localStorage.setItem('cb_assessment_view', v);
    };

    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [now, setNow] = useState(Date.now());

    const submissions = notes.filter(n => n.type === 'assessment_submission');

    const ipekaLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/ipeka.png').data.publicUrl;
    const ibLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/IB.png').data.publicUrl;

    const handleTransition = React.useCallback((newStatus: AssessmentState) => {
        const newConfig: AssessmentConfig = { 
            ...config, 
            status: newStatus, 
            startTime: Date.now(),
        };
        
        onUpdateBoard({ 
            assessmentConfig: newConfig,
            assessmentState: newStatus 
        });
    }, [config, onUpdateBoard]);

    useEffect(() => {
        const tick = () => {
            const currentTime = Date.now();
            setNow(currentTime);
            
            if (!isStudent && config.status === 'setup' && board.autoLiveTime && currentTime >= board.autoLiveTime) {
                handleTransition('inprogress');
                return;
            }

            if (config.startTime && (config.status === 'inprogress' || config.status === 'reading')) {
                const elapsedSeconds = Math.floor((currentTime - config.startTime) / 1000);
                
                const durationMins = config.status === 'reading' ? (config.readingMinutes || 0) : (config.durationMinutes || 60);
                const totalDurationSeconds = durationMins * 60;
                const durationRemaining = Math.max(0, totalDurationSeconds - elapsedSeconds);
                
                let deadlineRemaining = Infinity;
                if (board.autoLockTime) {
                    deadlineRemaining = Math.max(0, Math.floor((board.autoLockTime - currentTime) / 1000));
                }

                const actualRemaining = Math.min(durationRemaining, deadlineRemaining);
                setTimeLeft(actualRemaining);

                if (actualRemaining <= 0 && !isStudent && !isPreviewMode) {
                    if (deadlineRemaining === 0 && board.autoLockTime) {
                         handleTransition('finished');
                    } else if (config.status === 'reading') {
                        handleTransition('inprogress');
                    } else if (config.status === 'inprogress') {
                        handleTransition('finished');
                    }
                }
            } else {
                setTimeLeft(null);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [config, board.autoLiveTime, board.autoLockTime, isStudent, isPreviewMode, handleTransition]);

    const effectiveStatus = (board.autoLockTime && now >= board.autoLockTime && config.status !== 'finished') 
        ? 'finished' 
        : config.status;

    if (isStudent) {
        return (
            <StudentAssessment 
                board={board} 
                questions={questions} 
                userId={userId || ''} 
                onUpdateBoard={onUpdateBoard}
                config={config} 
                timeLeft={timeLeft}
            />
        );
    }

    if (isPreviewMode) {
        const simulatedStatus = config.status === 'setup' ? 'inprogress' : config.status;
        
        const previewConfig: AssessmentConfig = { 
            ...config, 
            status: simulatedStatus, 
            startTime: Date.now() 
        };

        return (
            <div className="relative h-full">
                <StudentAssessment 
                    board={board}
                    questions={questions}
                    userId={userId || 'teacher-preview'}
                    onUpdateBoard={() => {}} 
                    config={previewConfig}
                    timeLeft={(config.durationMinutes || 60) * 60} 
                    isPreviewMode={true}
                    onExitPreview={() => setIsPreviewMode(false)}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#111] text-white overflow-hidden">
            
            {isPrinting && (
                <AssessmentPrintView 
                    participants={[{ name: "____________________________", data: { answers: {} } }]}
                    questions={questions}
                    ipekaLogoUrl={ipekaLogoUrl}
                    ibLogoUrl={ibLogoUrl}
                    className={board.targetGrade}
                    onAfterPrint={() => setIsPrinting(false)}
                />
            )}

            <ControlHeader 
                title={board.title}
                status={effectiveStatus}
                timeLeft={timeLeft}
                config={config}
                isPublished={!!board.isPublished}
                onBack={onBack}
                onTransition={handleTransition}
                onTogglePublish={() => onUpdateBoard({ isPublished: !board.isPublished })}
                view={view}
                setView={setViewWithPersistence}
                onPreview={() => setIsPreviewMode(true)}
                onOpenSettings={onOpenSettings}
                onOpenShare={onOpenShare}
                onPrint={() => setIsPrinting(true)}
                classList={classList}
                currentClass={board.targetGrade}
                onUpdateClass={(cls) => onUpdateBoard({ targetGrade: cls })}
            />

            <div className="flex-1 overflow-hidden no-print">
                {view === 'editor' ? (
                    <Editor questions={questions} onUpdateBoard={onUpdateBoard} />
                ) : (
                    <TeacherMonitor 
                        board={board}
                        questions={questions} 
                        submissions={submissions} 
                        activeStudents={onlineUsers || []}
                        config={config}
                        onUpdateConfig={(newConfig) => {
                            onUpdateBoard({ assessmentConfig: { ...config, ...newConfig } });
                        }}
                        className={board.targetGrade}
                        onForceRefresh={() => {}}
                    />
                )}
            </div>
        </div>
    );
};
