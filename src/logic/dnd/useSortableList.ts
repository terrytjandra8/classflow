
import React, { useState, useCallback } from 'react';

// Generic item interface
interface SortableItem {
    id: string;
    [key: string]: any;
}

interface UseSortableListProps<T extends SortableItem> {
    items: T[];
    onReorder: (newItems: T[]) => void;
}

export const useSortableList = <T extends SortableItem>({ items, onReorder }: UseSortableListProps<T>) => {
    const [draggedItem, setDraggedItem] = useState<T | null>(null);
    const [dragOverItem, setDragOverItem] = useState<T | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent, item: T) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
        // Visual feedback for source
        if (e.currentTarget instanceof HTMLElement) {
             setTimeout(() => {
                 // Use class or style to hide original slightly
                 // e.target.style.opacity = '0.5'; 
                 // Note: Modifying style directly can be tricky with React re-renders, 
                 // but setTimeout allows the drag image to be taken first.
             }, 0);
        }
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent, targetItem: T) => {
        // Prevent default to allow drop
        e.preventDefault(); 
        if (draggedItem && draggedItem.id !== targetItem.id) {
            setDragOverItem(targetItem);
        }
    }, [draggedItem]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault(); // Necessary for drop event to fire
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        if (draggedItem && dragOverItem && draggedItem.id !== dragOverItem.id) {
            const newItems = [...items];
            const draggedIdx = newItems.findIndex(i => i.id === draggedItem.id);
            const targetIdx = newItems.findIndex(i => i.id === dragOverItem.id);
            
            if (draggedIdx > -1 && targetIdx > -1) {
                // Move item
                newItems.splice(draggedIdx, 1);
                newItems.splice(targetIdx, 0, draggedItem);
                onReorder(newItems);
            }
        }
        
        // Reset
        setDraggedItem(null);
        setDragOverItem(null);
    }, [draggedItem, dragOverItem, items, onReorder]);

    return {
        handleDragStart,
        handleDragEnter,
        handleDragOver,
        handleDragEnd,
        draggedItem,
        dragOverItem
    };
};
