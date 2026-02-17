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
        const isOwner = board.ownerId === userId;
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
        if (isBoardLocked) return false; // Global lock overrides everything
        
        // Teachers can edit any note
        if (!isStudent) return true; 
        
        // Students can only edit their own notes
        return !!userId && note.authorId === userId;
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
        if (isBoardLocked) return false;
        
        // Teachers can delete any note
        if (!isStudent) return true; 
        
        // Students can only delete their own notes
        return !!userId && note.authorId === userId;
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
        // 1. Teachers always see everything UNLESS in presentation mode
        if (!isStudent && !isPresentationMode) return false;
        
        // In presentation mode, treat viewer as generic (not author of student posts)
        const effectiveViewerId = isPresentationMode ? null : viewerId;

        // 2. Authors always see their own content
        const isAuthor = effectiveViewerId === note.authorId;
        if (isAuthor) return false;

        // 3. Teacher Posts logic
        // Fix: Check if note author is board owner OR explicitly marked as teacher
        const isOwner = note.authorId === board.ownerId;
        // Check collaborators too if available
        const isCollaborator = board.collaborators?.includes(note.authorId || '');
        
        const isTeacherNote = note.authorRole === 'teacher' || note.author === 'Teacher' || isOwner || isCollaborator;
        
        if (isTeacherNote) {
            // Only blur teacher posts if explicitly configured (default: visible)
            return !!board.blurTeacherPosts;
        }

        // 4. Peer Posts logic
        // Blur if global board setting is ON OR specific column setting is ON
        return (board.blurOtherPosts || !!sectionBlurred);
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
        const isOwner = note.authorId === board.ownerId;
        const isCollaborator = board.collaborators?.includes(note.authorId || '');
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

        const isOwner = comment.authorId === board.ownerId;
        const isCollaborator = board.collaborators?.includes(comment.authorId || '');
        const isTeacherComment = comment.authorRole === 'teacher' || isOwner || isCollaborator;
        
        if (isTeacherComment) return false;

        return (board.isAnonymous || !!sectionAnonymous);
    }
};
