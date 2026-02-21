
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AssessmentQuestion } from '../../../../../types';
import { RichTextEditorRef, FormatState } from '../../../../RichTextEditor';
import { getInitialAnswers, getInitialGrades, uploadImage } from './utils';

interface UseGradingStateProps {
    isOpen: boolean;
    participant: any;
    questions: AssessmentQuestion[];
    onAutoSave: (
        grades: Record<string, { score: number, feedback: string }>,
        updatedAnswers?: Record<string, string>
    ) => Promise<void>;
}

export const useGradingState = ({ isOpen, participant, questions, onAutoSave }: UseGradingStateProps) => {
    const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});
    const [currentGrades, setCurrentGrades] = useState<Record<string, { score: number, feedback: string }>>({});
    const [questionsToRevise, setQuestionsToRevise] = useState<Set<string>>(new Set());
    const [isDirty, setIsDirty] = useState(false);
    
    const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
    const [rawView, setRawView] = useState<Record<string, boolean>>({});
    const feedbackEditorRefs = useRef<Record<string, RichTextEditorRef | null>>({});
    const [activeFeedbackFormats, setActiveFeedbackFormats] = useState<Record<string, FormatState>>({});

    useEffect(() => {
        if (isOpen && participant) {
            setCurrentAnswers(getInitialAnswers(participant));
            setCurrentGrades(getInitialGrades(participant, questions));
            setQuestionsToRevise(new Set(participant.data?.retryQuestions || []));
            setRawView({});
            setActiveFeedbackFormats({});
            setIsDirty(false); // Reset dirty state on open
        } else {
            setCurrentAnswers({});
            setCurrentGrades({});
            setQuestionsToRevise(new Set());
        }
    }, [isOpen, participant, questions]);

    const debouncedAutoSave = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        return (grades: Record<string, { score: number, feedback: string }>, answers: Record<string, string>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                onAutoSave(grades, answers);
                setIsDirty(false); // Reset dirty flag after autosave
            }, 2000);
        };
    }, [onAutoSave]);

    const handleAnswerChange = useCallback((qId: string, value: string) => {
        const newAnswers = { ...currentAnswers, [qId]: value };
        setCurrentAnswers(newAnswers);
        setIsDirty(true);
        debouncedAutoSave(currentGrades, newAnswers);
    }, [currentAnswers, currentGrades, debouncedAutoSave]);

    const handleGradeChange = useCallback((qId: string, score: number, feedback: string) => {
        const newGrades = { ...currentGrades, [qId]: { score, feedback } };
        setCurrentGrades(newGrades);
        setIsDirty(true);
        debouncedAutoSave(newGrades, currentAnswers);
    }, [currentGrades, currentAnswers, debouncedAutoSave]);

    const handleClearAnswer = useCallback((qId: string) => {
        if (window.confirm('Are you sure you want to permanently erase this student\'s answer? This cannot be undone.')) {
            setIsDirty(true);
            handleAnswerChange(qId, '');
            handleGradeChange(qId, 0, currentGrades[qId]?.feedback || '');
        }
    }, [handleAnswerChange, handleGradeChange, currentGrades]);

    const handleToggleQuestionToRevise = useCallback((qId: string) => {
        setIsDirty(true);
        setQuestionsToRevise(prev => {
            const newSet = new Set(prev);
            if (newSet.has(qId)) {
                newSet.delete(qId);
            } else {
                newSet.add(qId);
            }
            return newSet;
        });
    }, []);

    const handleStudentAnswerImageUpload = useCallback((qId: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            setIsDirty(true);
            uploadImage(
                file,
                (placeholder) => handleAnswerChange(qId, placeholder),
                (finalHtml) => handleAnswerChange(qId, finalHtml),
                (errorHtml) => handleAnswerChange(qId, errorHtml)
            );
        };
        input.click();
    }, [handleAnswerChange]);

    const handleFeedbackImageUpload = useCallback((qId: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const editorRef = feedbackEditorRefs.current[qId];
            if (!editorRef) return;
            setIsDirty(true);
            uploadImage(
                file,
                (placeholder) => editorRef.insertHTML(placeholder),
                (finalHtml, _) => {
                    setTimeout(() => {
                        const currentContent = editorRef.getHTML();
                        const newContent = currentContent.replace(/<img id="temp-img-.*?"[^>]*>/, finalHtml);
                        handleGradeChange(qId, currentGrades[qId].score, newContent);
                    }, 100);
                },
                (errorHtml) => {
                    setTimeout(() => {
                        const currentContent = editorRef.getHTML();
                        const newContent = currentContent.replace(/<img id="temp-img-.*?"[^>]*>/, errorHtml);
                        handleGradeChange(qId, currentGrades[qId].score, newContent);
                    }, 100);
                }
            );
        };
        input.click();
    }, [handleGradeChange, currentGrades]);

    const totalScore = useMemo(() => {
        return Object.values(currentGrades).reduce((acc, curr) => acc + (curr?.score || 0), 0);
    }, [currentGrades]);

    return {
        currentAnswers,
        currentGrades,
        questionsToRevise,
        lightboxImageUrl,
        rawView,
        feedbackEditorRefs,
        activeFeedbackFormats,
        isDirty,
        setLightboxImageUrl,
        setRawView,
        setActiveFeedbackFormats,
        resetDirty: () => setIsDirty(false),
        handleAnswerChange,
        handleGradeChange,
        handleClearAnswer,
        handleToggleQuestionToRevise,
        handleStudentAnswerImageUpload,
        handleFeedbackImageUpload,
        totalScore,
    };
};
