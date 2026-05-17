
import { useEffect, useRef, useCallback } from 'react';

/**
 * Security hook for the active assessment test.
 * 
 * TWO LAYERS:
 * 1. Focus Tracking (always active in both Practice + Test):
 *    Counts tab switches and window blur events as "focus violations."
 *    These are displayed on the student's header and the teacher's live monitor.
 * 
 * 2. Security Enforcement (only in Test mode — isSecure = true):
 *    Fullscreen enforcement, keyboard blocking, disqualification on violation.
 * 
 * BLUR GRACE PERIOD: Focus losses shorter than 2 seconds are ignored.
 * This prevents false positives from:
 *   - Grammar/spell-check extensions (Grammarly, etc.)
 *   - Chrome OS / Chromebook system notifications
 *   - OS permission prompts (mic, camera, notifications)
 *   - Password manager autofill popups
 * 
 * TAB SWITCH (visibilitychange) is always immediate — that's unambiguous.
 */
export const useGuard = (
    isSecure: boolean,
    onDisqualify: () => void,
    isDrawingOpen: boolean,
    onFocusViolation?: () => void,
) => {

    const violationDebounceRef = useRef(false);

    // --- Disqualification handler (test mode only) ---
    const handleDisqualify = useCallback(() => {
        if (violationDebounceRef.current) return;
        if (isDrawingOpen) return;
        violationDebounceRef.current = true;
        onDisqualify();
        setTimeout(() => { violationDebounceRef.current = false; }, 1000);
    }, [onDisqualify, isDrawingOpen]);

    // --- Focus violation handler (always active) ---
    const focusDebounceRef = useRef(false);
    const handleFocusViolation = useCallback(() => {
        if (focusDebounceRef.current) return;
        if (isDrawingOpen) return;
        focusDebounceRef.current = true;
        onFocusViolation?.();
        setTimeout(() => { focusDebounceRef.current = false; }, 2000);
    }, [onFocusViolation, isDrawingOpen]);

    // --- Layer 1: Focus Tracking (Practice + Test) ---
    useEffect(() => {
        // Tab switch — unambiguous
        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleFocusViolation();
                // In secure (test) mode, also disqualify
                if (isSecure) handleDisqualify();
            }
        };

        // Window blur
        const handleBlur = () => {
            if (document.activeElement?.tagName.toLowerCase() === 'iframe') return;
            if (document.hasFocus()) return;
            handleFocusViolation();
            if (isSecure) handleDisqualify();
        };

        // Mouse leaving the window
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
                handleFocusViolation();
                if (isSecure) handleDisqualify();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [isSecure, handleFocusViolation, handleDisqualify, isDrawingOpen]);

    // --- Layer 2: Security Enforcement (Test mode only) ---
    useEffect(() => {
        if (!isSecure) return;

        // Fullscreen exit
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                handleDisqualify();
            }
        };

        // Watchdog Interval (Anti-Bypass)
        const watchdogInterval = setInterval(() => {
            if (document.hidden) {
                handleFocusViolation();
                handleDisqualify();
                return;
            }
            if (document.activeElement?.tagName.toLowerCase() !== 'iframe' && !document.hasFocus()) {
                handleFocusViolation();
                handleDisqualify();
            }
        }, 1000);

        // Keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            // Block DevTools: F12, Ctrl+Shift+I/J/C
            if (key === 'f12') {
                e.preventDefault();
                handleDisqualify();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key)) {
                e.preventDefault();
                handleDisqualify();
                return;
            }

            // Block window switching: Alt+Tab, Cmd+Tab
            if ((e.altKey && key === 'tab') || (e.metaKey && key === 'tab')) {
                e.preventDefault();
                handleDisqualify();
                return;
            }

            // Block PrintScreen
            if (key === 'printscreen') {
                e.preventDefault();
                document.body.style.opacity = '0';
                setTimeout(() => { document.body.style.opacity = ''; }, 300);
                return;
            }

            // Block Chromebook screenshot shortcuts
            if (e.ctrlKey && (key === 'f5' || key === 'mediaplaypause' || key === 'mediatracknext')) {
                e.preventDefault();
                document.body.style.opacity = '0';
                setTimeout(() => { document.body.style.opacity = ''; }, 300);
                return;
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('keydown', handleKeyDown, true);
            clearInterval(watchdogInterval);
        };
    }, [isSecure, handleDisqualify, handleFocusViolation]);

};
