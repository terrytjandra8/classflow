
import { useEffect, useRef, useCallback } from 'react';

/**
 * Security hook for the active assessment test.
 * Detects: tab switches, window focus loss, devtools shortcuts, screenshot attempts.
 * 
 * BLUR GRACE PERIOD: Focus losses shorter than 2 seconds are ignored.
 * This prevents false positives from:
 *   - Grammar/spell-check extensions (Grammarly, etc.)
 *   - Chrome OS / Chromebook system notifications
 *   - OS permission prompts (mic, camera, notifications)
 *   - Password manager autofill popups
 * 
 * TAB SWITCH (visibilitychange) is always immediate — that's unambiguous cheating.
 */
export const useGuard = (isActive: boolean, onViolation: () => void) => {

    const violationDebounceRef = useRef(false);
    const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleViolation = useCallback(() => {
        if (violationDebounceRef.current) return;
        violationDebounceRef.current = true;
        onViolation();
        setTimeout(() => { violationDebounceRef.current = false; }, 1000);
    }, [onViolation]);

    useEffect(() => {
        if (!isActive) return;

        // --- 1. Fullscreen exit ---
        // Any fullscreen exit during an active guard session = violation.
        // The student is expected to remain in fullscreen during the test.
        const handleFullscreenChange = () => {
            if (document.fullscreenElement) {
                // Entered fullscreen — mark it for context
            } else {
                // Exited fullscreen during active test = violation
                handleViolation();
            }
        };

        // --- 2. Tab switch (unambiguous) — immediate violation ---
        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation();
            }
        };

        // --- 3. Window blur and Mouse Leave — immediate violation ---
        // As requested: trigger immediately when cursor is out or focus is lost.
        const handleBlur = () => {
            if (document.activeElement?.tagName.toLowerCase() === 'iframe') return;
            if (document.hasFocus()) return;
            
            handleViolation();
        };

        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
                handleViolation();
            }
        };

        // --- 4. Watchdog Interval (Anti-Bypass) ---
        // Even if students maliciously delete the event listeners above via DevTools,
        // this interval constantly verifies the window's focus and visibility state.
        const watchdogInterval = setInterval(() => {
            if (document.hidden) {
                handleViolation();
                return;
            }
            if (document.activeElement?.tagName.toLowerCase() !== 'iframe' && !document.hasFocus()) {
                handleViolation();
            }
        }, 1000);

        // --- 4. Keyboard shortcuts ---
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            // Block DevTools: F12, Ctrl+Shift+I/J/C, Cmd+Opt+I/J/C
            if (key === 'f12') {
                e.preventDefault();
                handleViolation();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key)) {
                e.preventDefault();
                handleViolation();
                return;
            }

            // Block window switching: Alt+Tab, Cmd+Tab
            if ((e.altKey && key === 'tab') || (e.metaKey && key === 'tab')) {
                e.preventDefault();
                handleViolation();
                return;
            }

            // Block PrintScreen (Windows/Linux)
            if (key === 'printscreen') {
                e.preventDefault();
                // Brief hide to defeat screenshot — content will restore on focus
                document.body.style.opacity = '0';
                setTimeout(() => { document.body.style.opacity = ''; }, 300);
                return; // Not a violation — just block it silently
            }

            // Block Chromebook screenshot shortcuts:
            // Ctrl+Show Windows key (F5) = full screenshot
            // Ctrl+Shift+Show Windows key (F5) = partial screenshot  
            // Show Windows = either F5 (mapped) or MediaTrackNext on some models
            if (e.ctrlKey && (key === 'f5' || key === 'mediaplaypause' || key === 'mediatracknext')) {
                e.preventDefault();
                document.body.style.opacity = '0';
                setTimeout(() => { document.body.style.opacity = ''; }, 300);
                return; // Block silently
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('keydown', handleKeyDown, true);
            clearInterval(watchdogInterval);
        };

    }, [isActive, handleViolation]);

};
