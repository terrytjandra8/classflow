
import { useCallback, useRef, useEffect } from 'react';
import { Board, Note } from '../../../types';
import { getViolationKey, encryptViolationCount, decryptViolationCount } from '../../../utils/security';
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
        if (!isStudent && !isSimulatingStudent) {
            return;
        }
        
        const now = Date.now();
        if (now - lastViolationTime.current < 2000) return;
        lastViolationTime.current = now;

        const currentNotes = notesRef.current;
        
        // Primary Match by System ID
        const studentNotes = currentNotes.filter(n => n.author_id === userId);
        
        // Secondary Fallback: Name match (Amnesty)
        const nameMatches = currentNotes.filter(n => {
            const isNameMatch = n.author?.trim().toLowerCase() === username?.trim().toLowerCase();
            const isNotMe = n.author_id !== userId;
            const isNotTeacher = n.authorRole !== 'teacher' && n.author !== 'Teacher';
            
            return isNameMatch && isNotMe && isNotTeacher;
        });

        // Combine ID matches and Name matches
        let allMyNotes = [...studentNotes];
        if (studentNotes.length === 0 && nameMatches.length > 0) {
            for (const n of nameMatches) {
                updateNote(n.id, { author_id: userId } as any);
            }
            allMyNotes = [...nameMatches];
        }
        
        // --- STEP 1: ALWAYS UPDATE MASTER LOCAL STORAGE (Even if zero notes) ---
        const masterKey = `board_violations_${board.id}_${userId}`;
        const currentMasterCount = decryptViolationCount(localStorage.getItem(masterKey));
        
        // Find the highest known count (Local Master vs any DB notes)
        let maxViolations = currentMasterCount;
        for (const n of allMyNotes) {
            maxViolations = Math.max(maxViolations, n.violation_count || 0);
        }

        const newGlobalCount = maxViolations + 1;
        
        // Save to Master Key immediately (Always works!)
        localStorage.setItem(masterKey, encryptViolationCount(newGlobalCount));

        if (allMyNotes.length === 0) {
            return;
        }

        // --- STEP 2: SYNC TO EXISTING NOTES ---
        // Optimistic UI update
        setNotes((prev: Note[]) => prev.map((n: Note) => {
            const isMe = n.author_id === userId || 
                         (!!userId && !!username && n.author?.trim().toLowerCase() === username.trim().toLowerCase() && n.authorRole === 'student');
            return isMe ? { ...n, violation_count: newGlobalCount } : n;
        }));

        // Batch Update Database
        const { error } = await supabase
            .from('notes')
            .update({ violation_count: newGlobalCount })
            .eq('board_id', board.id)
            .or(`author_id.eq.${userId},author.eq.${username}`);

        if (error) {
            // Error logged to console is usually okay, but I'll remove the success logs
        } else {
            // Update local storage for individual notes to keep them consistent
            for (const n of allMyNotes) {
                localStorage.setItem(getViolationKey(n.id), encryptViolationCount(newGlobalCount));
            }
        }
    }, [isStudent, isSimulatingStudent, userId, username, board.id, board.sections, board.blockScreenshots, updateNote, incrementViolation, setNotes]);

    return { handleViolation };
};
