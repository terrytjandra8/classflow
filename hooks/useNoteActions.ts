
import React, { useCallback, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Note, Comment, Board } from '../types';
import { mapNote } from '../utils/mappers';

interface UseNoteActionsProps {
    board: Board;
    boardId: string;
    userId?: string;
    username?: string;
    userAvatar?: string | null;
    userRole?: string;
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    onTouchBoard: () => void;
}

// Action Types for Undo History
type HistoryAction = 
    | { type: 'CREATE_NOTE'; noteId: string }
    | { type: 'DELETE_NOTE'; note: Note }
    | { type: 'UPDATE_NOTE'; noteId: string; previousData: Partial<Note> }
    | { type: 'UPDATE_COMMENT'; noteId: string; previousComments: Comment[] };

export const useNoteActions = ({ 
    board, boardId, userId, username, userAvatar, userRole, setNotes, onTouchBoard 
}: UseNoteActionsProps) => {

    // History Stack for Undo
    const historyStack = useRef<HistoryAction[]>([]);

    const updateBoardTimestamp = useCallback(async () => {
        await supabase.from('boards').update({ updatedAt: new Date().toISOString() }).eq('id', boardId);
    }, [boardId]);

    // --- UNDO LOGIC ---
    const performUndo = useCallback(async () => {
        const lastAction = historyStack.current.pop();
        if (!lastAction) return;

        console.log("Undoing action:", lastAction.type);

        switch (lastAction.type) {
            case 'CREATE_NOTE':
                // Inverse: Delete the note
                setNotes(prev => prev.filter(n => n.id !== lastAction.noteId));
                await supabase.from('notes').delete().eq('id', lastAction.noteId);
                break;

            case 'DELETE_NOTE':
                // Inverse: Re-insert the note
                const noteToRestore = lastAction.note;
                const { id, createdAt, ...rest } = noteToRestore;
                
                // Construct DB payload from Note object (mapping back to snake_case for DB)
                const payload = {
                    id: noteToRestore.id, // Keep original ID
                    board_id: noteToRestore.board_id,
                    content: noteToRestore.content,
                    title: noteToRestore.title,
                    author: noteToRestore.author,
                    author_id: noteToRestore.author_id,
                    author_role: noteToRestore.authorRole,
                    author_avatar: noteToRestore.authorAvatar,
                    type: noteToRestore.type,
                    color: noteToRestore.color,
                    x: noteToRestore.x,
                    y: noteToRestore.y,
                    width: noteToRestore.width,
                    height: noteToRestore.height,
                    section_id: noteToRestore.sectionId,
                    attachment_url: noteToRestore.attachmentUrl,
                    is_pinned: noteToRestore.isPinned,
                    likes: noteToRestore.likes,
                    liked_by: noteToRestore.likedBy,
                    comments: noteToRestore.comments, // Restore comments too
                    created_at: new Date(noteToRestore.createdAt).toISOString()
                };

                setNotes(prev => [noteToRestore, ...prev]);
                await supabase.from('notes').insert([payload]);
                break;

            case 'UPDATE_NOTE':
                // Inverse: Update with previous data
                setNotes(prev => prev.map(n => n.id === lastAction.noteId ? { ...n, ...lastAction.previousData } : n));
                
                // Map frontend props back to DB columns for specific fields that might have changed
                const dbUpdates: any = { ...lastAction.previousData };
                if (dbUpdates.sectionId !== undefined) { dbUpdates.section_id = dbUpdates.sectionId; delete dbUpdates.sectionId; }
                if (dbUpdates.attachmentUrl !== undefined) { dbUpdates.attachment_url = dbUpdates.attachmentUrl; delete dbUpdates.attachmentUrl; }
                if (dbUpdates.isPinned !== undefined) { dbUpdates.is_pinned = dbUpdates.isPinned; delete dbUpdates.isPinned; }
                if (dbUpdates.createdAt !== undefined) { 
                    dbUpdates.created_at = new Date(dbUpdates.createdAt).toISOString(); 
                    delete dbUpdates.createdAt; 
                }
                
                await supabase.from('notes').update(dbUpdates).eq('id', lastAction.noteId);
                break;

            case 'UPDATE_COMMENT':
                // Inverse: Revert comments array
                setNotes(prev => prev.map(n => n.id === lastAction.noteId ? { ...n, comments: lastAction.previousComments } : n));
                await supabase.from('notes').update({ comments: lastAction.previousComments }).eq('id', lastAction.noteId);
                break;
        }
        
        onTouchBoard();
        // We don't bump timestamp on undo to keep it "silent" or maybe we should? Leaving silent for now.
    }, [setNotes, onTouchBoard]);

    // Keyboard Listener for Ctrl+Z
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Ctrl+Z (or Cmd+Z on Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                // Avoid undoing if user is typing in an input/textarea
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


    // --- WRAPPED ACTIONS ---

    const createNote = useCallback(async (noteData: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        const finalAuthorId = user?.id || userId;

        const noteToInsert = {
            board_id: boardId,
            content: noteData.content,
            title: noteData.title,
            author: noteData.author || username || 'Anonymous',
            author_id: finalAuthorId,
            author_role: userRole || 'student',
            author_avatar: userAvatar,
            type: noteData.type,
            color: noteData.color,
            x: noteData.x || 0,
            y: noteData.y || 0,
            section_id: noteData.sectionId,
            attachment_url: noteData.attachmentUrl,
            likes: 0,
            comments: [],
            liked_by: [],
            created_at: noteData.createdAt ? new Date(noteData.createdAt).toISOString() : new Date().toISOString()
        };

        const { data, error } = await supabase.from('notes').insert([noteToInsert]).select().single();
        
        if (data && !error) {
            const newNote = mapNote(data);
            setNotes(prev => [newNote, ...prev]);
            
            // Push to History
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
        // Snapshot previous state for Undo
        setNotes(currentNotes => {
            const noteToUpdate = currentNotes.find(n => n.id === id);
            if (noteToUpdate) {
                // Create a subset of the note containing only the keys being updated
                const previousData: Partial<Note> = {};
                Object.keys(updates).forEach(key => {
                    // @ts-ignore
                    previousData[key] = noteToUpdate[key];
                });
                
                // If special handling like Comments was passed as a Partial<Note>, capture it
                if (updates.comments) previousData.comments = noteToUpdate.comments;

                historyStack.current.push({ 
                    type: updates.comments ? 'UPDATE_COMMENT' : 'UPDATE_NOTE', 
                    noteId: id, 
                    previousData: previousData,
                    previousComments: noteToUpdate.comments || [] 
                } as any); // Cast because we dynamically determine type based on content
            }
            return currentNotes.map(n => n.id === id ? { ...n, ...updates } : n);
        });

        const dbUpdates: any = { ...updates };
        
        // Map frontend props to DB columns
        if (dbUpdates.sectionId !== undefined) { 
            dbUpdates.section_id = dbUpdates.sectionId; 
            delete dbUpdates.sectionId; 
        }
        if (dbUpdates.attachmentUrl !== undefined) { 
            dbUpdates.attachment_url = dbUpdates.attachmentUrl; 
            delete dbUpdates.attachmentUrl; 
        }
        if (dbUpdates.isPinned !== undefined) { 
            dbUpdates.is_pinned = dbUpdates.isPinned; 
            delete dbUpdates.isPinned; 
        }
        if (dbUpdates.createdAt !== undefined) {
            // Allow createdAt update for reordering
            dbUpdates.created_at = new Date(dbUpdates.createdAt).toISOString();
            delete dbUpdates.createdAt;
        }
        
        delete dbUpdates.id;
        // delete dbUpdates.createdAt; // REMOVED: Handled above conditionally
        delete dbUpdates.isPlaceholder;
        delete dbUpdates.likedBy;
        
        if (updates.comments) {
            dbUpdates.comments = updates.comments;
        } else {
            delete dbUpdates.comments;
        }

        dbUpdates.updatedAt = new Date().toISOString();

        const { error } = await supabase.from('notes').update(dbUpdates).eq('id', id);
        if (error) console.error("Error updating note:", error);
        
        onTouchBoard();
        updateBoardTimestamp();
    }, [setNotes, onTouchBoard, updateBoardTimestamp]);

    const deleteNote = useCallback(async (id: string) => {
        // Snapshot for Undo
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

            const isLiked = n.likedBy?.includes(userId);
            let newLikes = n.likes;
            let newLikedBy = [...(n.likedBy || [])];

            if (isLiked) {
                newLikes = Math.max(0, newLikes - 1);
                newLikedBy = newLikedBy.filter(uid => uid !== userId);
            } else {
                newLikes = newLikes + 1;
                newLikedBy.push(userId);
            }
            return { ...n, likes: newLikes, likedBy: newLikedBy };
        }));

        const { error } = await supabase.rpc('toggle_like', { target_note_id: id, user_id: userId });
        if (error) console.error("Error toggling like:", error);
        onTouchBoard();
    }, [userId, setNotes, onTouchBoard]);

    const addComment = useCallback(async (noteId: string, text: string, attachment?: any) => {
        const newComment: Comment = {
            id: Math.random().toString(36).substr(2, 9),
            text,
            author: username || 'Student', 
            authorId: userId, 
            authorRole: userRole, 
            authorAvatar: userAvatar || undefined,
            createdAt: Date.now(),
            attachment,
            likes: 0, 
            likedBy: []
        };

        setNotes(prev => {
            const note = prev.find(n => n.id === noteId);
            if (!note) return prev;
            
            // Snapshot previous comments for undo
            historyStack.current.push({ 
                type: 'UPDATE_COMMENT', 
                noteId: noteId, 
                previousComments: note.comments || [] 
            });

            const updatedComments = [...(note.comments || []), newComment];
            
            // Fire and forget update (state is optimistic)
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
            author: username || 'Student',
            author_id: finalAuthorId,
            author_role: userRole,
            author_avatar: userAvatar,
            type: note.type,
            color: note.color,
            x: note.x + 20,
            y: note.y + 20,
            section_id: note.sectionId,
            attachment_url: note.attachmentUrl,
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

    const isEditable = useCallback((note: Note): boolean => {
        if (userRole === 'teacher') return true;
        if (note.author_id !== userId) return false;

        const editTimeLimit = board.settings?.editTimeLimit;

        if (editTimeLimit === undefined || editTimeLimit === null) {
            return true; // No limit set
        }

        if (editTimeLimit <= 0) { // 0 or less means cannot edit
            return false;
        }

        const now = Date.now();
        const updatedAt = new Date(note.updatedAt || note.createdAt).getTime();
        const diffInMinutes = (now - updatedAt) / (1000 * 60);

        return diffInMinutes < editTimeLimit;
    }, [userId, userRole, board.settings]);

    return {
        createNote,
        updateNote,
        deleteNote,
        likeNote,
        addComment,
        duplicateNote,
        isEditable,
    };
};
