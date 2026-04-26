
import { useState, useRef } from 'react';

interface UseSortableListProps<T> {
    items: T[];
    onReorder: (newItems: T[], newIndex: number) => void;
}

export function useSortableList<T>({ items, onReorder }: UseSortableListProps<T>) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);

    const startAutoScroll = (direction: 'prev' | 'next', container: HTMLElement) => {
        if (scrollInterval.current) return;
        const speed = direction === 'next' ? 10 : -10;
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
        
        scrollInterval.current = setInterval(() => {
            if (isMobile) {
                container.scrollLeft += speed;
            } else {
                container.scrollTop += speed;
            }
        }, 16);
    };

    const stopAutoScroll = () => {
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
    };

    const handleEdgeScroll = (clientX: number, clientY: number) => {
        const container = document.querySelector('aside.custom-scrollbar') as HTMLElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
        const threshold = 60;

        if (isMobile) {
            if (clientX > rect.right - threshold) startAutoScroll('next', container);
            else if (clientX < rect.left + threshold) startAutoScroll('prev', container);
            else stopAutoScroll();
        } else {
            if (clientY > rect.bottom - threshold) startAutoScroll('next', container);
            else if (clientY < rect.top + threshold) startAutoScroll('prev', container);
            else stopAutoScroll();
        }
    };

    const calculateTargetIndex = (clientX: number, clientY: number) => {
        const container = document.querySelector('aside.custom-scrollbar') as HTMLElement;
        if (!container) return null;

        const rect = container.getBoundingClientRect();
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
        const itemWidth = 172; // Card (160) + Gap (12)
        const itemHeight = 112; // Card height + Gap

        if (isMobile) {
            const relativeX = clientX - rect.left + container.scrollLeft;
            const index = Math.floor(relativeX / itemWidth);
            return Math.max(0, Math.min(index, items.length - 1));
        } else {
            const relativeY = clientY - rect.top + container.scrollTop;
            const index = Math.floor(relativeY / itemHeight);
            return Math.max(0, Math.min(index, items.length - 1));
        }
    };

    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        setDragOverIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const onDragOver = (e: React.DragEvent, index?: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        handleEdgeScroll(e.clientX, e.clientY);
        
        const targetIndex = calculateTargetIndex(e.clientX, e.clientY);
        if (targetIndex !== null && dragOverIndex !== targetIndex) {
            setDragOverIndex(targetIndex);
        }
    };

    const onDragEnter = (e: React.DragEvent, index?: number) => {
        e.preventDefault();
        const targetIndex = calculateTargetIndex(e.clientX, e.clientY);
        if (targetIndex !== null && dragOverIndex !== targetIndex) {
            setDragOverIndex(targetIndex);
        }
    };

    const handleDragEnd = () => {
        stopAutoScroll();
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            const newItems = [...items];
            const [moved] = newItems.splice(draggedIndex, 1);
            newItems.splice(dragOverIndex, 0, moved);
            onReorder(newItems, dragOverIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const getOffset = (idx: number, itemWidth: number = 140, itemHeight: number = 112) => {
        if (draggedIndex === null || dragOverIndex === null) {
            return { x: 0, y: 0 };
        }

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
        
        // If this is the card being dragged, slide it to the target position
        if (idx === draggedIndex) {
            const diff = dragOverIndex - draggedIndex;
            if (isMobile) return { x: diff * itemWidth, y: 0 };
            return { x: 0, y: diff * itemHeight };
        }

        // For other cards, slide them to make room
        if (isMobile) {
            if (draggedIndex < idx && idx <= dragOverIndex) return { x: -itemWidth, y: 0 };
            if (dragOverIndex <= idx && idx < draggedIndex) return { x: itemWidth, y: 0 };
        } else {
            if (draggedIndex < idx && idx <= dragOverIndex) return { x: 0, y: -itemHeight };
            if (dragOverIndex <= idx && idx < draggedIndex) return { x: 0, y: itemHeight };
        }

        return { x: 0, y: 0 };
    };

    const onTouchStart = (index: number) => {
        setDraggedIndex(index);
        setDragOverIndex(index);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleEdgeScroll(touch.clientX, touch.clientY);
        
        const targetIndex = calculateTargetIndex(touch.clientX, touch.clientY);
        if (targetIndex !== null && dragOverIndex !== targetIndex) {
            setDragOverIndex(targetIndex);
        }
    };

    const onTouchEnd = () => {
        handleDragEnd();
    };

    return {
        draggedIndex,
        dragOverIndex,
        onDragStart,
        onDragOver,
        onDragEnter,
        handleDragEnd,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        getOffset
    };
}
