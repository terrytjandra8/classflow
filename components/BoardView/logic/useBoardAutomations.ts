
import { useEffect } from 'react';
import { Board } from '../../../types';

interface BoardAutomationsProps {
    board: Board;
    canManageBoard: boolean;
    onUpdateBoard: (updates: Partial<Board>) => void;
}

export const useBoardAutomations = ({
    board,
    canManageBoard,
    onUpdateBoard
}: BoardAutomationsProps) => {
    useEffect(() => {
        if (!canManageBoard) return;
        
        const hasAutoLock = board.autoLockTime && board.lockMode !== 'readonly';
        const hasAutoLive = board.autoLiveTime && !board.isPublished;

        if (!hasAutoLock && !hasAutoLive) return;

        const checkTimers = () => {
            const now = Date.now();
            
            if (board.autoLockTime && board.lockMode !== 'readonly' && now >= board.autoLockTime) {
                onUpdateBoard({ lockMode: 'readonly' });
            }

            if (board.autoLiveTime && !board.isPublished && now >= board.autoLiveTime) {
                onUpdateBoard({ isPublished: true, autoLiveTime: null });
            }
        };

        const interval = setInterval(checkTimers, 5000);
        checkTimers();

        return () => clearInterval(interval);
    }, [board.autoLockTime, board.autoLiveTime, board.lockMode, board.isPublished, canManageBoard, onUpdateBoard]);
};
