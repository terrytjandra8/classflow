
import React, { useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { NoteCard } from '../../NoteCard/index';
import { useBoard } from '../BoardContext';

export const TimelineLayout: React.FC<any> = () => {
    const { 
        board, notes, openAddNote, canManageBoard,
        deleteNote, likeNote, addComment, updateNote
    } = useBoard();

    const scrollRef = useRef<HTMLDivElement>(null);

    // Sort chronologically for timeline
    const sortedNotes = [...notes].sort((a, b) => a.createdAt - b.createdAt);
    const canAdd = canManageBoard || board.lockMode === 'unlocked';

    // Scroll to end on mount
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth / 2 - window.innerWidth / 2;
        }
    }, []);

    return (
        <div className="h-full w-full overflow-x-auto overflow-y-hidden custom-scrollbar relative pt-6" ref={scrollRef}>
            
            {/* The Timeline Line */}
            <div className="absolute top-1/2 left-0 w-[max(100%,_2000px)] h-1 bg-slate-300 dark:bg-white/20 -translate-y-1/2 z-0"></div>

            <div className="flex items-center h-full px-[50vw] gap-12 min-w-max relative z-10">
                {/* Start Marker */}
                <div className="absolute left-[calc(50vw-60px)] top-1/2 -translate-y-1/2 bg-slate-800 text-white px-4 py-1 rounded-full text-xs font-bold z-20">
                    Start
                </div>

                {sortedNotes.map((note, index) => {
                    // Alternate top and bottom
                    const isTop = index % 2 === 0;
                    
                    return (
                        <div key={note.id} className="relative flex flex-col items-center justify-center w-[300px] shrink-0 h-full group">
                            
                            {/* Connector Line */}
                            <div className={`absolute left-1/2 w-0.5 bg-slate-300 dark:bg-white/20 ${isTop ? 'bottom-1/2 top-auto h-24' : 'top-1/2 bottom-auto h-24'}`}></div>
                            
                            {/* Dot on Line */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-pink-500 rounded-full border-4 border-white dark:border-[#1a1a1a] shadow-sm z-20"></div>

                            {/* Date Badge */}
                            <div className={`absolute left-1/2 -translate-x-1/2 bg-white dark:bg-[#222] px-2 py-1 rounded text-[10px] font-bold shadow-sm border border-black/5 dark:border-white/10 z-20 ${isTop ? 'top-[calc(50%-2rem)]' : 'bottom-[calc(50%-2rem)]'}`}>
                                {new Date(note.createdAt).toLocaleDateString()}
                            </div>

                            {/* The Card */}
                            <div className={`transition-transform hover:scale-105 duration-300 relative z-30 ${isTop ? 'mb-auto mt-20' : 'mt-auto mb-20'}`}>
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
                        </div>
                    );
                })}

                {/* Add Button at End */}
                {canAdd && (
                    <button 
                        onClick={() => openAddNote()}
                        className="w-16 h-16 rounded-full bg-slate-200 dark:bg-white/10 border-4 border-white dark:border-[#1a1a1a] flex items-center justify-center text-slate-400 hover:text-pink-500 hover:scale-110 transition-all shrink-0 z-20 shadow-lg"
                    >
                        <Plus size={32} />
                    </button>
                )}
            </div>
        </div>
    );
};
