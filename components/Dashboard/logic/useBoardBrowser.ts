
import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { Board, ClassGroup } from '../../../types';
import { classService } from '../../../services/classService';

// Helper for Date Grouping
const getDateCategory = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return "This Week";
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
    isStudent: boolean
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
    const [sortBy, setSortBy] = useState<'created' | 'updated'>('updated');
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    
    const menu = useRef<{ visible: boolean; x: number; y: number; boardId: string | null }>({ visible: false, x: 0, y: 0, boardId: null });
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'soft_delete', id: null });

    useEffect(() => {
        if (isStudent) return; // Students dont need to see the class list in the sidebar
        classService.getClasses().then(setClasses).catch(err => console.error("Failed to load classes", err));
    }, [isStudent]);

    const filteredBoards = useMemo(() => {
        let result = boards.filter(b => !b.isTrashed);

        if (filter.trim()) {
            result = result.filter(b => b.title.toLowerCase().includes(filter.toLowerCase()));
        }

        if (isStudent) {
            // Student View: Only show boards for their class, that are published.
            result = result.filter(b => b.isPublished && (b.targetGrade || 'General') === selectedClass);
        } else {
            // Teacher View
            if (sidebarFilter === 'trashed') {
                result = boards.filter(b => b.isTrashed && b.owner_id === userId);
            } else {
                if (selectedClass && selectedClass !== 'All Classes') {
                    result = result.filter(b => (b.targetGrade || 'General').toLowerCase() === selectedClass.toLowerCase());
                }

                if (sidebarFilter === 'favourites') {
                    result = result.filter(b => b.isFavorite);
                } else if (sidebarFilter === 'made_by_me') {
                    result = result.filter(b => b.owner_id === userId);
                } else if (classes.some(c => c.name === sidebarFilter)) {
                    result = result.filter(b => (b.targetGrade || 'General') === sidebarFilter);
                }
            }
        }

        return result.sort((a, b) => {
            const timeA = sortBy === 'created' ? a.createdAt : (a.updatedAt || a.createdAt);
            const timeB = sortBy === 'created' ? b.createdAt : (b.updatedAt || b.createdAt);
            return timeB - timeA;
        });
    }, [boards, filter, sidebarFilter, userId, sortBy, selectedClass, isStudent, classes]);

    const groupedBoards = useMemo(() => {
        if (filter.trim() || sidebarFilter === 'trashed') return null;

        const getTimestamp = (b: Board) => sortBy === 'updated' ? (b.updatedAt || b.createdAt) : b.createdAt;
        const categories = [...new Set(filteredBoards.map(b => getDateCategory(getTimestamp(b))))];
        
        return categories.map(category => ({
            title: category,
            items: filteredBoards.filter(b => getDateCategory(getTimestamp(b)) === category)
        }));
    }, [filteredBoards, filter, sidebarFilter, sortBy]);

    const handleMenuAction = (action: string, boardId: string) => {
        switch (action) {
            case 'open': onSelectBoard(boardId); break;
            case 'duplicate': onDuplicateBoard(boardId); break;
            case 'delete': setConfirmModal({ isOpen: true, type: 'soft_delete', id: boardId }); break;
            case 'rename': setRenamingId(boardId); break;
            case 'toggleFav': onToggleFavorite(boardId); break;
            case 'copyLink':
                const board = boards.find(b => b.id === boardId);
                if (board) navigator.clipboard.writeText(`${window.location.origin}/?board=${board.customSlug || board.id}`);
                break;
        }
    };
    
    const handleConfirmAction = async () => {
        if(confirmModal.id) onDeleteBoard(confirmModal.id)
        setConfirmModal({ isOpen: false, type: 'soft_delete', id: null });
    };

    return {
        sidebarFilter, setSidebarFilter,
        filter, setFilter,
        sortBy, setSortBy,
        classes,
        renamingId, setRenamingId,
        confirmModal, setConfirmModal,
        filteredBoards,
        groupedBoards,
        handleMenuAction,
        handleConfirmAction,
        menu
    };
};
