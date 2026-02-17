import { Database } from '../types/db';
import { Board, Note, NoteColor, BoardFormat, LockMode, ViewMode, GradingType, SortOrder, NewPostPosition, ColorScheme, Font, QuizState, RecipeStatus, Section, SectionGroup, Poll, QuizQuestion, AssessmentQuestion, Guide, GradingConfig } from '../types';

type NoteRow = Database['public']['Tables']['notes']['Row'];
type BoardRow = Database['public']['Tables']['boards']['Row'];

const safeParse = <T>(input: any, fallback: T): T => {
    if (typeof input === 'string') {
        try {
            // Don't parse if it's not a JSON object/array
            if (input.trim().startsWith('{') || input.trim().startsWith('[')) {
                return JSON.parse(input) as T;
            }
        } catch (e) {
            console.error("Failed to parse JSON field", e);
            return fallback;
        }
    }
    return input || fallback;
};

export const mapBoard = (row: BoardRow | any): Board => {
    const settings = safeParse(row.settings, {}) as any;
    const steps = safeParse(row.steps, []);
    const collaborators = safeParse(row.collaborators, []);
    const deletedAtRaw = (row as any).deletedAt || row.deleted_at;

    return {
        id: row.id,
        createdAt: (row as any).createdAt || row.created_at,
        updatedAt: (row as any).updatedAt || row.updated_at || undefined,
        title: row.title,
        description: row.description || '',
        ownerId: (row as any).ownerId || row.owner_id,
        format: ((row as any).format || row.format as BoardFormat) || 'wall',
        sections: settings.sections || [],
        sectionGroups: (settings as any).sectionGroups || (settings as any).section_groups || [],
        settings: settings,
        wallpaper: row.wallpaper || 'blue',
        classCode: (row as any).classCode || row.class_code || undefined,
        isPublic: (row as any).isPublic ?? row.is_public ?? false,
        isPublished: (row as any).isPublished ?? row.is_published ?? false,
        targetGrade: (row as any).targetGrade || row.target_grade || 'General',
        subject: row.subject || undefined,
        topic: row.topic || '',
        gradingType: ((row as any).gradingType || row.grading_type as GradingType) || 'manual',
        isFavorite: (row as any).isFavorite ?? row.is_favorite ?? false,
        lockMode: (settings as any).lockMode || (settings as any).lock_mode || 'unlocked',
        viewMode: (settings as any).viewMode || (settings as any).view_mode || 'collaboration',
        steps: steps,
        currentStepIndex: (row as any).currentStepIndex || row.current_step_index || 0,
        deletedAt: deletedAtRaw ? new Date(deletedAtRaw) : null,
        isTrashed: (row as any).isTrashed ?? row.is_trashed ?? false,
        icon: settings.icon,
        sortOrder: (settings as any).sortOrder || (settings as any).sort_order || 'manual',
        newPostPosition: (settings as any).newPostPosition || (settings as any).new_post_position || 'last',
        customSlug: (settings as any).customSlug || (settings as any).custom_slug,
        autoLiveTime: (settings as any).autoLiveTime || (settings as any).auto_live_time || null,
        autoLockTime: (settings as any).autoLockTime || (settings as any).auto_lock_time || null,
        colorScheme: (settings as any).colorScheme || (settings as any).color_scheme || 'light',
        font: settings.font || 'sans',
        textColor: (settings as any).textColor || (settings as any).text_color,
        contentTextColor: (settings as any).contentTextColor || (settings as any).content_text_color,
        groupTextColor: (settings as any).groupTextColor || (settings as any).group_text_color,
        commentsEnabled: (settings as any).commentsEnabled ?? (settings as any).comments_enabled ?? true,
        reactionsEnabled: (settings as any).reactionsEnabled ?? (settings as any).reactions_enabled ?? true,
        repliesEnabled: (settings as any).repliesEnabled ?? (settings as any).replies_enabled ?? true,
        studentsCanDrag: (settings as any).studentsCanDrag ?? (settings as any).students_can_drag ?? false,
        studentsCanDragColumns: (settings as any).studentsCanDragColumns ?? (settings as any).students_can_drag_columns ?? false,
        disablePaste: (settings as any).disablePaste ?? (settings as any).disable_paste ?? false,
        allowLinks: (settings as any).allowLinks ?? (settings as any).allow_links ?? false,
        disableCopy: (settings as any).disableCopy ?? (settings as any).disable_copy ?? false,
        blockScreenshots: (settings as any).blockScreenshots ?? (settings as any).block_screenshots ?? false,
        isAnonymous: (settings as any).isAnonymous ?? (settings as any).is_anonymous ?? false,
        isWatermarked: (row as any).isWatermarked ?? row.is_watermarked ?? (settings as any).isWatermarked ?? (settings as any).is_watermarked ?? false,
        blurOtherPosts: (settings as any).blurOtherPosts ?? (settings as any).blur_other_posts ?? false,
        blurTeacherPosts: (settings as any).blurTeacherPosts ?? (settings as any).blur_teacher_posts ?? false,
        gradingConfig: (settings as any).gradingConfig || (settings as any).grading_config || { mode: 'numeric', maxScore: 100 },
        showQuestionOnStudentDevice: (settings as any).showQuestionOnStudentDevice ?? (settings as any).show_question_on_student_device,
        quizState: (settings as any).quizState || (settings as any).quiz_state,
        quizQuestions: (settings as any).quizQuestions || (settings as any).quiz_questions,
        quizMusic: (settings as any).quizMusic || (settings as any).quiz_music,
        quizStartTime: (settings as any).quizStartTime || (settings as any).quiz_start_time,
        currentQuestionIndex: (settings as any).currentQuestionIndex || (settings as any).current_question_index,
        assessmentConfig: (settings as any).assessmentConfig || (settings as any).assessment_config,
        assessmentState: (settings as any).assessmentState || (settings as any).assessment_state,
        assessmentQuestions: (settings as any).assessmentQuestions || (settings as any).assessment_questions,
        guide: settings.guide,
        guideDismissed: (settings as any).guideDismissed ?? (settings as any).guide_dismissed,
        collaborators: collaborators,
        polls: settings.polls,
        currentPollIndex: (settings as any).currentPollIndex || (settings as any).current_poll_index,
        recipeId: (settings as any).recipeId || (settings as any).recipe_id,
        recipeStatus: (settings as any).recipeStatus || (settings as any).recipe_status,
    };
};

export const mapNote = (row: NoteRow | any): Note => {
    const authorInfo = safeParse(row.author, {});

    return {
        id: row.id,
        boardId: (row as any).boardId || row.board_id,
        sectionId: (row as any).sectionId || row.section_id || undefined,
        createdAt: (row as any).createdAt || row.created_at,
        updatedAt: (row as any).updatedAt || row.updated_at || undefined,
        content: row.content || '',
        authorId: (row as any).authorId || row.author_id || '',
        authorName: (authorInfo as any).name || (row as any).authorName || (row as any).author_name || 'Anonymous',
        authorAvatar: (authorInfo as any).avatarUrl || (authorInfo as any).avatar_url || (row as any).authorAvatar || (row as any).author_avatar || undefined,
        color: (row.color as NoteColor) || 'yellow',
        positionX: (row as any).positionX || row.position_x || 0,
        positionY: (row as any).positionY || row.position_y || 0,
        width: row.width || 300,
        height: row.height || 300,
        likes: row.likes || 0,
        isPlaceholder: (row as any).isPlaceholder ?? row.is_placeholder ?? false,
        isDeleted: (row as any).isDeleted ?? row.is_deleted ?? false,
        isPinned: (row as any).isPinned ?? row.is_pinned ?? false,
        isWatermarked: (row as any).isWatermarked ?? row.is_watermarked ?? false,
        imageUrl: (row as any).imageUrl || row.image_url || undefined,
        videoUrl: (row as any).videoUrl || row.video_url || undefined,
        attachmentUrl: (row as any).attachmentUrl || row.attachment || undefined,
        reactions: safeParse(row.reactions, []),
        comments: safeParse(row.comments, []),
        tags: safeParse(row.tags, []),
        authorRole: (authorInfo as any).role || (row as any).authorRole || (row as any).author_role || 'student',
        likedBy: (row as any).likedBy || row.liked_by || [],
        title: row.title || undefined,
        author: authorInfo,
        type: (row.type as any) || 'text',
        connections: safeParse(row.connections, {}),
        x: (row as any).positionX || row.position_x || 0,
        y: (row as any).positionY || row.position_y || 0,
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
