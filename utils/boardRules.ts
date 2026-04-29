
import { Board, Note, Comment } from '../types';

/**
 * ClassBoard Rules Engine
 * Centralized logic for permissions, visibility, and privacy features.
 * 
 * This file acts as the single source of truth for:
 * 1. Hiding columns (Draft/Hidden modes)
 * 2. Anonymizing users (Anonymous Mode)
 * 3. Blurring content (Focus Mode/Anti-Cheat)
 * 4. Management permissions (Dashboard Editing)
 * 5. Note Interaction permissions (Edit/Delete)
 */
export const BoardRules = {
    /**
     * Determines if a user has management rights over a board (Edit title, Assign Class, etc).
     */
    canManageBoard: (board: Board, userId?: string): boolean => {
        if (!userId) return false;
        // Owners and Collaborators can manage
        const isOwner = board.owner_id === userId;
        const isCollaborator = board.collaborators?.includes(userId);
        return isOwner || !!isCollaborator;
    },

    /**
     * Determines if a column/section should be completely hidden from the current view.
     * @param sectionHidden - The `isHidden` property of the section
     * @param isStudent - Whether the current user is a student (or simulating one)
     * @param isPresentationMode - Whether the board is in projector mode
     */
    isHidden: (sectionHidden: boolean | undefined, isStudent: boolean, isPresentationMode: boolean = false): boolean => {
        // If the section is marked hidden, it must be hidden from:
        // 1. Students (so they can't see prep work)
        // 2. Projector Mode (so class doesn't see prep work on the big screen)
        return !!sectionHidden && (isStudent || isPresentationMode);
    },

    /**
     * Determines if a user can edit a specific note.
     */
    canEditNote: (
        note: Note, 
        userId: string | undefined, 
        isStudent: boolean, 
        isBoardLocked: boolean
    ): boolean => {
        // Teachers NOT simulating student view always have full bypass
        if (!isStudent) return true;

        if (isBoardLocked) return false; // Global lock overrides for students
        
        // Students can only edit their own notes
        return !!userId && note.author_id === userId;
    },

    /**
     * Determines if a user can delete a specific note.
     */
    canDeleteNote: (
        note: Note, 
        userId: string | undefined, 
        isStudent: boolean, 
        isBoardLocked: boolean
    ): boolean => {
        // Teachers NOT simulating student view always have full bypass
        if (!isStudent) return true;

        if (isBoardLocked) return false;
        
        // Students can only delete their own notes
        return !!userId && note.author_id === userId;
    },

    /**
     * Determines if text selection/copying is allowed for a specific note.
     * @param board - The board object
     * @param sectionId - The section ID the note belongs to
     * @param isStudent - Whether the current user is a student
     */
    canCopyContent: (
        board: Board, 
        sectionId: string | undefined, 
        isStudent: boolean
    ): boolean => {
        // Teachers can always copy
        if (!isStudent) return true;
        
        // 1. Check Global Setting
        if (board.disableCopy) return false;
        
        // 2. Check Section Setting
        if (sectionId && board.sections) {
            const section = board.sections.find(s => s.id === sectionId);
            if (section?.disableCopy) return false;
        }
        
        return true;
    },

    /**
     * Determines if a note's content should be blurred/masked.
     * Used for "Focus Mode" to prevent cheating or influence.
     */
    shouldBlurContent: (
        board: Board,
        sectionBlurred: boolean | undefined,
        note: Note,
        viewerId: string | undefined,
        isStudent: boolean,
        isPresentationMode: boolean = false
    ): boolean => {
        // 1. Initial Bypass: Non-students (teachers) NOT in presentation mode always see everything
        const isEffectiveStudent = isStudent || isPresentationMode;
        if (!isEffectiveStudent) return false;
        
        // In presentation mode, treat viewer as generic (not author of student posts)
        const effectiveViewerId = isPresentationMode ? null : viewerId;

        // 2. Authors always see their own content
        const isAuthor = effectiveViewerId === note.author_id;
        if (isAuthor) return false;

        // 3. Master Release Override (Always reveal if feedback is explicitly public)
        if (note.isFeedbackPublic) return false;

        // 4. Teacher Posts logic
        const isOwner = note.author_id === board.owner_id;
        const isCollaborator = board.collaborators?.includes(note.author_id || '');
        const isTeacherNote = note.authorRole === 'teacher' || note.author === 'Teacher' || isOwner || isCollaborator;
        
        // 5. Blur State calculations
        const isGlobalBlur = board.blurOtherPosts;
        const isColumnExplicitBlur = !!sectionBlurred;
        
        // Specific Assignment Blur logic
        let isAssignmentBlur = false;
        if (isEffectiveStudent && note.sectionId && board.sections) {
            const section = board.sections.find(s => s.id === note.sectionId);
            if (section?.blurUnassigned && section.assignedStudentIds && section.assignedStudentIds.length > 0) {
                const isAssigned = !!viewerId && section.assignedStudentIds.includes(viewerId);
                if (!isAssigned) isAssignmentBlur = true;
            }
        }
        
        if (isTeacherNote) {
            // Teacher notes are only blurred if explicitly configured OR if the column is blurred/assigned
            return !!board.blurTeacherPosts || isColumnExplicitBlur || isAssignmentBlur;
        }

        return isGlobalBlur || isColumnExplicitBlur || isAssignmentBlur;
    },

    canPostInSection: (
        board: Board,
        sectionId: string | undefined,
        userId: string | undefined,
        isStudent: boolean
    ): boolean => {
        // Teachers NOT simulating student view always have full bypass
        if (!isStudent) return true;

        // If board is read-only, nobody can post (except teachers handled above)
        const isLocked = board.lockMode === 'readonly' || board.lockMode === 'comments_only';
        if (isLocked) return false;

        if (!sectionId || !board.sections) return true;
        const section = board.sections.find(s => s.id === sectionId);
        
        // If the column is explicitly locked
        if (section?.locked) return false;

        // If the column has assignments, only allow assigned students
        if (section?.assignedStudentIds && section.assignedStudentIds.length > 0) {
            return !!userId && section.assignedStudentIds.includes(userId);
        }

        return true;
    },

    /**
     * Determines if a note's author identity should be hidden.
     * Used for "Anonymous Mode".
     */
    shouldAnonymizeNote: (
        board: Board,
        sectionAnonymous: boolean | undefined,
        note: Note,
        viewerId: string | undefined,
        isStudent: boolean,
        isPresentationMode: boolean = false
    ): boolean => {
        // 1. Teachers always see real names UNLESS in presentation mode
        if (!isStudent && !isPresentationMode) return false;

        // 2. Teacher posts are never anonymous to students (unless specifically requested in future)
        const isOwner = note.author_id === board.owner_id;
        const isCollaborator = board.collaborators?.includes(note.author_id || '');
        const isTeacherNote = note.authorRole === 'teacher' || note.author === 'Teacher' || isOwner || isCollaborator;
        
        if (isTeacherNote) return false;

        // 3. Anonymity Check
        // Anonymize if global board setting is ON OR specific column setting is ON
        // Note: Authors also see the anonymous state to confirm the setting is active.
        return (board.isAnonymous || !!sectionAnonymous);
    },

    /**
     * Determines if a comment's author identity should be hidden.
     * Applies same logic as notes but for the Comment type.
     */
    shouldAnonymizeComment: (
        board: Board,
        sectionAnonymous: boolean | undefined,
        comment: Comment,
        viewerId: string | undefined,
        isStudent: boolean,
        isPresentationMode: boolean = false
    ): boolean => {
        if (!isStudent && !isPresentationMode) return false;

        const isOwner = comment.authorId === board.owner_id;
        const isCollaborator = board.collaborators?.includes(comment.authorId || '');
        const isTeacherComment = comment.authorRole === 'teacher' || isOwner || isCollaborator;
        
        if (isTeacherComment) return false;

        return (board.isAnonymous || !!sectionAnonymous);
    }
};
