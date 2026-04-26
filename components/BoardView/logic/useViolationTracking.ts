
import { useCallback, useRef, useEffect } from 'react';
import { Board, Note } from '../../../types';
import { getViolationKey, encryptViolationCount, decryptViolationCount } from '../../../utils/security';

interface ViolationTrackingProps {
    board: Board;
    notes: Note[];
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
        
        // Secondary Fallback for debugging (Name match)
        const nameMatches = currentNotes.filter(n => n.author?.trim().toLowerCase() === username?.trim().toLowerCase() && n.author_id !== userId);

        // Combine ID matches and Name matches (Amnesty for ID mismatches)
        const allMyNotes = [...studentNotes];
        if (studentNotes.length === 0 && nameMatches.length > 0) {
            console.warn(`[FocusGuard] ID mismatch detected! Healing notes for "${username}"...`);
            
            // AUTO-REPAIR IDs: Update the author_id to match current session
            for (const n of nameMatches) {
                updateNote(n.id, { author_id: userId } as any);
            }
            
            allMyNotes.push(...nameMatches);
        }
        
        if (allMyNotes.length === 0) {
            console.log(`[FocusGuard] No notes found for user ${username} (ID: ${userId}) among ${currentNotes.length} notes.`);
            return;
        }

        console.log(`[FocusGuard] SUCCESS: Found ${allMyNotes.length} notes to flag/heal for ${username}.`);

        for (const note of allMyNotes) {
            // Check if the section this note belongs to has focus guard enabled
            const section = board.sections?.find(s => s.id === note.sectionId);
            
            // If the section is guarded (isWatermarked) or the global board security is on
            if (section?.isWatermarked || board.blockScreenshots) {
                const currentViolations = note.violation_count || 0;
                
                // --- SECURE LOCAL RECORDING ---
                const localKey = getViolationKey(note.id);
                const localCount = decryptViolationCount(localStorage.getItem(localKey));
                
                // Ensure we start from the highest known count (sync from DB if local is behind)
                const baseCount = Math.max(currentViolations, localCount);
                const newCount = baseCount + 1;
                
                console.log(`[FocusGuard] SECURE RECORD: Note ${note.id}. New total: ${newCount}`);
                
                // Save encrypted
                localStorage.setItem(localKey, encryptViolationCount(newCount));
                
                // Trigger secure database sync via RPC
                await incrementViolation(note.id, currentViolations);
            } else {
                console.log(`[FocusGuard] Skipping note ${note.id} - Section not guarded and global security is OFF.`);
            }
        }
    }, [isStudent, isSimulatingStudent, userId, username, board.sections, board.blockScreenshots, updateNote, incrementViolation]);

    return { handleViolation };
};
