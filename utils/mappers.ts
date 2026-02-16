import { Database } from '../types/db';
import { Board, Note, NoteColor } from '../types';

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
        created_at: row.created_at,
        updated_at: row.updated_at || undefined,
        title: row.title,
        description: row.description || '',
        owner_id: row.owner_id,
        format: (row.format as any) || 'wall',
        sections: settings.sections || [],
        section_groups: settings.section_groups || [],
        settings: settings,
        wallpaper: row.wallpaper || 'blue',
        class_code: row.class_code || undefined,
        is_public: row.is_public,
        is_published: row.is_published,
        target_grade: row.target_grade || 'General',
        subject: row.subject || undefined,
        topic: row.topic || '',
        grading_type: (row.grading_type as any) || 'manual',
        is_favorite: row.is_favorite,
        lock_mode: settings.lock_mode || 'unlocked',
        view_mode: settings.view_mode || 'collaboration',
        steps: steps,
        current_step_index: row.current_step_index || 0,
        deleted_at: row.deleted_at ? new Date(row.deleted_at) : null,
        is_trashed: row.is_trashed || false,
        icon: settings.icon,
        sort_order: settings.sort_order || 'manual',
        new_post_position: settings.new_post_position || 'last',
        custom_slug: settings.custom_slug,
        auto_live_time: settings.auto_live_time || null,
        auto_lock_time: settings.auto_lock_time || null,
        color_scheme: settings.color_scheme || 'light',
        font: settings.font || 'sans',
        text_color: settings.text_color,
        content_text_color: settings.content_text_color,
        group_text_color: settings.group_text_color,
        comments_enabled: settings.comments_enabled ?? true,
        reactions_enabled: settings.reactions_enabled ?? true,
        replies_enabled: settings.replies_enabled ?? true,
        students_can_drag: settings.students_can_drag ?? false,
        students_can_drag_columns: settings.students_can_drag_columns ?? false,
        disable_paste: settings.disable_paste ?? false,
        allow_links: settings.allow_links ?? false,
        disable_copy: settings.disable_copy ?? false,
        block_screenshots: settings.block_screenshots ?? false,
        is_anonymous: settings.is_anonymous ?? false,
        blur_other_posts: settings.blur_other_posts ?? false,
        blur_teacher_posts: settings.blur_teacher_posts ?? false,
        grading_config: settings.grading_config || { mode: 'numeric', maxScore: 100 },
        show_question_on_student_device: settings.show_question_on_student_device,
        quiz_state: settings.quiz_state,
        quiz_questions: settings.quiz_questions,
        quiz_music: settings.quiz_music,
        quiz_start_time: settings.quiz_start_time,
        current_question_index: settings.current_question_index,
        assessment_config: settings.assessment_config,
        assessment_state: settings.assessment_state,
        assessment_questions: settings.assessment_questions,
        guide: settings.guide,
        guide_dismissed: settings.guide_dismissed,
        collaborators: row.collaborators || [],
        polls: settings.polls,
        current_poll_index: settings.current_poll_index,
        recipe_id: settings.recipe_id,
        recipe_status: settings.recipe_status,
    };
};

export const mapNote = (row: NoteRow): Note => {
    const authorInfo = safeParse(row.author, {});

    return {
        id: row.id,
        board_id: row.board_id,
        section_id: row.section_id || undefined,
        created_at: row.created_at,
        content: row.content || '',
        author_id: row.author_id || '',
        author_name: authorInfo.name || 'Anonymous',
        author_avatar: authorInfo.avatar_url || undefined,
        color: (row.color as NoteColor) || 'yellow',
        x: row.x || 0,
        y: row.y || 0,
        width: row.width || 300,
        height: row.height || 300,
        likes: row.likes || 0,
        is_placeholder: row.is_placeholder || false,
        is_deleted: row.is_deleted || false,
        is_pinned: row.is_pinned || false,
        is_watermarked: row.is_watermarked || false,
        image_url: row.image_url || undefined,
        video_url: row.video_url || undefined,
        attachment: row.attachment || undefined,
        reactions: safeParse(row.reactions, []),
        comments: safeParse(row.comments, []),
        tags: safeParse(row.tags, []),
        author_role: (authorInfo.role as any) || 'student',
        liked_by: row.liked_by || [],
        title: row.title || undefined,
        author: authorInfo,
        type: (row.type as any) || 'text',
        connections: safeParse(row.connections, []),
    };
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
