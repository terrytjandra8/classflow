
import { supabase } from './supabaseClient';
import { Profile } from '../types';

export interface UserPreferences {
    saved_colors: string[];
    saved_gradients: string[];
}

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
     */
    async getRelevantStudents(): Promise<Profile[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

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
    },

    /**
     * Fetches user preferences (saved colors, gradients, etc.)
     */
    async getPreferences(): Promise<UserPreferences | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', user.id)
            .maybeSingle();

        if (error || !data || !data.preferences) return { saved_colors: [], saved_gradients: [] };
        
        const prefs = data.preferences as any;
        return {
            saved_colors: Array.isArray(prefs.saved_colors) ? prefs.saved_colors : [],
            saved_gradients: Array.isArray(prefs.saved_gradients) ? prefs.saved_gradients : []
        };
    },

    async saveColor(color: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', user.id)
            .maybeSingle();

        const currentPrefs = (profile?.preferences as any) || {};
        const colors = Array.isArray(currentPrefs.saved_colors) ? currentPrefs.saved_colors : [];
        
        if (colors.includes(color)) return;

        await supabase
            .from('profiles')
            .update({ 
                preferences: { 
                    ...currentPrefs, 
                    saved_colors: [...colors, color] 
                } 
            })
            .eq('id', user.id);
    },

    async deleteColor(color: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', user.id)
            .maybeSingle();

        const currentPrefs = (profile?.preferences as any) || {};
        const colors = (Array.isArray(currentPrefs.saved_colors) ? currentPrefs.saved_colors : []).filter((c: string) => c !== color);

        await supabase
            .from('profiles')
            .update({ 
                preferences: { 
                    ...currentPrefs, 
                    saved_colors: colors 
                } 
            })
            .eq('id', user.id);
    },

    async saveGradient(gradient: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', user.id)
            .maybeSingle();

        const currentPrefs = (profile?.preferences as any) || {};
        const gradients = Array.isArray(currentPrefs.saved_gradients) ? currentPrefs.saved_gradients : [];
        
        if (gradients.includes(gradient)) return;

        await supabase
            .from('profiles')
            .update({ 
                preferences: { 
                    ...currentPrefs, 
                    saved_gradients: [...gradients, gradient] 
                } 
            })
            .eq('id', user.id);
    },

    async deleteGradient(gradient: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', user.id)
            .maybeSingle();

        const currentPrefs = (profile?.preferences as any) || {};
        const gradients = (Array.isArray(currentPrefs.saved_gradients) ? currentPrefs.saved_gradients : []).filter((g: string) => g !== gradient);

        await supabase
            .from('profiles')
            .update({ 
                preferences: { 
                    ...currentPrefs, 
                    saved_gradients: gradients 
                } 
            })
            .eq('id', user.id);
    }
};