
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { notificationService, SystemNotification } from '../services/notificationService';

export const useNotifications = (isSuperAdmin: boolean) => {
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!isSuperAdmin) return;
        setLoading(true);
        try {
            const data = await notificationService.getNotifications(10);
            const count = await notificationService.getUnreadCount();
            setNotifications(data);
            setUnreadCount(count);
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setLoading(false);
        }
    }, [isSuperAdmin]);

    // Initial Fetch & Realtime Subscription
    useEffect(() => {
        if (!isSuperAdmin) return;

        fetchNotifications();

        // Subscribe to changes
        const channel = supabase.channel('notification-center')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const newNotif = payload.new as SystemNotification;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isSuperAdmin, fetchNotifications]);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await notificationService.markAsRead(id);
    };

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        await notificationService.markAllAsRead();
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllRead,
        refresh: fetchNotifications
    };
};
