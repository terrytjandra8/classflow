
import React from 'react';
import { MapPin, Plus } from 'lucide-react';
import { NoteCard } from '../../NoteCard/index';
import { useBoard } from '../BoardContext';

export const MapLayout: React.FC<any> = () => {
    const { 
        board, notes, openAddNote, canManageBoard,
        deleteNote, likeNote, addComment, updateNote, userId
    } = useBoard();

    // Use a high-quality map background for this layout specifically
    const mapBackground = {
        backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')",
        backgroundColor: '#a5bfdd', // Ocean color
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
    };

    const canAdd = canManageBoard || board.lockMode === 'unlocked';

    return (
        <div className="min-h-full w-full relative pt-4 pb-20 px-6" style={mapBackground}>
            <div className="absolute inset-0 bg-blue-500/10 pointer-events-none"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
                {notes.map(note => (
                    <div key={note.id} className="relative group">
                        {/* Fake Pin Visual */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-red-600 drop-shadow-md transform -translate-y-2 group-hover:-translate-y-4 transition-transform duration-300">
                            <MapPin size={32} fill="currentColor" />
                        </div>
                        
                        <NoteCard 
                            note={note} 
                            userId={userId}
                            commentsEnabled={board.commentsEnabled}
                            reactionsEnabled={board.reactionsEnabled}
                            onDelete={deleteNote}
                            onLike={likeNote}
                            onAddComment={addComment}
                            onUpdate={updateNote}
                        />
                    </div>
                ))}

                {canAdd && (
                    <button 
                        onClick={() => openAddNote()}
                        className="h-[200px] border-4 border-dashed border-white/40 bg-white/10 hover:bg-white/20 rounded-2xl flex flex-col items-center justify-center text-white font-bold gap-2 transition-colors backdrop-blur-sm"
                    >
                        <Plus size={40} />
                        <span>Add Pin</span>
                    </button>
                )}
            </div>
        </div>
    );
};
