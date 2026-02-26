
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { Board, ClassGroup } from '../../../types';

// This function remains the same
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
    
    if (weekStart.getTime() === currentWeekStart.getTime()) return "This Week";
    
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    if (weekStart.getTime() === lastWeekStart.getTime()) return "Last Week";
    
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
    isStudent: boolean,
    studentClasses: string[] = []
) => {
    const [sidebarFilter, setSidebarFilterState] = useState<string>(() => {
        const key = isStudent ? 'cb_student_sidebar_filter' : 'cb_teacher_sidebar_filter';
        return localStorage.getItem(key) || (isStudent ? 'my_class' : 'recents');
    });

    const setSidebarFilter = (newFilter: string) => {
        const key = isStudent ? 'cb_student_sidebar_filter' : 'cb_teacher_sidebar_filter';
        setSidebarFilterState(newFilter);
        localStorage.setItem(key, newFilter);
    };

    const [filter, setFilter] = useState('');
    const [sortBy, setSortBy] = useState<'created' | 'updated'>('created');
    
    // --- FIX STARTS HERE ---
    // 1. Derive the classes directly from the boards prop.
    // This ensures the sidebar is always in sync with the main content.
    const classes = useMemo<ClassGroup[]>(() => {
      if (!boards || isStudent) return [];
      
      // Create a list of classes from the 'targetGrade' property of each board.
      const allClasses = boards
        .filter(b => b.targetGrade) // Only consider boards that have a class assigned
        .map(b => ({ 
            // Use the class name as the ID for uniqueness
            id: b.targetGrade!,
            name: b.targetGrade!,
            owner_id: b.owner_id 
        }));
      
      // Filter out duplicate class names to create a unique list.
      const uniqueClasses = Array.from(new Map(allClasses.map(item => [item.name, item])).values());
      
      return uniqueClasses;
    }, [boards, isStudent]);

    // 2. The local state for classes now just mirrors the derived list.
    const [localClasses, setClasses] = useState<ClassGroup[]>(classes);
    useEffect(() => {
        setClasses(classes);
    }, [classes]);
    // --- FIX ENDS HERE ---

    const [menu, setMenu] = useState<{ visible: boolean; x: number; y: number; boardId: string | null }>({ visible: false, x: 0, y: 0, boardId: null });
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [exitingBoardId, setExitingBoardId] = useState<string | null>(null);

    const [confirmModal, setConfirmModal] = useState<{ 
        isOpen: boolean; 
        type: 'soft_delete' | 'hard_delete' | 'empty_trash'; 
        id: string | null; 
    }>({ isOpen: false, type: 'soft_delete', id: null });
    
    const menuRef = useRef<HTMLDivElement>(null);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    // This useEffect is now REMOVED, as we no longer fetch classes separately.
    // useEffect(() => { ... }, [isStudent]);

    const filteredBoards = useMemo(() => {
        let result = boards;

        if (isStudent) {
            const viewableClasses = selectedClass === 'All My Classes' ? studentClasses : [selectedClass];
            result = boards.filter(b => 
                !b.isTrashed && 
                b.isPublished &&
                b.targetGrade && viewableClasses.includes(b.targetGrade)
            );
        } else {
            if (sidebarFilter === 'trashed') {
                result = result.filter(b => b.isTrashed && b.owner_id === userId);
            } else if (sidebarFilter === 'global_trash') {
                result = result.filter(b => b.isTrashed);
            } else if (sidebarFilter === 'all_boards') {
                result = result.filter(b => !b.isTrashed);
            } else {
                result = result.filter(b => !b.isTrashed);
                if (selectedClass && selectedClass !== 'All Classes') {
                    result = result.filter(b => (b.targetGrade || 'General').trim().toLowerCase() === selectedClass.trim().toLowerCase());
                }
                if (sidebarFilter === 'favourites') {
                    result = result.filter(b => b.isFavorite);
                } else if (sidebarFilter === 'made_by_me') {
                    result = result.filter(b => b.owner_id === userId || (b.collaborators && b.collaborators.includes(userId!)));
                } else if (sidebarFilter !== 'recents') {
                     result = result.filter(b => (b.targetGrade || 'General') === sidebarFilter);
                }
            }
        }

        if (filter.trim()) {
            result = result.filter(b => b.title.toLowerCase().includes(filter.toLowerCase()));
        }

        return result.sort((a, b) => {
            const timeA = sortBy === 'created' ? a.createdAt : (a.updatedAt || a.createdAt);
            const timeB = sortBy === 'created' ? b.createdAt : (b.updatedAt || b.createdAt);
            return timeB - timeA;
        });
    }, [boards, filter, sidebarFilter, userId, sortBy, selectedClass, isStudent, studentClasses]);

    const groupedBoards = useMemo(() => {
        if (filter.trim() || ['trashed', 'global_trash', 'all_boards'].includes(sidebarFilter) || isStudent) return null;
        const getTimestamp = (b: Board) => sortBy === 'created' ? b.createdAt : (b.updatedAt || b.createdAt);
        const categories = [...new Set(filteredBoards.map(b => getDateCategory(getTimestamp(b))))];
        return categories.map(category => ({
            title: category,
            items: filteredBoards.filter(b => getDateCategory(getTimestamp(b)) === category)
        }));
    }, [filteredBoards, filter, sidebarFilter, sortBy, isStudent]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenu({ ...menu, visible: false });
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) setIsSortMenuOpen(false);
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
        } else {
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
                await supabase.from('boards').update({ settings: { ...(board.settings || {}), isTrashed: false, deletedAt: null }, updated_at: new Date().toISOString() }).eq('id', id);
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
                if (type === 'soft_delete') onDeleteBoard(id);
                else await supabase.from('boards').delete().eq('id', id);
                setExitingBoardId(null);
            }, 300);
        } else if (type === 'empty_trash') onEmptyTrash();
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleMenuAction = (action: string) => {
        if (!menu.boardId) return;
        const board = boards.find(b => b.id === menu.boardId);
        switch (action) {
            case 'open': onSelectBoard(menu.boardId); break;
            case 'duplicate': onDuplicateBoard(menu.boardId); break;
            case 'delete': openConfirmModal('soft_delete', menu.boardId); break; 
            case 'restore': handleRestore(menu.boardId); break;
            case 'hard_delete': openConfirmModal('hard_delete', menu.boardId); break;
            case 'toggleFav': onToggleFavorite(menu.boardId); break;
            case 'rename': setRenamingId(menu.boardId); break;
            case 'copyLink':
                if (board) navigator.clipboard.writeText(`${window.location.origin}/?board=${board.customSlug || board.id}`);
                break;
        }
        setMenu({ ...menu, visible: false });
    };

    return {
        sidebarFilter, setSidebarFilter, filter, setFilter, sortBy, setSortBy, classes: localClasses, setClasses,
        menu, isSortMenuOpen, setIsSortMenuOpen, renamingId, setRenamingId, exitingBoardId, confirmModal, setConfirmModal,
        menuRef, sortMenuRef, filteredBoards, groupedBoards, handleMenuOpen, handleRestore, 
        openConfirmModal, handleConfirmAction, handleMenuAction
    };
};
