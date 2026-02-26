
import React, { useState, useCallback, useEffect, RefObject } from 'react';
import { isValidUrl } from '../utils/validation';

interface PasteProtectionOptions {
    isStudent?: boolean;
    disablePaste?: boolean;
    allowLinks?: boolean;
    targetRef: RefObject<HTMLElement>; // Ref to the element to protect
}

// --- Advanced Paste Protection Hook (Honeypot Strategy) ---
export const usePasteProtection = ({ isStudent, disablePaste, allowLinks, targetRef }: PasteProtectionOptions) => {
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

            if (allowLinks && isValidUrl(text)) {
                return;
            }

            // The core protection logic
            if (text.length > 50) {
                console.warn('Pasting blocked by global paste protector.');
                e.preventDefault();
                e.stopPropagation();

                // Flash the warning state
                setPasteWarning(true);
                setTimeout(() => setPasteWarning(false), 3000);
            }
        };

        // Attach the real listener to the document
        document.addEventListener('paste', handleGlobalPaste, true);

        // Cleanup on unmount
        return () => {
            document.removeEventListener('paste', handleGlobalPaste, true);
        };

    }, [isStudent, disablePaste, allowLinks, targetRef]);


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
