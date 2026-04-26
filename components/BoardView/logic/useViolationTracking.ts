
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
            console.log("[FocusGuard] Not a student, ignoring violation.");
            return;
        }
        
        const now = Date.now();
        if (now - lastViolationTime.current < 2000) return;
        lastViolationTime.current = now;

        const currentNotes = notesRef.current;
        console.log(`[FocusGuard] ${type.toUpperCase()} violation detected! Checking ${currentNotes.length} notes.`);
        console.log(`[FocusGuard] Current User System ID: ${userId}`);
        
        // --- SECURE ID AUDIT ---
        if (currentNotes.length > 0) {
            console.log("[FocusGuard] Note ID Audit (First 5 notes):", 
                currentNotes.slice(0, 5).map(n => ({ author: n.author, id: n.author_id }))
            );
        }

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
            console.warn(`[FocusGuard] ID mismatch detected! Healing notes for "${username}"...`);
            for (const n of nameMatches) {
                updateNote(n.id, { author_id: userId } as any);
            }
            allMyNotes = [...nameMatches];
        }
        
        if (allMyNotes.length === 0) {
            console.log(`[FocusGuard] No notes found for user ${username} (ID: ${userId}) among ${currentNotes.length} notes.`);
            return;
        }

        // --- GLOBAL SESSION SYNC ---
        // Instead of tracking per note, we track per STUDENT.
        // All of a student's notes will now show the same "Permanent Record" total.
        
        // 1. Find the current highest count among all notes (DB or Local)
        let maxViolations = 0;
        for (const n of allMyNotes) {
            const dbCount = n.violation_count || 0;
            const localKey = getViolationKey(n.id);
            const localCount = decryptViolationCount(localStorage.getItem(localKey));
            maxViolations = Math.max(maxViolations, dbCount, localCount);
        }

        const newGlobalCount = maxViolations + 1;
        console.log(`[FocusGuard] GLOBAL SYNC: Setting all ${allMyNotes.length} notes for ${username} to ${newGlobalCount}`);

        // 2. Optimistic UI update for ALL notes instantly
        setNotes((prev: Note[]) => prev.map((n: Note) => {
            const isMe = n.author_id === userId || 
                         (!!userId && !!username && n.author?.trim().toLowerCase() === username.trim().toLowerCase() && n.authorRole === 'student');
            return isMe ? { ...n, violation_count: newGlobalCount } : n;
        }));

        // 3. Batch Update Database (Single Network Call)
        // We update by author_id OR author name (for amnesty)
        const { error } = await supabase
            .from('notes')
            .update({ violation_count: newGlobalCount })
            .eq('board_id', board.id)
            .or(`author_id.eq.${userId},author.eq.${username}`);

        if (error) {
            console.error("[FocusGuard] Global sync failed:", error.message);
        } else {
            // Update local storage for all notes AND the master student key
            const masterKey = `board_violations_${board.id}_${userId}`;
            localStorage.setItem(masterKey, encryptViolationCount(newGlobalCount));
            
            for (const n of allMyNotes) {
                localStorage.setItem(getViolationKey(n.id), encryptViolationCount(newGlobalCount));
            }
        }
    }, [isStudent, isSimulatingStudent, userId, username, board.sections, board.blockScreenshots, updateNote, incrementViolation]);

    return { handleViolation };
};
