
import { supabase } from './supabaseClient';
import { Note } from '../types';
import { Database } from '../types/db';
import { mapNote } from '../utils/mappers';

type NoteRow = Database['public']['Tables']['notes']['Row'];
type NoteInsert = Database['public']['Tables']['notes']['Insert'];
type NoteUpdate = Database['public']['Tables']['notes']['Update'];

export const noteService = {
    async getNotes(boardId: string) {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('board_id', boardId);
        
        if (error) throw error;
        return (data as NoteRow[]).map(mapNote);
    },

    async createNote(note: Partial<Note> & { boardId: string, author_id: string }) {
        const payload: NoteInsert = {
            board_id: note.boardId,
            content: note.content,
            title: note.title,
            author: note.author,
            author_id: note.author_id,
            author_role: note.authorRole,
            author_avatar: note.authorAvatar,
            type: note.type,
            color: note.color,
            x: note.x,
            y: note.y,
            section_id: note.sectionId,
            attachment_url: note.attachmentUrl,
            likes: 0,
            comments: [],
            liked_by: [],
            connections: []
        };

        const { data, error } = await supabase
            .from('notes')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return mapNote(data as NoteRow);
    },

    async updateNote(id: string, updates: Partial<Note>) {
        const dbUpdates: NoteUpdate = {};
        
        if (updates.content !== undefined) dbUpdates.content = updates.content;
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.x !== undefined) dbUpdates.x = updates.x;
        if (updates.y !== undefined) dbUpdates.y = updates.y;
        if (updates.width !== undefined) dbUpdates.width = updates.width;
        if (updates.height !== undefined) dbUpdates.height = updates.height;
        if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
        if (updates.likes !== undefined) dbUpdates.likes = updates.likes;
        if (updates.likedBy !== undefined) dbUpdates.liked_by = updates.likedBy;
        if (updates.comments !== undefined) dbUpdates.comments = updates.comments as any;
        if (updates.connections !== undefined) dbUpdates.connections = updates.connections as any;
        if (updates.sectionId !== undefined) dbUpdates.section_id = updates.sectionId;

        const { data, error } = await supabase
            .from('notes')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapNote(data as NoteRow);
    },

    async deleteNote(id: string) {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) throw error;
    },

    async deleteNotes(ids: string[]) {
        if (ids.length === 0) return;
        const { error } = await supabase.from('notes').delete().in('id', ids);
        if (error) throw error;
    },

    async toggleLike(noteId: string, userId: string) {
        const { error } = await supabase.rpc('toggle_like', { 
            target_note_id: noteId, 
            user_id: userId 
        });
        if (error) throw error;
    }
};
