
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PenTool, Trash2, Undo, Redo, Eraser } from 'lucide-react';

interface DrawingCanvasProps {
    onDrawEnd?: (blob: Blob) => void;
    onClear?: () => void;
    className?: string;
    style?: React.CSSProperties;
    strokeColor?: string;
    initialData?: string;
}

const COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
const STROKE_SIZES = [3, 6, 12];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
    onDrawEnd, 
    onClear, 
    className = "",
    style,
    strokeColor = '#000000',
    initialData
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(!!initialData);
    const [activeColor, setActiveColor] = useState(strokeColor);
    const [strokeWidth, setStrokeWidth] = useState(STROKE_SIZES[0]);
    const [isEraser, setIsEraser] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyStep, setHistoryStep] = useState(0);

    const getCanvas = () => canvasRef.current;
    const getCtx = () => getCanvas()?.getContext('2d', { willReadFrequently: true });

    const redrawCanvasState = (imgData: ImageData) => {
        const ctx = getCtx();
        const canvas = getCanvas();
        if (ctx && canvas) {
            ctx.putImageData(imgData, 0, 0);
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            const canvas = getCanvas();
            if (canvas && (canvas.width !== width || canvas.height !== height)) {
                const lastState = history[historyStep];
                canvas.width = width;
                canvas.height = height;
                const ctx = getCtx();
                if (ctx) {
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    if (lastState) redrawCanvasState(lastState);
                }
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [history, historyStep]);


    useEffect(() => {
        const ctx = getCtx();
        const canvas = getCanvas();
        if (ctx && canvas) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (initialData) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    setHistory([initial]);
                    setHistoryStep(0);
                    setHasContent(true);
                };
                img.src = initialData;
            } else {
                const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setHistory([blank]);
                setHistoryStep(0);
                setHasContent(false);
            }
        }
        setActiveColor(strokeColor);
        setIsEraser(false);
    }, [strokeColor, initialData]);

    useEffect(() => {
        const ctx = getCtx();
        if (ctx) {
            ctx.lineWidth = isEraser ? 20 : strokeWidth;
            ctx.strokeStyle = isEraser ? '#ffffff' : activeColor;
        }
    }, [strokeWidth, activeColor, isEraser]);

    const saveHistoryStep = () => {
        const canvas = getCanvas();
        const ctx = getCtx();
        if (canvas && ctx) {
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const newHistory = history.slice(0, historyStep + 1);
            newHistory.push(data);
            if (newHistory.length > 20) newHistory.shift();
            setHistory(newHistory);
            setHistoryStep(newHistory.length - 1);
        }
    };

    const notifyDrawEnd = useCallback(() => {
        const canvas = getCanvas();
        if (canvas && onDrawEnd) {
            canvas.toBlob((blob) => { if (blob) onDrawEnd(blob); });
        }
    }, [onDrawEnd]);

    const handleUndo = useCallback(() => {
        if (historyStep > 0) {
            const newStep = historyStep - 1;
            const prevState = history[newStep];
            if (prevState) {
                redrawCanvasState(prevState);
                setHistoryStep(newStep);
                setHasContent(newStep > 0 || !!initialData);
                notifyDrawEnd();
            }
        }
    }, [history, historyStep, notifyDrawEnd, initialData]);

    const handleRedo = useCallback(() => {
        if (historyStep < history.length - 1) {
            const newStep = historyStep + 1;
            const nextState = history[newStep];
            if (nextState) {
                redrawCanvasState(nextState);
                setHistoryStep(newStep);
                setHasContent(true);
                notifyDrawEnd();
            }
        }
    }, [history, historyStep, notifyDrawEnd]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                const key = e.key.toLowerCase();
                if (key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
                if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); handleRedo(); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = getCanvas();
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = 'touches' in e && e.touches[0] ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e && e.touches[0] ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const ctx = getCtx();
        if (!ctx) return;
        setIsDrawing(true);
        const { x, y } = getCanvasCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing) return;
        const ctx = getCtx();
        if (!ctx) return;
        const { x, y } = getCanvasCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (!hasContent) setHasContent(true);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveHistoryStep();
            notifyDrawEnd();
        }
    };

    const clearCanvas = () => {
        const canvas = getCanvas();
        const ctx = getCtx();
        if (canvas && ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            setHasContent(false);
            saveHistoryStep();
            notifyDrawEnd();
            if (onClear) onClear();
        }
    };

    return (
        <div className={`flex flex-col gap-3 ${className}`} style={style}>
            <div ref={containerRef} className="relative rounded-xl overflow-hidden shadow-inner border-2 border-black/5 dark:border-white/10 bg-white cursor-crosshair w-full flex-1 min-h-0">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                    className="w-full h-full block touch-none"
                />
            </div>
            <div className="flex flex-col gap-3 px-1 shrink-0 pb-2">
                <div className="flex items-center justify-center gap-3 bg-black/5 dark:bg-white/5 p-2 rounded-xl">
                    {COLORS.map(c => (
                        <button key={c} onClick={() => { setActiveColor(c); setIsEraser(false); }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === c && !isEraser ? 'scale-125 border-white ring-2 ring-black/20 shadow-sm' : 'border-transparent hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                    <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1"></div>
                    <button onClick={() => setIsEraser(!isEraser)}
                        className={`p-1.5 rounded-lg transition-colors flex flex-col items-center justify-center ${isEraser ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 dark:text-gray-400'}`}>
                        <Eraser size={16} />
                    </button>
                </div>
                 <div className="flex items-center justify-center gap-3 bg-black/5 dark:bg-white/5 p-2 rounded-xl">
                    {STROKE_SIZES.map(size => (
                        <button key={size} onClick={() => setStrokeWidth(size)}
                            className={`h-8 rounded-lg flex items-center justify-center transition-all ${strokeWidth === size && !isEraser ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/10'}`}>
                            <div className="w-6 h-6 flex items-center justify-center">
                                <div className="rounded-full" style={{ width: size, height: size, backgroundColor: 'black' }} />
                            </div>
                        </button>
                    ))}
                </div>
                <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-400 flex items-center gap-1 font-medium"><PenTool size={12} /> {isEraser ? 'Eraser' : 'Draw'}</div>
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={handleUndo} disabled={historyStep <= 0} className="text-xs text-gray-500 hover:text-blue-500 font-bold px-2 py-1.5 rounded-lg disabled:opacity-30"><Undo size={14} /></button>
                        <button type="button" onClick={handleRedo} disabled={historyStep >= history.length - 1} className="text-xs text-gray-500 hover:text-blue-500 font-bold px-2 py-1.5 rounded-lg disabled:opacity-30"><Redo size={14} /></button>
                        {hasContent && (<><div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1"></div><button type="button" onClick={clearCanvas} className="text-xs text-red-500 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><Trash2 size={14} /> Clear</button></>)}
                    </div>
                </div>
            </div>
        </div>
    );
};