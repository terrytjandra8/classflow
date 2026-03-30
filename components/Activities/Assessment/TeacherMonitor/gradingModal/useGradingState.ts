
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AssessmentQuestion } from '../../../../../types';
import { RichTextEditorRef, FormatState } from '../../../../RichTextEditor';
import { getInitialAnswers, getInitialGrades, uploadImage } from './utils';
import { supabase } from '../../../../../services/supabaseClient';

interface UseGradingStateProps {
    isOpen: boolean;
    participant: any;
    questions: AssessmentQuestion[];
    boardId: string;
    onAutoSave: (
        grades: Record<string, { score: number, feedback: string }>,
        updatedAnswers?: Record<string, string>
    ) => Promise<void>;
}

export const useGradingState = ({ isOpen, participant, questions, boardId, onAutoSave }: UseGradingStateProps) => {
    const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});
    const [currentGrades, setCurrentGrades] = useState<Record<string, { score: number, feedback: string }>>({});
    const [questionsToRevise, setQuestionsToRevise] = useState<Set<string>>(new Set());
    const [isDirty, setIsDirty] = useState(false);
    
    const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
    const [rawView, setRawView] = useState<Record<string, boolean>>({});
    const feedbackEditorRefs = useRef<Record<string, RichTextEditorRef | null>>({});
    const [activeFeedbackFormats, setActiveFeedbackFormats] = useState<Record<string, FormatState>>({});
    const prevParticipantIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (isOpen && participant) {
            // Only initialize grades and reset state if we switched to a new participant or just opened
            if (prevParticipantIdRef.current !== participant.id) {
                setCurrentAnswers(getInitialAnswers(participant));
                setCurrentGrades(getInitialGrades(participant, questions));
                setQuestionsToRevise(new Set(participant.data?.retryQuestions || []));
                setRawView({});
                setActiveFeedbackFormats({});
                setIsDirty(false); // Reset dirty state on open or switch
                prevParticipantIdRef.current = participant.id;
            }
        } else {
            setCurrentAnswers({});
            setCurrentGrades({});
            setQuestionsToRevise(new Set());
            prevParticipantIdRef.current = null;
        }
    }, [isOpen, participant, questions]);

    useEffect(() => {
        if (!isOpen || !participant) return;

        let activeChannel: ReturnType<typeof supabase.channel> | null = null;
        let activeInterval: NodeJS.Timeout | null = null;

        const connectToStudent = async () => {
            let noteIdToUse = participant.noteId;

            // If the teacher hasn't refreshed the monitor since the student started the test, 
            // noteId will be null. Let's find it.
            if (!noteIdToUse && participant.id) {
                const { data } = await supabase.from('notes')
                    .select('id')
                    .eq('board_id', boardId)
                    .eq('author_id', participant.id)
                    .eq('type', 'assessment_submission')
                    .single();
                
                if (data) {
                    noteIdToUse = data.id;
                }
            }

            if (!noteIdToUse) return; // Student legitimately hasn't started yet

            activeChannel = supabase.channel(`grading-${noteIdToUse}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notes',
                    filter: `id=eq.${noteIdToUse}`
                }, (payload: any) => {
                    const newData = (payload.new as any).connections;
                    if (newData && newData.answers) {
                        setCurrentAnswers(prev => {
                            // Merge the new answers from the database with our current answers.
                            return { ...prev, ...newData.answers };
                        });
                    }
                })
                .subscribe();

            // Fallback polling for local environments where Supabase Realtime might not fire
            const fetchLatest = async () => {
                const { data } = await supabase.from('notes').select('connections').eq('id', noteIdToUse!).single();
                if (data && data.connections && (data.connections as any).answers) {
                    setCurrentAnswers(prev => ({ ...prev, ...(data.connections as any).answers }));
                }
            };

            activeInterval = setInterval(fetchLatest, 3000);
        };

        connectToStudent();

        return () => {
            if (activeInterval) clearInterval(activeInterval);
            if (activeChannel) supabase.removeChannel(activeChannel);
        };
    }, [isOpen, participant?.id, participant?.noteId, boardId]);

    const debouncedAutoSave = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        return (grades: Record<string, { score: number, feedback: string }>, answers: Record<string, string>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                onAutoSave(grades, answers);
                // NOTE: We do NOT reset the dirty flag here. The dirty flag should persist until a MANUAL
                // save action is performed (Save, Save & Release, Republish).
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

    const resetDirty = useCallback(() => {
        setIsDirty(false);
    }, []);

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
        resetDirty,
        handleAnswerChange,
        handleGradeChange,
        handleClearAnswer,
        handleToggleQuestionToRevise,
        handleStudentAnswerImageUpload,
        handleFeedbackImageUpload,
        totalScore,
    };
};
