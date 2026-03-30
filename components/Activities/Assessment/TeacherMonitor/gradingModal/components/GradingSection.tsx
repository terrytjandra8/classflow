
import React, { useState, useEffect } from 'react';
import { RichTextEditor, RichTextEditorRef, FormatState } from '../../../../../RichTextEditor';
import { FeedbackToolbar } from './FeedbackToolbar';
import { parseMath } from '../../../../../../utils/mappers';

interface GradingSectionProps {
    qId: string;
    grade: { score: number, feedback: string };
    points: number;
    questionType: 'mcq' | 'essay' | 'section';
    correctAnswer?: string;
    correctAnswerMcqOption?: string; // Add this to handle MCQ options
    handleGradeChange: (qId: string, score: number, feedback: string) => void;
    handleFeedbackImageUpload: (qId: string) => void;
    feedbackEditorRefs: React.MutableRefObject<Record<string, RichTextEditorRef | null>>;
    activeFeedbackFormats: Record<string, FormatState>;
    setActiveFeedbackFormats: React.Dispatch<React.SetStateAction<Record<string, FormatState>>>;
}

export const GradingSection: React.FC<GradingSectionProps> = ({
    qId, 
    grade, 
    points, 
    questionType,
    correctAnswer,
    correctAnswerMcqOption,
    handleGradeChange, 
    handleFeedbackImageUpload,
    feedbackEditorRefs, 
    activeFeedbackFormats, 
    setActiveFeedbackFormats
}) => {

    const [displayScore, setDisplayScore] = useState(String(grade.score));

    useEffect(() => {
        setDisplayScore(String(grade.score));
    }, [grade.score]);

    const handleScoreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (value === '') {
            setDisplayScore('');
            handleGradeChange(qId, 0, grade.feedback);
            return;
        }

        if (/^[0-9]+$/.test(value)) {
            let newScore = parseInt(value, 10);

            if (newScore > points) {
                newScore = points; // Cap the score at the maximum points
            }

            setDisplayScore(String(newScore));
            handleGradeChange(qId, newScore, grade.feedback);
        }
    };

    const handleScoreInputBlur = () => {
        if (displayScore === '') {
            setDisplayScore('0');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1c1c1c] rounded-lg">
            <div className="p-3">
                <h4 className="text-sm font-bold text-gray-400 mb-2">Grade & Feedback</h4>
                <div className="flex items-center gap-2 mb-3">
                    <input 
                        type="number" 
                        value={displayScore}
                        onChange={handleScoreInputChange}
                        onBlur={handleScoreInputBlur}
                        className="w-24 bg-black/50 border border-white/10 rounded-md px-2 py-1 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        max={points}
                        min={0}
                    />
                    <button onClick={() => handleGradeChange(qId, 0, grade.feedback)} className="px-3 py-1 rounded-md text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">Clear</button>
                    <button onClick={() => handleGradeChange(qId, points, grade.feedback)} className="px-3 py-1 rounded-md text-xs font-bold bg-green-500/10 hover:bg-green-500/20 text-green-300 transition-colors">Full</button>
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-black/30 rounded-b-xl border-t border-white/10 min-h-[250px]">
                <FeedbackToolbar 
                    editorRef={{ current: feedbackEditorRefs.current[qId] }}
                    onImageUpload={() => handleFeedbackImageUpload(qId)}
                    activeFormats={activeFeedbackFormats[qId] || { bold: false, italic: false, underline: false, strikeThrough: false, list: false, orderedList: false, subscript: false, superscript: false, blockquote: false, h1: false, h2: false, h3: false, h4: false, alignLeft: true, alignCenter: false, alignRight: false, alignJustify: false }}
                />
                <RichTextEditor
                    ref={(el: any) => feedbackEditorRefs.current[qId] = el}
                    value={grade.feedback}
                    onChange={text => handleGradeChange(qId, grade.score, text)}
                    onFormatChange={(formats: any) => setActiveFeedbackFormats(prev => ({...prev, [qId]: formats}))}
                    placeholder="Provide feedback..."
                    className="w-full flex-1 bg-transparent p-3 text-sm outline-none resize-y overflow-y-auto"
                />
            </div>


        </div>
    );
};
