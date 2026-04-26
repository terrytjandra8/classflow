
import React, { useCallback, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Note, Comment, Board } from '../types';
import { mapNote } from '../utils/mappers';
import { getViolationKey, decryptViolationCount, encryptViolationCount } from '../utils/security';

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

type HistoryAction = 
    | { type: 'CREATE_NOTE'; noteId: string }
    | { type: 'DELETE_NOTE'; note: Note }
    | { type: 'UPDATE_NOTE'; noteId: string; previousData: Partial<Note> }
    | { type: 'UPDATE_COMMENT'; noteId: string; previousComments: Comment[] };

export const useNoteActions = ({ 
    board, boardId, userId, username, userAvatar, userRole, setNotes, onTouchBoard 
}: UseNoteActionsProps) => {

    const historyStack = useRef<HistoryAction[]>([]);
    const setNotesRef = useRef(setNotes);
    useEffect(() => { setNotesRef.current = setNotes; }, [setNotes]);


    const performUndo = useCallback(async () => {
        const lastAction = historyStack.current.pop();
        if (!lastAction) return;

        const currentSetNotes = setNotesRef.current;

        switch (lastAction.type) {
            case 'CREATE_NOTE':
                currentSetNotes(prev => prev.filter(n => n.id !== lastAction.noteId));
                await supabase.from('notes').delete().eq('id', lastAction.noteId);
                break;

            case 'DELETE_NOTE':
                const noteToRestore = lastAction.note;
                const payload = {
                    id: noteToRestore.id,
                    board_id: noteToRestore.board_id,
                    content: noteToRestore.content,
                    title: noteToRestore.title,
                    author: noteToRestore.author,
                    author_id: noteToRestore.author_id,
                    author_role: noteToRestore.authorRole,
                    author_avatar: noteToRestore.authorAvatar,
                    type: noteToRestore.type,
                    color: noteToRestore.color,
                    x: noteToRestore.x, y: noteToRestore.y, width: noteToRestore.width, height: noteToRestore.height,
                    section_id: noteToRestore.sectionId,
                    attachment_url: noteToRestore.attachmentUrl,
                    is_pinned: noteToRestore.isPinned,
                    likes: noteToRestore.likes,
                    liked_by: noteToRestore.likedBy,
                    comments: noteToRestore.comments,
                    created_at: new Date(noteToRestore.createdAt).toISOString()
                };
                currentSetNotes(prev => [noteToRestore, ...prev]);
                await supabase.from('notes').insert([payload]);
                break;

            case 'UPDATE_NOTE':
                currentSetNotes(prev => prev.map(n => n.id === lastAction.noteId ? { ...n, ...lastAction.previousData } : n));
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
                currentSetNotes(prev => prev.map(n => n.id === lastAction.noteId ? { ...n, comments: lastAction.previousComments } : n));
                await supabase.from('notes').update({ comments: lastAction.previousComments }).eq('id', lastAction.noteId);
                break;
        }
        onTouchBoard();
    }, [onTouchBoard]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                const activeTag = document.activeElement?.tagName.toLowerCase();
                if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) return;
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
            violation_count: decryptViolationCount(localStorage.getItem(`board_violations_${boardId}_${finalAuthorId}`)),
            created_at: noteData.createdAt ? new Date(noteData.createdAt).toISOString() : new Date().toISOString()
        };

        const { data, error } = await supabase.from('notes').insert([noteToInsert]).select().single();
        
        if (data && !error) {
            const newNote = mapNote(data);
            setNotes(prev => [newNote, ...prev]);
            historyStack.current.push({ type: 'CREATE_NOTE', noteId: newNote.id });
            onTouchBoard();
            return newNote;
        } else {
            console.error("Failed to create note:", error);
            return null;
        }
    }, [boardId, username, userAvatar, userRole, setNotes, onTouchBoard, userId]);

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
            return currentNotes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n);
        });

        const dbUpdates: { [key: string]: any } = {
            updated_at: new Date().toISOString(),
        };

        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.content !== undefined) dbUpdates.content = updates.content;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.x !== undefined) dbUpdates.x = updates.x;
        if (updates.y !== undefined) dbUpdates.y = updates.y;
        if (updates.width !== undefined) dbUpdates.width = updates.width;
        if (updates.height !== undefined) dbUpdates.height = updates.height;
        if (updates.comments !== undefined) dbUpdates.comments = updates.comments;
        if (updates.sectionId !== undefined) dbUpdates.section_id = updates.sectionId;
        if (updates.attachmentUrl !== undefined) dbUpdates.attachment_url = updates.attachmentUrl;
        if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
        if (updates.createdAt !== undefined) dbUpdates.created_at = new Date(updates.createdAt).toISOString();
        
        // --- SECURE LOCAL SYNC ---
        // If a local encrypted violation count exists, merge it into the update
        const localKey = getViolationKey(id);
        const localViolations = decryptViolationCount(localStorage.getItem(localKey));
        
        if (updates.violation_count !== undefined) {
            dbUpdates.violation_count = updates.violation_count;
            // Clear local storage after explicit update to prevent double-counting
            localStorage.removeItem(localKey);
        } else if (localViolations > 0) {
            // Pick up pending local violations if not explicitly provided
            dbUpdates.violation_count = localViolations;
        }

        const { error } = await supabase.from('notes').update(dbUpdates).eq('id', id);

        if (error) {
            console.error("Error updating note:", error);
        }
        
        onTouchBoard();
        // Removed: updateBoardTimestamp() - causing race conditions on busy boards
    }, [setNotes, onTouchBoard]);
    
    const incrementViolation = useCallback(async (id: string, currentCount: number = 0) => {
        console.log(`[FocusGuard] Calling secure RPC for note: ${id}. Base count: ${currentCount}`);
        
        // Optimistic update for instant UI feedback
        setNotes(currentNotes => currentNotes.map(n => 
            n.id === id ? { ...n, violation_count: (n.violation_count || 0) + 1 } : n
        ));

        // Call secure RPC - this bypasses RLS using SECURITY DEFINER
        const { error } = await supabase.rpc('increment_violation_count', { target_note_id: id });
        
        if (error) {
            console.error("[FocusGuard] RPC Error:", error.message);
            // Fallback: If RPC fails (e.g. not created yet), try a standard update as a last resort
            await supabase.from('notes').update({ 
                violation_count: currentCount + 1 
            }).eq('id', id);
        } else {
            console.log(`[FocusGuard] Database successfully updated for note: ${id}`);
            // Clear local storage after successful DB sync
            localStorage.removeItem(getViolationKey(id));
        }
    }, [setNotes]);

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
    }, [setNotes, onTouchBoard]);

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
            
            historyStack.current.push({ 
                type: 'UPDATE_COMMENT', 
                noteId: noteId, 
                previousComments: note.comments || [] 
            });

            const updatedComments = [...(note.comments || []), newComment];
            
            supabase.from('notes').update({ comments: updatedComments }).eq('id', noteId).then(({ error }) => {
                if(error) console.error("Error adding comment", error);
                onTouchBoard();
            });

            return prev.map(n => n.id === noteId ? { ...n, comments: updatedComments } : n);
        });

    }, [userId, username, userRole, userAvatar, setNotes, onTouchBoard]);

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
        }
    }, [boardId, username, userRole, userAvatar, setNotes, onTouchBoard, userId]);

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
        incrementViolation
    };
};
