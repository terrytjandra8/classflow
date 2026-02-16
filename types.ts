
import { PostgrestError } from "@supabase/supabase-js";

// A comprehensive overhaul of all type definitions to fix the build errors.

export type BoardFormat = 'wall' | 'columns' | 'grid' | 'timeline' | 'quiz' | 'poll' | 'map' | 'canvas' | 'freeform' | 'lesson' | 'assessment' | 'stream';
export type LockMode = 'unlocked' | 'posts-only' | 'locked' | 'readonly' | 'comments_only';
export type NoteColor = 'gray' | 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'purple' | string;
export type NoteType = 'text' | 'image' | 'video' | 'link' | 'doodle' | 'drawing' | 'exit_ticket' | 'quiz_answer' | 'assessment_submission' | 'section';
export type UserRole = 'teacher' | 'student' | 'admin';

export interface AiRecipe {
    id: string;
    title: string;
    description: string;
}

export interface BoardGuide {
    id: string;
    title: string;
    description: string;
    steps: any[];
}

export type LessonStepType = 'slide' | 'poll' | 'quiz' | 'discussion' | 'canva' | 'google_slide' | 'board' | 'canvas' | 'video' | 'image' | 'website';
export interface LessonStep {
    id: string;
    type: LessonStepType;
    title: string;
    content: string;
    options?: any[];
    boardSettings?: any;
    url?: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    timeLimit?: number;
    [key: string]: any;
}

export type QuizState = 'setup' | 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'finished';

export interface PollQuestion {
    id: string;
    question: string;
    options: string[];
    [key: string]: any;
}

export type AssessmentQuestionType = 'multiple_choice' | 'short_answer' | 'essay' | 'section' | 'mcq';
export interface AssessmentQuestion {
    id: string;
    type: AssessmentQuestionType;
    question: string;
    options?: string[];
    answer?: string;
    points?: number;
    minWords?: number;
    correctAnswer?: string;
    [key: string]: any;
}

export interface AssessmentConfig {
     status: AssessmentState;
     startTime: number;
     durationMinutes?: number;
     readingMinutes?: number;
     autoLockTime?: number;
     [key: string]: any;
}

export type AssessmentState = 'setup' | 'reading' | 'inprogress' | 'submitted' | 'finished' | 'grading' | 'active' | 'closed' | 'practice';

export interface Board {
    id: string;
    createdAt: string;
    updatedAt?: string;
    title: string;
    description?: string;
    owner_id: string;
    format: BoardFormat;
    sections?: Section[];
    sectionGroups?: SectionGroup[];
    settings?: BoardSettings;
    wallpaper?: string;
    classCode?: string;
    isPublic?: boolean;
    isPublished?: boolean;
    targetGrade?: string;
    subject?: string;
    topic?: string;
    gradingType?: 'manual' | 'automatic' | 'none';
    isFavorite?: boolean;
    lockMode?: LockMode;
    viewMode?: 'presentation' | 'collaboration';
    steps?: LessonStep[];
    currentStepIndex?: number;
    notes?: Note[];
    grades?: Grade[];
    deletedAt?: Date | null;
    isTrashed?: boolean;
    icon?: string;
    sortOrder?: 'manual' | 'date_desc' | 'date_asc' | 'likes';
    newPostPosition?: 'first' | 'last';
    customSlug?: string;
    autoLiveTime?: number | null;
    autoLockTime?: number | null;
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
    currentQuestionIndex?: number;
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
    allow_posts?: boolean;
    allow_reactions?: boolean;
    allow_comments?: boolean;
    allow_anonymous_posts?: boolean;
    allow_anonymous_comments?: boolean;
    allow_student_pins?: boolean;
    allow_embedding?: boolean;
    default_note_color?: string;
    default_note_font?: string;
    max_posts_per_student?: number;
    max_comments_per_student?: number;
    post_approval_required?: boolean;
    comment_approval_required?: boolean;
    show_authors?: boolean;
    show_posts_in_realtime?: boolean;
    show_header?: boolean;
    show_posts_count?: boolean;
    show_reactions_count?: boolean;
    show_comments_count?: boolean;
    post_order?: 'newest_first' | 'oldest_first' | 'random';
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
    createdAt: string;
    content: string;
    author_id: string;
    author_name?: string;
    author_avatar?: string;
    color: NoteColor;
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
    attachmentUrl?: string;
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
    type: 'image' | 'video' | 'file' | 'drawing' | 'link';
    title?: string;
    content?: any;
}

export interface Comment {
    id: string;
    note_id: string;
    author_id: string;
    author_name?: string;
    author_avatar?: string;
    content: string;
    text: string;
    createdAt: string;
    is_anonymous?: boolean;
    liked_by?: string[];
    replies?: Comment[];
    author_role?: UserRole | string;
    author?: any;
    likes?: number;
    attachment?: CommentAttachment;
}

export interface UserProfile {
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
    profile: UserProfile | null;
}

export interface ClassGroup {
    id: string;
    name: string;
    autoEnroll?: boolean;
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

export interface Participant {
    id: string;
    name: string;
    role: UserRole;
    disqualified: boolean;
    status: 'Submitted' | 'Graded' | 'In Progress' | 'Revising' | 'Ready';
    violations: any;
    hasLowWordCount: any;
    progress: number;
    score: any;
    noteId: string;
    data: any;
    submittedAt: string;
}
