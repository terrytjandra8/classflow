import React, { createContext, useContext } from 'react';
import { Board, Note } from '../../types';

export interface BoardContextType {
    board: Board;
    notes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    userId?: string;
    username: string; // Added username
    userRole: string;
    isStudent: boolean;
    canManageBoard: boolean;
    isLoadingNotes: boolean;
    updateBoard: (updates: Partial<Board>) => void;
    deleteNote: (id: string) => void;
    likeNote: (id: string) => void;
    addComment: (noteId: string, text: string, attachment?: any) => void;
    updateNote: (id: string, updates: Partial<Note>) => void;
    duplicateNote: (note: Note) => void;
    openAddNote: (sectionId?: string | { x: number; y: number }) => void;
    
    // NEW: Trigger edit mode in the centralized modal
    openEditNote: (note: Note) => void;

    goBack: () => void;
    openSettings: () => void;
    openShare: () => void;
    openBoardAnalysis: () => void; // Kept as no-op or remove if fully cleaning, stub for now
    isSimulating: boolean;
    toggleSimulation: () => void;
    isSimulatingStudent: boolean;
    toggleStudentSimulation: () => void;
    isAiLoading: boolean;
    summarize: () => void;
    summarizeSection?: (sectionId: string) => void;
    backgroundStyle: React.CSSProperties;
    fontClass: string;
    userAvatar: string | null;
    onlineUsers?: any[];
    typingUsers: string[]; // List of names currently typing
    setTypingStatus: (isTyping: boolean) => void; // Function to broadcast typing state
    classList?: string[];
    
    // Filters for embedding
    sectionIdFilter?: string;
    embeddedMode?: boolean;
    
    // Presentation & Section Management
    isPresentationMode?: boolean;
    launchProjectorMode: () => void;
    toggleSectionLock: (sectionId: string) => void;
    toggleSectionContentBlur: (sectionId: string) => void; // Blurs Note Content
    toggleSectionVisibility: (sectionId: string) => void;  // Hides Column
    toggleSectionAnonymous: (sectionId: string) => void;
    toggleSectionComments: (sectionId: string) => void;
    toggleSectionReplies: (sectionId: string) => void;
    toggleSectionRearrange: (sectionId: string) => void;

    // Highlighting
    highlightedUserId: string | null;
    setHighlightedUserId: (id: string | null) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider: React.FC<{ value: BoardContextType; children: React.ReactNode }> = ({ value, children }) => {
    return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export const useBoard = () => {
    const context = useContext(BoardContext);
    if (!context) {
        throw new Error("useBoard must be used within a BoardProvider");
    }
    return context;
};