import { useState, useCallback, useRef } from 'react';

export function useHistory<T>(initialState: T) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const historyRef = useRef<T[]>([initialState]);

    const pushState = useCallback((nextState: T) => {
        const nextStateClone = JSON.parse(JSON.stringify(nextState));
        
        // Don't push if it's the same as the current state
        const currentState = historyRef.current[currentIndex];
        if (JSON.stringify(currentState) === JSON.stringify(nextStateClone)) return;

        const newHistory = historyRef.current.slice(0, currentIndex + 1);
        newHistory.push(nextStateClone);
        
        // Limit history size to 50
        if (newHistory.length > 50) {
            newHistory.shift();
            historyRef.current = newHistory;
            setCurrentIndex(newHistory.length - 1);
        } else {
            historyRef.current = newHistory;
            setCurrentIndex(newHistory.length - 1);
        }
    }, [currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            const nextIndex = currentIndex - 1;
            setCurrentIndex(nextIndex);
            return historyRef.current[nextIndex];
        }
        return null;
    }, [currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex < historyRef.current.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            return historyRef.current[nextIndex];
        }
        return null;
    }, [currentIndex]);

    return { 
        state: historyRef.current[currentIndex], 
        pushState, 
        undo, 
        redo, 
        canUndo: currentIndex > 0, 
        canRedo: currentIndex < historyRef.current.length - 1 
    };
}
