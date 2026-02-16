'''
import { PostgrestError } from "@supabase/supabase-js";

export interface Board {
    id: string;
    created_at: string;
    title: string;
    description?: string;
    owner_id: string;
    format: 'wall' | 'columns' | 'grid' | 'timeline' | 'quiz' | 'poll';
    sections?: Section[];
    sectionGroups?: SectionGroup[]; // New field for merged column titles
    settings?: BoardSettings;
    wallpaper?: string;
    class_code?: string;
    is_public?: boolean;
    is_published?: boolean;
    target_grade?: string;
    subject?: string;
    topic?: string;
    grading_type?: 'manual' | 'automatic' | 'none';
    is_favorite?: boolean;
    lockMode?: 'unlocked' | 'posts-only' | 'locked';
    viewMode?: 'presentation' | 'collaboration';
    steps?: any[]; 
    current_step_index?: number;
    notes?: Note[]; 
    grades?: Grade[];
}

export interface Section {
    id: string;
    title: string;
    is_published?: boolean;
}

export interface SectionGroup {
    id: string;
    title: string;
    span: number; // Number of columns to span
}

export interface BoardSettings {
    allow_posts: boolean;
    allow_reactions: boolean;
    allow_comments: boolean;
    allow_anonymous_posts: boolean;
    allow_anonymous_comments: boolean;
    allow_student_pins: boolean;
    allow_embedding: boolean;
    default_note_color?: string;
    default_note_font?: string;
    max_posts_per_student?: number;
    max_comments_per_student?: number;
    post_approval_required: boolean;
    comment_approval_required: boolean;
    show_authors: boolean;
    show_posts_in_realtime: boolean;
    show_header: boolean;
    show_posts_count: boolean;
    show_reactions_count: boolean;
    show_comments_count: boolean;
    post_order: 'newest_first' | 'oldest_first' | 'random';
    layout_columns?: number;
    layout_direction?: 'row' | 'column';
    layout_align?: 'start' | 'center' | 'end';
}


export interface Note {
    id: string;
    board_id: string;
    section_id?: string;
    created_at: string;
    content: string;
    author_id: string;
    author_name?: string;
    author_avatar?: string;
    color: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    likes: number;
    is_placeholder?: boolean;
    is_deleted?: boolean;
    is_pinned?: boolean;
    is_watermarked?: boolean;
    image_url?: string;
    video_url?: string;
    attachment_url?: string;
    reactions?: any[];
    comments?: Comment[];
    tags?: string[];
    author_role?: 'teacher' | 'student';
    liked_by?: string[];
}


export interface Grade {
    id: string;
    student_id: string;
    board_id: string;
    score: number;
    feedback?: string;
    created_at: string;
    updated_at: string;
}

export interface Comment {
    id: string;
    note_id: string;
    author_id: string;
    author_name?: string;
    author_avatar?: string;
    content: string;
    created_at: string;
    is_anonymous?: boolean;
}

export interface Profile {
    id: string;
    updated_at: string;
    full_name: string;
    avatar_url: string;
    role: 'teacher' | 'student' | 'admin';
    enrolled_classes?: string[];
    email: string;
    preferences?: UserPreferences;
    grade_level?: string;
}


export interface UserPreferences {
    saved_colors?: string[];
    saved_gradients?: string[];
}

export type AppState = {
    currentBoard: Board | null;
    currentBoardError: PostgrestError | null;
    notes: Note[];
    profile: Profile | null;
}

export interface Class {
    id: string;
    name: string;
    description?: string;
    owner_id: string;
    created_at: string;
    auto_enroll?: boolean;
    position?: number;
}
''