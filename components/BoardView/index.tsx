
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Board, Note, LockMode } from '../../types';
import { useBoardData } from './logic/useBoardData';
import { useNoteActions } from '../../hooks/useNoteActions';
import { BoardLayout } from './Board';
import { BoardOverlays } from './BoardOverlays';
import { useBoardInteractions } from './logic/useBoardInteractions';
import { LessonLayout } from './LessonLayout';
import { QuizView } from '../Activities/QuizView';
import { PollView } from '../Activities/PollView';
import { AssessmentManager } from '../Activities/Assessment/AssessmentManager/index';
import { BoardProvider, BoardContextType } from './BoardContext';
import { resolveBackgroundStyle } from '../../utils/theme';
import { classService } from '../../services/classService';
import { ScreenshotGuard } from '../Security/ScreenshotGuard';
import { supabase } from '../../services/supabaseClient';
import { mapBoard } from '../../utils/mappers';

interface BoardViewProps {
    board: Board;
    onBack: () => void;
    onUpdateBoard: (updates: Partial<Board>) => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    username: string;
    userAvatar: string | null;
    userId?: string;
    isStudent: boolean;
    userRole: string;
    isPresentationMode?: boolean;
}

export const BoardView: React.FC<BoardViewProps> = ({ 
    board: initialBoard, onBack, onUpdateBoard, theme, onToggleTheme, username, userAvatar, userId, isStudent, userRole, isPresentationMode
}) => {
    const [liveBoard, setLiveBoard] = useState<Board>(initialBoard);
    const [, setTick] = useState(0);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRecipeSidebarOpen, setIsRecipeSidebarOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [pendingPasteImage, setPendingPasteImage] = useState<File | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isSimulatingStudent, setIsSimulatingStudent] = useState(false);
    const [addNoteLocation, setAddNoteLocation] = useState<any>(null); 
    const [classList, setClassList] = useState<string[]>([]);
    const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);
    
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    useEffect(() => {
        setLiveBoard(initialBoard);
    }, [initialBoard]);

    useEffect(() => {
        const channel = supabase.channel(`board_meta:${initialBoard.id}`)
            .on('postgres_changes',
                { 
                    event: '*',
                    schema: 'public', 
                    table: 'boards', 
                    filter: `id=eq.${initialBoard.id}` 
                },
                (payload) => {
                    if (payload.new) {
                        const updatedBoard = mapBoard(payload.new as any);
                        // Corrected: Trust the mapper and merge the result.
                        setLiveBoard(prev => ({ ...prev, ...updatedBoard }));
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [initialBoard.id]);

    const isExpired = liveBoard.autoLockTime && Date.now() >= liveBoard.autoLockTime;
    
    const board = useMemo(() => ({
        ...liveBoard,
        lockMode: (isExpired ? 'readonly' : liveBoard.lockMode) as LockMode
    }), [liveBoard, isExpired]);

    const { notes, setNotes, isLoading: isLoadingNotes, onlineUsers, typingUsers, setTypingStatus } = useBoardData(board, username, userAvatar, userId, userRole);
    
    const { 
        createNote, updateNote, deleteNote, likeNote, addComment, duplicateNote 
    } = useNoteActions({
        board: board,
        boardId: board.id,
        userId,
        username,
        userAvatar,
        userRole,
        setNotes,
        onTouchBoard: () => onUpdateBoard({ updated_at: new Date().toISOString() } as any) 
    });

    const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useBoardInteractions(
        board, isStudent, isModalOpen, setPendingPasteImage, setIsModalOpen
    );

    useEffect(() => {
        if (!isPresentationMode) {
            if (board.guide && !board.guideDismissed) {
                setIsGuideOpen(true);
            }
        }
    }, [board.guide, board.guideDismissed, isPresentationMode]);

    useEffect(() => {
        const fetchClasses = async () => {
            if (!isStudent && !isPresentationMode) {
                try {
                    const classes = await classService.getClasses();
                    setClassList(classes.map(c => c.name));
                } catch (e) {
                    console.error("Failed to load classes for board header", e);
                }
            }
        };
        fetchClasses();
    }, [isStudent, isPresentationMode]);

    const canManageBoard = !isStudent && !isSimulatingStudent && !isPresentationMode;
    
    useEffect(() => {
        if (!canManageBoard) return;
        
        const hasAutoLock = liveBoard.autoLockTime && liveBoard.lockMode !== 'readonly';
        const hasAutoLive = liveBoard.autoLiveTime && !liveBoard.isPublished;

        if (!hasAutoLock && !hasAutoLive) return;

        const checkTimers = () => {
            const now = Date.now();
            
            if (liveBoard.autoLockTime && liveBoard.lockMode !== 'readonly' && now >= liveBoard.autoLockTime) {
                onUpdateBoard({ lockMode: 'readonly' });
            }

            if (liveBoard.autoLiveTime && !liveBoard.isPublished && now >= liveBoard.autoLiveTime) {
                onUpdateBoard({ isPublished: true, autoLiveTime: null });
            }
        };

        const interval = setInterval(checkTimers, 5000);
        checkTimers();

        return () => clearInterval(interval);
    }, [liveBoard.autoLockTime, liveBoard.autoLiveTime, liveBoard.lockMode, liveBoard.isPublished, canManageBoard, onUpdateBoard]);

    const sortedNotes = useMemo(() => {
        let filtered = notes;
        if (!canManageBoard) {
            filtered = notes.filter(n => {
                if (!n.sectionId) return true;
                const section = board.sections?.find(s => s.id === n.sectionId);
                return !section?.isHidden;
            });
        }

        return [...filtered].sort((a, b) => {
            if (a.isPinned && b.isPinned) return b.createdAt - a.createdAt;
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            if (board.sortOrder === 'date_asc') return a.createdAt - b.createdAt;
            if (board.sortOrder === 'likes') return b.likes - a.likes;
            
            return b.createdAt - a.createdAt;
        });
    }, [notes, board.sortOrder, board.sections, canManageBoard]);

    const backgroundStyle = resolveBackgroundStyle(board.wallpaper, theme);
    const fontClass = board.font === 'serif' ? 'font-serif' : board.font === 'mono' ? 'font-mono' : board.font === 'hand' ? 'font-hand' : 'font-sans';

    const openAddNoteModal = useCallback((location?: string | { x: number; y: number }) => {
        if (isPresentationMode) return;
        setAddNoteLocation(location);
        setPendingPasteImage(null);
        setEditingNote(null); 
        setIsModalOpen(true);
    }, [isPresentationMode]);

    const openEditNoteModal = useCallback((note: Note) => {
        if (isPresentationMode) return;
        setEditingNote(note);
        setIsModalOpen(true);
    }, [isPresentationMode]);

    const handleModalSubmit = async (noteData: any) => {
        if (editingNote) {
            await updateNote(editingNote.id, noteData);
        } else {
            let calculatedCreatedAt: number | undefined = undefined;

            if (typeof addNoteLocation === 'object' && addNoteLocation.relativeId) {
                const targetNote = notes.find(n => n.id === addNoteLocation.relativeId);
                if (targetNote) {
                    const isNewestFirst = board.sortOrder !== 'date_asc';
                    const epsilon = 100; 

                    if (addNoteLocation.position === 'before') {
                        calculatedCreatedAt = targetNote.createdAt + (isNewestFirst ? epsilon : -epsilon);
                    } else {
                        calculatedCreatedAt = targetNote.createdAt + (isNewestFirst ? -epsilon : epsilon);
                    }
                }
            }

            const payload = {
                ...noteData,
                sectionId: typeof addNoteLocation === 'string' 
                    ? addNoteLocation 
                    : (addNoteLocation?.sectionId || undefined), 
                x: typeof addNoteLocation === 'object' ? addNoteLocation.x : undefined,
                y: typeof addNoteLocation === 'object' ? addNoteLocation.y : undefined,
                createdAt: calculatedCreatedAt
            };
            await createNote(payload);
        }
        setIsModalOpe