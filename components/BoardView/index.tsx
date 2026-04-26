
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
    const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    // Sync board state
    useEffect(() => { setLiveBoard(initialBoard); }, [initialBoard]);
    useEffect(() => {
        const channel = supabase.channel(`board_meta:${initialBoard.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'boards', filter: `id=eq.${initialBoard.id}` },
                (payload) => { if (payload.new) setLiveBoard(prev => ({ ...prev, ...mapBoard(payload.new as any) })); }
            ).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [initialBoard.id]);

    const isExpired = liveBoard.autoLockTime && Date.now() >= liveBoard.autoLockTime;
    const board = useMemo(() => ({
        ...liveBoard,
        lockMode: (isExpired ? 'readonly' : liveBoard.lockMode) as LockMode
    }), [liveBoard, isExpired]);

    // Data and Actions
    const { notes, setNotes, isLoading: isLoadingNotes, onlineUsers, typingUsers, setTypingStatus } = useBoardData(board, username, userAvatar, userId, userRole);
    const { createNote, updateNote, deleteNote, likeNote, addComment, duplicateNote, incrementViolation } = useNoteActions({
        board, boardId: board.id, userId, username, userAvatar, userRole, setNotes,
        onTouchBoard: () => onUpdateBoard({ updated_at: new Date().toISOString() } as any) 
    });

    // --- REFACTORED LOGIC HOOKS ---
    const { handleViolation } = useViolationTracking({ board, notes, userId, username, isStudent, isSimulatingStudent, updateNote, incrementViolation });
    useBoardSecurity({ board, isStudent, isSimulatingStudent });
    useBoardAutomations({ board, canManageBoard: !isStudent && !isSimulatingStudent && !isPresentationMode, onUpdateBoard });
    const sectionManagement = useSectionManagement({ board, onUpdateBoard });

    const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useBoardInteractions(board, isStudent, isModalOpen, setPendingPasteImage, setIsModalOpen);

    useEffect(() => {
        if (!isPresentationMode && board.guide && !board.guideDismissed) setIsGuideOpen(true);
    }, [board.guide, board.guideDismissed, isPresentationMode]);

    useEffect(() => {
        const fetchClasses = async () => {
            if (!isStudent && !isPresentationMode) {
                try {
                    const classes = await classService.getClasses();
                    setClassList(classes);
                } catch (e) { console.error("Failed to load classes", e); }
            }
        };
        fetchClasses();
    }, [isStudent, isPresentationMode]);

    const canManageBoard = !isStudent && !isSimulatingStudent && !isPresentationMode;

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
            await updateNote(editingNote.id, noteData);
        } else {
            let calculatedCreatedAt: number | undefined = undefined;
            if (typeof addNoteLocation === 'object' && addNoteLocation.relativeId) {
                const targetNote = notes.find(n => n.id === addNoteLocation.relativeId);
                if (targetNote) {
                    const isNewestFirst = board.sortOrder !== 'date_asc';
                    const epsilon = 100; 
                    calculatedCreatedAt = targetNote.createdAt + (addNoteLocation.position === 'before' ? (isNewestFirst ? epsilon : -epsilon) : (isNewestFirst ? -epsilon : epsilon));
                }
            }
            await createNote({ ...noteData, sectionId: typeof addNoteLocation === 'string' ? addNoteLocation : (addNoteLocation?.sectionId || undefined), x: typeof addNoteLocation === 'object' ? addNoteLocation.x : undefined, y: typeof addNoteLocation === 'object' ? addNoteLocation.y : undefined, createdAt: calculatedCreatedAt });
        }
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
        isAiLoading: false, summarize: () => {}, backgroundStyle, fontClass, userAvatar, onlineUsers, typingUsers, setTypingStatus, isPresentationMode, classList, launchProjectorMode,
        ...sectionManagement, highlightedUserId, setHighlightedUserId
    }), [
        board, sortedNotes, userId, username, userRole, isStudent, isSimulatingStudent, canManageBoard, isLoadingNotes,
        onUpdateBoard, deleteNote, likeNote, addComment, updateNote, duplicateNote, openAddNoteModal, openEditNoteModal, onBack, 
        isSimulating, backgroundStyle, fontClass, userAvatar, onlineUsers, isPresentationMode, classList, launchProjectorMode,
        sectionManagement, highlightedUserId
    ]);

    const renderProtectedContent = (content: React.ReactNode) => {
        const hasWatermarkedSection = board.sections?.some(s => s.isWatermarked);
        const protectionEnabled = (!!board.blockScreenshots || !!hasWatermarkedSection) && (isStudent || isSimulatingStudent);
        return (
            <ScreenshotGuard blockScreenshots={protectionEnabled} studentName={username} onViolation={handleViolation} boardId={board.id}>
                {content}
            </ScreenshotGuard>
        );
    };

    // Shared Components and Overlays
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

    // Board Formats
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
