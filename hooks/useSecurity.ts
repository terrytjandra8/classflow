
import React, { useState, useCallback, useEffect, RefObject } from 'react';
import { isValidUrl } from '../utils/validation';

interface PasteProtectionOptions {
    isStudent?: boolean;
    disablePaste?: boolean;
    allowLinks?: boolean;
    targetRef: RefObject<HTMLElement>; // Ref to the element to protect
    onBlock?: () => void; // Optional callback when blocked
}

// --- Advanced Paste Protection Hook (Honeypot Strategy) ---
export const usePasteProtection = ({ isStudent, disablePaste, allowLinks, targetRef, onBlock }: PasteProtectionOptions) => {
    const [pasteWarning, setPasteWarning] = useState(false);

    // The REAL paste handler - attached globally so it's hard to find
    useEffect(() => {
        const handleGlobalPaste = (e: ClipboardEvent) => {
            // Check if protections are active and if the event target is our protected element
            if (!isStudent || !disablePaste || !targetRef.current || !targetRef.current.contains(e.target as Node)) {
                return;
            }

            const text = e.clipboardData?.getData('text/plain');
            if (!text) return;

            // Allow short text (like 3 chars) to avoid false positives for keyboard shortcuts
            if (text.length <= 3) return;

            if (allowLinks && isValidUrl(text)) {
                return;
            }

            // The core protection logic
            // ROBUST: Block any significant paste, not just > 50 chars
            console.warn('Pasting blocked by global paste protector.');
            e.preventDefault();
            e.stopPropagation();

            // Flash the warning state
            setPasteWarning(true);
            setTimeout(() => setPasteWarning(false), 3000);
            
            if (onBlock) onBlock();
        };
    
        // Attach the real listener to the document
        document.addEventListener('paste', handleGlobalPaste, true);
    
        // Cleanup on unmount
        return () => {
            document.removeEventListener('paste', handleGlobalPaste, true);
        };
    
    }, [isStudent, disablePaste, allowLinks, targetRef, onBlock]);


    // The DECOY paste handler - this is what the student will find and remove
    const honeypotPasteHandler = useCallback((e: React.ClipboardEvent) => {
        if (!isStudent || !disablePaste) return;

        // Make it look like it's doing something
        const text = e.clipboardData.getData('text/plain');
        if (allowLinks && isValidUrl(text)) {
             return;
        }
        if (text.length > 50) {
            console.log('Decoy paste handler triggered. Student thinks they bypassed it.');
            e.preventDefault();
            e.stopPropagation();
        }
    }, [isStudent, disablePaste, allowLinks]);

    return {
        pasteWarning,
        setPasteWarning,
        // Return the decoy handler to be placed on the element
        onPaste: honeypotPasteHandler
    };
};


// --- Copy Protection Hook ---
// Returns props to apply to an element to disable selection, copying, and context menu
export const useCopyProtection = (disabled: boolean) => {
    const prevent = useCallback((e: React.SyntheticEvent) => {
        if (disabled) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, [disabled]);

    return {
        style: disabled ? {
            userSelect: 'none' as const,
            WebkitUserSelect: 'none' as const,
            msUserSelect: 'none' as const
        } : {},
        onContextMenu: prevent,
        onCopy: prevent,
        onCut: prevent
    };
};

// --- Screenshot & Snipping Protection Hook ---
export const useScreenshotProtection = (enabled: boolean) => {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // 1. Block PrintScreen key (Standard & some Chromebooks)
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                e.preventDefault();
                // We don't alert here as it might interfere with the blur logic
            }

            // 2. Block common screenshot shortcuts
            const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
            
            // Mac: Cmd+Shift+3/4/5
            if (isMac && e.shiftKey && e.metaKey && ['3', '4', '5'].includes(e.key)) {
                e.preventDefault();
            }

            // Windows: Win+Shift+S
            if (e.shiftKey && e.metaKey && (e.key === 'S' || e.key === 's')) {
                e.preventDefault();
            }

            // Chromebook: Ctrl + Window Switcher (F5) or Ctrl + Shift + Window Switcher
            // The Switcher key often maps to F5 or a specific code.
            if (e.ctrlKey && (e.key === 'F5' || e.keyCode === 121)) {
                e.preventDefault();
            }
        };

        // 3. Blur/Blackout logic when focus is lost (Prevents Snipping Tools)
        const handleBlur = () => {
            // We use a high-performance CSS filter on the root
            document.documentElement.style.filter = 'blur(40px) grayscale(100%)';
            document.documentElement.style.transition = 'filter 0.1s ease-out';
            
            // Optional: Overlay a message
            const overlay = document.getElementById('security-overlay');
            if (overlay) overlay.style.display = 'flex';
        };

        const handleFocus = () => {
            document.documentElement.style.filter = '';
            const overlay = document.getElementById('security-overlay');
            if (overlay) overlay.style.display = 'none';
        };

        // 4. Clipboard Clearing (Deterrence)
        const clearClipboard = async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText('Security: Content Protected');
                }
            } catch (e) { /* Ignore */ }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('keyup', (e) => {
            if (e.key === 'PrintScreen') clearClipboard();
        });

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.documentElement.style.filter = '';
        };
    }, [enabled]);
};

// --- Velocity Monitoring (Anti-Cheat) ---
// Detects if text is added too fast (scripts/auto-typers)
export const useAntiCheat = ({ 
    value, 
    onBlock, 
    enabled = true,
    ignoreBurst = false,
    thresholdChars = 10,
    thresholdTimeMs = 50 
}: { 
    value: string, 
    onBlock: () => void, 
    enabled?: boolean,
    ignoreBurst?: boolean,
    thresholdChars?: number,
    thresholdTimeMs?: number
}) => {
    const lastValueRef = React.useRef(value);
    const lastTimeRef = React.useRef(Date.now());

    useEffect(() => {
        if (!enabled || !value || ignoreBurst) {
            lastValueRef.current = value;
            lastTimeRef.current = Date.now();
            return;
        }

        const now = Date.now();
        const deltaChars = value.length - lastValueRef.current.length;
        const deltaTime = now - lastTimeRef.current;

        // If more than X characters are added in less than Y ms, it's suspicious
        if (deltaChars > thresholdChars && deltaTime < thresholdTimeMs) {
            console.error('Anti-cheat: Script detection triggered!', { deltaChars, deltaTime });
            onBlock();
        }

        lastValueRef.current = value;
        lastTimeRef.current = now;
    }, [value, onBlock, enabled, thresholdChars, thresholdTimeMs]);
};
