
import { supabase } from './supabaseClient';
import { Board } from '../types';
import { Database } from '../types/db';
import { mapBoard } from '../utils/mappers';

type BoardRow = Database['public']['Tables']['boards']['Row'];
type BoardInsert = Database['public']['Tables']['boards']['Insert'];

export const boardService = {
    async getBoards() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

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
        const settings: any = {
            sections: board.sections || [],
            lock_mode: board.lock_mode || 'unlocked',
            auto_lock_time: board.auto_lock_time || null,
            auto_live_time: board.auto_live_time || null,
            comments_enabled: board.comments_enabled ?? true,
            reactions_enabled: board.reactions_enabled ?? true,
            wallpaper: board.wallpaper,
            color_scheme: board.color_scheme,
            font: board.font,
            recipe_id: board.recipe_id,
            recipe_status: board.recipe_status,
            icon: board.icon,
            guide: board.guide,
            polls: board.polls,
            quiz_questions: board.quiz_questions,
            assessment_questions: board.assessment_questions,
            assessment_state: board.assessment_state,
            assessment_config: board.assessment_config,
            grading_config: board.grading_config
        };

        const payload: BoardInsert = {
            title: board.title || 'Untitled Board',
            description: board.description,
            owner_id: userId,
            format: board.format || 'wall',
            wallpaper: board.wallpaper,
            class_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            settings: settings,
            target_grade: board.target_grade || 'General',
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

        const dbColumns = [
            'title', 'description', 'topic', 'format', 'class_code', 'wallpaper', 
            'is_published', 'is_public', 'is_favorite', 'target_grade', 'subject', 'grading_type',
            'steps', 'current_step_index'
        ];

        const dbUpdates: any = {};
        const settingsUpdates: any = { ...currentSettings };

        Object.entries(updates).forEach(([key, value]) => {
            if (dbColumns.includes(key)) {
                dbUpdates[key] = value;
            } else {
                settingsUpdates[key] = value;
            }
        });

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

    async repairAssessmentData(boardId: string) {
        console.log("Starting repair for board:", boardId);
        const { data: notes } = await supabase.from('notes').select('*').eq('board_id', boardId);
        if (!notes) return 0;

        let fixedCount = 0;

        for (const note of notes) {
            let needsUpdate = false;
            let newType = note.type;

            let conn: any = {};
            if (typeof note.connections === 'string') {
                try { conn = JSON.parse(note.connections); } catch {}
            } else if (note.connections) {
                conn = note.connections;
            }

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
