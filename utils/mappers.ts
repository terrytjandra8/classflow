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
        createdAt: row.created_at,
        updatedAt: row.updated_at || undefined,
        title: row.title,
        description: row.description || '',
        ownerId: row.owner_id,
        format: (row.format as BoardFormat) || 'wall',
        sections: settings.sections || [],
        sectionGroups: settings.section_groups || [],
        settings: settings,
        wallpaper: row.wallpaper || 'blue',
        classCode: row.class_code || undefined,
        isPublic: row.is_public,
        isPublished: row.is_published,
        targetGrade: row.target_grade || 'General',
        subject: row.subject || undefined,
        topic: row.topic || '',
        gradingType: (row.grading_type as GradingType) || 'manual',
        isFavorite: row.is_favorite,
        lockMode: settings.lock_mode || 'unlocked',
        viewMode: settings.view_mode || 'collaboration',
        steps: steps,
        currentStepIndex: row.current_step_index || 0,
        deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
        isTrashed: row.is_trashed || false,
        icon: settings.icon,
        sortOrder: settings.sort_order || 'manual',
        newPostPosition: settings.new_post_position || 'last',
        customSlug: settings.custom_slug,
        autoLiveTime: settings.auto_live_time || null,
        autoLockTime: settings.auto_lock_time || null,
        colorScheme: settings.color_scheme || 'light',
        font: settings.font || 'sans',
        textColor: settings.text_color,
        contentTextColor: settings.content_text_color,
        groupTextColor: settings.group_text_color,
        commentsEnabled: settings.comments_enabled ?? true,
        reactionsEnabled: settings.reactions_enabled ?? true,
        repliesEnabled: settings.replies_enabled ?? true,
        studentsCanDrag: settings.students_can_drag ?? false,
        studentsCanDragColumns: settings.students_can_drag_columns ?? false,
        disablePaste: settings.disable_paste ?? false,
        allowLinks: settings.allow_links ?? false,
        disableCopy: settings.disable_copy ?? false,
        blockScreenshots: settings.block_screenshots ?? false,
        isAnonymous: settings.is_anonymous ?? false,
        blurOtherPosts: settings.blur_other_posts ?? false,
        blurTeacherPosts: settings.blur_teacher_posts ?? false,
        gradingConfig: settings.grading_config || { mode: 'numeric', maxScore: 100 },
        showQuestionOnStudentDevice: settings.show_question_on_student_device,
        quizState: settings.quiz_state,
        quizQuestions: settings.quiz_questions,
        quizMusic: settings.quiz_music,
        quizStartTime: settings.quiz_start_time,
        currentQuestionIndex: settings.current_question_index,
        assessmentConfig: settings.assessment_config,
        assessmentState: settings.assessment_state,
        assessmentQuestions: settings.assessment_questions,
        guide: settings.guide,
        guideDismissed: settings.guide_dismissed,
        collaborators: safeParse(row.collaborators, []),
        polls: settings.polls,
        currentPollIndex: settings.current_poll_index,
        recipeId: settings.recipe_id,
        recipeStatus: settings.recipe_status,
    };
};

export const mapNote = (row: NoteRow): Note => {
    const authorInfo = safeParse(row.author, {});

    return {
        id: row.id,
        boardId: row.board_id,
        sectionId: row.section_id || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at || undefined,
        content: row.content || '',
        authorId: row.author_id || '',
        authorName: authorInfo.name || 'Anonymous',
        authorAvatar: authorInfo.avatar_url || undefined,
        color: (row.color as NoteColor) || 'yellow',
        positionX: row.position_x || 0,
        positionY: row.position_y || 0,
        width: row.width || 300,
        height: row.height || 300,
        likes: row.likes || 0,
        isPlaceholder: row.is_placeholder || false,
        isDeleted: row.is_deleted || false,
        isPinned: row.is_pinned || false,
        isWatermarked: row.is_watermarked || false,
        imageUrl: row.image_url || undefined,
        videoUrl: row.video_url || undefined,
        attachmentUrl: row.attachment || undefined,
        reactions: safeParse(row.reactions, []),
        comments: safeParse(row.comments, []),
        tags: safeParse(row.tags, []),
        authorRole: (authorInfo.role as any) || 'student',
        likedBy: row.liked_by || [],
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