
import { useState, useEffect, useCallback } from 'react';

export const useFocusMode = (isActive: boolean, onViolation: () => void) => {
    const [isFocused, setIsFocused] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // 1. Detect Tab Switching (Reliable Anti-Cheat)
    useEffect(() => {
        if (!isActive) return;

        const handleVisibilityChange = () => {
            // document.hidden is true when tab is switched or window minimized
            if (document.hidden) {
                setIsFocused(false);
                console.log("Violation: Tab Hidden");
                onViolation();
            } else {
                setIsFocused(true);
            }
        };

        // NOTE: Removed 'blur' event listener to prevent disqualification on 
        // system notifications (battery, updates, etc.) which steal focus 
        // but keep the window visible.

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isActive, onViolation]);

    // 2. Fullscreen Management
    const enterFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (e) {
            console.error("Fullscreen denied", e);
        }
    }, []);

    useEffect(() => {
        if (!isActive) return;

        const handleFsChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);
        };

        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, [isActive]);

    return { isFocused, isFullscreen, enterFullscreen };
};
