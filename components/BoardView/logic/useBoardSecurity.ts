
import { useEffect } from 'react';
import { Board } from '../../../types';

interface BoardSecurityProps {
    board: Board;
    isStudent: boolean;
    isSimulatingStudent: boolean;
}

export const useBoardSecurity = ({
    board,
    isStudent,
    isSimulatingStudent
}: BoardSecurityProps) => {
    useEffect(() => {
        const isGuarded = isStudent || isSimulatingStudent;
        if (!isGuarded) return;

        const handlers: [string, EventListener][] = [];
        let watchdog: any = null;

        if (board.disableCopy) {
            const blockCopyCut = (e: Event) => { e.preventDefault(); };
            handlers.push(['copy', blockCopyCut as EventListener], ['cut', blockCopyCut as EventListener]);
        }

        if (board.disablePaste) {
            const blockPaste = (e: Event) => { e.preventDefault(); };
            handlers.push(['paste', blockPaste as EventListener]);
        }

        handlers.forEach(([event, handler]) => document.addEventListener(event, handler, true));

        // Anti-bypass: aggressively overwrite the property handlers so even if event listeners 
        // are removed via DevTools, copy/paste remains blocked.
        if (board.disableCopy || board.disablePaste) {
            watchdog = setInterval(() => {
                if (board.disableCopy) {
                    document.oncopy = (e) => { e.preventDefault(); return false; };
                    document.oncut = (e) => { e.preventDefault(); return false; };
                }
                if (board.disablePaste) {
                    document.onpaste = (e) => { e.preventDefault(); return false; };
                }
            }, 1000);
        }

        return () => {
            handlers.forEach(([event, handler]) => document.removeEventListener(event, handler, true));
            if (watchdog) clearInterval(watchdog);
            document.oncopy = null;
            document.oncut = null;
            document.onpaste = null;
        };
    }, [board.disableCopy, board.disablePaste, isStudent, isSimulatingStudent]);
};
