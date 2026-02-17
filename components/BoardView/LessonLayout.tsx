
import React from 'react';
import { Board, Note } from '../../types';
import { LessonManager } from '../LessonEngine/LessonManager';

interface LessonLayoutProps {
    board: Board;
    isStudent: boolean;
    onUpdateBoard: (updates: Partial<Board>) => void;
    onBack: () => void;
    notes: Note[];
    userId?: string;
    onAddComment: (noteId: string, text: string, attachment?: any) => void;
    onDeleteNote: (id: string) => void;
    onLikeNote: (id: string) => void;
    onUpdateNote: (id: string, updates: Partial<Note>) => void;
    onDuplicateNote: (note: Note) => void;
    onOpenAddNote: (sectionId?: string | { x: number; y: number }) => void;
    onOpenSettings: () => void;
    onOpenShare?: () => void; 
    isPresentationMode?: boolean; // New prop
}

export const LessonLayout: React.FC<LessonLayoutProps> = (props) => {
    return <LessonManager {...props} />;
};
