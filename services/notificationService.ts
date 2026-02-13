
import { supabase } from './supabaseClient';

export interface SystemNotification {
    id: string;
    type: 'user_signup' | 'system_alert';
    content: {
        userId?: string;
        email?: string;
        name?: string;
        avatar?: string;
        message?: string;
    };
    is_read: boolean;
    created_at: string;
}

export const notificationService = {
    async getNotifications(limit = 20) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data as SystemNotification[];
    },

    async markAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
        
        if (error) throw error;
    },

    async markAllAsRead() {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('is_read', false);
        
        if (error) throw error;
    },

    async getUnreadCount() {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);
        
        if (error) return 0;
        return count || 0;
    }
};
