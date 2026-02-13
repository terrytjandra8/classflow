
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
            if (isModalOpen || isLocked) return;
            
            const items = e.clipboardData?.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) {
                            setPendingPasteImage(file);
                            setIsModalOpen(true);
                            e.preventDefault();
                            return;
                        }
                    }
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isModalOpen, isLocked, setIsModalOpen, setPendingPasteImage]);

    // Drag and Drop Handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (isModalOpen || isLocked) return;
        
        // CRITICAL FIX: Only trigger upload overlay if dragging FILES
        // e.dataTransfer.types is an array-like object (DOMStringList)
        if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
            e.preventDefault(); // Allow drop
            setIsDragOver(true);
        }
    }, [isModalOpen, isLocked]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        // Only prevent default if we were actually handling a file drag
        if (isDragOver) {
            e.preventDefault();
            setIsDragOver(false);
        }
    }, [isDragOver]);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        if (isModalOpen || isLocked) return;

        // Only handle if files are present
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            
            const file = e.dataTransfer.files[0];
            // Only accept images for now via drag/drop shortcut
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
