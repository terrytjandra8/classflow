
import React, { useState } from 'react';
import { AssessmentQuestion, AssessmentConfig } from '../../../../../types';
import { useDrawing } from './hooks';
import { useFocusMode } from '../../../../../hooks/useFocusMode';
import { DrawingModal } from './DrawingModal';
import { SubmitModal } from './SubmitModal';
import { TestHeader } from './TestHeader';
import { QuestionItem } from './QuestionItem';
import { AlertTriangle, Check, Send } from 'lucide-react';

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

export const ActiveTest: React.FC<ActiveTestProps> = ({ 
    boardTitle, questions, config, timeLeft, answers, onAnswerChange, onSubmit, onManualSync, meetsRequirements, isPreviewMode, onExitPreview, isReadingMode, isPracticeMode, retryQuestions, onViolation
}) => {
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const { activeDrawingQId, setActiveDrawingQId, drawingSaveStatus, setLiveDrawingBlob, handleCloseDrawingModal, activeDrawingInitialData } = useDrawing(answers, onAnswerChange);

    const isRevision = retryQuestions && retryQuestions.length > 0;
    const isSecureMode = !isPreviewMode && !isPracticeMode && !isReadingMode;

    useFocusMode(isSecureMode, onViolation);

    const handleConfirmSubmit = () => {
        setShowSubmitModal(false);
        onSubmit();
    };

    const handleSync = async () => {
        setIsSyncing(true);
        await onManualSync();
        setTimeout(() => setIsSyncing(false), 800);
    };

    return (
        <div className="h-full flex flex-col bg-[#111] text-white overflow-hidden relative">
            <TestHeader 
                boardTitle={boardTitle}
                config={config}
                timeLeft={timeLeft}
                isSyncing={isSyncing}
                onSync={handleSync}
                isPreviewMode={isPreviewMode}
                onExitPreview={onExitPreview}
                isReadingMode={isReadingMode}
                isPracticeMode={isPracticeMode}
                isRevision={isRevision}
            />

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

            <SubmitModal 
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleConfirmSubmit}
                meetsRequirements={meetsRequirements}
                isPracticeMode={isPracticeMode}
                isRevision={isRevision}
            />

            <DrawingModal 
                isOpen={!!activeDrawingQId}
                onClose={handleCloseDrawingModal}
                onDrawEnd={setLiveDrawingBlob}
                initialData={activeDrawingInitialData}
                saveStatus={drawingSaveStatus}
            />
        </div>
    );
};
