import { supabase } from './supabaseClient';
import { Database } from '../types/db';
import { SUPER_ADMIN_EMAIL } from '../components/Dashboard/constants';
import { Profile, UserPreferences } from '../types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const mapProfile = (data: any): Profile => {
    return {
      id: data.id,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      gradeLevel: data.grade_level,
      enrolledClasses: data.enrolled_classes || [],
      email: data.email,
      role: data.role,
      preferences: data.preferences,
      updatedAt: data.updated_at,
      createdAt: data.created_at,
    };
};

export const profileService = {
    async getCurrentProfile(): Promise<Profile | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        const isSuperAdmin = user.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.trim().toLowerCase();

        if (data) {
            const profileData: any = data;
            if (isSuperAdmin && profileData.role !== 'teacher') {
                await supabase.from('profiles').update({ role: 'teacher' }).eq('id', user.id);
                profileData.role = 'teacher';
            }
            return mapProfile(profileData);
        }
        
        if (user) {
            const metaName = user.user_metadata.full_name || user.email?.split('@')[0];
            const metaAvatar = user.user_metadata.avatar_url;
            const role = isSuperAdmin ? 'teacher' : 'student';
            
            const newProfile: any = {
                id: user.id,
                email: user.email!,
                full_name: metaName,
                avatar_url: metaAvatar,
                role: role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                enrolled_classes: [],
                preferences: {},
                grade_level: null
            };
            
            const { error: insertError } = await supabase.from('profiles').upsert(newProfile);
            
            if (insertError) {
                console.error("Failed to create user profile. Please check RLS policies.", insertError);
            }
            
            return mapProfile(newProfile);
        }
        
        return null;
    },

    async updateProfile(userId: string, updates: Partial<Profile>) {
        const snakeCaseUpdates: any = {};
        if (updates.fullName) snakeCaseUpdates.full_name = updates.fullName;
        if (updates.avatarUrl) snakeCaseUpdates.avatar_url = updates.avatarUrl;
        if (updates.role) snakeCaseUpdates.role = updates.role;
        if (updates.enrolledClasses) snakeCaseUpdates.enrolled_classes = updates.enrolledClasses;
        if (updates.preferences) snakeCaseUpdates.preferences = updates.preferences;
        if (updates.gradeLevel) snakeCaseUpdates.grade_level = updates.gradeLevel;

        const { error } = await supabase.from('profiles').update(snakeCaseUpdates).eq('id', userId);
        if (error) throw error;
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
        const currentColors = prefs.savedColors || [];
        
        if (!currentColors.includes(color)) {
            const newPrefs = { ...prefs, savedColors: [...currentColors, color] };
            await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', user.id);
        }
    },

    async deleteColor(color: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const prefs = await this.getPreferences();
        const newColors = (prefs.savedColors || []).filter(c => c !== color);
        const newPrefs = { ...prefs, savedColors: newColors };
        
        await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', user.id);
    },

    async saveGradient(gradient: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const prefs = await this.getPreferences();
        const currentGradients = prefs.savedGradients || [];
        
        if (!currentGradients.includes(gradient)) {
            const newPrefs = { ...prefs, savedGradients: [...currentGradients, gradient] };
            await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', user.id);
        }
    },

    async deleteGradient(gradient: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const prefs = await this.getPreferences();
        const newGradients = (prefs.savedGradients || []).filter(g => g !== gradient);
        const newPrefs = { ...prefs, savedGradients: newGradients };
        
        await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', user.id);
    }
};