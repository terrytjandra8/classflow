
import { Database } from '../types/db';
import { Board, Note } from '../types';

type NoteRow = Database['public']['Tables']['notes']['Row'];
type BoardRow = Database['public']['Tables']['boards']['Row'];

const safeParse = (input: any, fallback: any) => {
    if (typeof input === 'string') {
        try {
            return JSON.parse(input);
        } catch (e) {
            console.error("Failed to parse JSON field", e);
            return fallback;
        }
    }
    return input || fallback;
};

export const mapBoard = (row: BoardRow): Board => {
    const settings = safeParse(row.settings, {});
    const steps = safeParse(row.steps, []);
    
    return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        topic: row.topic || '',
        owner_id: row.owner_id,
        format: (row.format as any) || 'wall',
        classCode: row.class_code || undefined,
        wallpaper: row.wallpaper || 'blue',
        
        isPublished: row.is_published,
        isPublic: row.is_public,
        isFavorite: row.is_favorite,
        
        targetGrade: row.target_grade || 'General',
        subject: row.subject || undefined,
        gradingType: (row.grading_type as any) || 'manual',
        gradingConfig: settings.grading_config || { mode: 'numeric', maxScore: 100 },
        
        createdAt: new Date(row.created_at).toString(),
        updatedAt: new Date(row.updated_at).toString(),
        
        sections: settings.sections || [],
        lockMode: settings.lock_mode || 'unlocked',
        autoLockTime: settings.auto_lock_time || null,
        autoLiveTime: settings.auto_live_time || null, 
        commentsEnabled: settings.comments_enabled ?? true,
        repliesEnabled: settings.replies_enabled ?? true,
        reactionsEnabled: settings.reactions_enabled ?? true,
        studentsCanDrag: settings.students_can_drag ?? false,
        studentsCanDragColumns: settings.students_can_drag_columns ?? false, 
        disablePaste: settings.disable_paste ?? false,
        allowLinks: settings.allow_links ?? false,
        
        blurOtherPosts: settings.blur_other_posts ?? false,
        blurTeacherPosts: settings.blur_teacher_posts ?? false,
        isAnonymous: settings.is_anonymous ?? false,
        
        disableCopy: settings.disable_copy ?? false,
        blockScreenshots: settings.block_screenshots ?? false,
        
        collaborators: settings.collaborators || [],
        
        textColor: settings.text_color,
        contentTextColor: settings.content_text_color,
        groupTextColor: settings.group_text_color,
        colorScheme: settings.color_scheme || 'light',
        font: settings.font || 'sans',
        
        sortOrder: settings.sort_order || 'manual',
        newPostPosition: settings.new_post_position || 'last',
        
        customSlug: settings.custom_slug,
        recipeId: settings.recipe_id,
        recipeStatus: settings.recipe_status,
        
        icon: settings.icon,
        guide: settings.guide,
        guideDismissed: settings.guide_dismissed,
        
        polls: settings.polls,
        currentPollIndex: settings.current_poll_index,
        
        quizQuestions: settings.quiz_questions,
        quizState: settings.quiz_state,
        currentQuestionIndex: settings.current_question_index,
        quizStartTime: settings.quiz_start_time,
        showQuestionOnStudentDevice: settings.show_question_on_student_device,
        
        assessmentQuestions: settings.assessment_questions,
        assessmentState: settings.assessment_state,
        assessmentConfig: settings.assessment_config,
        
        steps: steps,
        currentStepIndex: row.current_step_index || 0,
        
        isTrashed: settings.is_trashed,
        deletedAt: settings.deleted_at,
        
        settings: settings
    };
};

export const mapNote = (row: NoteRow): Note => ({
    id: row.id,
    board_id: row.board_id,
    title: row.title || undefined,
    content: row.content || '',
    author: row.author,
    author_id: row.author_id || undefined,
    authorRole: row.author_role,
    authorAvatar: row.author_avatar || undefined,
    type: (row.type as any) || 'text',
    color: (row.color as any) || 'bg-yellow-200',
    position_x: row.position_x,
    position_y: row.position_y,
    width: row.width || 300,
    height: row.height || 300,
    section_id: row.section_id || undefined,
    attachmentUrl: row.attachment_url || undefined,
    isPinned: row.is_pinned,
    isPlaceholder: row.is_placeholder,
    isWatermarked: row.is_watermarked,
    likes: row.likes,
    likedBy: row.liked_by || [],
    comments: safeParse(row.comments, []),
    connections: safeParse(row.connections, []),
    createdAt: new Date(row.created_at).toString(),
    is_deleted: row.is_deleted,
    author_name: row.author_name,
    author_avatar: row.author_avatar,
    liked_by: row.liked_by,
    created_at: new Date(row.created_at).toString(),
});

export const parseMath = (text: string) => {
    if (!text) return '';
    let processed = text;
    
    processed = processed.replace(/\(?\$([a-zA-Z0-9]+)_\{([a-zA-Z0-9]+)\}\$\)?/g, (_, base, sub) => {
        return `${base}<sub>${sub}</sub>`;
    });

    processed = processed.replace(/\(?\$([a-zA-Z0-9]+)\^\{([a-zA-Z0-9]+)\}\$\)?/g, (_, base, sup) => {
        return `${base}<sup>${sup}</sup>`;
    });

    return processed;
};
