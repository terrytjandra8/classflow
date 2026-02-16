import { Database } from '../types/db';
import { Board, Note, NoteColor, BoardFormat, LockMode, ViewMode, GradingType, SortOrder, NewPostPosition, ColorScheme, Font, QuizState, RecipeStatus, Section, SectionGroup, Poll, QuizQuestion, AssessmentQuestion, Guide, GradingConfig } from '../types';

type NoteRow = Database['public']['Tables']['notes']['Row'];
type BoardRow = Database['public']['Tables']['boards']['Row'];

const safeParse = <T>(input: any, fallback: T): T => {
    if (typeof input === 'string') {
        try {
            return JSON.parse(input) as T;
        } catch (e) {
            console.error("Failed to parse JSON field", e);
            return fallback;
        }
    }
    return input || fallback;
};

export const mapBoard = (row: BoardRow): Board => {
    const settings = safeParse(row.settings, {}) as any;
    const steps = safeParse(row.steps, []);

    return {
        id: row.id,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt || undefined,
        title: row.title,
        description: row.description || '',
        ownerId: row.ownerId,
        format: (row.format as BoardFormat) || 'wall',
        sections: settings.sections || [],
        sectionGroups: settings.sectionGroups || [],
        settings: settings,
        wallpaper: row.wallpaper || 'blue',
        classCode: row.classCode || undefined,
        isPublic: row.isPublic,
        isPublished: row.isPublished,
        targetGrade: row.targetGrade || 'General',
        subject: row.subject || undefined,
        topic: row.topic || '',
        gradingType: (row.gradingType as GradingType) || 'manual',
        isFavorite: row.isFavorite,
        lockMode: settings.lockMode || 'unlocked',
        viewMode: settings.viewMode || 'collaboration',
        steps: steps,
        currentStepIndex: row.currentStepIndex || 0,
        deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
        isTrashed: row.isTrashed || false,
        icon: settings.icon,
        sortOrder: settings.sortOrder || 'manual',
        newPostPosition: settings.newPostPosition || 'last',
        customSlug: settings.customSlug,
        autoLiveTime: settings.autoLiveTime || null,
        autoLockTime: settings.autoLockTime || null,
        colorScheme: settings.colorScheme || 'light',
        font: settings.font || 'sans',
        textColor: settings.textColor,
        contentTextColor: settings.contentTextColor,
        groupTextColor: settings.groupTextColor,
        commentsEnabled: settings.commentsEnabled ?? true,
        reactionsEnabled: settings.reactionsEnabled ?? true,
        repliesEnabled: settings.repliesEnabled ?? true,
        studentsCanDrag: settings.studentsCanDrag ?? false,
        studentsCanDragColumns: settings.studentsCanDragColumns ?? false,
        disablePaste: settings.disablePaste ?? false,
        allowLinks: settings.allowLinks ?? false,
        disableCopy: settings.disableCopy ?? false,
        blockScreenshots: settings.blockScreenshots ?? false,
        isAnonymous: settings.isAnonymous ?? false,
        blurOtherPosts: settings.blurOtherPosts ?? false,
        blurTeacherPosts: settings.blurTeacherPosts ?? false,
        gradingConfig: settings.gradingConfig || { mode: 'numeric', maxScore: 100 },
        showQuestionOnStudentDevice: settings.showQuestionOnStudentDevice,
        quizState: settings.quizState,
        quizQuestions: settings.quizQuestions,
        quizMusic: settings.quizMusic,
        quizStartTime: settings.quizStartTime,
        currentQuestionIndex: settings.currentQuestionIndex,
        assessmentConfig: settings.assessmentConfig,
        assessmentState: settings.assessmentState,
        assessmentQuestions: settings.assessmentQuestions,
        guide: settings.guide,
        guideDismissed: settings.guideDismissed,
        collaborators: safeParse(row.collaborators, []),
        polls: settings.polls,
        currentPollIndex: settings.currentPollIndex,
        recipeId: settings.recipeId,
        recipeStatus: settings.recipeStatus,
    };
};

export const mapNote = (row: NoteRow): Note => {
    const authorInfo = safeParse(row.author, {});

    return {
        id: row.id,
        boardId: row.boardId,
        sectionId: row.sectionId || undefined,
        createdAt: row.createdAt,
        content: row.content || '',
        authorId: row.authorId || '',
        authorName: authorInfo.name || 'Anonymous',
        authorAvatar: authorInfo.avatar_url || undefined,
        color: (row.color as NoteColor) || 'yellow',
        positionX: row.positionX || 0,
        positionY: row.positionY || 0,
        width: row.width || 300,
        height: row.height || 300,
        likes: row.likes || 0,
        isPlaceholder: row.isPlaceholder || false,
        isDeleted: row.isDeleted || false,
        isPinned: row.isPinned || false,
        isWatermarked: row.isWatermarked || false,
        imageUrl: row.imageUrl || undefined,
        videoUrl: row.videoUrl || undefined,
        attachmentUrl: row.attachmentUrl || undefined,
        reactions: safeParse(row.reactions, []),
        comments: safeParse(row.comments, []),
        tags: safeParse(row.tags, []),
        authorRole: (authorInfo.role as any) || 'student',
        likedBy: row.likedBy || [],
        title: row.title || undefined,
        author: authorInfo,
        type: (row.type as any) || 'text',
        connections: safeParse(row.connections, []),
    } as Note;
};


export const parseMath = (text: string) => {
    if (!text) return '';
    let processed = text;
    
    // Subscript: $base_{sub}$
    processed = processed.replace(/\(?\$([a-zA-Z0-9]+)_\{([a-zA-Z0-9]+)\}\$\)?/g, (_, base, sub) => {
        return `${base}<sub>${sub}</sub>`;
    });

    // Superscript: $base^{sup}$
    processed = processed.replace(/\(?\$([a-zA-Z0-9]+)\^\{([a-zA-Z0-9]+)\}\$\)?/g, (_, base, sup) => {
        return `${base}<sup>${sup}</sup>`;
    });

    return processed;
};
