
import React, { useState, useCallback } from 'react';
import { isValidUrl } from '../utils/validation';

// --- Paste Protection Hook ---
// Returns a handler and a warning state for when a user tries to paste large text
export const usePasteProtection = (isStudent?: boolean, disablePaste?: boolean, allowLinks?: boolean) => {
    const [pasteWarning, setPasteWarning] = useState(false);

    const handlePasteProtection = useCallback((e: React.ClipboardEvent) => {
        // If protections are not active, do nothing (allow default behavior)
        if (!isStudent || !disablePaste) return;

        const text = e.clipboardData.getData('text/plain');
        
        // If no text (e.g. image file), let it pass (handled by other logic if needed)
        if (!text) return;

        // If links are allowed and it validates as a URL, let it pass
        if (allowLinks && isValidUrl(text)) {
            return;
        }

        // Block large text chunks (e.g. > 50 chars)
        if (text.length > 50) {
            e.preventDefault();
            e.stopPropagation();
            setPasteWarning(true);
            setTimeout(() => setPasteWarning(false), 3000);
        }
    }, [isStudent, disablePaste, allowLinks]);

    return { handlePasteProtection, pasteWarning };
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
