
import { Board } from '../types';

/**
 * UserRules — Single source of truth for role-based behavior.
 * 
 * Every security feature, UI restriction, and permission check
 * should derive from this file. This prevents scattered if/else
 * logic from drifting out of sync across components.
 * 
 * KEY CONCEPT:
 *   isProtectedUser = true  → Student rules apply (guards, blur, restrictions)
 *   isProtectedUser = false → Teacher/Owner rules apply (full access, no guards)
 * 
 * The "View as Student" simulation button sets isSimulatingStudent=true,
 * which makes the teacher a "protected user" for debugging purposes.
 */

export interface UserContext {
    userId?: string;
    userRole?: string;
    isStudent: boolean;           // True if the user joined as a student
    isSimulatingStudent: boolean; // True if a teacher clicked "View as Student"
    board: Board;
}

export const UserRules = {

    // ─── CORE IDENTITY ───────────────────────────────────────────────

    /**
     * Is this user subject to student-level protections?
     * TRUE for: actual students, teachers simulating student view
     * FALSE for: board owners, collaborators (when not simulating)
     */
    isProtectedUser: (ctx: UserContext): boolean => {
        return ctx.isStudent || ctx.isSimulatingStudent;
    },

    /**
     * Is this user a board manager (owner or collaborator)?
     * Note: A teacher simulating student view is STILL a manager
     * (they can exit simulation), but they are ALSO protected.
     */
    isBoardManager: (ctx: UserContext): boolean => {
        if (!ctx.userId) return false;
        const isOwner = ctx.board.owner_id === ctx.userId;
        const isCollaborator = ctx.board.collaborators?.includes(ctx.userId);
        return isOwner || !!isCollaborator;
    },


    // ─── SECURITY GUARDS ─────────────────────────────────────────────

    /**
     * Should the focus guard (blur on tab switch / mouse leave) be active?
     * Active when: user is protected AND the board hasn't disabled it.
     */
    shouldEnableFocusGuard: (ctx: UserContext): boolean => {
        if (!UserRules.isProtectedUser(ctx)) return false;
        return !ctx.board.disableFocusGuard;
    },

    /**
     * Should screenshot protection (watermark + key interception) be active?
     * Active when: user is protected AND board has blockScreenshots on.
     */
    shouldEnableScreenshotProtection: (ctx: UserContext): boolean => {
        if (!UserRules.isProtectedUser(ctx)) return false;
        const hasWatermarkedSection = ctx.board.sections?.some(s => s.isWatermarked);
        return !!ctx.board.blockScreenshots || !!hasWatermarkedSection;
    },

    /**
     * Should ANY security guard be rendered at all?
     * If neither focus guard nor screenshot protection is needed, skip.
     */
    shouldRenderSecurityGuard: (ctx: UserContext): boolean => {
        return UserRules.shouldEnableFocusGuard(ctx) || UserRules.shouldEnableScreenshotProtection(ctx);
    },


    // ─── CONTENT RESTRICTIONS ────────────────────────────────────────

    /**
     * Is paste disabled for this user on this board?
     */
    isPasteDisabled: (ctx: UserContext): boolean => {
        if (!UserRules.isProtectedUser(ctx)) return false;
        return !!ctx.board.disablePaste;
    },

    /**
     * Is text copying disabled for this user on this board?
     */
    isCopyDisabled: (ctx: UserContext): boolean => {
        if (!UserRules.isProtectedUser(ctx)) return false;
        return !!ctx.board.disableCopy;
    },


    // ─── PERMISSIONS ────────────────────────────────────────────────
    
    /**
     * Can this user add a post to a specific section?
     */
    canAddPost: (ctx: UserContext, sectionId?: string): boolean => {
        // 1. Teachers NOT simulating student view always have full bypass
        if (!UserRules.isProtectedUser(ctx)) return true;

        // 2. Read-only mode prevents all posting
        const isLocked = ctx.board.lockMode === 'readonly' || ctx.board.lockMode === 'comments_only';
        if (isLocked) return false;

        // 3. Section specific lock
        if (sectionId && ctx.board.sections) {
            const section = ctx.board.sections.find(s => s.id === sectionId);
            if (section?.locked) return false;

            // 4. Assignments check: If column is assigned, user MUST be in it
            if (section.assignedStudentIds && section.assignedStudentIds.length > 0) {
                return !!ctx.userId && section.assignedStudentIds.includes(ctx.userId);
            }
        }

        return true;
    },

    /**
     * Can this user edit or delete a specific note?
     */
    canEditNote: (ctx: UserContext, note?: Note): boolean => {
        if (!note) return false;

        // 1. Teachers NOT simulating student view always have full bypass
        if (!UserRules.isProtectedUser(ctx)) return true;

        // 2. Read-only mode prevents all editing
        const isLocked = ctx.board.lockMode === 'readonly' || ctx.board.lockMode === 'comments_only';
        if (isLocked) return false;

        // 3. Section specific lock
        if (note.sectionId && ctx.board.sections) {
            const section = ctx.board.sections.find(s => s.id === note.sectionId);
            if (section?.locked) return false;
        }

        // 4. Students/Simulators can only edit their own notes
        return !!ctx.userId && note.author_id === ctx.userId;
    },

    /**
     * Is the board effectively read-only for this user?
     */
    isReadOnly: (ctx: UserContext): boolean => {
        // Teachers NOT simulating always bypass read-only
        if (!UserRules.isProtectedUser(ctx)) return false;
        
        return ctx.board.lockMode === 'readonly' || ctx.board.lockMode === 'comments_only';
    },

    /**
     * Can this user drag/rearrange a note?
     */
    canDragNote: (ctx: UserContext, note?: Note, sectionCanDrag?: boolean): boolean => {
        // 1. Teachers NOT simulating always have full bypass
        if (!UserRules.isProtectedUser(ctx)) return true;

        // 2. Read-only mode prevents all dragging
        if (UserRules.isReadOnly(ctx)) return false;

        // 3. Section specific lock
        if (note?.sectionId && ctx.board.sections) {
            const section = ctx.board.sections.find(s => s.id === note.sectionId);
            if (section?.locked) return false;
        }

        // 4. If note exists, only owner can drag? 
        // Actually, for Classboards, "Rearrange" usually means anyone assigned can move.
        // But if sectionCanDrag is false, students can't move.
        return !!sectionCanDrag;
    },

    // ─── VIOLATION TRACKING ──────────────────────────────────────────

    /**
     * Should violations be persisted to the DB for this user?
     * TRUE for: real students only
     * FALSE for: teachers, owners, and teachers simulating student view
     * 
     * The overlay still SHOWS during simulation (for debugging),
     * but the count is never written to the database.
     */
    shouldPersistViolations: (ctx: UserContext): boolean => {
        // Only real students get violations tracked
        return ctx.isStudent && !ctx.isSimulatingStudent;
    },

    /**
     * Should the violation counter badge be shown on a note?
     * TRUE for: teachers viewing student notes, students viewing their own notes
     * FALSE for: teacher's own notes (teachers never have violation counters)
     */
    shouldShowViolationBadge: (
        noteAuthorId: string | undefined,
        noteAuthorRole: string | undefined,
        boardOwnerId: string,
        collaborators: string[] | undefined,
    ): boolean => {
        // Never show badge on teacher/owner notes
        if (noteAuthorRole === 'teacher') return false;
        if (noteAuthorId === boardOwnerId) return false;
        if (noteAuthorId && collaborators?.includes(noteAuthorId)) return false;
        return true;
    },
};
