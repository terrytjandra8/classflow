
import { supabase } from './supabaseClient';
import { Board } from '../types';
import { Database } from '../types/db';
import { mapBoard } from '../utils/mappers';
import { SUPER_ADMIN_EMAIL } from '../components/Dashboard/constants';

type BoardRow = Database['public']['Tables']['boards']['Row'];
type BoardInsert = Database['public']['Tables']['boards']['Insert'];
type BoardUpdate = Database['public']['Tables']['boards']['Update'];

export const boardService = {
    async getBoards() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // RLS policies handle visibility (Owner + Public + Published)
        const { data, error } = await supabase
            .from('boards')
            .select('*')
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        return (data as BoardRow[]).map(mapBoard);
    },

    async getBoardById(id: string) {
        const { data, error } = await supabase
            .from('boards')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) return null;
        return mapBoard(data as BoardRow);
    },

    async createBoard(board: Partial<Board>, userId: string) {
        const isAssessment = board.format === 'assessment';

        const settings: any = {
            sections: board.sections || [],
            lockMode: board.lockMode || 'unlocked',
            autoLockTime: board.autoLockTime || null,
            autoLiveTime: board.autoLiveTime || null,
            commentsEnabled: isAssessment ? false : (board.commentsEnabled ?? true),
            reactionsEnabled: isAssessment ? false : (board.reactionsEnabled ?? true),
            wallpaper: board.wallpaper,
            colorScheme: board.colorScheme,
            font: board.font,
            recipeId: board.recipeId,
            recipeStatus: board.recipeStatus,
            icon: board.icon,
            guide: board.guide,
            // Security Defaults (Global)
            disablePaste: board.disablePaste ?? true, // Default to true for all boards
            blockScreenshots: board.blockScreenshots ?? true, // Default to true for all boards
            // Assessment Specific Security
            disableCopy: board.disableCopy ?? true,
            blurOtherPosts: board.blurOtherPosts ?? true,
            // Interactive Modules
            polls: board.polls,
            quizQuestions: board.quizQuestions,
            // Capture Assessment Data
            assessmentQuestions: board.assessmentQuestions,
            assessmentState: board.assessmentState,
            assessmentConfig: board.assessmentConfig,
            // Capture Grading Config
            gradingConfig: board.gradingConfig
        };


        const payload: BoardInsert = {
            title: board.title || 'Untitled Board',
            description: board.description,
            owner_id: userId,
            format: board.format || 'wall',
            wallpaper: board.wallpaper,
            class_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            settings: settings,
            target_grade: board.targetGrade || 'General',
            steps: board.steps as any,
            current_step_index: 0
        };

        const { data, error } = await supabase
            .from('boards')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return mapBoard(data as BoardRow);
    },

    async updateBoard(id: string, updates: Partial<Board>) {
        const { data: current } = await supabase.from('boards').select('settings').eq('id', id).single();
        const currentSettings = (current?.settings as any) || {};

        // Keys that map directly to DB columns
        const dbColumns = [
            'title', 'description', 'topic', 'format', 'class_code', 'wallpaper', 
            'is_published', 'is_public', 'is_favorite', 'target_grade', 'subject', 'grading_type',
            'steps', 'current_step_index'
        ];

        const dbUpdates: any = {};
        const settingsUpdates: any = { ...currentSettings };

        Object.entries(updates).forEach(([key, value]) => {
            if (key === 'classCode') dbUpdates.class_code = value;
            else if (key === 'isPublished') dbUpdates.is_published = value;
            else if (key === 'isPublic') dbUpdates.is_public = value;
            else if (key === 'isFavorite') dbUpdates.is_favorite = value;
            else if (key === 'targetGrade') dbUpdates.target_grade = value;
            else if (key === 'gradingType') dbUpdates.grading_type = value;
            else if (key === 'currentStepIndex') dbUpdates.current_step_index = value;
            else if (key === 'settings') {
                // CRITICAL FIX: Merge nested settings properly instead of nesting them under 'settings' key
                Object.assign(settingsUpdates, value);
            }
            else if (dbColumns.includes(key)) {
                dbUpdates[key] = value;
            } else {
                // Everything else goes to settings
                settingsUpdates[key] = value;
            }
        });

        // Always update updated_at
        dbUpdates.updated_at = new Date().toISOString();
        dbUpdates.settings = settingsUpdates;

        const { data, error } = await supabase
            .from('boards')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return mapBoard(data as BoardRow);
    },

    // --- REPAIR TOOLS ---
    async repairAssessmentData(boardId: string) {
        console.log("Starting repair for board:", boardId);
        // Fetch all notes
        const { data: notes } = await supabase.from('notes').select('*').eq('board_id', boardId);
        if (!notes) return 0;

        let fixedCount = 0;

        for (const note of notes) {
            let needsUpdate = false;
            let newType = note.type;

            // Safe Parse Connections
            let conn: any = {};
            if (typeof note.connections === 'string') {
                try { conn = JSON.parse(note.connections); } catch {}
            } else if (note.connections) {
                conn = note.connections;
            }

            // Heuristic: If it has answers/score but wrong type
            const hasAssessmentData = conn && (conn.answers || conn.grading || conn.submitted === true || conn.score !== undefined);
            
            if (hasAssessmentData && note.type !== 'assessment_submission') {
                newType = 'assessment_submission';
                needsUpdate = true;
            }

            if (needsUpdate) {
                console.log(`Fixing note ${note.id}: ${note.type} -> ${newType}`);
                await supabase.from('notes').update({ type: newType }).eq('id', note.id);
                fixedCount++;
            }
        }
        
        return fixedCount;
    }
};
