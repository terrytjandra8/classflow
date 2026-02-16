
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
        class_code: row.class_code || undefined,
        wallpaper: row.wallpaper || 'blue',
        
        is_published: row.is_published,
        is_public: row.is_public,
        is_favorite: row.is_favorite,
        
        target_grade: row.target_grade || 'General',
        subject: row.subject || undefined,
        grading_type: (row.grading_type as any) || 'manual',
        grading_config: settings.grading_config || { mode: 'numeric', maxScore: 100 },
        
        created_at: new Date(row.created_at).getTime(),
        updated_at: new Date(row.updated_at).getTime(),
        
        sections: settings.sections || [],
        lock_mode: settings.lock_mode || 'unlocked',
        auto_lock_time: settings.auto_lock_time || null,
        auto_live_time: settings.auto_live_time || null, 
        comments_enabled: settings.comments_enabled ?? true,
        replies_enabled: settings.replies_enabled ?? true,
        reactions_enabled: settings.reactions_enabled ?? true,
        students_can_drag: settings.students_can_drag ?? false,
        students_can_drag_columns: settings.students_can_drag_columns ?? false, 
        disable_paste: settings.disable_paste ?? false,
        allow_links: settings.allow_links ?? false,
        
        blur_other_posts: settings.blur_other_posts ?? false,
        blur_teacher_posts: settings.blur_teacher_posts ?? false,
        is_anonymous: settings.is_anonymous ?? false,
        
        disable_copy: settings.disable_copy ?? false,
        block_screenshots: settings.block_screenshots ?? false,
        
        collaborators: settings.collaborators || [],
        
        text_color: settings.text_color,
        content_text_color: settings.content_text_color,
        group_text_color: settings.group_text_color,
        color_scheme: settings.color_scheme || 'light',
        font: settings.font || 'sans',
        post_size: settings.post_size || 'medium',
        
        sort_order: settings.sort_order || 'manual',
        new_post_position: settings.new_post_position || 'last',
        
        custom_slug: settings.custom_slug,
        recipe_id: settings.recipe_id,
        recipe_status: settings.recipe_status,
        
        icon: settings.icon,
        guide: settings.guide,
        guide_dismissed: settings.guide_dismissed,
        
        polls: settings.polls,
        current_poll_index: settings.current_poll_index,
        
        quiz_questions: settings.quiz_questions,
        quiz_state: settings.quiz_state,
        current_question_index: settings.current_question_index,
        quiz_start_time: settings.quiz_start_time,
        show_question_on_student_device: settings.show_question_on_student_device,
        
        assessment_questions: settings.assessment_questions,
        assessment_state: settings.assessment_state,
        assessment_config: settings.assessment_config,
        
        steps: steps,
        current_step_index: row.current_step_index || 0,
        
        is_trashed: settings.is_trashed,
        deleted_at: settings.deleted_at,
        
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
    author_role: row.author_role,
    author_avatar: row.author_avatar || undefined,
    type: (row.type as any) || 'text',
    color: (row.color as any) || 'bg-yellow-200',
    position_x: row.position_x,
    position_y: row.position_y,
    width: row.width || undefined,
    height: row.height || undefined,
    section_id: row.section_id || undefined,
    attachment_url: row.attachment_url || undefined,
    is_pinned: row.is_pinned,
    is_placeholder: row.is_placeholder,
    is_watermarked: row.is_watermarked,
    likes: row.likes,
    liked_by: row.liked_by || [],
    comments: safeParse(row.comments, []),
    connections: safeParse(row.connections, []),
    created_at: new Date(row.created_at).getTime()
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
