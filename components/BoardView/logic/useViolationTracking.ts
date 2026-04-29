
import { useCallback, useRef, useEffect } from 'react';
import { Board, Note } from '../../../types';
import { encryptViolationCount, decryptViolationCount } from '../../../utils/security';
import { supabase } from '../../../services/supabaseClient';

interface ViolationTrackingProps {
    board: Board;
    notes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    userId: string | undefined;
    username: string;
    isStudent: boolean;
    isSimulatingStudent: boolean;
    updateNote: (id: string, updates: any) => Promise<any>;
    incrementViolation: (id: string, currentCount: number) => Promise<void>;
}

/**
 * useViolationTracking
 * 
 * Tracks focus/screenshot violations and persists them to ALL of a student's notes.
 * 
 * RULES:
 *   - Only REAL students write violation counts (never teacher simulations)
 *   - Teacher simulation still triggers the overlay (for debugging) but does NOT persist
 *   - ALL notes by the same student on the same board get the SAME violation count
 *   - The count is the MAX found across all sources + 1 (never resets, never splits)
 */
export const useViolationTracking = ({
    board,
    notes,
    setNotes,
    userId,
    username,
    isStudent,
    isSimulatingStudent,
    updateNote,
    incrementViolation
}: ViolationTrackingProps) => {
    const lastViolationTime = useRef<number>(0);
    
    // Keep a ref to the latest notes to avoid stale closures in event listeners
    const notesRef = useRef(notes);
    useEffect(() => { notesRef.current = notes; }, [notes]);

    const handleViolation = useCallback(async (type: 'security' | 'focus') => {
        // ─── RULE: Teacher simulation shows overlay but does NOT persist ───
        // The overlay itself is handled by ScreenshotGuard. Here we only
        // decide whether to write to the DB.
        if (isSimulatingStudent) {
            // Don't persist — the overlay already appeared for debugging
            return;
        }

        // Only real students persist violations
        if (!isStudent) {
            return;
        }
        
        // Throttle: 2 seconds between violations
        const now = Date.now();
        if (now - lastViolationTime.current < 2000) return;
        lastViolationTime.current = now;

        const currentNotes = notesRef.current;
        
        // ─── Find ALL notes that belong to this student ───
        // Match by author_id OR by name (for legacy notes without author_id)
        const allMyNotes = currentNotes.filter(n => {
            if (n.author_id === userId) return true;
            // Fallback: name match for notes without author_id, excluding teacher notes
            if (!n.author_id && n.author?.trim().toLowerCase() === username?.trim().toLowerCase()) {
                if (n.authorRole !== 'teacher' && n.author !== 'Teacher') return true;
            }
            return false;
        });

        // Claim any unclaimed notes that match by name
        for (const n of allMyNotes) {
            if (!n.author_id && userId) {
                updateNote(n.id, { author_id: userId });
            }
        }
        
        // ─── Calculate the single global count ───
        // Source 1: localStorage master key (survives page refreshes)
        const masterKey = `board_violations_${board.id}_${userId}`;
        const localCount = decryptViolationCount(localStorage.getItem(masterKey));
        
        // Source 2: highest count from any of the student's notes in the DB
        let dbMaxCount = 0;
        for (const n of allMyNotes) {
            dbMaxCount = Math.max(dbMaxCount, n.violation_count || 0);
        }

        // The true count is the MAX of all sources + 1
        const newCount = Math.max(localCount, dbMaxCount) + 1;
        
        // ─── Persist to localStorage immediately ───
        localStorage.setItem(masterKey, encryptViolationCount(newCount));

        if (allMyNotes.length === 0) {
            return;
        }

        // ─── Optimistic UI: update ALL student notes to the same count ───
        setNotes((prev: Note[]) => prev.map((n: Note) => {
            const isMine = n.author_id === userId || 
                (!n.author_id && n.author?.trim().toLowerCase() === username?.trim().toLowerCase() && n.authorRole !== 'teacher');
            return isMine ? { ...n, violation_count: newCount } : n;
        }));

        // ─── Write to DB: update ALL notes by this student on this board ───
        const noteIds = allMyNotes.map(n => n.id);
        await supabase
            .from('notes')
            .update({ violation_count: newCount })
            .eq('board_id', board.id)
            .in('id', noteIds);

    }, [isStudent, isSimulatingStudent, userId, username, board.id, updateNote, setNotes]);

    return { handleViolation };
};
