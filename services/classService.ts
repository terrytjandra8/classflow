
import { supabase } from './supabaseClient';
import { ClassGroup } from '../types';

export const classService = {
    /**
     * Fetches the classes visible to the current user.
     * For teachers, this returns classes they own.
     * For superadmins, this should return all classes (handled by RLS).
     */
    async getClasses(): Promise<ClassGroup[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log("getClasses: No user found, returning empty array.");
            return [];
        }

        // The query is now simplified. It just asks for 'classes'.
        // RLS policies on the server will ensure the right data is returned
        // based on the user's role (teacher or superadmin).
        const { data, error } = await supabase
            .from('classes')
            .select('id, name, description, position, owner_id, auto_enroll')
            .order('position', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });
        
        if (error) {
            console.error("Error fetching classes:", error.message);
            return []; // Return empty on error
        }

        if (!data) {
            console.log("getClasses: No data returned from query, returning empty array.");
            return [];
        }

        return data.map((d: any) => ({
            ...d,
            autoEnroll: d.auto_enroll
        })) as ClassGroup[];
    },

    async getStudentClasses(): Promise<string[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // This assumes a `student_classes` table or view, which is more secure.
        const { data, error } = await supabase
            .from('student_classes')
            .select('class_name')
            .eq('student_id', user.id);

        if (error || !data) {
            console.error("Error fetching student classes:", error);
            return [];
        }

        return data.map(item => item.class_name);
    },

    async getClassByName(name: string): Promise<ClassGroup | null> {
        const { data, error } = await supabase
            .from('classes')
            .select('id, name, auto_enroll')
            .eq('name', name.trim())
            .single();
        
        if (data && !error) {
            return {
                id: data.id,
                name: data.name,
                autoEnroll: data.auto_enroll
            };
        }
        return null;
    },

    async createClass(name: string): Promise<ClassGroup | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase.from('classes').insert([{ 
            name: name.trim(),
            owner_id: user.id, // Owner is set to the creator
            auto_enroll: true
        }]).select().single();
        
        if (error) {
            console.error("Error creating class:", error);
            return null;
        }
        return { ...data, autoEnroll: data.auto_enroll };
    },

    async deleteClass(id: string): Promise<boolean> {
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) {
            console.error("Error deleting class:", error);
            return false;
        }
        return true;
    },

    // This sync function is complex and can cause issues. 
    // It's better to manage classes directly. 
    // I am removing it from the primary getClasses flow.
    // If you need this functionality, it should be a separate, explicit action.
    async syncClassesFromBoards(): Promise<ClassGroup[]> {
        console.warn("syncClassesFromBoards is not recommended for primary data fetching.");
        return [];
    },

    async reorderClasses(items: ClassGroup[]) {
        const validItems = items.filter(i => !i.id.startsWith('temp-'));
        if (validItems.length === 0) return;

        const updates = validItems.map((item, index) => ({
            id: item.id,
            position: index,
            name: item.name
        }));

        const { error } = await supabase
            .from('classes')
            .upsert(updates, { onConflict: 'id' });

        if (error) console.error("Error persisting class order:", error);
    }
};
