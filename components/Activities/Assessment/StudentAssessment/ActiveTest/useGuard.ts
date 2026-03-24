
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
    const wasInFullscreen = useRef(false);

    const handleViolation = useCallback(() => {
        if (violationDebounceRef.current) return;
        violationDebounceRef.current = true;
        onViolation();
        setTimeout(() => { violationDebounceRef.current = false; }, 1000);
    }, [onViolation]);

    useEffect(() => {
        if (!isActive) return;

        // Clear any pending blur timer on mount/re-activation
        if (blurTimerRef.current) {
            clearTimeout(blurTimerRef.current);
            blurTimerRef.current = null;
        }

        // --- 1. Fullscreen exit ---
        // Only count as violation if we were previously IN fullscreen.
        // This avoids false-triggering if the page was never fullscreened.
        const handleFullscreenChange = () => {
            if (document.fullscreenElement) {
                wasInFullscreen.current = true;
            } else if (wasInFullscreen.current) {
                // Genuinely exited fullscreen
                handleViolation();
            }
        };

        // --- 2. Tab switch (unambiguous) — immediate violation ---
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Cancel any pending blur timer to avoid double-counting
                if (blurTimerRef.current) {
                    clearTimeout(blurTimerRef.current);
                    blurTimerRef.current = null;
                }
                handleViolation();
            }
        };

        // --- 3. Window blur — with 2-second grace period ---
        // Grammarly, spell-check extensions, Chromebook OS notifications, system
        // permission dialogs all briefly steal focus and return within ~500ms–1s.
        // We only count it as a violation if focus is still gone after 2 seconds.
        const handleBlur = () => {
            // Skip if an iframe has focus (rich text editor iframes are normal)
            if (document.activeElement?.tagName.toLowerCase() === 'iframe') return;

            // Skip if focus is still within the document (e.g., canvas overlay)
            if (document.hasFocus()) return;

            // Start grace timer — if focus returns before it fires, we cancel it
            if (!blurTimerRef.current) {
                blurTimerRef.current = setTimeout(() => {
                    blurTimerRef.current = null;
                    // Double-check: still unfocused?
                    if (!document.hasFocus() && !document.hidden) {
                        handleViolation();
                    }
                }, 2000); // 2-second grace period
            }
        };

        const handleFocus = () => {
            // Focus returned — cancel any pending blur violation
            if (blurTimerRef.current) {
                clearTimeout(blurTimerRef.current);
                blurTimerRef.current = null;
            }
        };

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
        window.addEventListener('focus', handleFocus);
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('keydown', handleKeyDown, true);

            // Clean up any pending grace timer
            if (blurTimerRef.current) {
                clearTimeout(blurTimerRef.current);
                blurTimerRef.current = null;
            }
        };

    }, [isActive, handleViolation]);

};
