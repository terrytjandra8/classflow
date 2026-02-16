
import { PostgrestError } from "@supabase/supabase-js";

// Re-introducing all the missing types and fixing casing and properties
// to resolve the widespread build errors.

export type BoardFormat = 'wall' | 'columns' | 'grid' | 'timeline' | 'quiz' | 'poll' | 'map' | 'canvas' | 'freeform' | 'lesson' | 'assessment';
export type LockMode = 'unlocked' | 'posts-only' | 'locked' | 'readonly' | 'comments_only';
export type NoteColor = 'gray' | 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'purple';
export type NoteType = 'text' | 'image' | 'video' | 'link' | 'doodle';
export type UserRole = 'teacher' | 'student' | 'admin';

export interface AiRecipe {
    id: string;
    title: string;
    description: string;
    // other properties...
}

export interface BoardGuide {
    id: string;
    steps: any[];
}

export type LessonStepType = 'slide' | 'poll' | 'quiz' | 'discussion';
export interface LessonStep {
    id: string;
    type: LessonStepType;
    title: string;
    content: string;
    // other properties...
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    timeLimit?: number;
    [key: string]: any;
}

export interface QuizState {
    status: 'lobby' | 'question' | 'leaderboard' | 'finished';
    currentQuestion: number;
    [key: string]: any;
}

export interface PollQuestion {
    id: string;
    question: string;
    options: string[];
    [key: string]: any;
}

export interface AssessmentQuestion {
    id: string;
    type: 'multiple_choice' | 'short_answer' | 'essay';
    question: string;
    options?: string[];
    answer?: string;
    [key: string]: any;
}

export interface AssessmentConfig {
    [key: string]: any;
}

export interface AssessmentState {
    [key: string]: any;
}

export interface Board {
    id: string;
    created_at: string; // Reverting to snake_case as per original schema
    updatedAt?: string;
    title: string;
    description?: string;
    owner_id: string; // Reverting to snake_case
    format: BoardFormat;
    sections?: Section[];
    sectionGroups?: SectionGroup[];
    settings?: BoardSettings;
    wallpaper?: string;
    class_code?: string; // Reverting to snake_case
    is_public?: boolean; // Reverting to snake_case
    is_published?: boolean; // Reverting to snake_case
    target_grade?: string; // Reverting to snake_case
    subject?: string;
    topic?: string;
    grading_type?: 'manual' | 'automatic' | 'none';
    is_favorite?: boolean; // Reverting to snake_case
    lockMode?: LockMode;
    viewMode?: 'presentation' | 'collaboration';
    steps?: LessonStep[];
    current_step_index?: number; // Reverting to snake_case
    notes?: Note[];
    grades?: Grade[];
    isTrashed?: boolean;
    icon?: string;
    sortOrder?: 'manual' | 'date_desc' | 'date_asc' | 'likes';
    newPostPosition?: 'first' | 'last';
    customSlug?: string;
    autoLiveTime?: string;
    autoLockTime?: string;
    colorScheme?: string;
    font?: string;
    textColor?: string;
    contentTextColor?: string;
    groupTextColor?: string;
    commentsEnabled?: boolean;
    reactionsEnabled?: boolean;
    repliesEnabled?: boolean;
    studentsCanDrag?: boolean;
    studentsCanDragColumns?: boolean;
    disablePaste?: boolean;
    allowLinks?: boolean;
    disableCopy?: boolean;
    blockScreenshots?: boolean;
    isAnonymous?: boolean;
    blurOtherPosts?: boolean;
    blurTeacherPosts?: boolean;
    gradingConfig?: any;
    showQuestionOnStudentDevice?: boolean;
    quizState?: QuizState;
    quizQuestions?: QuizQuestion[];
    quizMusic?: string;
    quizStartTime?: number;
    assessmentConfig?: AssessmentConfig;
    assessmentState?: AssessmentState;
    assessmentQuestions?: AssessmentQuestion[];
    guide?: BoardGuide;
    guideDismissed?: boolean;
    collaborators?: any[];
    polls?: PollQuestion[];
    currentPollIndex?: number;
    recipeId?: string;
    recipeStatus?: string;
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
    quizMusic?: string;
    assessmentConfig?: AssessmentConfig;
    lessonLayout?: string;
}

export interface Section {
    id: string;
    title: string;
    is_published?: boolean;
    locked?: boolean;
    isContentBlurred?: boolean;
    isHidden?: boolean;
    isAnonymous?: boolean;
    commentsEnabled?: boolean;
    repliesEnabled?: boolean;
    studentsCanDrag?: boolean;
    disableCopy?: boolean;
    isTitleBlurred?: boolean;
}

export interface SectionGroup {
    id: string;
    title: string;
    span: number;
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
    color: NoteColor | string;
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
    author_role?: UserRole;
    liked_by?: string[];
    title?: string;
    author?: any;
    type?: NoteType;
    x?: number;
    y?: number;
    connections?: any[];
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

export interface CommentAttachment {
    url: string;
    type: 'image' | 'video' | 'file';
    title?: string;
}

export interface Comment {
    id: string;
    note_id: string;
    author_id: string;
    author_name?: string;
    author_avatar?: string;
    content: string;
    text: string;
    created_at: string;
    is_anonymous?: boolean;
    likedBy?: string[];
    replies?: Comment[];
    authorRole?: UserRole;
    author?: any;
    likes?: number;
    attachment?: CommentAttachment;
}

export interface Profile {
    id: string;
    updated_at: string;
    full_name: string;
    avatar_url: string;
    role: UserRole;
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

export interface ClassGroup {
    id: string;
    name: string;
}
export interface Class {
    id: string;
    name: string;
    description?: string;
    owner_id: string;
    created_at: string;
    auto_enroll?: boolean;
    position?: number;
    group?: ClassGroup;
}

export interface ColumnAnalyticsData {
  // Define properties based on usage
}
