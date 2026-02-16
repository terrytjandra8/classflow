import { supabase } from './supabaseClient';
import { Database } from '../types/db';
import { SUPER_ADMIN_EMAIL } from '../components/Dashboard/constants';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    role: 'student' | 'teacher';
    enrolled_classes: string[];
}

export interface UserPreferences {
    saved_colors?: string[];
    saved_gradients?: string[];
}

const mapProfile = (row: ProfileRow): UserProfile => ({
    id: row.id,
    email: row.email || '',
    full_name: row.full_name || 'Unknown',
    avatar_url: row.avatar_url || '',
    role: (row.role as 'student' | 'teacher') || 'student',
    enrolled_classes: row.enrolled_classes || [],
});

export const profileService = {
    async getCurrentProfile(): Promise<UserProfile | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role, enrolled_classes, email')
            .eq('id', user.id)
            .single();

        const isSuperAdmin = user.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.trim().toLowerCase();

        if (data) {
            if (isSuperAdmin && data.role !== 'teacher') {
                await supabase.from('profiles').update({ role: 'teacher' }).eq('id', user.id);
                data.role = 'teacher';
            }
            return mapProfile(data as ProfileRow);
        }
        
        if (user) {
            const metaName = user.user_metadata.full_name || user.email?.split('@')[0];
            const metaAvatar = user.user_metadata.avatar_url;
            const role = isSuperAdmin ? 'teacher' : 'student';
            
            const newProfile: ProfileRow = {
                id: user.id,
                email: user.email!,
                full_name: metaName,
                avatar_url: metaAvatar,
                role: role,
                created_at: new Date().toISOString(),
                enrolled_classes: [],
                preferences: {},
                updated_at: new Date().toISOString(),
            };
            
            const { error: insertError } = await supabase.from('profiles').upsert(newProfile);
            
            if (insertError) {
                console.error("Failed to create user profile. Please check RLS policies.", insertError);
            }
            
            return mapProfile(newProfile);
        }
        
        return null;
    },

    async updateClasses(userId: string, classes: string[]) {
        const { error } = await supabase
            .from('profiles')
            .update({ enrolled_classes: classes })
            .eq('id', userId);
        if (error) throw error;
    },

    async getPreferences(): Promise<UserPreferences> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return {};

        const { data } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', user.id)
            .single();
        
        return (data?.preferences as UserPreferences) || {};
    },

    async saveColor(color: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const prefs = await this.getPreferences();
        const currentColors = prefs.saved_colors || [];
        
        if (!currentColors.includes(color)) {
            const newPrefs = { ...prefs, saved_colors: [...currentColors, color] };
            await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', user.id);
        }
    },

    async deleteColor(color: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const prefs = await this.getPreferences();
        const newColors = (prefs.saved_colors || []).filter(c => c !== color);
        const newPrefs = { ...prefs, saved_colors: newColors };
        
        await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', user.id);
    },

    async saveGradient(gradient: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const prefs = await this.getPreferences();
        const currentGradients = prefs.saved_gradients || [];
        
        if (!currentGradients.includes(gradient)) {
            const newPrefs = { ...prefs, saved_gradients: [...currentGradients, gradient] };
            await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', user.id);
        }
    },

    async deleteGradient(gradient: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const prefs = await this.getPreferences();
        const newGradients = (prefs.saved_gradients || []).filter(g => g !== gradient);
        const newPrefs = { ...prefs, saved_gradients: newGradients };
        
        await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', user.id);
    }
};