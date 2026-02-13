
import React from 'react';
import { Plus } from 'lucide-react';
import { NoteCard } from '../../NoteCard/index';
import { useBoard } from '../BoardContext';

export const StreamLayout: React.FC<any> = () => {
    const { 
        board, notes, openAddNote, sectionIdFilter, canManageBoard,
        deleteNote, likeNote, addComment, updateNote
    } = useBoard();

    const isLocked = board.lockMode === 'readonly' || board.lockMode === 'comments_only';
    const canAdd = canManageBoard || !isLocked;
    
    const displayNotes = sectionIdFilter 
        ? notes.filter(n => n.sectionId === sectionIdFilter)
        : notes;

    return (
        <div className="mx-auto pt-4 pb-20 px-4 w-full max-w-3xl">
            <div className="flex flex-col gap-6">
                {/* Add Button at Top of Stream */}
                {canAdd && (
                    <button 
                        onClick={() => openAddNote(sectionIdFilter)}
                        className="w-full py-6 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-white hover:border-slate-400 dark:hover:border-white/30 transition-all bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 group"
                    >
                        <div className="p-3 bg-white dark:bg-black/20 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold text-sm">Add to Stream</span>
                    </button>
                )}

                {displayNotes.map(note => (
                    <div key={note.id} className="w-full">
                        <NoteCard 
                            note={note} 
                            canDrag={false} 
                            commentsEnabled={board.commentsEnabled}
                            reactionsEnabled={board.reactionsEnabled}
                            onDelete={deleteNote}
                            onLike={likeNote}
                            onAddComment={addComment}
                            onUpdate={updateNote}
                        />
                    </div>
                ))}

                {displayNotes.length === 0 && (
                    <div className="text-center py-10 text-gray-400 italic">
                        No posts yet. Be the first to share!
                    </div>
                )}
            </div>
        </div>
    );
};
