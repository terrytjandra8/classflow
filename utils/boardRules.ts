import { Board, Note, Comment } from '../types';

export const BoardRules = {
    canManageBoard: (board: Board, userId?: string): boolean => {
        if (!userId) return false;
        const isOwner = board.ownerId === userId;
        const isCollaborator = board.collaborators?.includes(userId);
        return isOwner || !!isCollaborator;
    },

    isHidden: (sectionHidden: boolean | undefined, isStudent: boolean, isPresentationMode: boolean = false): boolean => {
        return !!sectionHidden && (isStudent || isPresentationMode);
    },

    canEditNote: (
        note: Note, 
        userId: string | undefined, 
        isStudent: boolean, 
        isBoardLocked: boolean
    ): boolean => {
        if (isBoardLocked) return false; 
        if (!isStudent) return true; 
        return !!userId && note.authorId === userId;
    },

    canDeleteNote: (
        note: Note, 
        userId: string | undefined, 
        isStudent: boolean, 
        isBoardLocked: boolean
    ): boolean => {
        if (isBoardLocked) return false;
        if (!isStudent) return true; 
        return !!userId && note.authorId === userId;
    },

    canCopyContent: (
        board: Board, 
        sectionId: string | undefined, 
        isStudent: boolean
    ): boolean => {
        if (!isStudent) return true;
        if (board.disableCopy) return false;
        if (sectionId && board.sections) {
            const section = board.sections.find(s => s.id === sectionId);
            if (section?.disableCopy) return false;
        }
        return true;
    },

    shouldBlurContent: (
        board: Board,
        sectionBlurred: boolean | undefined,
        note: Note,
        viewerId: string | undefined,
        isStudent: boolean,
        isPresentationMode: boolean = false
    ): boolean => {
        if (!isStudent && !isPresentationMode) return false;
        const effectiveViewerId = isPresentationMode ? null : viewerId;
        const isAuthor = effectiveViewerId === note.authorId;
        if (isAuthor) return false;

        const isOwner = note.authorId === board.ownerId;
        const isCollaborator = board.collaborators?.includes(note.authorId || '');
        const isTeacherNote = note.authorRole === 'teacher' || isOwner || isCollaborator;
        
        if (isTeacherNote) {
            return !!board.blurTeacherPosts;
        }

        return (board.blurOtherPosts || !!sectionBlurred);
    },

    shouldAnonymizeNote: (
        board: Board,
        sectionAnonymous: boolean | undefined,
        note: Note,
        viewerId: string | undefined,
        isStudent: boolean,
        isPresentationMode: boolean = false
    ): boolean => {
        if (!isStudent && !isPresentationMode) return false;

        const isOwner = note.authorId === board.ownerId;
        const isCollaborator = board.collaborators?.includes(note.authorId || '');
        const isTeacherNote = note.authorRole === 'teacher' || isOwner || isCollaborator;
        
        if (isTeacherNote) return false;

        return (board.isAnonymous || !!sectionAnonymous);
    },

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