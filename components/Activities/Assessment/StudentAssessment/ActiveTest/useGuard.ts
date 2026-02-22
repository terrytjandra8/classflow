
import { useEffect, useRef, useCallback } from 'react';

/**
 * A hook to enforce a secure environment for assessments.
 * It handles fullscreen enforcement, tab/window switching, context menus, and keyboard shortcuts.
 * It does NOT render any UI, preventing conflicts with component interactions.
 * @param isActive - Whether the security measures should be active.
 * @param onViolation - A callback function to be triggered when a security rule is broken.
 */
export const useGuard = (isActive: boolean, onViolation: () => void) => {

    const violationDebounceRef = useRef(false);

    // Using useCallback to ensure the function reference is stable
    const handleViolation = useCallback(() => {
        // Debounce to prevent multiple rapid violation calls
        if (violationDebounceRef.current) return;
        violationDebounceRef.current = true;
        
        onViolation();

        // Reset the debounce after a short period
        setTimeout(() => {
            violationDebounceRef.current = false;
        }, 500); 
    }, [onViolation]);

    useEffect(() => {
        if (!isActive) return;

        // --- Event Listeners for Violation Detection ---

        // 1. Fullscreen Exit Detection
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                console.log("Violation: Exited Fullscreen");
                handleViolation();
            }
        };

        // 2. Tab/Window Switch & Focus Loss Detection
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log("Violation: Tab Hidden");
                handleViolation();
            }
        };

        // This handles Alt-Tab, clicking outside the window, etc.
        const handleBlur = () => {
            // We allow focus to move to iframes, which are used by some rich text editors.
            // Without this, clicking inside the editor would trigger a violation.
            if (document.activeElement?.tagName.toLowerCase() !== 'iframe') {
                console.log("Violation: Window lost focus");
                handleViolation();
            }
        };

        // 3. Right-Click / Context Menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            console.log("Violation: Context Menu Opened");
            handleViolation();
        };

        // 4. Keyboard Shortcut Detection
        const handleKeyDown = (e: KeyboardEvent) => {
            // Block F12 (DevTools)
            if (e.key === 'F12') {
                e.preventDefault();
                console.log(`Violation: Key press detected - ${e.key}`);
                handleViolation();
                return;
            }
            
            // Block standard DevTools shortcuts (Ctrl+Shift+I/J/C, Cmd+Opt+I/J/C)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
                 e.preventDefault();
                 console.log(`Violation: DevTools shortcut detected`);
                 handleViolation();
                 return;
            }
            
            // Block standard screenshot shortcuts
            if (
                (e.metaKey && e.shiftKey && ['s', '3', '4'].includes(e.key.toLowerCase())) || // Win+Shift+S, Cmd+Shift+3/4
                (e.key === 'PrintScreen')
            ) {
                e.preventDefault();
                console.log(`Violation: Screenshot shortcut detected`);
                handleViolation();
                return;
            }

            // Block window switching via Alt+Tab or Cmd+Tab
            if ((e.altKey || e.metaKey) && e.key === 'Tab') {
                e.preventDefault();
                console.log("Violation: Window switch shortcut detected");
                handleViolation();
                return;
            }
        };
        
        // Add all listeners
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('contextmenu', handleContextMenu);
        // Use 'true' to capture keys before they are processed by the page
        window.addEventListener('keydown', handleKeyDown, true);

        // Cleanup function to remove listeners when the component unmounts or isActive becomes false
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown, true);
        };

    }, [isActive, handleViolation]);

};
