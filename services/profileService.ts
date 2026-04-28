
import { supabase } from './supabaseClient';
import { Profile } from '../types';

export const profileService = {
    /**
     * Fetches the profile of the currently logged-in user.
     */
    async getCurrentProfile(): Promise<any | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (error || !data) {
            console.error("Error fetching current profile:", error);
            return null;
        }

        return {
            ...data,
            fullName: data.full_name,
            avatarUrl: data.avatar_url,
            enrolledClasses: Array.isArray(data.enrolled_classes) ? data.enrolled_classes : [],
            role: (data.role || 'student').toLowerCase()
        };
    },

    /**
     * Fetches students relevant to the current teacher.
     * This uses the same logic as adminService but returns only profiles.
     */
    async getRelevantStudents(): Promise<Profile[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Fetch all profiles. RLS will filter for students the teacher can see.
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name');

        if (error) {
            console.error("Error fetching students:", error);
            return [];
        }

        return (data || []).map((p: any) => ({
            ...p,
            enrolled_classes: Array.isArray(p.enrolled_classes) ? p.enrolled_classes : [],
            role: (p.role || 'student').toLowerCase()
        })).filter(p => p.role === 'student');
    }
};