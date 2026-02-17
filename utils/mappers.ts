
import { Database } from '../types/db';
import { Board, Note } from '../types';

type NoteRow = Database['public']['Tables']['notes']['Row'];
type BoardRow = Database['public']['Tables']['boards']['Row'];

// Helper to safely parse JSON whether it comes as a string or object
const safeParse = (input: any, fallback: any) => {
    if (typeof input === 'string') {
        try {
            return JSON.parse(input);
        } catch (e) {
            console.error("Failed to parse JSON field", e);
            return fallback;
        }
    }
    // If it's already an object (Supabase JSONB) or null
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
        gradingConfig: settings.gradingConfig || { mode: 'numeric', maxScore: 100 },
        
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        
        // Spread settings
        sections: settings.sections || [],
        lockMode: settings.lockMode || 'unlocked',
        autoLockTime: settings.autoLockTime || null, // Map autoLockTime
        autoLiveTime: settings.autoLiveTime || null, // Map autoLiveTime
        commentsEnabled: settings.commentsEnabled ?? true,
        repliesEnabled: settings.repliesEnabled ?? true,
        reactionsEnabled: settings.reactionsEnabled ?? true,
        studentsCanDrag: settings.studentsCanDrag ?? false,
        studentsCanDragColumns: settings.studentsCanDragColumns ?? false, 
        disablePaste: settings.disablePaste ?? false,
        allowLinks: settings.allowLinks ?? false,
        
        // Privacy / Engagement
        blurOtherPosts: settings.blurOtherPosts ?? false,
        blurTeacherPosts: settings.blurTeacherPosts ?? false,
        isAnonymous: settings.isAnonymous ?? false,
        
        // Anti-Cheat & Security
        disableCopy: settings.disableCopy ?? false,
        blockScreenshots: settings.blockScreenshots ?? false,
        
        // Collaborators
        collaborators: settings.collaborators || [],
        
        textColor: settings.textColor,
        contentTextColor: settings.contentTextColor,
        groupTextColor: settings.groupTextColor,
        colorScheme: settings.colorScheme || 'light',
        font: settings.font || 'sans',
        postSize: settings.postSize || 'medium',
        
        sortOrder: settings.sortOrder || 'manual',
        newPostPosition: settings.newPostPosition || 'last',
        
        customSlug: settings.customSlug,
        recipeId: settings.recipeId,
        recipeStatus: settings.recipeStatus,
        
        icon: settings.icon,
        guide: settings.guide,
        guideDismissed: settings.guideDismissed,
        
        polls: settings.polls,
        currentPollIndex: settings.currentPollIndex,
        
        quizQuestions: settings.quizQuestions,
        quizState: settings.quizState,
        currentQuestionIndex: settings.currentQuestionIndex,
        quizStartTime: settings.quizStartTime,
        showQuestionOnStudentDevice: settings.showQuestionOnStudentDevice,
        
        // Assessment Mapping
        assessmentQuestions: settings.assessmentQuestions,
        assessmentState: settings.assessmentState,
        assessmentConfig: settings.assessmentConfig,
        
        steps: steps,
        currentStepIndex: row.current_step_index || 0,
        
        isTrashed: settings.isTrashed,
        deletedAt: settings.deletedAt,
        
        settings: settings
    };
};

export const mapNote = (row: NoteRow): Note => ({
    id: row.id,
    board_id: row.board_id,
    title: row.title || undefined,
    content: row.content || '',
    author: row.author || 'Anonymous',
    author_id: row.author_id || undefined,
    authorRole: row.author_role,
    authorAvatar: row.author_avatar || undefined,
    type: (row.type as any) || 'text',
    color: (row.color as any) || 'bg-yellow-200',
    x: row.x,
    y: row.y,
    width: row.width || undefined,
    height: row.height || undefined,
    sectionId: row.section_id || undefined,
    attachmentUrl: row.attachment_url || undefined,
    isPinned: row.is_pinned,
    isPlaceholder: row.is_placeholder,
    isWatermarked: row.is_watermarked, // Mapped here
    likes: row.likes,
    likedBy: row.liked_by || [],
    comments: safeParse(row.comments, []),
    connections: safeParse(row.connections, []),
    createdAt: new Date(row.created_at).getTime()
});

// Helper for Math Parsing (Subscript/Superscript)
// Transforms $Y_{FE}$ to Y<sub>FE</sub> and $X^{2}$ to X<sup>2</sup>
export const parseMath = (text: string) => {
    if (!text) return '';
    let processed = text;
    
    // Subscript: $Base_{Sub}$ or ($Base_{Sub}$)
    processed = processed.replace(/\(?\$([a-zA-Z0-9]+)_\{([a-zA-Z0-9]+)\}\$\)?/g, (_, base, sub) => {
        return `${base}<sub>${sub}</sub>`;
    });

    // Superscript: $Base^{Sup}$ or ($Base^{Sup}$)
    processed = processed.replace(/\(?\$([a-zA-Z0-9]+)\^\{([a-zA-Z0-9]+)\}\$\)?/g, (_, base, sup) => {
        return `${base}<sup>${sup}</sup>`;
    });

    return processed;
};
