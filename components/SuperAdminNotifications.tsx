
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserPlus, X } from 'lucide-react';

interface SuperAdminNotificationsProps {
    isSuperAdmin: boolean;
}

interface Notification {
    id: string;
    userName: string;
    email: string;
    avatarUrl: string | null;
}

export const SuperAdminNotifications: React.FC<SuperAdminNotificationsProps> = ({ isSuperAdmin }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!isSuperAdmin) return;

        console.log("Initializing Super Admin Listener...");

        const channel = supabase.channel('super-admin-alerts')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'profiles' },
                (payload) => {
                    const newUser = payload.new;
                    const id = Math.random().toString(36).substr(2, 9);
                    
                    const newNotification: Notification = {
                        id,
                        userName: newUser.full_name || 'Unknown User',
                        email: newUser.email || 'No Email',
                        avatarUrl: newUser.avatar_url
                    };

                    // Add to list
                    setNotifications((prev) => [...prev, newNotification]);

                    // Play a subtle sound
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.volume = 0.2;
                    audio.play().catch(() => {}); // Ignore play errors (browsers block auto-audio sometimes)

                    // Auto dismiss after 6 seconds
                    setTimeout(() => {
                        removeNotification(id);
                    }, 6000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isSuperAdmin]);

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {notifications.map((n) => (
                <div 
                    key={n.id}
                    className="pointer-events-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-4 w-80 animate-in slide-in-from-right-10 fade-in duration-300 flex items-start gap-4 relative overflow-hidden group"
                >
                    {/* Progress Bar Animation */}
                    <div className="absolute bottom-0 left-0 h-1 bg-green-500 animate-[width_6s_linear_forwards] w-full origin-left" />

                    <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                            {n.avatarUrl ? (
                                <img src={n.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <UserPlus size={20} className="text-white" />
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center">
                            <PlusIcon />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white mb-0.5">New Student Joined!</h4>
                        <p className="text-xs font-bold text-gray-300 truncate">{n.userName}</p>
                        <p className="text-[10px] text-gray-500 truncate">{n.email}</p>
                    </div>

                    <button 
                        onClick={() => removeNotification(n.id)}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

const PlusIcon = () => (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-black">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);
