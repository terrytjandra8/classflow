
import React from 'react';
import { StudentAnswer } from './StudentAnswer';
import { GradingSection } from './GradingSection';
import { AssessmentQuestion } from '../../../../../../types';
import { parseMath } from '../../../../../../utils/mappers';

// Forward ref for RichTextEditor
import { RichTextEditorRef, FormatState } from '../../../../../RichTextEditor';

interface QuestionCardProps {
    question: AssessmentQuestion;
    qNum: number;
    participant: any;
    questionsToRevise: Set<string>;
    handleToggleQuestionToRevise: (qId: string) => void;
    // From useGradingState hook
    answer: string;
    grade: { score: number, feedback: string };
    rawView: boolean;
    setRawView: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setLightboxImageUrl: (url: string) => void;
    handleClearAnswer: (qId: string) => void;
    handleStudentAnswerImageUpload: (qId: string) => void;
    handleGradeChange: (qId: string, score: number, feedback: string) => void;
    handleFeedbackImageUpload: (qId: string) => void;
    feedbackEditorRefs: React.MutableRefObject<Record<string, RichTextEditorRef | null>>;
    activeFeedbackFormats: Record<string, FormatState>;
    setActiveFeedbackFormats: React.Dispatch<React.SetStateAction<Record<string, FormatState>>>;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
    question: q, qNum, participant, questionsToRevise, handleToggleQuestionToRevise,
    answer, grade, rawView, setRawView, setLightboxImageUrl,
    handleClearAnswer, handleStudentAnswerImageUpload,
    handleGradeChange, handleFeedbackImageUpload,
    feedbackEditorRefs, activeFeedbackFormats, setActiveFeedbackFormats
}) => {
    if (q.type === 'section') return null;

    const isRetry = participant.data?.retryQuestions?.includes(q.id);
    const cardBorderColor = questionsToRevise.has(q.id) ? 'border-amber-500' : (isRetry ? 'border-orange-500/50' : 'border-white/10');

    return (
        <div key={q.id} className={`p-4 rounded-xl bg-[#111] border ${cardBorderColor} transition-colors`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        checked={questionsToRevise.has(q.id)} 
                        onChange={() => handleToggleQuestionToRevise(q.id)} 
                        className="w-4 h-4 rounded bg-black/20 border-white/20 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        title="Mark for revision"
                    />
                    <span className="text-sm font-bold text-blue-400">Question {qNum}</span>
                    {isRetry && <span className="text-xs font-bold text-orange-400 bg-orange-900/50 px-2 py-0.5 rounded-full border border-orange-500/50">Revision</span>}
                </div>
                <span className="text-sm font-bold text-gray-400">{q.points} pts</span>
            </div>

            <div className="text-gray-300 mb-4 rich-text-content" dangerouslySetInnerHTML={{ __html: parseMath(q.text) }} />
            
            <div className="grid grid-cols-2 gap-4">
                <StudentAnswer 
                    qId={q.id}
                    answer={answer}
                    question={q}
                    rawView={rawView}
                    setRawView={setRawView}
                    setLightboxImageUrl={setLightboxImageUrl}
                    handleClearAnswer={handleClearAnswer}
                    handleStudentAnswerImageUpload={handleStudentAnswerImageUpload}
                />

                <GradingSection
                    qId={q.id}
                    grade={grade}
                    points={q.points ?? 0}
                    correctAnswer={q.correctAnswer}
                    correctAnswerMcqOption={q.type === 'mcq' ? q.options?.[Number(q.correctAnswer)] : undefined}
                    questionType={q.type}
                    handleGradeChange={handleGradeChange}
                    handleFeedbackImageUpload={handleFeedbackImageUpload}
                    feedbackEditorRefs={feedbackEditorRefs}
                    activeFeedbackFormats={activeFeedbackFormats}
                    setActiveFeedbackFormats={setActiveFeedbackFormats}
                />
            </div>
        </div>
    );
};
