
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
    setLightboxImageUrl: (url: string | null) => void;
    onClear: (qId: string) => void;
    onImageUpload: (qId: string) => void;
}

export const StudentAnswer: React.FC<StudentAnswerProps> = ({
    qId, question, answer, rawView, setRawView, setLightboxImageUrl, 
    onClear, onImageUpload
}) => {

    const isImageAnswer = (text: string) => {
        return text && typeof text === 'string' && (text.startsWith('data:image') || (text.startsWith('http') && /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(text)));
    };

    // Parse composite answer format {d: drawingUrl, t: htmlText} used by 'both' mode questions
    const parseCompositeAnswer = (raw: string | undefined): { text: string; drawingUrl: string | null } => {
        if (!raw) return { text: '', drawingUrl: null };
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && ('d' in parsed || 't' in parsed)) {
                return { text: parsed.t || '', drawingUrl: parsed.d || null };
            }
        } catch {}
        return { text: raw, drawingUrl: null };
    };

    const { text: parsedText, drawingUrl: parsedDrawingUrl } = rawView 
        ? { text: answer, drawingUrl: null } 
        : parseCompositeAnswer(answer);
    
    // MCQ fallback for text part
    let displayText = !rawView && question.type === 'mcq' && question.options && !isNaN(parseInt(parsedText))
        ? question.options[parseInt(parsedText)] || parsedText
        : parsedText;

    const effectiveImageUrl = parsedDrawingUrl || (isImageAnswer(answer) ? answer : null);

    // If the text is exactly the image URL and we are not in raw view, don't show the redundant text below the image
    if (!rawView && effectiveImageUrl && displayText === effectiveImageUrl) {
        displayText = '';
    }

    // Attempt to format raw text that lacks HTML but has newlines
    let formattedHtml = displayText || "";
    if (!rawView && formattedHtml && !/<[a-z][\s\S]*>/i.test(formattedHtml)) {
        formattedHtml = formattedHtml.replace(/\n/g, '<br/>');
    }

    return (
        <div className="bg-[#0c0c0c] p-4 rounded-lg border border-white/10">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-base font-semibold text-cyan-400">Student Answer</h4>
                <div className="flex items-center gap-2">
                    {effectiveImageUrl && (
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
                        onClick={() => onImageUpload(qId)}
                        className="text-gray-400 hover:text-white"
                    >
                        <FiUploadCloud />
                    </button>
                    <button
                        title="Clear Answer"
                        onClick={() => onClear(qId)}
                        className="text-red-500 hover:text-red-400"
                    >
                        <FiTrash2 />
                    </button>
                </div>
            </div>

            {effectiveImageUrl ? (
                <div className="flex flex-col gap-4">
                    <img
                        src={effectiveImageUrl}
                        alt="Student's answer"
                        className="max-h-80 w-auto rounded-md cursor-pointer mx-auto shadow-md border border-white/10"
                        onClick={() => setLightboxImageUrl(effectiveImageUrl)}
                    />
                    {displayText && (
                        <div
                            className="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-300 prose prose-invert max-w-none text-sm break-words overflow-hidden [&_p]:mb-4 [&_div]:mb-4"
                            style={{ wordBreak: 'break-word' }}
                            dangerouslySetInnerHTML={{ __html: formattedHtml }}
                        />
                    )}
                </div>
            ) : (
                <div
                    className="text-gray-300 prose prose-invert max-w-none [&_p]:mb-4 [&_div]:mb-4 p-2 whitespace-pre-wrap text-sm break-words overflow-hidden"
                    style={{ wordBreak: 'break-word', lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: formattedHtml }}
                />
            )}
        </div>
    );
};
