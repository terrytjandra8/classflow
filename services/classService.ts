
import { supabase } from './supabaseClient';
import { ClassGroup } from '../types';
import { SUPER_ADMIN_EMAIL } from '../components/Dashboard/constants';

export const classService = {
    async getClasses(): Promise<ClassGroup[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('classes')
            .select('id, name, description, position, owner_id, auto_enroll')
            .or(`owner_id.eq.${user.id},owner_id.is.null`)
            .order('position', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });
        
        if (!error && data && data.length > 0) {
            return data.map((d: any) => ({
                ...d,
                autoEnroll: d.auto_enroll
            })) as ClassGroup[];
        }

        return await this.syncClassesFromBoards();
    },

    async getStudentClasses(): Promise<string[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

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
            owner_id: user.id,
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

    async syncClassesFromBoards(): Promise<ClassGroup[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: boards } = await supabase
            .from('boards')
            .select('target_grade')
            .eq('owner_id', user.id)
            .not('target_grade', 'is', null)
            .neq('target_grade', 'General'); 

        if (!boards) return [];

        const distinctNames = [...new Set(boards.map((b: any) => b.target_grade).filter(Boolean))];
        if (distinctNames.length === 0) return [];

        const payload = distinctNames.map((name, index) => ({
            name: String(name),
            position: index,
            owner_id: user.id,
            auto_enroll: true
        }));

        const { data, error } = await supabase
            .from('classes')
            .upsert(payload, { onConflict: 'name', ignoreDuplicates: true })
            .select();

        if (error || !data) {
            return distinctNames.map((name, i) => ({ 
                id: `temp-${i}`, 
                name: String(name), 
                position: i,
                autoEnroll: true
            }));
        }

        return data.map((d: any) => ({ ...d, autoEnroll: d.auto_enroll })) as ClassGroup[];
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

        if (error) console.error("Error persisting order:", error);
    }
};