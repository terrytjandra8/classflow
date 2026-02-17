
import { supabase } from './supabaseClient';
import { Database } from '../types/db';
import { SUPER_ADMIN_EMAIL } from '../components/Dashboard/constants';

export const adminService = {
    // Optimized fetch with Role-Based Access Control and Scoping
    async fetchStats(scope: 'my_classes' | 'global' = 'my_classes') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Case insensitive check
        const isSuperAdmin = user.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.trim().toLowerCase();
        
        // Determine if we should fetch EVERYTHING (Global View) or just MY STUFF (Teacher View)
        // Only Super Admin can request global scope
        const fetchGlobal = isSuperAdmin && scope === 'global';

        // 1. Fetch Classes
        let classesQuery = supabase.from('classes').select('*').order('name');
        
        if (!fetchGlobal) {
            // "My Classes" Scope: Matches sidebar logic (Owned + Legacy/Unowned)
            classesQuery = classesQuery.or(`owner_id.eq.${user.id},owner_id.is.null`);
        }
        
        const classesRes = await classesQuery;
        
        // Create a Set of class names visible to this teacher for efficient student filtering
        const visibleClassNames = new Set((classesRes.data || []).map((c: any) => c.name.trim().toLowerCase()));
        
        // 2. Fetch Boards (Only IDs needed for filtering grades/notes)
        let boardsQuery = supabase.from('boards').select('id, owner_id');
        
        if (!fetchGlobal) {
            // "My Classes" Scope: Only boards I own
            boardsQuery = boardsQuery.eq('owner_id', user.id);
        }
        
        const boardsRes = await boardsQuery;
        const visibleBoardIds = (boardsRes.data || []).map(b => b.id);

        // 3. Fetch Grades (STRICT ISOLATION)
        let gradesQuery = supabase.from('grades').select('*');
        
        if (!fetchGlobal) {
            if (visibleBoardIds.length > 0) {
                gradesQuery = gradesQuery.in('board_id', visibleBoardIds);
            } else {
                // Return empty set if no boards owned
                gradesQuery = gradesQuery.eq('id', '00000000-0000-0000-0000-000000000000'); 
            }
        }
        const gradesRes = await gradesQuery;

        // 4. Fetch Profiles
        // We fetch ALL profiles initially because filtering by JSON array (enrolled_classes) in Supabase is tricky/limited
        // We will filter in memory below.
        const profilesRes = await supabase.from('profiles').select('*').order('full_name');

        // 5. Fetch Activity (Notes) - Lightweight
        let activityQuery = supabase.from('notes').select('author_id, content, board_id');
        
        if (!fetchGlobal) {
            if (visibleBoardIds.length > 0) {
                activityQuery = activityQuery.in('board_id', visibleBoardIds);
            } else {
                activityQuery = activityQuery.eq('id', '00000000-0000-0000-0000-000000000000'); 
            }
        }
        const activityRes = await activityQuery;

        if (classesRes.error) throw classesRes.error;
        if (profilesRes.error) throw profilesRes.error;
        if (gradesRes.error) throw gradesRes.error;
        if (activityRes.error) throw activityRes.error;
        if (boardsRes.error) throw boardsRes.error;

        // --- Data Processing ---

        const students = (profilesRes.data || []).map((p: any) => ({
            ...p,
            enrolled_classes: (Array.isArray(p.enrolled_classes) ? p.enrolled_classes : [])
                .map((c: any) => typeof c === 'string' ? c.trim() : '')
                .filter((c: string) => c.length > 0),
            role: (p.role || 'student').toLowerCase().trim()
        })).filter(s => {
            // Visibility Logic:
            
            // 1. If fetching global (System Dashboard), show everyone
            if (fetchGlobal) return true;

            // 2. If viewing "My Classes", show SELF
            if (s.id === user.id) return true; 
            
            // 3. Hide other Teachers in "My Classes" view
            if (s.role === 'teacher') return false; 
            
            // 4. Show Students ENROLLED in visible classes
            const studentClasses = s.enrolled_classes || [];
            const isEnrolled = studentClasses.some((cls: string) => visibleClassNames.has(cls.trim().toLowerCase()));
            
            return isEnrolled;
        });

        // Process Activity Stats & Storage
        const engagementStats: Record<string, number> = {};
        const storageStats: Record<string, { bytes: number; items: number; boards: number }> = {};

        (activityRes.data || []).forEach((n: { author_id: string | null; content: string | null }) => {
            if (n.author_id) {
                engagementStats[n.author_id] = (engagementStats[n.author_id] || 0) + 1;

                if (!storageStats[n.author_id]) storageStats[n.author_id] = { bytes: 0, items: 0, boards: 0 };
                let size = n.content ? n.content.length : 0;
                size += 1024; 
                storageStats[n.author_id].bytes += size;
                storageStats[n.author_id].items += 1;
            }
        });

        (boardsRes.data || []).forEach((b: { owner_id: string }) => {
            if (b.owner_id) {
                if (!storageStats[b.owner_id]) storageStats[b.owner_id] = { bytes: 0, items: 0, boards: 0 };
                storageStats[b.owner_id].bytes += 2048;
                storageStats[b.owner_id].boards += 1;
            }
        });

        return {
            classes: (classesRes.data || []).map((c: any) => ({ ...c, autoEnroll: c.auto_enroll })),
            students: students,
            grades: gradesRes.data || [],
            engagementStats,
            storageStats,
            isSuperAdmin,
            userId: user.id // Return ID for strict ownership checks
        };
    },

    async updateGrade(studentId: string, boardId: string, score: number | null) {
        if (score === null) {
             await supabase.from('grades').upsert({
                student_id: studentId,
                board_id: boardId,
                score: null
            }, { onConflict: 'student_id, board_id' });
        } else {
            await supabase.from('grades').upsert({
                student_id: studentId,
                board_id: boardId,
                score: score
            }, { onConflict: 'student_id, board_id' });
        }
    },

    async addClass(name: string, autoEnroll: boolean) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user");

        // Insert with owner_id
        const { data, error } = await supabase.from('classes').insert([{ 
            name: name.trim(),
            owner_id: user.id,
            auto_enroll: autoEnroll
        }]).select().single();
        
        if (error) throw error;
        return { ...data, autoEnroll: data.auto_enroll };
    },

    async deleteClass(id: string) {
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) throw error;
    },

    async updateClass(id: string, name: string, autoEnroll: boolean) {
        const { error } = await supabase.from('classes').update({ name: name.trim(), auto_enroll: autoEnroll }).eq('id', id);
        if (error) throw error;
    },

    async updateProfile(id: string, updates: { role?: string; enrolled_classes?: string[] }) {
        const { error } = await supabase.from('profiles').update(updates).eq('id', id);
        if (error) throw error;
    },

    // --- RECOVERY TOOLS ---

    async mergeUsers(oldUserId: string, newUserId: string) {
        const { error } = await supabase.rpc('merge_users', { old_user_id: oldUserId, new_user_id: newUserId });
        if (error) throw error;
    },

    async getFullBackup() {
        const [boards, notes, profiles, classes, grades] = await Promise.all([
            supabase.from('boards').select('*'),
            supabase.from('notes').select('*'),
            supabase.from('profiles').select('*'),
            supabase.from('classes').select('*'),
            supabase.from('grades').select('*')
        ]);

        return {
            timestamp: new Date().toISOString(),
            boards: boards.data || [],
            notes: notes.data || [],
            profiles: profiles.data || [],
            classes: classes.data || [],
            grades: grades.data || []
        };
    },

    async restoreBackup(data: any) {
        if (data.classes?.length) await supabase.from('classes').upsert(data.classes, { onConflict: 'id' });
        if (data.profiles?.length) await supabase.from('profiles').upsert(data.profiles, { onConflict: 'id' });
        
        if (data.boards?.length) await supabase.from('boards').upsert(data.boards, { onConflict: 'id' });
        
        if (data.notes?.length) {
            const batchSize = 100;
            for (let i = 0; i < data.notes.length; i += batchSize) {
                await supabase.from('notes').upsert(data.notes.slice(i, i + batchSize), { onConflict: 'id' });
            }
        }
        if (data.grades?.length) {
             const batchSize = 200;
             for (let i = 0; i < data.grades.length; i += batchSize) {
                await supabase.from('grades').upsert(data.grades.slice(i, i + batchSize), { onConflict: 'student_id, board_id' });
             }
        }
    }
};
