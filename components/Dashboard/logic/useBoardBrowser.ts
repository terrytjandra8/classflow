
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { Board, ClassGroup } from '../../../types';
import { classService } from '../../../services/classService';

// Helper for Date Grouping
const getDateCategory = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    const d = new Date(date); d.setHours(0,0,0,0);
    const n = new Date(now); n.setHours(0,0,0,0);
    
    const diffTime = n.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (86400000));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    
    const day = d.getDay(); 
    const diffToSunday = d.getDate() - day;
    const weekStart = new Date(d);
    weekStart.setDate(diffToSunday);
    
    const currentDay = n.getDay();
    const currentDiffToSunday = n.getDate() - currentDay;
    const currentWeekStart = new Date(n);
    currentWeekStart.setDate(currentDiffToSunday);
    
    if (weekStart.getTime() === currentWeekStart.getTime()) {
        return "This Week";
    }
    
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    if (weekStart.getTime() === lastWeekStart.getTime()) {
        return "Last Week";
    }
    
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('en-US', { month: 'long' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const useBoardBrowser = (
    boards: Board[], 
    userId: string | undefined, 
    onDeleteBoard: (id: string) => void, 
    onEmptyTrash: () => void,
    selectedClass: string,
    onSelectBoard: (id: string) => void,
    onDuplicateBoard: (id: string) => void,
    onToggleFavorite: (id: string) => void,
) => {
    // --- PERSISTENCE: Initialize from LocalStorage ---
    const [sidebarFilter, setSidebarFilterState] = useState<string>(() => {
        return localStorage.getItem('cb_teacher_sidebar_filter') || 'recents';
    });

    const setSidebarFilter = (newFilter: string) => {
        setSidebarFilterState(newFilter);
        localStorage.setItem('cb_teacher_sidebar_filter', newFilter);
    };

    const [filter, setFilter] = useState('');
    const [sortBy, setSortBy] = useState<'created' | 'updated'>('created'); 
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    
    // UI State
    const [menu, setMenu] = useState<{ visible: boolean; x: number; y: number; boardId: string | null }>({ visible: false, x: 0, y: 0, boardId: null });
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [exitingBoardId, setExitingBoardId] = useState<string | null>(null);

    const [confirmModal, setConfirmModal] = useState<{ 
        isOpen: boolean; 
        type: 'soft_delete' | 'hard_delete' | 'empty_trash'; 
        id: string | null; 
    }>({ 
        isOpen: false, 
        type: 'soft_delete', 
        id: null 
    });
    
    const menuRef = useRef<HTMLDivElement>(null);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    // Fetch Classes for Sidebar
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const data = await classService.getClasses();
                setClasses(data);
            } catch (err) {
                console.error("Failed to load classes", err);
            }
        };
        fetchClasses();

        const channel = supabase.channel('classes_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
                fetchClasses();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // Filter Logic
    const filteredBoards = useMemo(() => {
        let result = boards;
        
        // 1. Text Search Filter
        if (filter.trim()) {
            result = result.filter(b => b.title.toLowerCase().includes(filter.toLowerCase()));
        }

        // 2. Sidebar Category Logic
        if (sidebarFilter === 'trashed') {
            // PERSONAL TRASH: Only show boards owned by the user
            result = result.filter(b => b.isTrashed && b.owner_id === userId);
        } 
        else if (sidebarFilter === 'global_trash') {
            // ADMIN TRASH: Show ALL trashed boards
            result = result.filter(b => b.isTrashed);
        }
        else if (sidebarFilter === 'all_boards') {
            // GLOBAL ACTIVE: Show ALL active boards (Admin View)
            result = result.filter(b => !b.isTrashed);
        }
        else {
            // STANDARD VIEWS (Recents, Favorites, Class Filters)
            // Filter out trashed items first
            result = result.filter(b => !b.isTrashed);

            // Apply Class Filter (Top Bar) - Only applies to standard views, not global admin views
            if (selectedClass && selectedClass !== 'All Classes') {
                result = result.filter(b => {
                    const grade = b.targetGrade || 'General';
                    return grade.trim().toLowerCase() === selectedClass.trim().toLowerCase();
                });
            }

            if (sidebarFilter === 'favourites') {
                result = result.filter(b => b.isFavorite); 
            } 
            else if (sidebarFilter === 'made_by_me') {
                if (userId) {
                    result = result.filter(b => b.owner_id === userId || (b.collaborators && b.collaborators.includes(userId)));
                }
            } 
            else if (sidebarFilter === 'recents') {
                if (userId) {
                    result = result.filter(b => b.owner_id === userId || (b.collaborators && b.collaborators.includes(userId)));
                }
            } 
            else {
                // Specific Class Group selected from Sidebar
                if (selectedClass === 'All Classes') {
                     // If top filter is All, filter by the specific sidebar class
                     result = result.filter(b => (b.targetGrade || 'General') === sidebarFilter);
                }
                // If top filter is specific AND sidebar is specific, the intersection happens naturally via the logic above
            }
        }

        // 3. Sort Logic
        result = result.sort((a, b) => {
            const timeA = sortBy === 'created' ? a.createdAt : (a.updatedAt || a.createdAt);
            const timeB = sortBy === 'created' ? b.createdAt : (b.updatedAt || b.createdAt);
            return timeB - timeA;
        });

        return result;
    }, [boards, filter, sidebarFilter, userId, sortBy, selectedClass]);

    // Grouping Logic
    const groupedBoards = useMemo(() => {
        // Disable grouping for Admin views or searches
        if (filter.trim() || sidebarFilter === 'trashed' || sidebarFilter === 'global_trash' || sidebarFilter === 'all_boards') return null;

        const getTimestamp = (b: Board) => sortBy === 'created' ? b.createdAt : (b.updatedAt || b.createdAt);
        const categories = Array.from(new Set(filteredBoards.map(b => getDateCategory(getTimestamp(b)))));
        
        return categories.map(category => ({
            title: category,
            items: filteredBoards.filter(b => getDateCategory(getTimestamp(b)) === category)
        }));
    }, [filteredBoards, filter, sidebarFilter, sortBy]);

    // Menu Logic
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenu({ ...menu, visible: false });
            }
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
                setIsSortMenuOpen(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        window.addEventListener('contextmenu', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('contextmenu', handleClickOutside);
        };
    }, [menu]);

    const handleMenuOpen = (e: React.MouseEvent, boardId: string) => {
        e.stopPropagation();
        
        if (e.type === 'contextmenu') {
            e.preventDefault(); 
            setMenu({ visible: true, x: e.clientX, y: e.clientY, boardId });
        } 
        else {
            const target = e.currentTarget as HTMLElement;
            const rect = target.getBoundingClientRect();
            setMenu({ visible: true, x: rect.right - 150, y: rect.bottom + 5, boardId });
        }
    };

    const handleRestore = async (id: string) => {
        const board = boards.find(b => b.id === id);
        if (board) {
            setExitingBoardId(id);
            setTimeout(async () => {
                const currentSettings = board.settings || {};
                
                // Properly merge settings: preserve existing, just flip trashed flag
                const newSettings = { 
                    ...currentSettings, 
                    isTrashed: false, 
                    deletedAt: null 
                };
                
                // Direct DB update to settings column
                await supabase.from('boards').update({ 
                    settings: newSettings,
                    updated_at: new Date().toISOString()
                }).eq('id', id);

                setExitingBoardId(null);
            }, 300);
        }
        setMenu({ ...menu, visible: false });
    };

    const openConfirmModal = (type: 'soft_delete' | 'hard_delete' | 'empty_trash', id: string | null = null) => {
        setConfirmModal({ isOpen: true, type, id });
        setMenu({ ...menu, visible: false });
    };

    const handleConfirmAction = async () => {
        const { type, id } = confirmModal;
        
        if ((type === 'soft_delete' || type === 'hard_delete') && id) {
            setExitingBoardId(id);
            setTimeout(async () => {
                if (type === 'soft_delete') {
                    onDeleteBoard(id);
                } else {
                    await supabase.from('boards').delete().eq('id', id);
                }
                setExitingBoardId(null);
            }, 300);
        } else if (type === 'empty_trash') {
            onEmptyTrash();
        }
        
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleMenuAction = (action: string) => {
        if (!menu.boardId) return;
        
        switch (action) {
            case 'open': onSelectBoard(menu.boardId); break;
            case 'duplicate': onDuplicateBoard(menu.boardId); break;
            case 'delete': openConfirmModal('soft_delete', menu.boardId); break; 
            case 'restore': handleRestore(menu.boardId); break;
            case 'hard_delete': openConfirmModal('hard_delete', menu.boardId); break;
            case 'toggleFav': onToggleFavorite(menu.boardId); break;
            case 'rename': setRenamingId(menu.boardId); break;
            case 'copyLink':
                const board = boards.find(b => b.id === menu.boardId);
                if (board) {
                    const url = `${window.location.origin}/?board=${board.customSlug || board.id}`;
                    navigator.clipboard.writeText(url);
                }
                break;
        }
        setMenu({ ...menu, visible: false });
    };

    return {
        sidebarFilter, setSidebarFilter,
        filter, setFilter,
        sortBy, setSortBy,
        classes, setClasses,
        menu, setMenu,
        isSortMenuOpen, setIsSortMenuOpen,
        renamingId, setRenamingId,
        exitingBoardId, setExitingBoardId,
        confirmModal, setConfirmModal,
        menuRef, sortMenuRef,
        filteredBoards,
        groupedBoards,
        handleMenuOpen,
        handleRestore,
        openConfirmModal,
        handleConfirmAction,
        handleMenuAction
    };
};
