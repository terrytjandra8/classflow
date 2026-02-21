
import React from 'react';
import { AssessmentQuestion } from '../../../../../../types';
import { RichTextEditorRef, FormatState } from '../../../../../RichTextEditor';
import { StudentAnswer } from './StudentAnswer';
import { GradingSection } from './GradingSection';
import { getWordCount } from '../../../../../../utils/helpers';
import { TbAlertTriangle } from 'react-icons/tb';

interface QuestionCardProps {
    qNum: number;
    question: AssessmentQuestion;
    participant: any;
    questionsToRevise: Set<string>;
    handleToggleQuestionToRevise: (qId: string) => void;
    answer: string;
    grade: { score: number, feedback: string };
    rawView: boolean;
    setRawView: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setLightboxImageUrl: (url: string | null) => void;
    handleClearAnswer: (qId: string) => void;
    handleStudentAnswerImageUpload: (qId: string) => void;
    handleGradeChange: (qId: string, score: number, feedback: string) => void;
    handleFeedbackImageUpload: (qId: string) => void;
    feedbackEditorRefs: React.MutableRefObject<Record<string, RichTextEditorRef | null>>;
    activeFeedbackFormats: Record<string, FormatState>;
    setActiveFeedbackFormats: React.Dispatch<React.SetStateAction<Record<string, FormatState>>>;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
    qNum,
    question,
    participant,
    questionsToRevise,
    handleToggleQuestionToRevise,
    answer,
    grade,
    rawView,
    setRawView,
    setLightboxImageUrl,
    handleClearAnswer,
    handleStudentAnswerImageUpload,
    handleGradeChange,
    handleFeedbackImageUpload,
    feedbackEditorRefs,
    activeFeedbackFormats,
    setActiveFeedbackFormats,
}) => {

    const wordCount = getWordCount(answer);
    const minWords = question.minWords || 0;
    const isBelowWordLimit = minWords > 0 && wordCount < minWords;

    return (
        <div className="bg-white/5 border border-white/10 rounded-lg p-5 transition-all duration-300 relative">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold bg-white/10 px-2 py-1 rounded-md">
                            QUESTION {qNum}
                        </span>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`revise-${question.id}`}
                                className="h-4 w-4 rounded bg-white/5 border-white/20 text-blue-500 focus:ring-blue-500"
                                checked={questionsToRevise.has(question.id)}
                                onChange={() => handleToggleQuestionToRevise(question.id)}
                            />
                            <label htmlFor={`revise-${question.id}`} className="text-sm text-white/60">
                                Allow student to revise
                            </label>
                        </div>
                    </div>
                    <div className="mt-3 text-white/80" dangerouslySetInnerHTML={{ __html: question.text }} />
                    <div className="flex items-center gap-4 mt-3">
                        <div className="text-xs text-white/40">
                            Word Count: {wordCount}
                        </div>
                        {minWords > 0 && (
                            <div className="text-xs text-white/40">
                                (Min: {minWords})
                            </div>
                        )}
                        {isBelowWordLimit && (
                            <div className="flex items-center gap-1 text-yellow-500 text-xs">
                                <TbAlertTriangle />
                                <span>Below word limit</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end ml-4">
                    <div className="text-sm text-white/60">Points</div>
                    <div className="text-2xl font-bold">{question.points || 0}</div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StudentAnswer
                    qId={question.id}
                    question={question}
                    answer={answer}
                    rawView={rawView}
                    setRawView={setRawView}
                    setLightboxImageUrl={setLightboxImageUrl}
                    onClear={handleClearAnswer}
                    onImageUpload={handleStudentAnswerImageUpload}
                />
                <GradingSection
                    qId={question.id}
                    grade={grade}
                    points={question.points}
                    questionType={question.type}
                    correctAnswer={question.correctAnswer}
                    handleGradeChange={handleGradeChange}
                    handleFeedbackImageUpload={handleFeedbackImageUpload}
                    feedbackEditorRefs={feedbackEditorRefs}
                    activeFeedbackFormats={activeFeedbackFormats}
                    setActiveFeedbackFormats={setActiveFeedbackFormats}
                />
            </div>
        </div>
    )
};
