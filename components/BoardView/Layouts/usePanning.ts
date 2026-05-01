
import { useRef, useCallback } from 'react';

export const usePanning = (scrollContainerRef: React.RefObject<HTMLDivElement>) => {
    const isPanningRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);

    const handlePanningMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 1) return; // Middle mouse button
        e.preventDefault();
        isPanningRef.current = true;
        startXRef.current = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
        scrollLeftRef.current = scrollContainerRef.current?.scrollLeft || 0;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.classList.add('cursor-grabbing');
        }
    }, [scrollContainerRef]);

    const handlePanningMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanningRef.current || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
        const walk = (x - startXRef.current) * 2; // Scroll speed
        scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
    }, [scrollContainerRef]);

    const handlePanningMouseUp = useCallback(() => {
        isPanningRef.current = false;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.classList.remove('cursor-grabbing');
        }
    }, [scrollContainerRef]);

    return {
        handlePanningMouseDown,
        handlePanningMouseMove,
        handlePanningMouseUp
    };
};
