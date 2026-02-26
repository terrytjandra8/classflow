
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { Note, Board } from '../../../types';
import { mapNote } from '../../../utils/mappers';
import { boardService } from '../../../services/boardService'; // Import the service

export const useBoardData = (board: Board, username?: string, userAvatar?: string | null, userId?: string, userRole?: string) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    
    const [presenceState, setPresenceState] = useState({ status: 'online', isTyping: false });
    
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const notesBufferRef = useRef<Note[]>([]);
    const isThrottleActive = useRef(false);
    const hasPendingUpdates = useRef(false);
    const hasRepaired = useRef(false); // Ref to track if repair has run

    useEffect(() => {
        notesBufferRef.current = notes;
    }, [notes]);

    useEffect(() => {
        let timeoutId: any;
        const goAway = () => setPresenceState(prev => ({ ...prev, status: 'away' }));
        
        const resetTimer = () => {
            if (presenceState.status === 'away') {
                setPresenceState(prev => ({ ...prev, status: 'online' }));
            }
            clearTimeout(timeoutId);
            timeoutId = setTimeout(goAway, 60000); 
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('click', resetTimer);
        resetTimer();

        return () => {
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('click', resetTimer);
            clearTimeout(timeoutId);
        };
    }, [presenceState.status]);

    // Initial Note Fetch & Auto-Repair
    useEffect(() => {
        setIsLoading(true);
        hasRepaired.current = false; // Reset on board change

        const fetchAndRepair = async () => {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('board_id', board.id)
                .order('created_at', { ascending: false }); 
            
            if (error) {
                 if (error.code === '42501') {
                     setPermissionError("Missing 'SELECT' Policy. You cannot see notes.");
                 } else {
                     console.error("Error fetching notes:", error);
                 }
                 setNotes([]); // Clear notes on error
                 notesBufferRef.current = [];
            } else if (data) {
                setPermissionError(null);
                const mapped = data.map(mapNote);
                setNotes(mapped);
                notesBufferRef.current = mapped;

                // --- AUTOMATED REPAIR --- 
                // Run once after initial fetch, if the user can manage the board
                const canManage = userRole === 'teacher' || userRole === 'superadmin';
                if (!hasRepaired.current && canManage) {
                    console.log('Running automatic data repair...');
                    try {
                        await boardService.repairAssessmentData(board.id);
                        hasRepaired.current = true; 
                    } catch (repairError) {
                        console.error('Automatic data repair failed:', repairError);
                    }
                }
            }
            setIsLoading(false);
        };

        fetchAndRepair();
    }, [board.id, userRole]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (hasPendingUpdates.current) {
                setNotes([...notesBufferRef.current]);
                hasPendingUpdates.current = false;
            }
        }, 1000); 

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const channel = supabase.channel(`room:${board.id}`);
        channelRef.current = channel;

        channel
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'notes', filter: `board_id=eq.${board.id}` }, 
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                         try {
                             const freshNote = mapNote(payload.new as any);
                             const currentBuffer = notesBufferRef.current;
                             const idx = currentBuffer.findIndex(n => n.id === freshNote.id);
                             
                             if (idx > -1) {
                                 currentBuffer[idx] = freshNote;
                             } else {
                                 currentBuffer.unshift(freshNote);
                             }
                             hasPendingUpdates.current = true;
                         } catch (e) {
                             console.error("Error processing realtime update", e);
                         }
                    } 
                    else if (payload.eventType === 'DELETE') {
                         notesBufferRef.current = notesBufferRef.current.filter(n => n.id !== payload.old?.id);
                         hasPendingUpdates.current = true;
                    }
                }
            )
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users = Object.values(state).flat() as any[];
                const uniqueUsers = Array.from(new Map(users.map((item) => [item.id || item.user, item])).values());
                setOnlineUsers(uniqueUsers);
                const allTypers = uniqueUsers.filter(u => u.isTyping).map(u => u.user);
                setTypingUsers(allTypers);
            })
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [board.id]); 

    useEffect(() => {
        const channel = channelRef.current;
        if (channel && isConnected && username) {
            channel.track({
                id: userId,
                user: username,
                avatar: userAvatar,
                role: userRole,
                online_at: new Date().toISOString(),
                status: presenceState.status,
                isTyping: presenceState.isTyping
            }).catch(err => console.error("Tracking error:", err));
        }
    }, [isConnected, username, userAvatar, userId, userRole, presenceState]);

    const setTypingStatus = useCallback((isTyping: boolean) => {
        setPresenceState(prev => {
            if (prev.isTyping === isTyping) return prev;
            return { ...prev, isTyping };
        });
    }, []);

    const visibleTypingUsers = typingUsers.filter(u => u !== username);

    return {
        notes,
        setNotes, 
        isLoading,
        isConnected,
        permissionError,
        onlineUsers,
        typingUsers: visibleTypingUsers,
        setTypingStatus
    };
};
