
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Clock, Radio } from 'lucide-react';
import { useHeaderLogic } from './useHeaderLogic';

export const HeaderMeta: React.FC = () => {
    const { board, formatDate } = useHeaderLogic();
    const [isBlinking, setIsBlinking] = useState(false);
    const lastUpdateRef = useRef(board.updatedAt);

    useEffect(() => {
        // Only trigger blink if the timestamp actually changes (real-time update)
        if (board.updatedAt && lastUpdateRef.current && board.updatedAt !== lastUpdateRef.current) {
            setIsBlinking(true);
            
            const timer = setTimeout(() => setIsBlinking(false), 3000);
            
            // Update ref
            lastUpdateRef.current = board.updatedAt;
            
            return () => clearTimeout(timer);
        }
        
        // Ensure ref is synced on mount/first load without triggering
        if (board.updatedAt && !lastUpdateRef.current) {
            lastUpdateRef.current = board.updatedAt;
        }
    }, [board.updatedAt]);

    const getTimeDisplay = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return isToday ? `Today at ${timeStr}` : `${date.toLocaleDateString()} ${timeStr}`;
    };

    return (
        <div className="flex flex-col gap-1 pointer-events-auto w-full">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-white/50">
                <span>Created: {formatDate(board.createdAt)}</span>
                {board.updatedAt && board.updatedAt > board.createdAt + 60000 && (
                    <span className={`flex items-center gap-2 text-blue-400 font-bold transition-all duration-500 ${isBlinking ? 'animate-pulse bg-blue-500/10 px-2 rounded -ml-2' : ''}`}>
                        <div className={`w-1 h-1 bg-blue-400 rounded-full transition-transform ${isBlinking ? 'scale-150' : ''}`}></div> 
                        Updated: {formatDate(board.updatedAt)}
                    </span>
                )}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/70 mt-1 max-w-full">
                {board.description && (
                    <span className="truncate max-w-full md:max-w-[600px] block">{board.description}</span>
                )}

                {/* Lock Status */}
                {board.lockMode !== 'unlocked' && (
                    <>
                        <div className="w-px h-3 bg-white/20 hidden sm:block"></div>
                        <span className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase text-[10px] font-bold whitespace-nowrap">
                            <Lock size={10} /> {board.lockMode === 'readonly' ? 'Read Only' : 'Comments Only'}
                        </span>
                    </>
                )}

                {/* Auto Live Timer Display */}
                {board.autoLiveTime && !board.isPublished && (
                    <>
                        <div className="w-px h-3 bg-white/20 hidden sm:block"></div>
                        <span className="flex items-center gap-1.5 text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 uppercase text-[10px] font-bold whitespace-nowrap">
                            <Radio size={10} /> Goes Live: {getTimeDisplay(board.autoLiveTime)}
                        </span>
                    </>
                )}

                {/* Auto Lock Timer Display */}
                {board.autoLockTime && board.lockMode === 'unlocked' && (
                    <>
                        <div className="w-px h-3 bg-white/20 hidden sm:block"></div>
                        <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase text-[10px] font-bold whitespace-nowrap">
                            <Clock size={10} /> Locks: {getTimeDisplay(board.autoLockTime)}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};
