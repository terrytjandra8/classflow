
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
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'boards', 
                    filter: `id=eq.${initialBoard.id}` 
                },
                (payload) => {
                    if (payload.new) {
                        const updatedBoard = mapBoard(payload.new as any);
                        setLiveBoard(updatedBoard);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [initialBoard.id]);

    useEffect(() => {
        const timers = [liveBoard.auto_lock_time, liveBoard.auto_live_time].filter(t => t && t > Date.now()) as number[];
        
        if (timers.length > 0) {
            const nextTime = Math.min(...timers);
            const delay = Math.max(0, nextTime - Date.now()) + 500; 
            
            const timerId = setTimeout(() => {
                setTick(t => t + 1); 
            }, delay);
            
            return () => clearTimeout(timerId);
        }
    }, [liveBoard.auto_lock_time, liveBoard.auto_live_time]);

    const isExpired = liveBoard.auto_lock_time && Date.now() >= liveBoard.auto_lock_time;
    
    const board = useMemo(() => ({
        ...liveBoard,
        lock_mode: (isExpired ? 'readonly' : liveBoard.lockMode) as LockMode
    }), [liveBoard, isExpired]);

    const { notes, setNotes, isLoading: isLoadingNotes, onlineUsers, typingUsers, setTypingStatus } = useBoardData(board, username, userAvatar, userId, userRole);
    
    const { 
        createNote, updateNote, deleteNote, likeNote, addComment, duplicateNote 
    } = useNoteActions({
        boardId: board.id,
        userId,
        username,
        userAvatar,
        userRole,
        setNotes,
        onTouchBoard: () => {} 
    });

    const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useBoardInteractions(
        board, isStudent, isModalOpen, setPendingPasteImage, setIsModalOpen
    );

    useEffect(() => {
        if (!isPresentationMode) {
            if (board.guide && !board.guide_dismissed) {
                setIsGuideOpen(true);
            }
        }
    }, [board.guide, board.guide_dismissed, isPresentationMode]);

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
        
        const hasAutoLock = liveBoard.auto_lock_time && liveBoard.lockMode !== 'readonly';
        const hasAutoLive = liveBoard.auto_live_time && !liveBoard.is_published;

        if (!hasAutoLock && !hasAutoLive) return;

        const checkTimers = () => {
            const now = Date.now();
            
            if (liveBoard.auto_lock_time && liveBoard.lockMode !== 'readonly' && now >= liveBoard.auto_lock_time) {
                onUpdateBoard({ lockMode: 'readonly' });
            }

            if (liveBoard.auto_live_time && !liveBoard.is_published && now >= liveBoard.auto_live_time) {
                onUpdateBoard({ is_published: true, auto_live_time: null });
            }
        };

        const interval = setInterval(checkTimers, 5000);
        checkTimers();

        return () => clearInterval(interval);
    }, [liveBoard.auto_lock_time, liveBoard.auto_live_time, liveBoard.lockMode, liveBoard.is_published, canManageBoard, onUpdateBoard]);

    const sortedNotes = useMemo(() => {
        let filtered = notes;
        if (!canManageBoard) {
            filtered = notes.filter(n => {
                if (!n.section_id) return true;
                const section = board.sections?.find(s => s.id === n.section_id);
                return !section?.isHidden;
            });
        }

        return [...filtered].sort((a, b) => {
            if (a.is_pinned && b.is_pinned) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;

            if (board.sort_order === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (board.sort_order === 'likes') return b.likes - a.likes;
            
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [notes, board.sort_order, board.sections, canManageBoard]);

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
            const payload = {
                ...noteData,
                section_id: typeof addNoteLocation === 'string' 
                    ? addNoteLocation 
                    : (addNoteLocation?.sectionId || undefined), 
                position_x: typeof addNoteLocation === 'object' ? addNoteLocation.x : undefined,
                position_y: typeof addNoteLocation === 'object' ? addNoteLocation.y : undefined,
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

    const getEffectiveSections = useCallback(() => {
        if (board.sections && board.sections.length > 0) return board.sections;
        return [{ 
            id: 'default', 
            title: 'Group 1',
            locked: false,
            is_content_blurred: false,
            is_hidden: false,
            is_anonymous: false,
            comments_enabled: true,
            replies_enabled: true,
            students_can_drag: false
        }];
    }, [board.sections]);

    const toggleSectionLock = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => s.id === sectionId ? { ...s, locked: !s.locked } : s);
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionContentBlur = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, is_content_blurred: !s.is_content_blurred, is_title_blurred: !s.is_content_blurred };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionVisibility = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => s.id === sectionId ? { ...s, is_hidden: !s.is_hidden } : s);
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionAnonymous = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => s.id === sectionId ? { ...s, is_anonymous: !s.is_anonymous } : s);
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionComments = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, comments_enabled: !s.comments_enabled };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionReplies = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, replies_enabled: !s.replies_enabled };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionRearrange = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, students_can_drag: !s.students_can_drag };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const contextValue: BoardContextType = useMemo(() => ({
        board,
        notes: sortedNotes,
        setNotes,
        userId,
        username, 
        isStudent: isStudent || isSimulatingStudent, 
        canManageBoard, 
        isLoadingNotes,
        updateBoard: onUpdateBoard,
        deleteNote,
        likeNote: (id) => board.reactions_enabled && likeNote(id),
        addComment,
        updateNote,
        duplicateNote,
        openAddNote: openAddNoteModal,
        openEditNote: openEditNoteModal,
        goBack: onBack,
        openSettings: () => setIsSettingsOpen(true),
        openShare: () => setIsShareModalOpen(true),
        openBoardAnalysis: () => {}, 
        isSimulatingStudent,
        toggleStudentSimulation: () => setIsSimulatingStudent(!isSimulatingStudent),
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
        setHighlightedUserId
    }), [
        board, sortedNotes, userId, username, isStudent, isSimulatingStudent, canManageBoard, isLoadingNotes,
        onUpdateBoard, deleteNote, likeNote, addComment, updateNote, duplicateNote,
        openAddNoteModal, openEditNoteModal, onBack,
        backgroundStyle, fontClass, userAvatar, onlineUsers, isPresentationMode, classList,
        launchProjectorMode, toggleSectionLock, toggleSectionContentBlur, toggleSectionVisibility, toggleSectionAnonymous,
        toggleSectionComments, toggleSectionReplies, toggleSectionRearrange, typingUsers, setTypingStatus,
        highlightedUserId
    ]);

    const renderProtectedContent = (content: React.ReactNode) => {
        const protectionEnabled = !!board.block_screenshots && (isStudent || isSimulatingStudent);
        
        return (
            <ScreenshotGuard isEnabled={protectionEnabled} username={username}>
                {content}
            </ScreenshotGuard>
        );
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
        board,
        notes,
        userId,
        isStudent: isStudent || isSimulatingStudent,
        onUpdateBoard,
        onBack,
        onlineUsers,
        onOpenSettings: () => setIsSettingsOpen(true),
        onOpenShare: () => setIsShareModalOpen(true),
        isPresentationMode
    };

    return (
        <BoardProvider value={contextValue}>
            {renderProtectedContent(
                <div 
                    className="h-screen w-full relative overflow-hidden" 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
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
