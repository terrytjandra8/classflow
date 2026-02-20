
import React from 'react';
import { FiMaximize2, FiTrash2, FiUploadCloud, FiFileText } from 'react-icons/fi';
import { AssessmentQuestion } from '../../../../../../types';
import { isContentImage, parseAnswer } from '../../../../../../utils/helpers';

interface StudentAnswerProps {
    qId: string;
    question: AssessmentQuestion;
    answer: string;
    rawView: boolean;
    setRawView: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setLightboxImageUrl: (url: string) => void;
    handleClearAnswer: (qId: string) => void;
    handleStudentAnswerImageUpload: (qId: string) => void;
}

export const StudentAnswer: React.FC<StudentAnswerProps> = ({
    qId, question, answer, rawView, setRawView, setLightboxImageUrl, 
    handleClearAnswer, handleStudentAnswerImageUpload
}) => {

    const answerIsImage = isContentImage(answer);
    const displayAnswer = rawView ? answer : parseAnswer(answer, question.type, question.options);

    return (
        <div className="bg-[#0c0c0c] p-4 rounded-lg border border-white/10">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-base font-semibold text-cyan-400">Student Answer</h4>
                <div className="flex items-center gap-2">
                    {answerIsImage && (
                        <button
                            title="View Full Image"
                            onClick={() => setLightboxImageUrl(answer)}
                            className="text-gray-400 hover:text-white"
                        >
                            <FiMaximize2 />
                        </button>
                    )}
                    {question.type === 'essay' && (
                         <button
                            title={rawView ? "Show Formatted View" : "Show Raw HTML"}
                            onClick={() => setRawView(prev => ({...prev, [qId]: !prev[qId]}))}
                            className={rawView ? "text-blue-400 hover:text-blue-300" : "text-gray-400 hover:text-white"}
                        >
                            <FiFileText />
                        </button>
                    )}
                     <button
                        title="Upload Corrected Answer"
                        onClick={() => handleStudentAnswerImageUpload(qId)}
                        className="text-gray-400 hover:text-white"
                    >
                        <FiUploadCloud />
                    </button>
                    <button
                        title="Clear Answer"
                        onClick={() => handleClearAnswer(qId)}
                        className="text-red-500 hover:text-red-400"
                    >
                        <FiTrash2 />
                    </button>
                </div>
            </div>

            {answerIsImage ? (
                <img
                    src={answer}
                    alt="Student's answer"
                    className="max-h-60 w-auto rounded-md cursor-pointer mx-auto"
                    onClick={() => setLightboxImageUrl(answer)}
                />
            ) : (
                <div
                    className="text-gray-300 prose prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-blockquote:my-1 whitespace-pre-wrap text-sm"
                    dangerouslySetInnerHTML={{ __html: displayAnswer }}
                />
            )}
        </div>
    );
};
