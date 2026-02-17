
import { PostgrestError } from "@supabase/supabase-js";

// A comprehensive overhaul of all type definitions to fix the build errors.

// Enums
export type BoardFormat = 'wall' | 'columns' | 'grid' | 'timeline' | 'quiz' | 'poll' | 'map' | 'canvas' | 'freeform' | 'lesson' | 'assessment' | 'stream';
export type LockMode = 'unlocked' | 'posts-only' | 'locked' | 'readonly' | 'comments_only';
export type NoteColor = 'gray' | 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'purple' | string;
export type NoteType = 'text' | 'image' | 'video' | 'link' | 'doodle' | 'drawing' | 'exit_ticket' | 'quiz_answer' | 'assessment_submission' | 'section';
export type UserRole = 'teacher' | 'student' | 'admin';
export type LessonStepType = 'slide' | 'poll' | 'quiz' | 'discussion' | 'canva' | 'google_slide' | 'board' | 'canvas' | 'video' | 'image' | 'website';
export type AssessmentQuestionType = 'multiple_choice' | 'short_answer' | 'essay' | 'section' | 'mcq';
export type AssessmentState = 'setup' | 'reading' | 'inprogress' | 'submitted' | 'finished' | 'grading' | 'active' | 'closed' | 'practice';
export type QuizState = 'setup' | 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'finished';
export type ViewMode = 'presentation' | 'collaboration';
export type GradingType = 'manual' | 'automatic' | 'none';
export type SortOrder = 'manual' | 'date_desc' | 'date_asc' | 'likes';
export type NewPostPosition = 'first' | 'last';
export type ColorScheme = string;
export type Font = string;
export type RecipeStatus = string;
export type ParticipantStatus = 
  | "Submitted" | "Graded" | "In Progress" | "Revising" | "Ready" 
  | "Disqualified" | "finished" | "offline" | "online" | "disqualified";
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];


// Interfaces
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
    correctAnswer: number;
    timeLimit?: number;
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

export interface Board {
    id: string;
    createdAt: string;
    updatedAt?: string;
    title: string;
    description?: string;
    ownerId: string;
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
    gradingType?: GradingType;
    isFavorite?: boolean;
    lockMode?: LockMode;
    viewMode?: ViewMode;
    steps?: LessonStep[];
    currentStepIndex?: number;
    notes?: Note[];
    grades?: Grade[];
    deletedAt?: Date | null;
    isTrashed?: boolean;
    icon?: string;
    sortOrder?: SortOrder;
    newPostPosition?: NewPostPosition;
    customSlug?: string;
    autoLiveTime?: number | null;
    autoLockTime?: number | null;
    colorScheme?: ColorScheme;
    font?: Font;
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
    isWatermarked?: boolean;
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
    polls?: Poll[];
    currentPollIndex?: number;
    recipeId?: string;
    recipeStatus?: RecipeStatus;
}

export interface BoardSettings {
    allowPosts?: boolean;
    allowReactions?: boolean;
    allowComments?: boolean;
    allowAnonymousPosts?: boolean;
    allowAnonymousComments?: boolean;
    allowStudentPins?: boolean;
    allowEmbedding?: boolean;
    defaultNoteColor?: string;
    defaultNoteFont?: string;
    maxPostsPerStudent?: number;
    maxCommentsPerStudent?: number;
    postApprovalRequired?: boolean;
    commentApprovalRequired?: boolean;
    showAuthors?: boolean;
    showPostsInRealtime?: boolean;
    showHeader?: boolean;
    showPostsCount?: boolean;
    showReactionsCount?: boolean;
    showCommentsCount?: boolean;
    postOrder?: 'newest_first' | 'oldest_first' | 'random';
    layoutColumns?: number;
    layoutDirection?: 'row' | 'column';
    layoutAlign?: 'start' | 'center' | 'end';
    quizMusic?: string;
    assessmentConfig?: AssessmentConfig;
    lessonLayout?: string;
}

export interface Section {
    id: string;
    title: string;
    isPublished?: boolean;
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
    boardId: string;
    sectionId?: string;
    createdAt: string;
    updatedAt?: string;
    content: string;
    authorId: string;
    authorName?: string;
    authorAvatar?: string;
    color: NoteColor;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    likes: number;
    isPlaceholder?: boolean;
    isDeleted?: boolean;
    isPinned?: boolean;
    isWatermarked?: boolean;
    imageUrl?: string;
    videoUrl?: string;
    attachmentUrl?: string;
    reactions?: any[];
    comments?: Comment[];
    tags?: string[];
    authorRole?: UserRole;
    likedBy?: string[];
    title?: string;
    author?: any;
    type?: NoteType;
    x?: number;
    y?: number;
    connections?: any[];
}

export interface Grade {
    id: string;
    studentId: string;
    boardId: string;
    score: number;
    feedback?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CommentAttachment {
    url: string;
    type: 'image' | 'video' | 'file' | 'drawing' | 'link';
    title?: string;
    content?: any;
}

export interface Comment {
    id: string;
    noteId: string;
    authorId: string;
    authorName?: string;
    authorAvatar?: string;
    content: string;
    text: string;
    createdAt: string;
    isAnonymous?: boolean;
    likedBy?: string[];
    replies?: Comment[];
    authorRole?: UserRole | string;
    author?: any;
    likes?: number;
    attachment?: CommentAttachment;
}

export interface Profile {
    id: string;
    updatedAt: string;
    createdAt: string;
    fullName: string;
    avatarUrl: string;
    role: UserRole;
    enrolledClasses?: string[];
    email: string;
    preferences?: UserPreferences;
    gradeLevel?: string;
}

export interface UserPreferences {
    savedColors?: string[];
    savedGradients?: string[];
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
    autoEnroll?: boolean;
}
export interface Class {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    createdAt: string;
    autoEnroll?: boolean;
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
    status: ParticipantStatus;
    violations: any;
    hasLowWordCount: any;
    progress: number;
    score: any;
    noteId: string | null;
    data: any;
    submittedAt: string;
    lastActivity: string;
}

export interface SubmissionData {
    id: string;
    name: string;
    role: UserRole;
    status: ParticipantStatus;
    violations: any[];
    answers: any;
    score: number;
    feedback?: string;
    [key: string]: any;
}

export interface BackupData {
    answers: { [key: string]: string };
    violations: any[];
    timestamp: number;
}

export interface Poll extends PollQuestion {
    // any additional properties for a Poll
}
export interface GradingConfig {
    // any additional properties for a GradingConfig
}
export interface Guide {
    // any additional properties for a Guide
}
