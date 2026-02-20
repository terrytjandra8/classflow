
import { AssessmentQuestion } from '../../../../../types';
import { supabase } from '../../../../../services/supabaseClient';

/**
 * Extracts the initial answers from the participant object.
 */
export const getInitialAnswers = (participant: any): Record<string, string> => {
    return participant?.data?.answers || {};
};

/**
 * Computes the initial grades for a participant based on their answers and existing grading data.
 * If a grade already exists, it's used. Otherwise, it calculates the grade for MCQs.
 */
export const getInitialGrades = (
    participant: any, 
    questions: AssessmentQuestion[]
): Record<string, { score: number, feedback: string }> => {
    const initialGrades: Record<string, { score: number, feedback: string }> = {};
    const answers = getInitialAnswers(participant);

    questions.forEach(q => {
        if (q.type === 'section') return;

        const existingGrade = participant?.data?.grading?.[q.id];
        if (existingGrade) {
            initialGrades[q.id] = existingGrade;
        } else {
            const isCorrect = q.type === 'mcq' && answers[q.id] === q.correctAnswer;
            initialGrades[q.id] = { score: isCorrect ? (q.points ?? 0) : 0, feedback: '' };
        }
    });
    return initialGrades;
};

/**
 * Handles the process of uploading a file to Supabase storage.
 * It provides progress, success, and failure callbacks to update the UI.
 */
export const uploadImage = async (
    file: File,
    onProgress: (html: string) => void,
    onSuccess: (finalHtml: string, url: string) => void,
    onFailure: (errorHtml: string) => void
) => {
    const tempId = `temp-img-${Date.now()}`;
    const tempSrc = URL.createObjectURL(file);
    const placeholderHtml = `<img id="${tempId}" src="${tempSrc}" style="opacity: 0.5; max-width: 200px;" alt="Uploading..."/>`;
    onProgress(placeholderHtml);

    try {
        const fileName = `teacher-upload-${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('uploads').upload(fileName, file);
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
        const finalHtml = `<img src="${publicUrl}" style="max-width: 400px; border-radius: 8px;" alt="Uploaded image"/>`;
        onSuccess(finalHtml, publicUrl);
    } catch (err) {
        console.error('Upload failed', err);
        onFailure('<p style="color: red;">[Image upload failed]</p>');
    }
};
