import React, { useState, useRef, useCallback } from 'react';

export const useCanvasControls = (
    onNoteMove?: (id: string, x: number, y: number) => void
) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    // Note Dragging State
    const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
    const [noteDragOffset, setNoteDragOffset] = useState({ x: 0, y: 0 });

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const s = Math.exp(-e.deltaY * 0.001);
            setScale(prev => Math.min(Math.max(0.1, prev * s), 5));
        } else {
            setPosition(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    }, []);

    const startPan = useCallback((e: React.MouseEvent) => {
        setIsDraggingCanvas(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    }, []);

    const startDragNote = useCallback((e: React.MouseEvent, id: string, noteX: number, noteY: number) => {
        e.stopPropagation();
        setDraggingNoteId(id);
        setNoteDragOffset({ 
            x: (e.clientX - position.x) / scale - noteX, 
            y: (e.clientY - position.y) / scale - noteY 
        });
    }, [position, scale]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDraggingCanvas) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (draggingNoteId && onNoteMove) {
            const x = (e.clientX - position.x) / scale - noteDragOffset.x;
            const y = (e.clientY - position.y) / scale - noteDragOffset.y;
            onNoteMove(draggingNoteId, x, y);
        }
    }, [isDraggingCanvas, dragStart, draggingNoteId, position, scale, noteDragOffset, onNoteMove]);

    const handleMouseUp = useCallback(() => {
        setIsDraggingCanvas(false);
        setDraggingNoteId(null);
    }, []);

    const resetView = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    const zoomIn = useCallback(() => setScale(s => Math.min(s * 1.2, 5)), []);
    const zoomOut = useCallback(() => setScale(s => Math.max(s / 1.2, 0.1)), []);

    return {
        scale,
        position,
        isDraggingCanvas,
        draggingNoteId,
        handleWheel,
        startPan,
        startDragNote,
        handleMouseMove,
        handleMouseUp,
        resetView,
        zoomIn,
        zoomOut,
        // Expose for connection lines
        transformToCanvas: (clientX: number, clientY: number) => ({
            x: (clientX - position.x) / scale,
            y: (clientY - position.y) / scale
        })
    };
};