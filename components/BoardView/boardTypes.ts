import React from 'react';
import { Board, Note, ClassGroup } from '../../types';

export interface BoardProps {
    board: Board;
    notes: Note[];
    setNotes?: React.Dispatch<React.SetStateAction<Note[]>>;
    onBack: () => void;
    onUpdateBoard: (updates: Partial<Board>) => void;
    onOpenSettings: () => void;
    onOpenShare: () => void;
    onOpenAddNote: (config?: string | { x?: number; y?: number; sectionId?: string; relativeId?: string; position?: 'before' | 'after' }) => void;
    onDeleteNote: (id: string) => void;
    onLikeNote: (id: string) => void;
    onAddComment: (noteId: string, text: string, attachment?: any) => void;
    isSimulating: boolean;
    onToggleSimulation: () => void;
    isAiLoading: boolean;
    onSummarize: () => void;
    onSummarizeSection?: (sectionId: string) => void;
    backgroundStyle: React.CSSProperties;
    fontClass: string;
    userAvatar: string | null;
    isStudent?: boolean;
    onUpdateNote?: (id: string, updates: Partial<Note>) => void;
    onDuplicateNote?: (note: Note) => void; 
    onlineUsers?: any[];
    userId?: string;
    classList?: ClassGroup[];
    // New Props for Embedding
    sectionIdFilter?: string;
    embeddedMode?: boolean;
}
