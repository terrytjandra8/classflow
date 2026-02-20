
import React from 'react';
import { AssessmentQuestion } from '../../../../../types';
import { useGradingState } from './useGradingState';
import { Lightbox } from './components/Lightbox';
import { GradingModalHeader } from './components/GradingModalHeader';
import { QuestionCard } from './components/QuestionCard';

interface GradingModalProps {
    isOpen: boolean;
    participant: any;
    onClose: () => void;
    questions: AssessmentQuestion[];
    onSave: (release: boolean, retryIds?: string[]) => void;
    onAutoSave: (
        grades: Record<string, { score: number, feedback: string }>,
        updatedAnswers?: Record<string, string>,
    ) => Promise<void>;
}

export const GradingModal: React.FC<GradingModalProps> = ({ 
    isOpen, participant, onClose, questions, onSave, onAutoSave 
}) => {
    const {
        currentAnswers,
        currentGrades,
        questionsToRevise,
        lightboxImageUrl,
        rawView,
        feedbackEditorRefs,
        activeFeedbackFormats,
        setLightboxImageUrl,
        setRawView,
        setActiveFeedbackFormats,
        handleClearAnswer,
        handleStudentAnswerImageUpload,
        handleGradeChange,
        handleFeedbackImageUpload,
        handleToggleQuestionToRevise,
        totalScore,
    } = useGradingState({ isOpen, participant, questions, onAutoSave });

    const handleAllowRevision = () => {
        if (questionsToRevise.size === 0) {
            alert('Please select which question(s) the student needs to revise.');
            return;
        }
        onSave(false, Array.from(questionsToRevise));
        onClose();
    };
    
    const handleSave = (release: boolean) => {
        onSave(release, Array.from(questionsToRevise));
    }

    if (!isOpen || !participant) return null;

    return (
        <>
            {lightboxImageUrl && (
                <Lightbox imageUrl={lightboxImageUrl} onClose={() => setLightboxImageUrl(null)} />
            )}
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl">
                    <GradingModalHeader
                        participantName={participant.name}
                        participantId={participant.id}
                        totalScore={totalScore}
                        questionsToReviseCount={questionsToRevise.size}
                        onSave={handleSave}
                        onAllowRevision={handleAllowRevision}
                        onClose={onClose}
                    />

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {questions.map((q, index) => {
                            if (q.type === 'section') return null;
                            
                            const qNum = questions.filter((item, i) => i <= index && item.type !== 'section').length;
                            const answer = currentAnswers[q.id] || '';
                            const grade = currentGrades[q.id] || { score: 0, feedback: '' };

                            return (
                                <QuestionCard
                                    key={q.id}
                                    question={q}
                                    qNum={qNum}
                                    participant={participant}
                                    questionsToRevise={questionsToRevise}
                                    handleToggleQuestionToRevise={handleToggleQuestionToRevise}
                                    answer={answer}
                                    grade={grade}
                                    rawView={rawView[q.id] || false}
                                    setRawView={setRawView as any} 
                                    setLightboxImageUrl={setLightboxImageUrl}
                                    handleClearAnswer={handleClearAnswer}
                                    handleStudentAnswerImageUpload={handleStudentAnswerImageUpload}
                                    handleGradeChange={handleGradeChange}
                                    handleFeedbackImageUpload={handleFeedbackImageUpload}
                                    feedbackEditorRefs={feedbackEditorRefs}
                                    activeFeedbackFormats={activeFeedbackFormats}
                                    setActiveFeedbackFormats={setActiveFeedbackFormats}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};
