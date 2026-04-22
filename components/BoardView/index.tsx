
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Board, Note, LockMode, ClassGroup } from '../../types';
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
    const [classList, setClassList] = useState<ClassGroup[]>([]);
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
                    setClassList(classes);
                } catch (e) {
                    console.error("Failed to load classes for board header", e);
                }
            }
        };
        fetchClasses();
    }, [isStudent, isPresentationMode]);

    const canManageBoard = !isStudent && !isSimulatingStudent && !isPresentationMode;
    
    // --- Board-level copy / paste / cut blocking ---
    // Applies to all formats when the board has these settings enabled for students.
    useEffect(() => {
        const isGuarded = isStudent || isSimulatingStudent;
        if (!isGuarded) return;

        const handlers: [string, EventListener][] = [];
        let watchdog: any = null;

        if (board.disableCopy) {
            const blockCopyCut = (e: Event) => { e.preventDefault(); };
            handlers.push(['copy', blockCopyCut as EventListener], ['cut', blockCopyCut as EventListener]);
        }

        if (board.disablePaste) {
            const blockPaste = (e: Event) => { e.preventDefault(); };
            handlers.push(['paste', blockPaste as EventListener]);
        }

        handlers.forEach(([event, handler]) => document.addEventListener(event, handler, true));

        // Anti-bypass: aggressively overwrite the property handlers so even if event listeners 
        // are removed via DevTools, copy/paste remains blocked.
        if (board.disableCopy || board.disablePaste) {
            watchdog = setInterval(() => {
                if (board.disableCopy) {
                    document.oncopy = (e) => { e.preventDefault(); return false; };
                    document.oncut = (e) => { e.preventDefault(); return false; };
                }
                if (board.disablePaste) {
                    document.onpaste = (e) => { e.preventDefault(); return false; };
                }
            }, 1000);
        }

        return () => {
            handlers.forEach(([event, handler]) => document.removeEventListener(event, handler, true));
            if (watchdog) clearInterval(watchdog);
            document.oncopy = null;
            document.oncut = null;
            document.onpaste = null;
        };
    }, [board.disableCopy, board.disablePaste, isStudent, isSimulatingStudent]);

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
            isContentBlurred: false,
            isHidden: false,
            isAnonymous: false,
            commentsEnabled: true,
            repliesEnabled: true,
            studentsCanDrag: false
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
                const current = s.isContentBlurred !== undefined ? s.isContentBlurred : s.isTitleBlurred;
                return { ...s, isContentBlurred: !current, isTitleBlurred: !current };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionVisibility = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => s.id === sectionId ? { ...s, isHidden: !s.isHidden } : s);
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionAnonymous = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => s.id === sectionId ? { ...s, isAnonymous: !s.isAnonymous } : s);
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionComments = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                const currentVal = s.commentsEnabled !== false; 
                return { ...s, commentsEnabled: !currentVal };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionReplies = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                const currentVal = s.repliesEnabled !== false;
                return { ...s, repliesEnabled: !currentVal };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionRearrange = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                const currentVal = s.studentsCanDrag !== undefined ? s.studentsCanDrag : (board.studentsCanDrag ?? false);
                return { ...s, studentsCanDrag: !currentVal };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, board.studentsCanDrag, onUpdateBoard]);

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
        isSimulating,
        toggleSimulation: () => setIsSimulating(!isSimulating),
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
        board, sortedNotes, userId, username, userRole, isStudent, isSimulatingStudent, canManageBoard, isLoadingNotes,
        onUpdateBoard, deleteNote, likeNote, addComment, updateNote, duplicateNote,
        openAddNoteModal, openEditNoteModal, onBack, isSimulating,
        backgroundStyle, fontClass, userAvatar, onlineUsers, isPresentationMode, classList,
        launchProjectorMode, toggleSectionLock, toggleSectionContentBlur, toggleSectionVisibility, toggleSectionAnonymous,
        toggleSectionComments, toggleSectionReplies, toggleSectionRearrange, typingUsers, setTypingStatus,
        highlightedUserId
    ]);

    const renderProtectedContent = (content: React.ReactNode) => {
        const protectionEnabled = !!board.blockScreenshots && (isStudent || isSimulatingStudent) && board.format !== 'quiz';
        
        return (
            <ScreenshotGuard isEnabled={protectionEnabled}>
                {content}
            </ScreenshotGuard>
        );
    };

    if (board.format === 'lesson') {
        return (
            <BoardProvider value={contextValue}>
                {renderProtectedContent(
                    <div 
                        className="h-screen w-full relative overflow-hidden"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                    <LessonLayout 
                        board={board}
                        isStudent={isStudent || isSimulatingStudent}
                        onUpdateBoard={onUpdateBoard}
                        onBack={onBack}
                        notes={notes}
                        userId={userId}
                        onAddComment={addComment}
                        onDeleteNote={deleteNote}
                        onLikeNote={likeNote}
                        onUpdateNote={updateNote}
                        onDuplicateNote={duplicateNote}
                        onOpenAddNote={openAddNoteModal}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenShare={() => setIsShareModalOpen(true)}
                        isPresentationMode={isPresentationMode}
                    />
                    {!isPresentationMode && (
                        <BoardOverlays 
                            board={board} 
                            isStudent={isStudent}
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
                    )}
                    </div>
                )}
            </BoardProvider>
        );
    }

    if (board.format === 'quiz') {
        return (
            <BoardProvider value={contextValue}>
                {renderProtectedContent(
                    <div className="h-screen w-full relative overflow-hidden">
                    <QuizView 
                        board={board}
                        notes={notes}
                        userId={userId}
                        username={username}
                        isStudent={isStudent || isSimulatingStudent}
                        onlineUsers={onlineUsers}
                        onUpdateBoard={onUpdateBoard}
                        onActivity={() => {}} 
                        onBack={onBack}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenShare={() => setIsShareModalOpen(true)}
                        isPresentationMode={isPresentationMode}
                        classList={classList}
                    />
                    {!isPresentationMode && (
                        <BoardOverlays 
                            board={board} 
                            isStudent={isStudent}
                            username={username}
                            isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}
                            isShareModalOpen={isShareModalOpen} setIsShareModalOpen={setIsShareModalOpen}
                            isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}
                            isRecipeSidebarOpen={false} setIsRecipeSidebarOpen={() => {}}
                            isGuideOpen={false} setIsGuideOpen={() => {}}
                            isDragOver={false}
                            onUpdateBoard={onUpdateBoard}
                            setNotes={setNotes}
                            onAddNote={handleModalSubmit}
                            pendingPasteImage={null}
                            editingNote={null}
                        />
                    )}
                    </div>
                )}
            </BoardProvider>
        );
    }

    if (board.format === 'poll') {
        return (
            <BoardProvider value={contextValue}>
                {renderProtectedContent(
                    <div className="h-screen w-full relative overflow-hidden">
                    <PollView 
                        board={board}
                        notes={notes}
                        userId={userId}
                        isStudent={isStudent || isSimulatingStudent}
                        onUpdateBoard={onUpdateBoard}
                        onActivity={() => {}}
                        onBack={onBack}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenShare={() => setIsShareModalOpen(true)}
                        isPresentationMode={isPresentationMode}
                        classList={classList}
                    />
                    {!isPresentationMode && (
                        <BoardOverlays 
                            board={board} 
                            isStudent={isStudent}
                            username={username}
                            isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}
                            isShareModalOpen={isShareModalOpen} setIsShareModalOpen={setIsShareModalOpen}
                            isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}
                            isRecipeSidebarOpen={false} setIsRecipeSidebarOpen={() => {}}
                            isGuideOpen={false} setIsGuideOpen={() => {}}
                            isDragOver={false}
                            onUpdateBoard={onUpdateBoard}
                            setNotes={setNotes}
                            onAddNote={handleModalSubmit}
                            pendingPasteImage={null}
                            editingNote={null}
                        />
                    )}
                    </div>
                )}
            </BoardProvider>
        );
    }

    if (board.format === 'assessment') {
        return (
            <BoardProvider value={contextValue}>
                {renderProtectedContent(
                    <div className="h-screen w-full relative bg-[#111]">
                        <AssessmentManager 
                            board={board}
                            notes={notes}
                            userId={userId}
                            isStudent={isStudent || isSimulatingStudent}
                            onUpdateBoard={onUpdateBoard}
                            onBack={onBack}
                            onlineUsers={onlineUsers}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                            onOpenShare={() => setIsShareModalOpen(true)}
                            classList={classList}
                        />
                        {!isPresentationMode && !isStudent && !isSimulatingStudent && (
                            <BoardOverlays 
                                board={board} 
                                isStudent={isStudent}
                                username={username}
                                isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}
                                isShareModalOpen={isShareModalOpen} setIsShareModalOpen={setIsShareModalOpen}
                                isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}
                                isRecipeSidebarOpen={false} setIsRecipeSidebarOpen={() => {}}
                                isGuideOpen={false} setIsGuideOpen={() => {}}
                                isDragOver={false}
                                onUpdateBoard={onUpdateBoard}
                                setNotes={setNotes}
                                onAddNote={handleModalSubmit}
                                pendingPasteImage={null}
                                editingNote={null}
                            />
                        )}
                    </div>
                )}
            </BoardProvider>
        );
    }

    return (
        <BoardProvider value={contextValue}>
            {renderProtectedContent(
                <div 
                    className={`h-screen w-full relative overflow-hidden ${board.disableCopy && (isStudent || isSimulatingStudent) ? 'select-none' : ''}`} 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >

                    <BoardLayout isPresentationMode={isPresentationMode} />
                    
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
                        activeSectionId={typeof addNoteLocation === 'string' ? addNoteLocation : (addNoteLocation as any)?.sectionId}
                    />
                </div>
            )}
        </BoardProvider>
    );
};
