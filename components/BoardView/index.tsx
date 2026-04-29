
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Board, Note, LockMode, ClassGroup, Profile } from '../../types';
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
import { profileService } from '../../services/profileService';
import { ScreenshotGuard } from '../Security/ScreenshotGuard';
import { UserRules } from '../../utils/userRules';
import { supabase } from '../../services/supabaseClient';
import { mapBoard } from '../../utils/mappers';
import { useHistory } from '../../hooks/useHistory';

// Custom Hooks for Clean Code
import { useViolationTracking } from './logic/useViolationTracking';
import { useBoardSecurity } from './logic/useBoardSecurity';
import { useBoardAutomations } from './logic/useBoardAutomations';
import { useSectionManagement } from './logic/useSectionManagement';

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
    const [students, setStudents] = useState<Profile[]>([]);
    const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isMergeMode, setIsMergeMode] = useState(false);

    // Sync board state
    useEffect(() => { setLiveBoard(initialBoard); }, [initialBoard]);
    useEffect(() => {
        const channel = supabase.channel(`board_meta:${initialBoard.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'boards', filter: `id=eq.${initialBoard.id}` },
                (payload) => { if (payload.new) setLiveBoard(prev => ({ ...prev, ...mapBoard(payload.new as any) })); }
            ).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [initialBoard.id]);

    const isStudentUser = isStudent || isSimulatingStudent;
    const isExpired = liveBoard.autoLockTime && Date.now() >= liveBoard.autoLockTime && isStudentUser;
    
    // Auto-Live logic: if scheduled and in the future, treat as draft for students
    const isWaitingForLive = liveBoard.autoLiveTime && Date.now() < liveBoard.autoLiveTime && isStudentUser;

    const board = useMemo(() => ({
        ...liveBoard,
        lockMode: (isExpired ? 'readonly' : liveBoard.lockMode) as LockMode,
        isPublished: isWaitingForLive ? false : liveBoard.isPublished
    }), [liveBoard, isExpired, isWaitingForLive]);

    // Data and Actions
    const { notes, setNotes, isLoading: isLoadingNotes, onlineUsers, typingUsers, setTypingStatus } = useBoardData(board, username, userAvatar, userId, userRole);
    const { createNote, updateNote, deleteNote, likeNote, addComment, duplicateNote, incrementViolation } = useNoteActions({
        board, boardId: board.id, userId, username, userAvatar, userRole, setNotes,
        onTouchBoard: () => onUpdateBoard({ updated_at: new Date().toISOString() } as any) 
    });

    // History Tracking
    const history = useHistory({ board: liveBoard, notes });
    const isHistoryApplying = useRef(false);

    // Snapshot state when it changes (debounced)
    useEffect(() => {
        if (isHistoryApplying.current) return;
        const timer = setTimeout(() => {
            history.pushState({ board: liveBoard, notes });
        }, 1000);
        return () => clearTimeout(timer);
    }, [liveBoard, notes]);

    const handleUndo = useCallback(async () => {
        const prevState = history.undo();
        if (prevState) {
            isHistoryApplying.current = true;
            setLiveBoard(prevState.board);
            setNotes(prevState.notes);
            onUpdateBoard(prevState.board);
            setTimeout(() => { isHistoryApplying.current = false; }, 1100);
        }
    }, [history, onUpdateBoard, setNotes]);

    const handleRedo = useCallback(async () => {
        const nextState = history.redo();
        if (nextState) {
            isHistoryApplying.current = true;
            setLiveBoard(nextState.board);
            setNotes(nextState.notes);
            onUpdateBoard(nextState.board);
            setTimeout(() => { isHistoryApplying.current = false; }, 1100);
        }
    }, [history, onUpdateBoard, setNotes]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Disable global board undo/redo if any modal or overlay is open
            if (isModalOpen || isSettingsOpen || isShareModalOpen || isRecipeSidebarOpen) return;

            const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable;
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'z') {
                    if (isInput) return;
                    e.preventDefault();
                    if (e.shiftKey) handleRedo();
                    else handleUndo();
                } else if (e.key.toLowerCase() === 'y') {
                    if (isInput) return;
                    e.preventDefault();
                    handleRedo();
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleUndo, handleRedo, isModalOpen, isSettingsOpen, isShareModalOpen, isRecipeSidebarOpen]);


    // --- REFACTORED LOGIC HOOKS ---
    const { handleViolation } = useViolationTracking({ board, notes, setNotes, userId, username, isStudent: isStudent || isSimulatingStudent, isSimulatingStudent, updateNote, incrementViolation });
    useBoardSecurity({ board, isStudent, isSimulatingStudent });
    useBoardAutomations({ board, canManageBoard: !isStudent && !isSimulatingStudent && !isPresentationMode, onUpdateBoard });
    const sectionManagement = useSectionManagement({ board, onUpdateBoard });

    const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useBoardInteractions(board, isStudent, isModalOpen, setPendingPasteImage, setIsModalOpen);

    useEffect(() => {
        if (!isPresentationMode && board.guide && !board.guideDismissed) setIsGuideOpen(true);
    }, [board.guide, board.guideDismissed, isPresentationMode]);

    useEffect(() => {
        const fetchData = async () => {
            if (!isStudent && !isPresentationMode) {
                try {
                    const [classes, studentsList] = await Promise.all([
                        classService.getClasses(),
                        profileService.getRelevantStudents()
                    ]);
                    setClassList(classes);
                    setStudents(studentsList);
                } catch (e) { console.error("Failed to load board management data", e); }
            }
        };
        fetchData();
    }, [isStudent, isPresentationMode]);

    const canManageBoard = !isStudent;

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

    const openAddNoteModal = useCallback((location?: any) => {
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
            updateNote(editingNote.id, noteData);
            setIsModalOpen(false);
            setEditingNote(null);
            return;
        }

        let calculatedCreatedAt: number | undefined = undefined;
        if (typeof addNoteLocation === 'object' && addNoteLocation.relativeId) {
            const targetNote = notes.find(n => n.id === addNoteLocation.relativeId);
            if (targetNote) {
                const isNewestFirst = board.sortOrder !== 'date_asc';
                const epsilon = 100; 
                calculatedCreatedAt = targetNote.createdAt + (addNoteLocation.position === 'before' ? (isNewestFirst ? epsilon : -epsilon) : (isNewestFirst ? -epsilon : epsilon));
            }
        }
        await createNote({ 
            ...noteData, 
            sectionId: typeof addNoteLocation === 'string' ? addNoteLocation : (addNoteLocation?.sectionId || undefined), 
            x: typeof addNoteLocation === 'object' ? addNoteLocation.x : undefined, 
            y: typeof addNoteLocation === 'object' ? addNoteLocation.y : undefined, 
            createdAt: calculatedCreatedAt 
        });
        
        setIsModalOpen(false);
        setEditingNote(null);
    };

    const launchProjectorMode = useCallback(() => {
        const url = `${window.location.origin}/?board=${board.id}&present=true`;
        window.open(url, 'ClassBoardProjector', 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no');
    }, [board.id]);

    const contextValue: BoardContextType = useMemo(() => ({
        board, notes: sortedNotes, setNotes, userId, username, userRole, isStudent: isStudent || isSimulatingStudent, canManageBoard, isLoadingNotes,
        updateBoard: onUpdateBoard, deleteNote, likeNote: (id) => board.reactionsEnabled && likeNote(id), addComment, updateNote, duplicateNote,
        openAddNote: openAddNoteModal, openEditNote: openEditNoteModal, goBack: onBack,
        openSettings: () => setIsSettingsOpen(true), openShare: () => setIsShareModalOpen(true), openBoardAnalysis: () => {}, 
        isSimulating, toggleSimulation: () => setIsSimulating(!isSimulating),
        isSimulatingStudent, toggleStudentSimulation: () => setIsSimulatingStudent(!isSimulatingStudent),
        isAiLoading: false, summarize: () => {}, backgroundStyle, fontClass, userAvatar, onlineUsers, typingUsers, setTypingStatus, isPresentationMode, classList, students, launchProjectorMode,
        ...sectionManagement, highlightedUserId, setHighlightedUserId,
        isMergeMode, setIsMergeMode
    }), [
        board, sortedNotes, userId, username, userRole, isStudent, isSimulatingStudent, canManageBoard, isLoadingNotes,
        onUpdateBoard, deleteNote, likeNote, addComment, updateNote, duplicateNote, openAddNoteModal, openEditNoteModal, onBack, 
        isSimulating, backgroundStyle, fontClass, userAvatar, onlineUsers, isPresentationMode, classList, launchProjectorMode,
        sectionManagement, highlightedUserId, isMergeMode
    ]);

    const renderProtectedContent = (content: React.ReactNode) => {
        const userCtx = {
            userId, userRole, board,
            isStudent, isSimulatingStudent,
        };

        // If user is not protected (teacher/owner, not simulating), skip the guard entirely
        if (!UserRules.shouldRenderSecurityGuard(userCtx)) {
            return <>{content}</>;
        }

        return (
            <ScreenshotGuard 
                blockScreenshots={UserRules.shouldEnableScreenshotProtection(userCtx)} 
                enableFocusGuard={UserRules.shouldEnableFocusGuard(userCtx)}
                studentName={username} 
                onViolation={handleViolation} 
                boardId={board.id} 
            >
                {content}
            </ScreenshotGuard>
        );
    };

    const renderOverlays = () => !isPresentationMode && (
        <BoardOverlays 
            board={board} isStudent={isStudent || isSimulatingStudent} username={username}
            isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}
            isShareModalOpen={isShareModalOpen} setIsShareModalOpen={setIsShareModalOpen}
            isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}
            isRecipeSidebarOpen={isRecipeSidebarOpen} setIsRecipeSidebarOpen={setIsRecipeSidebarOpen}
            isGuideOpen={isGuideOpen} setIsGuideOpen={setIsGuideOpen}
            isDragOver={isDragOver} onUpdateBoard={onUpdateBoard} setNotes={setNotes} onAddNote={handleModalSubmit}
            pendingPasteImage={pendingPasteImage} editingNote={editingNote}
            activeSectionId={typeof addNoteLocation === 'string' ? addNoteLocation : (addNoteLocation as any)?.sectionId}
        />
    );

    const wrapProvider = (content: React.ReactNode) => (
        <BoardProvider value={contextValue}>
            {renderProtectedContent(content)}
        </BoardProvider>
    );

    if (board.format === 'lesson') {
        return wrapProvider(
            <div className="h-screen w-full relative overflow-hidden" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <LessonLayout board={board} isStudent={isStudent || isSimulatingStudent} onUpdateBoard={onUpdateBoard} onBack={onBack} notes={notes} userId={userId} onAddComment={addComment} onDeleteNote={deleteNote} onLikeNote={likeNote} onUpdateNote={updateNote} onDuplicateNote={duplicateNote} onOpenAddNote={openAddNoteModal} onOpenSettings={() => setIsSettingsOpen(true)} onOpenShare={() => setIsShareModalOpen(true)} isPresentationMode={isPresentationMode} />
                {renderOverlays()}
            </div>
        );
    }

    if (board.format === 'quiz') {
        return wrapProvider(
            <div className="h-screen w-full relative overflow-hidden">
                <QuizView board={board} notes={notes} userId={userId} username={username} isStudent={isStudent || isSimulatingStudent} onlineUsers={onlineUsers} onUpdateBoard={onUpdateBoard} onActivity={() => {}} onBack={onBack} onOpenSettings={() => setIsSettingsOpen(true)} onOpenShare={() => setIsShareModalOpen(true)} isPresentationMode={isPresentationMode} classList={classList} />
                {renderOverlays()}
            </div>
        );
    }

    if (board.format === 'poll') {
        return wrapProvider(
            <div className="h-screen w-full relative overflow-hidden">
                <PollView board={board} notes={notes} userId={userId} isStudent={isStudent || isSimulatingStudent} onUpdateBoard={onUpdateBoard} onActivity={() => {}} onBack={onBack} onOpenSettings={() => setIsSettingsOpen(true)} onOpenShare={() => setIsShareModalOpen(true)} isPresentationMode={isPresentationMode} classList={classList} />
                {renderOverlays()}
            </div>
        );
    }

    if (board.format === 'assessment') {
        return wrapProvider(
            <div className="h-screen w-full relative bg-[#111]">
                <AssessmentManager board={board} notes={notes} userId={userId} isStudent={isStudent || isSimulatingStudent} onUpdateBoard={onUpdateBoard} onBack={onBack} onlineUsers={onlineUsers} onOpenSettings={() => setIsSettingsOpen(true)} onOpenShare={() => setIsShareModalOpen(true)} classList={classList} />
                {!isPresentationMode && !isStudent && !isSimulatingStudent && renderOverlays()}
            </div>
        );
    }

    return wrapProvider(
        <div className={`h-screen w-full relative overflow-hidden ${board.disableCopy && (isStudent || isSimulatingStudent) ? 'select-none' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <BoardLayout isPresentationMode={isPresentationMode} />
            {renderOverlays()}
        </div>
    );
};
