import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Board, Note, LockMode, Section, BoardFormat, UserRole } from '../../types';
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
    userRole: UserRole | string;
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
                { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${initialBoard.id}` },
                (payload) => {
                    if (payload.new) setLiveBoard(mapBoard(payload.new as any));
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [initialBoard.id]);

    useEffect(() => {
        const timers = [liveBoard.autoLockTime, liveBoard.autoLiveTime].filter(t => t && t > Date.now()) as number[];
        if (timers.length > 0) {
            const nextTime = Math.min(...timers);
            const delay = Math.max(0, nextTime - Date.now()) + 500; 
            const timerId = setTimeout(() => setTick(t => t + 1), delay);
            return () => clearTimeout(timerId);
        }
    }, [liveBoard.autoLockTime, liveBoard.autoLiveTime]);

    const isExpired = liveBoard.autoLockTime != null && Date.now() >= liveBoard.autoLockTime;
    
    const board = useMemo(() => ({
        ...liveBoard,
        lockMode: (isExpired ? 'readonly' : liveBoard.lockMode) as LockMode
    }), [liveBoard, isExpired]);

    const { notes, setNotes, isLoading: isLoadingNotes, onlineUsers, typingUsers, setTypingStatus } = useBoardData(board, username, userAvatar, userId, userRole as UserRole);
    
    const { 
        createNote, updateNote, deleteNote, likeNote, addComment, duplicateNote 
    } = useNoteActions({
        boardId: board.id,
        userId: userId || '',
        username,
        userAvatar: userAvatar || '',
        userRole: userRole as UserRole,
        setNotes,
        onTouchBoard: () => {} 
    });

    const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useBoardInteractions(
        board, isStudent, isModalOpen, setPendingPasteImage, setIsModalOpen
    );

    useEffect(() => {
        if (!isPresentationMode && board.guide && !board.guideDismissed) {
            setIsGuideOpen(true);
        }
    }, [board.guide, board.guideDismissed, isPresentationMode]);

    useEffect(() => {
        const fetchClasses = async () => {
            if (!isStudent && !isPresentationMode) {
                try {
                    const classes = await classService.getClasses();
                    setClassList(classes.map(c => c.name));
                } catch (e) { console.error("Failed to load classes for board header", e); }
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
            if (a.isPinned && b.isPinned) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            if (board.sortOrder === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (board.sortOrder === 'likes') return (b.likes || 0) - (a.likes || 0);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [notes, board.sortOrder, board.sections, canManageBoard]);

    const backgroundStyle = resolveBackgroundStyle(board.wallpaper || 'default', theme);
    const fontClass = board.font || 'font-sans';

    const openAddNoteModal = useCallback((location?: string | { x: number; y: number; sectionId?: string }) => {
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
            const payload = { ...noteData,
                sectionId: typeof addNoteLocation === 'string' ? addNoteLocation : (addNoteLocation?.sectionId || undefined), 
                x: typeof addNoteLocation === 'object' ? addNoteLocation.x : undefined,
                y: typeof addNoteLocation === 'object' ? addNoteLocation.y : undefined,
            };
            await createNote(payload);
        }
        setIsModalOpen(false);
        setEditingNote(null);
    };

    const launchProjectorMode = useCallback(() => {
        const url = `${window.location.origin}/?board=${board.id}&present=true`;
        window.open(url, 'ClassBoardProjector', 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no');
    }, [board.id]);

    const getEffectiveSections = useCallback((): Section[] => {
        if (board.sections && board.sections.length > 0) return board.sections;
        return [{ id: 'default', title: 'Group 1', isPublished: true, locked: false, isContentBlurred: false, isHidden: false, isAnonymous: false, commentsEnabled: true, repliesEnabled: true, studentsCanDrag: false }];
    }, [board.sections]);

    const toggleSectionLock = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        onUpdateBoard({ sections: sections.map(s => s.id === sectionId ? { ...s, locked: !s.locked } : s) });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionContentBlur = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        onUpdateBoard({ sections: sections.map(s => s.id === sectionId ? { ...s, isContentBlurred: !s.isContentBlurred } : s) });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionVisibility = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        onUpdateBoard({ sections: sections.map(s => s.id === sectionId ? { ...s, isHidden: !s.isHidden } : s) });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionAnonymous = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        onUpdateBoard({ sections: sections.map(s => s.id === sectionId ? { ...s, isAnonymous: !s.isAnonymous } : s) });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionComments = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        onUpdateBoard({ sections: sections.map(s => s.id === sectionId ? { ...s, commentsEnabled: !s.commentsEnabled } : s) });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionReplies = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        onUpdateBoard({ sections: sections.map(s => s.id === sectionId ? { ...s, repliesEnabled: !s.repliesEnabled } : s) });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionRearrange = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        onUpdateBoard({ sections: sections.map(s => s.id === sectionId ? { ...s, studentsCanDrag: !s.studentsCanDrag } : s) });
    }, [getEffectiveSections, onUpdateBoard]);

    const contextValue: BoardContextType = useMemo(() => ({
        board,
        notes: sortedNotes,
        setNotes,
        userId,
        username, 
        userRole,
        isStudent: isStudent || isSimulatingStudent, 
        canManageBoard, 
        isLoadingNotes,
        updateBoard: onUpdateBoard,
        deleteNote,
        likeNote: (id) => board.reactionsEnabled && likeNote(id),
        addComment,
        updateNote,
        duplicateNote,
        openAddNote: openAddNoteModal,
        openEditNote: openEditNoteModal,
        goBack: onBack,
        openSettings: () => setIsSettingsOpen(true),
        openShare: () => setIsShareModalOpen(true),
        openBoardAnalysis: () => {}, 
        isSimulating: isSimulatingStudent,
        toggleSimulation: () => setIsSimulatingStudent(!isSimulatingStudent),
        isAiLoading: false,
        summarize: () => {},
        backgroundStyle,
        fontClass,
        userAvatar,
        onlineUsers,
        typingUsers,
        setTypingStatus,
        isPresentationMode,
        classList,
        launchProjectorMode,
        toggleSectionLock,
        toggleSectionContentBlur,
        toggleSectionVisibility,
        toggleSectionAnonymous,
        toggleSectionComments,
        toggleSectionReplies,
        toggleSectionRearrange,
        highlightedUserId,
        setHighlightedUserId,
        isSimulatingStudent: isSimulatingStudent,
        toggleStudentSimulation: () => setIsSimulatingStudent(prev => !prev)
    }), [
        board, sortedNotes, userId, username, userRole, isStudent, isSimulatingStudent, canManageBoard, isLoadingNotes,
        onUpdateBoard, deleteNote, likeNote, addComment, updateNote, duplicateNote,
        openAddNoteModal, openEditNoteModal, onBack,
        backgroundStyle, fontClass, userAvatar, onlineUsers, isPresentationMode, classList, 
        launchProjectorMode, toggleSectionLock, toggleSectionContentBlur, toggleSectionVisibility, toggleSectionAnonymous,
        toggleSectionComments, toggleSectionReplies, toggleSectionRearrange, typingUsers, setTypingStatus,
        highlightedUserId
    ]);

    const renderProtectedContent = (content: React.ReactNode) => {
        const protectionEnabled = !!board.blockScreenshots && (isStudent || isSimulatingStudent);
        return <ScreenshotGuard isEnabled={protectionEnabled} username={username}>{content}</ScreenshotGuard>;
    };

    const ViewComponent = useMemo(() => {
        switch (board.format) {
            case 'lesson': return LessonLayout;
            case 'quiz': return QuizView;
            case 'poll': return PollView;
            case 'assessment': return AssessmentManager;
            default: return BoardLayout;
        }
    }, [board.format]);

    const commonProps = {
        board, notes, userId, isStudent: isStudent || isSimulatingStudent,
        onUpdateBoard, onBack, onlineUsers, onOpenSettings: () => setIsSettingsOpen(true),
        onOpenShare: () => setIsShareModalOpen(true), isPresentationMode
    };

    return (
        <BoardProvider value={contextValue}>
            {renderProtectedContent(
                <div className="h-screen w-full relative overflow-hidden" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                    <ViewComponent {...commonProps} />
                    <BoardOverlays 
                        board={board} 
                        isStudent={isStudent || isSimulatingStudent}
                        username={username}
                        isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}
                        isShareModalOpen={isShareModalOpen} setIsShareModalOpen={setIsShareModalOpen}
                        isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}
                        isRecipeSidebarOpen={isRecipeSidebarOpen} setIsRecipeSidebarOpen={setIsRecipeSidebarOpen}
                        isGuideOpen={isGuideOpen} setIsGuideOpen={setIsGuideOpen}
                        isDragOver={isDragOver}
                        onUpdateBoard={onUpdateBoard}
                        setNotes={setNotes}
                        onAddNote={handleModalSubmit}
                        pendingPasteImage={pendingPasteImage}
                        editingNote={editingNote}
                    />
                </div>
            )}
        </BoardProvider>
    );
};
