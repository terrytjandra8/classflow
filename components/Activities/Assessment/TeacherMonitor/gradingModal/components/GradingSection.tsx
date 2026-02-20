
import React from 'react';
import { RichTextEditor, RichTextEditorRef, FormatState } from '../../../../../RichTextEditor';
import { FeedbackToolbar } from './FeedbackToolbar';
import { parseMath } from '../../../../../../utils/mappers';

interface GradingSectionProps {
    qId: string;
    grade: { score: number, feedback: string };
    points: number;
    correctAnswer?: string;
    correctAnswerMcqOption?: string;
    questionType: string;
    handleGradeChange: (qId: string, score: number, feedback: string) => void;
    handleFeedbackImageUpload: (qId: string) => void;
    feedbackEditorRefs: React.MutableRefObject<Record<string, RichTextEditorRef | null>>;
    activeFeedbackFormats: Record<string, FormatState>;
    setActiveFeedbackFormats: React.Dispatch<React.SetStateAction<Record<string, FormatState>>>;
}

export const GradingSection: React.FC<GradingSectionProps> = ({
    qId, grade, points, correctAnswer, correctAnswerMcqOption, questionType,
    handleGradeChange, handleFeedbackImageUpload,
    feedbackEditorRefs, activeFeedbackFormats, setActiveFeedbackFormats
}) => {
    return (
        <div className="flex flex-col h-full bg-[#1c1c1c] rounded-lg">
            <div className="p-3">
                <h4 className="text-sm font-bold text-gray-400 mb-2">Grade & Feedback</h4>
                <div className="flex items-center gap-2 mb-3">
                    <input 
                        type="number" 
                        value={grade.score}
                        onChange={e => handleGradeChange(qId, parseInt(e.target.value) || 0, grade.feedback)}
                        className="w-24 bg-black/50 border border-white/10 rounded-md px-2 py-1 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        max={points}
                        min={0}
                    />
                    <button onClick={() => handleGradeChange(qId, 0, grade.feedback)} className="px-3 py-1 rounded-md text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">Clear</button>
                    <button onClick={() => handleGradeChange(qId, points, grade.feedback)} className="px-3 py-1 rounded-md text-xs font-bold bg-green-500/10 hover:bg-green-500/20 text-green-300 transition-colors">Full</button>
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-black/30 rounded-b-xl border-t border-white/10">
                <FeedbackToolbar 
                    editorRef={{ current: feedbackEditorRefs.current[qId] }}
                    onImageUpload={() => handleFeedbackImageUpload(qId)}
                    activeFormats={activeFeedbackFormats[qId] || { bold: false, italic: false, underline: false, strikeThrough: false, list: false, orderedList: false, subscript: false, superscript: false, blockquote: false, h1: false, h2: false, h3: false, h4: false, alignLeft: true, alignCenter: false, alignRight: false, alignJustify: false }}
                />
                <RichTextEditor
                    ref={ref => feedbackEditorRefs.current[qId] = ref}
                    value={grade.feedback}
                    onChange={text => handleGradeChange(qId, grade.score, text)}
                    onFormatChange={formats => setActiveFeedbackFormats(prev => ({...prev, [qId]: formats}))}
                    placeholder="Provide feedback..."
                    className="w-full flex-1 bg-transparent p-3 text-sm outline-none resize-none"
                />
            </div>

            {correctAnswer && (
                <div className="p-3 mt-2">
                    <h5 className="font-bold text-gray-500 text-xs mb-1 uppercase tracking-wider">Correct Answer</h5>
                    <div className="p-2.5 rounded bg-green-900/30 border border-green-500/30 text-green-200 text-sm rich-text-content">
                        <div dangerouslySetInnerHTML={{ __html: questionType === 'mcq' ? parseMath(correctAnswerMcqOption ?? 'N/A') : parseMath(correctAnswer) }} />
                    </div>
                </div>
            )}
        </div>
    );
};
