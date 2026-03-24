import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../../../../../services/supabaseClient';
import { debounce } from 'lodash';

export const useDrawing = (answers: Record<string, string>, onAnswerChange: (qId: string, value: string, immediate?: boolean) => void) => {
    const [activeDrawingQId, setActiveDrawingQId] = useState<string | null>(null);
    const [drawingSaveStatus, setDrawingSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [liveDrawingBlob, setLiveDrawingBlob] = useState<Blob | null>(null);

    const saveDrawing = useCallback(async (blob: Blob, qId: string): Promise<string | null> => {
        setDrawingSaveStatus('saving');
        try {
            const currentAnswer = answers[qId];
            let fileName;

            if (currentAnswer && currentAnswer.startsWith('http') && !currentAnswer.startsWith('blob:')) {
                const urlParts = currentAnswer.split('/');
                fileName = urlParts[urlParts.length - 1].split('?')[0];
            } else {
                fileName = `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
            }

            const { error } = await supabase.storage.from('uploads').upload(fileName, blob, { upsert: true });
            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
            const finalUrl = `${publicUrl}?t=${new Date().getTime()}`;
            
            setDrawingSaveStatus('saved');
            return finalUrl;
        } catch (e) {
            console.error("Drawing upload failed", e);
            setDrawingSaveStatus('error');
            return null;
        }
    }, [answers]);

    const debouncedSave = useMemo(() =>
        debounce((blob: Blob, qId: string) => {
            saveDrawing(blob, qId);
        }, 2500),
    [saveDrawing]);

    useEffect(() => {
        if (liveDrawingBlob && activeDrawingQId) {
            setDrawingSaveStatus('saving'); 
            debouncedSave(liveDrawingBlob, activeDrawingQId);
        }
        return () => {
            debouncedSave.cancel();
        };
    }, [liveDrawingBlob, activeDrawingQId, debouncedSave]);

    const handleCloseDrawingModal = useCallback(() => {
        debouncedSave.cancel();
        const qId = activeDrawingQId;

        if (qId && liveDrawingBlob) {
            const tempUrl = URL.createObjectURL(liveDrawingBlob);

            // Detect if the current answer has a text portion to preserve (both mode)
            const currentAnswer = answers[qId] || '';
            let existingText = '';
            try {
                const parsed = JSON.parse(currentAnswer);
                if (parsed && typeof parsed === 'object' && 't' in parsed) {
                    existingText = parsed.t || '';
                }
            } catch { /* plain string answer — no text to preserve */ }

            const composeAnswer = (url: string) =>
                existingText ? JSON.stringify({ d: url, t: existingText }) : url;

            onAnswerChange(qId, composeAnswer(tempUrl), false);
            
            saveDrawing(liveDrawingBlob, qId).then(finalUrl => {
                if (finalUrl) {
                    const img = new Image();
                    img.src = finalUrl;
                    img.onload = () => {
                        onAnswerChange(qId, composeAnswer(finalUrl), true);
                        URL.revokeObjectURL(tempUrl);
                    };
                    img.onerror = () => {
                        onAnswerChange(qId, composeAnswer(finalUrl), true);
                        URL.revokeObjectURL(tempUrl);
                    }
                }
            });
        }
        
        setActiveDrawingQId(null);
        setLiveDrawingBlob(null);
        setDrawingSaveStatus('idle');
    }, [activeDrawingQId, liveDrawingBlob, onAnswerChange, saveDrawing, debouncedSave, answers]);

    const activeDrawingInitialData = (() => {
        if (!activeDrawingQId) return undefined;
        const raw = answers[activeDrawingQId];
        if (!raw) return undefined;
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && 'd' in parsed) return parsed.d || undefined;
        } catch { /* not JSON */ }
        return raw;
    })();

    return {
        activeDrawingQId,
        setActiveDrawingQId,
        drawingSaveStatus,
        liveDrawingBlob,
        setLiveDrawingBlob,
        handleCloseDrawingModal,
        activeDrawingInitialData
    };
};