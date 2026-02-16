import React, { useCallback, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Note, Comment } from '../types';
import { mapNote } from '../utils/mappers';

interface UseNoteActionsProps {
    boardId: string;
    userId?: string;
    username?: string;
    userAvatar?: string | null;
    userRole?: string;
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    onTouchBoard: () => void;
}

type HistoryAction = 
    | { type: 'CREATE_NOTE'; noteId: string }
    | { type: 'DELETE_NOTE'; note: Note }
    | { type: 'UPDATE_NOTE'; noteId: string; previousData: Partial<Note> }
    | { type: 'UPDATE_COMMENT'; noteId: string; previousComments: Comment[] };

export const useNoteActions = ({ 
    boardId, userId, username, userAvatar, userRole, setNotes, onTouchBoard 
}: UseNoteActionsProps) => {

    const historyStack = useRef<HistoryAction[]>([]);

    const updateBoardTimestamp = useCallback(async () => {
        await supabase.from('boards').update({ updated_at: new Date().toISOString() }).eq('id', boardId);
    }, [boardId]);

    const performUndo = useCallback(async () => {
        const lastAction = historyStack.current.pop();
        if (!lastAction) return;

        console.log("Undoing action:", lastAction.type);

        switch (lastAction.type) {
            case 'CREATE_NOTE':
                setNotes(prev => prev.filter(n => n.id !== lastAction.noteId));
                await supabase.from('notes').delete().eq('id', lastAction.noteId);
                break;

            case 'DELETE_NOTE':
                const noteToRestore = lastAction.note;
                const { created_at, ...rest } = noteToRestore;
                
                const payload = {
                    ...rest,
                    created_at: new Date(created_at).toISOString()
                };

                setNotes(prev => [noteToRestore, ...prev]);
                await supabase.from('notes').insert([payload]);
                break;

            case 'UPDATE_NOTE':
                setNotes(prev => prev.map(n => n.id === lastAction.noteId ? { ...n, ...lastAction.previousData } : n));
                
                const dbUpdates: any = { ...lastAction.previousData };
                
                await supabase.from('notes').update(dbUpdates).eq('id', lastAction.noteId);
                break;

            case 'UPDATE_COMMENT':
                setNotes(prev => prev.map(n => n.id === lastAction.noteId ? { ...n, comments: lastAction.previousComments } : n));
                await supabase.from('notes').update({ comments: lastAction.previousComments }).eq('id', lastAction.noteId);
                break;
        }
        
        onTouchBoard();
    }, [setNotes, onTouchBoard]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                const activeTag = document.activeElement?.tagName.toLowerCase();
                if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
                    return;
                }
                
                e.preventDefault();
                performUndo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [performUndo]);

    const createNote = useCallback(async (noteData: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        const finalAuthorId = user?.id || userId;

        const noteToInsert = {
            board_id: boardId,
            content: noteData.content,
            title: noteData.title,
            author_name: noteData.author || username || 'Anonymous',
            author_id: finalAuthorId,
            author_role: userRole || 'student',
            author_avatar: userAvatar,
            type: noteData.type,
            color: noteData.color,
            x: noteData.x || 0,
            y: noteData.y || 0,
            section_id: noteData.sectionId,
            attachment: noteData.attachment,
            likes: 0,
            comments: [],
            liked_by: [],
            created_at: noteData.createdAt ? new Date(noteData.createdAt).toISOString() : new Date().toISOString()
        };

        const { data, error } = await supabase.from('notes').insert([noteToInsert]).select().single();
        
        if (data && !error) {
            const newNote = mapNote(data);
            setNotes(prev => [newNote, ...prev]);
            
            historyStack.current.push({ type: 'CREATE_NOTE', noteId: newNote.id });
            
            onTouchBoard();
            updateBoardTimestamp();
            return newNote;
        } else {
            console.error("Failed to create note:", error);
            return null;
        }
    }, [boardId, username, userAvatar, userRole, setNotes, onTouchBoard, userId, updateBoardTimestamp]);

    const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
        setNotes(currentNotes => {
            const noteToUpdate = currentNotes.find(n => n.id === id); 
            if (noteToUpdate) {
                const previousData: Partial<Note> = {};
                Object.keys(updates).forEach(key => {
                    // @ts-ignore
                    previousData[key] = noteToUpdate[key];
                });
                
                if (updates.comments) previousData.comments = noteToUpdate.comments;

                historyStack.current.push({ 
                    type: updates.comments ? 'UPDATE_COMMENT' : 'UPDATE_NOTE', 
                    noteId: id, 
                    previousData: previousData,
                    previousComments: noteToUpdate.comments || [] 
                } as any);
            }
            return currentNotes.map(n => n.id === id ? { ...n, ...updates } : n);
        });

        const dbUpdates: any = { ...updates };
        
        delete dbUpdates.id;
        delete dbUpdates.isPlaceholder;
        
        if (updates.comments) {
            dbUpdates.comments = updates.comments;
        } else {
            delete dbUpdates.comments;
        }

        const { error } = await supabase.from('notes').update(dbUpdates).eq('id', id);
        if (error) console.error("Error updating note:", error);
        
        onTouchBoard();
        updateBoardTimestamp();
    }, [setNotes, onTouchBoard, updateBoardTimestamp]);

    const deleteNote = useCallback(async (id: string) => {
        setNotes(currentNotes => {
            const noteToDelete = currentNotes.find(n => n.id === id);
            if (noteToDelete) {
                historyStack.current.push({ type: 'DELETE_NOTE', note: noteToDelete });
            }
            return currentNotes.filter(n => n.id !== id);
        });

        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) console.error("Error deleting note:", error);
        
        onTouchBoard();
        updateBoardTimestamp();
    }, [setNotes, onTouchBoard, updateBoardTimestamp]);

    const likeNote = useCallback(async (id: string) => {
        if (!userId) return;

        setNotes(prev => prev.map(n => {
            if (n.id !== id) return n;

            const isLiked = n.liked_by?.includes(userId);
            let newLikes = n.likes;
            let newLikedBy = [...(n.liked_by || [])];

            if (isLiked) {
                newLikes = Math.max(0, newLikes - 1);
                newLikedBy = newLikedBy.filter(uid => uid !== userId);
            } else {
                newLikes = newLikes + 1;
                newLikedBy.push(userId);
            }
            return { ...n, likes: newLikes, liked_by: newLikedBy };
        }));

        const { error } = await supabase.rpc('toggle_like', { target_note_id: id, user_id: userId });
        if (error) console.error("Error toggling like:", error);
        onTouchBoard();
    }, [userId, setNotes, onTouchBoard]);

    const addComment = useCallback(async (noteId: string, text: string, attachment?: any) => {
        const newComment: Comment = {
            id: Math.random().toString(36).substr(2, 9),
            content: text,
            author_name: username || 'Student', 
            author_id: userId, 
            author_role: userRole || 'student', 
            author_avatar: userAvatar || undefined,
            created_at: new Date().toISOString(),
            attachment,
            likes: 0, 
            liked_by: [],
            is_published: true,
        };

        setNotes(prev => {
            const note = prev.find(n => n.id === noteId);
            if (!note) return prev;
            
            historyStack.current.push({ 
                type: 'UPDATE_COMMENT', 
                noteId: noteId, 
                previousComments: note.comments || [] 
            });

            const updatedComments = [...(note.comments || []), newComment];
            
            supabase.from('notes').update({ comments: updatedComments }).eq('id', noteId).then(({ error }) => {
                if(error) console.error("Error adding comment", error);
                onTouchBoard();
                updateBoardTimestamp();
            });

            return prev.map(n => n.id === noteId ? { ...n, comments: updatedComments } : n);
        });

    }, [userId, username, userRole, userAvatar, setNotes, onTouchBoard, updateBoardTimestamp]);

    const duplicateNote = useCallback(async (note: Note) => {
        const { data: { user } } = await supabase.auth.getUser();
        const finalAuthorId = user?.id || userId;
        
        const noteToInsert = {
            board_id: boardId,
            content: note.content,
            title: note.title ? `${note.title} (Copy)` : undefined,
            author_name: username || 'Student',
            author_id: finalAuthorId,
            author_role: userRole || 'student', 
            author_avatar: userAvatar,
            type: note.type,
            color: note.color,
            x: (note.x || 0) + 20,
            y: (note.y || 0) + 20,
            section_id: note.section_id,
            attachment: note.attachment,
            likes: 0,
            comments: [],
            liked_by: [],
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('notes').insert([noteToInsert]).select().single();
        if (data && !error) {
            const newNote = mapNote(data);
            setNotes(prev => [newNote, ...prev]);
            
            historyStack.current.push({ type: 'CREATE_NOTE', noteId: newNote.id });
            
            onTouchBoard();
            updateBoardTimestamp();
        }
    }, [boardId, username, userRole, userAvatar, setNotes, onTouchBoard, userId, updateBoardTimestamp]);

    return {
        createNote,
        updateNote,
        deleteNote,
        likeNote,
        addComment,
        duplicateNote
    };
};
