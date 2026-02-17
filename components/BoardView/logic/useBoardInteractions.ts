
import React, { useState, useEffect, useCallback } from 'react';
import { Board } from '../../../types';

export const useBoardInteractions = (
    board: Board, 
    isStudent: boolean, 
    isModalOpen: boolean,
    setPendingPasteImage: (file: File | null) => void,
    setIsModalOpen: (isOpen: boolean) => void
) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const isLocked = isStudent && (board.lockMode === 'readonly' || board.lockMode === 'comments_only');

    // Handle CTRL+V (Paste) for images
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            // CRITICAL FIX: Check if the paste event is happening inside an editable field.
            const target = e.target as HTMLElement;
            const isEditable = target.isContentEditable || 
                               target.tagName === 'INPUT' || 
                               target.tagName === 'TEXTAREA' ||
                               target.closest('.ProseMirror, [contenteditable="true"]');

            // If it is editable, or a modal is open, or the board is locked for the user, ignore the global paste.
            if (isEditable || isModalOpen || isLocked) {
                return;
            }
            
            const items = e.clipboardData?.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) {
                            // This is a global paste, open the note creation modal
                            setPendingPasteImage(file);
                            setIsModalOpen(true);
                            e.preventDefault();
                            return;
                        }
                    }
                }
            }
        };
        
        // Use capturing phase to potentially intercept before other listeners
        window.addEventListener('paste', handlePaste, true);
        return () => window.removeEventListener('paste', handlePaste, true);

    }, [isModalOpen, isLocked, setIsModalOpen, setPendingPasteImage]);

    // Drag and Drop Handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (isModalOpen || isLocked) return;
        
        if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
            e.preventDefault(); // Allow drop
            setIsDragOver(true);
        }
    }, [isModalOpen, isLocked]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        if (isDragOver) {
            e.preventDefault();
            setIsDragOver(false);
        }
    }, [isDragOver]);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        if (isModalOpen || isLocked) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                setPendingPasteImage(file);
                setIsModalOpen(true);
            }
        }
    }, [isModalOpen, isLocked, setPendingPasteImage, setIsModalOpen]);

    return {
        isDragOver,
        handleDragOver,
        handleDragLeave,
        handleDrop
    };
};
