
import { useEffect, useCallback } from 'react';

export const useFocusMode = (isActive: boolean, onViolation: () => void) => {

    const enterFullscreen = useCallback(async () => {
        try {
            if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (e) {
            console.error("Could not enter fullscreen:", e);
        }
    }, []);

    const exitFullscreen = useCallback(async () => {
        try {
            if (document.exitFullscreen && document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch (e) {
            console.error("Could not exit fullscreen:", e);
        }
    }, []);

    useEffect(() => {
        if (!isActive) {
            exitFullscreen();
            return;
        }

        enterFullscreen();

        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log("Violation: Tab Hidden");
                onViolation();
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            console.log("Violation: Context Menu");
            e.preventDefault();
            onViolation();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey)) { // Catches PrintScreen and Cmd+Shift+S/3/4
                console.log("Violation: Screenshot Attempt");
                onViolation();
            }
        };
        
        const handleFullscreenError = () => {
            // If user manually exits fullscreen, we need to treat it as a violation.
            if (!document.fullscreenElement) {
                console.log("Violation: Exited Fullscreen");
                onViolation();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('fullscreenchange', handleFullscreenError);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullscreenError);
            // Do NOT exit fullscreen here, as it can cause issues on component unmount.
            // Let the parent component decide when to exit.
        };
    }, [isActive, onViolation, enterFullscreen, exitFullscreen]);
};
