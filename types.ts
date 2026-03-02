
export enum NoteColor {
  // --- REDS & PINKS ---
  RED = 'bg-red-200',
  ROSE = 'bg-rose-200',
  BLUSH = 'bg-rose-100', // New
  PINK = 'bg-pink-200',
  FUCHSIA = 'bg-fuchsia-200',
  
  // --- PURPLES ---
  LILAC = 'bg-purple-100', // New
  PURPLE = 'bg-purple-200',
  VIOLET = 'bg-violet-200',
  INDIGO = 'bg-indigo-200',
  PERIWINKLE = 'bg-indigo-100', // New
  
  // --- BLUES ---
  BLUE = 'bg-blue-200',
  ICE = 'bg-blue-100', // New
  SKY = 'bg-sky-200',
  CYAN = 'bg-cyan-200',
  
  // --- GREENS & TEALS ---
  TEAL = 'bg-teal-200',
  EMERALD = 'bg-emerald-200',
  MINT = 'bg-green-100', // New
  GREEN = 'bg-green-200',
  LIME = 'bg-lime-200',
  
  // --- YELLOWS & ORANGES ---
  YELLOW = 'bg-yellow-200',
  CREAM = 'bg-yellow-100', // New
  AMBER = 'bg-amber-200',
  ORANGE = 'bg-orange-200',
  PEACH = 'bg-orange-100', // New
  
  // --- NEUTRALS ---
  STONE = 'bg-stone-200',
  NEUTRAL = 'bg-neutral-200',
  ZINC = 'bg-zinc-200',
  GRAY = 'bg-gray-200',
  SLATE = 'bg-slate-200',
  
  // --- SPECIAL ---
  WHITE = 'bg-white',
  TRANSPARENT = 'bg-transparent'
}

export type NoteType = 'text' | 'image' | 'drawing' | 'link' | 'exit_ticket' | 'quiz_answer' | 'vote' | 'assessment_submission';

export interface CommentAttachment {
  type: 'image' | 'link' | 'drawing';
  content: string;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorId?: string;
  authorRole?: string;
  authorAvatar?: string;
  createdAt: number;
  likes: number;
  likedBy?: string[];
  attachment?: CommentAttachment;
  replies?: Comment[];
}

export interface Note {
  id: string;
  board_id?: string;
  title?: string;
  content: string;
  author: string;
  author_id?: string;
  authorRole?: string;
  authorAvatar?: string;
  type: NoteType;
  color: NoteColor;
  x: number;
  y: number;
  width?: number;
  height?: number;
  sectionId?: string;
  attachmentUrl?: string;
  isPinned?: boolean;
  isPlaceholder?: boolean;
  isWatermarked?: boolean; // NEW: Watermark toggle
  likes: number;
  likedBy?: string[];
  comments?: Comment[];
  createdAt: number;
  updatedAt?: number;
  connections?: string[];
  // Assessment Specific
  submissionData?: {
      violations: number; // Number of tab switches
      answers: Record<string, string>; // questionId -> answer
      score?: number;
      graded?: boolean; // If teacher has finalized grading
      released?: boolean; // If results are visible to student
      disqualified?: boolean;
      // Per question grading
      grading?: Record<string, { score: number; feedback: string }>;
  }
}

export type BoardFormat = 'wall' | 'grid' | 'canvas' | 'stream' | 'timeline' | 'columns' | 'map' | 'lesson' | 'quiz' | 'poll' | 'freeform' | 'assessment';
export type LockMode = 'unlocked' | 'readonly' | 'comments_only';

// --- NEW ANALYTICS TYPES ---
export interface LocalizedText {
    en: string;
    id: string;
}

export interface ColumnAnalyticsData {
    summary: LocalizedText;
    sentiment: { positive: number; neutral: number; negative: number };
    themes: { label: LocalizedText; count: number }[];
    misconceptions: LocalizedText[];
    actionable_insight: LocalizedText;
    last_analyzed: number; // Timestamp
}

export interface Section {
  id: string;
  title: string;
  locked?: boolean;
  isContentBlurred?: boolean; 
  isHidden?: boolean;         
  isAnonymous?: boolean;
  commentsEnabled?: boolean; 
  repliesEnabled?: boolean; 
  studentsCanDrag?: boolean; 
  isTitleBlurred?: boolean;
  disableCopy?: boolean; // NEW: Prevent text selection in this column
  analytics?: ColumnAnalyticsData; 
}

export interface PollQuestion {
    id: string;
    question: string;
    type: 'multiple_choice' | 'word_cloud';
    options?: string[];
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    timeLimit: number;
}

// Assessment Question Type
export interface AssessmentQuestion {
    id: string;
    type: 'mcq' | 'essay' | 'section';
    notes?: string;
    text: string;
    options?: string[]; // For MCQ
    correctAnswer?: string; // For MCQ (index or text)
    points: number;
    minWords?: number; // New: For Essays
    allowDrawing?: boolean; // Deprecated: Use responseType
    responseType?: 'text' | 'drawing' | 'both'; // NEW: Granular control
    answerAreaFormat?: 'box' | 'lines' | 'both'; // NEW: For Essay print format
}

export type QuizState = 'setup' | 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'finished';
export type AssessmentState = 'setup' | 'reading' | 'active' | 'closed' | 'practice';

export interface AssessmentConfig {
    durationMinutes: number;
    readingMinutes: number;
    startTime: number | null; // Timestamp when current phase started
    status: AssessmentState;
    autoLockTime?: number | null; // New: Timestamp for auto-locking
    autoLiveTime?: number | null; // New: Timestamp for auto-start
    allowStudentImages?: boolean;
    allowLineInBox?: boolean; // New: Allow horizontal lines inside a bordered box
}

export interface LessonStep {
    id: string;
    type: LessonStepType;
    title: string;
    url?: string;
    content?: string;
    options?: string[];
    boardSettings?: {
        format?: BoardFormat;
        allowPosting?: boolean;
    };
}

export type LessonStepType = 'video' | 'website' | 'image' | 'canva' | 'google_slide' | 'board' | 'canvas' | 'poll';

export interface BoardGuide {
    title: string;
    description: string;
    steps: { text: string; actionLabel?: string; actionIcon?: string }[];
}

export interface GradingConfig {
    mode: 'numeric' | 'binary'; // 'numeric' = 0-Max, 'binary' = Check/Cross
    maxScore: number;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  owner_id: string;
  format: BoardFormat;
  classCode?: string;
  customSlug?: string;
  wallpaper: string;
  
  // Settings
  sections?: Section[];
  lockMode: LockMode;
  autoLockTime?: number | null; // New: Auto-Lock absolute timestamp for regular boards
  autoLiveTime?: number | null; // New: Auto-Live absolute timestamp
  commentsEnabled: boolean;
  repliesEnabled: boolean;
  reactionsEnabled: boolean;
  studentsCanDrag?: boolean;       // For Notes
  studentsCanDragColumns?: boolean; // For Columns
  disablePaste?: boolean;
  allowLinks?: boolean; 
  blurOtherPosts?: boolean;
  blurTeacherPosts?: boolean;
  isAnonymous?: boolean;
  disableCopy?: boolean; // NEW: Global disable text selection
  blockScreenshots?: boolean; // NEW: Watermark & Blur on focus lost
  collaborators?: string[]; // NEW: List of User IDs
  
  // Appearance
  textColor?: string;
  contentTextColor?: string;
  groupTextColor?: string;
  colorScheme?: 'light' | 'dark';
  font?: string;
  postSize?: 'small' | 'medium' | 'large';
  
  // Layout
  sortOrder?: 'manual' | 'date_desc' | 'date_asc' | 'likes';
  newPostPosition?: 'first' | 'last';
  
  // State
  isPublished?: boolean;
  isPublic?: boolean;
  isFavorite?: boolean;
  isTrashed?: boolean;
  deletedAt?: number;
  
  // Metadata
  createdAt: number;
  updatedAt?: number;
  targetGrade?: string;
  subject?: string;
  icon?: string;
  
  // Modules
  polls?: PollQuestion[];
  currentPollIndex?: number;
  
  quizQuestions?: QuizQuestion[];
  quizState?: QuizState;
  currentQuestionIndex?: number;
  quizStartTime?: number;
  showQuestionOnStudentDevice?: boolean;
  
  // Assessment Module
  assessmentQuestions?: AssessmentQuestion[];
  assessmentState?: AssessmentState; // Deprecated, move to config
  assessmentConfig?: AssessmentConfig;

  steps?: LessonStep[];
  currentStepIndex?: number;
  
  recipeId?: string;
  recipeStatus?: 'draft' | 'published';
  
  gradingType?: 'manual' | 'auto';
  gradingConfig?: GradingConfig; // New Config
  
  guide?: BoardGuide;
  guideDismissed?: boolean;
  
  settings?: any; 
}

export interface GeneratedIdea {
    title: string;
    description: string;
    prompt: string;
    type: 'question' | 'debate';
}

export interface AiRecipe {
    id: string;
    label: string;
    icon: any;
    color: string;
    isNew?: boolean;
}

export interface ClassGroup {
    id: string;
    name: string;
    description?: string;
    position?: number;
    owner_id?: string;
    autoEnroll?: boolean;
}
