
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Undo2, Redo2, Trash2, Eraser, PenLine, Pen, Highlighter, Brush, Minus } from 'lucide-react';

interface DrawingCanvasProps {
    onDrawEnd?: (blob: Blob) => void;
    onClear?: () => void;
    className?: string;
    style?: React.CSSProperties;
    initialData?: string;
}

// --- Pen Tip Definitions ---
type PenTip = 'ballpoint' | 'marker' | 'pencil' | 'highlighter' | 'calligraphy';

interface PenConfig {
    id: PenTip;
    label: string;
    icon: React.ReactNode;
    lineWidth: number;
    opacity: number;
    compositeOp: GlobalCompositeOperation;
    lineCap: CanvasLineCap;
    lineJoin: CanvasLineJoin;
    pressureVariation: boolean; // simulate pressure
}

const PEN_CONFIGS: PenConfig[] = [
    { id: 'ballpoint', label: 'Ballpoint', icon: <Pen size={16} />, lineWidth: 2, opacity: 1, compositeOp: 'source-over', lineCap: 'round', lineJoin: 'round', pressureVariation: false },
    { id: 'marker', label: 'Marker', icon: <PenLine size={16} />, lineWidth: 8, opacity: 1, compositeOp: 'source-over', lineCap: 'round', lineJoin: 'round', pressureVariation: false },
    { id: 'pencil', label: 'Pencil', icon: <Minus size={16} />, lineWidth: 2, opacity: 0.75, compositeOp: 'source-over', lineCap: 'round', lineJoin: 'round', pressureVariation: true },
    { id: 'highlighter', label: 'Highlighter', icon: <Highlighter size={16} />, lineWidth: 20, opacity: 0.35, compositeOp: 'source-over', lineCap: 'square', lineJoin: 'bevel', pressureVariation: false },
    { id: 'calligraphy', label: 'Calligraphy', icon: <Brush size={16} />, lineWidth: 4, opacity: 0.9, compositeOp: 'source-over', lineCap: 'butt', lineJoin: 'miter', pressureVariation: true },
];

// --- Size Options ---
const SIZES = [
    { label: 'Fine', multiplier: 0.5 },
    { label: 'Medium', multiplier: 1 },
    { label: 'Thick', multiplier: 2 },
    { label: 'Bold', multiplier: 3.5 },
];

// --- Color Palette ---
const COLORS: string[] = [
    '#000000', '#1e293b', '#374151', '#64748b', '#94a3b8', '#ffffff',
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
    '#8b5cf6', '#ec4899', '#0d9488', '#84cc16', '#f59e0b', '#6366f1',
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    onDrawEnd,
    onClear,
    className = '',
    style,
    initialData,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const historyRef = useRef<ImageData[]>([]);
    const historyStepRef = useRef<number>(-1);

    const [isDrawing, setIsDrawing] = useState(false);
    const [activePenId, setActivePenId] = useState<PenTip>('ballpoint');
    const [activeColor, setActiveColor] = useState('#000000');
    const [sizeIdx, setSizeIdx] = useState(1);
    const [isEraser, setIsEraser] = useState(false);
    const [hasContent, setHasContent] = useState(!!initialData);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const getCanvas = () => canvasRef.current;
    const getCtx = () => getCanvas()?.getContext('2d', { willReadFrequently: true }) ?? null;

    const updateHistoryState = useCallback(() => {
        setCanUndo(historyStepRef.current > 0);
        setCanRedo(historyStepRef.current < historyRef.current.length - 1);
    }, []);

    const saveSnapshot = useCallback(() => {
        const canvas = getCanvas();
        const ctx = getCtx();
        if (!canvas || !ctx) return;
        const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Truncate redo history
        historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
        historyRef.current.push(snap);
        if (historyRef.current.length > 30) historyRef.current.shift();
        historyStepRef.current = historyRef.current.length - 1;
        updateHistoryState();
    }, [updateHistoryState]);

    const restoreSnapshot = useCallback((data: ImageData) => {
        const ctx = getCtx();
        const canvas = getCanvas();
        if (!ctx || !canvas) return;
        ctx.putImageData(data, 0, 0);
    }, []);

    const notifyDrawEnd = useCallback(() => {
        const canvas = getCanvas();
        if (canvas && onDrawEnd) {
            canvas.toBlob((blob) => { if (blob) onDrawEnd(blob); }, 'image/png');
        }
    }, [onDrawEnd]);

    const initCanvas = useCallback((width: number, height: number) => {
        const canvas = getCanvas();
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        // Preserve existing content via snapshot
        const prevSnap = historyRef.current[historyStepRef.current];

        canvas.width = width;
        canvas.height = height;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        if (prevSnap && prevSnap.width === width && prevSnap.height === height) {
            ctx.putImageData(prevSnap, 0, 0);
        }
    }, []);

    // Load initial data
    useEffect(() => {
        const canvas = getCanvas();
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        const load = () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (initialData) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    historyRef.current = [snap];
                    historyStepRef.current = 0;
                    updateHistoryState();
                    setHasContent(true);
                };
                img.src = initialData;
            } else {
                const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
                historyRef.current = [blank];
                historyStepRef.current = 0;
                updateHistoryState();
                setHasContent(false);
            }
        };

        // Small delay to ensure canvas container has correct dimensions
        const timer = setTimeout(load, 50);
        return () => clearTimeout(timer);
    }, [initialData]);

    // Resize observer — canvas fills its container
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const ro = new ResizeObserver((entries) => {
            if (!entries.length) return;
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) initCanvas(width, height);
        });
        ro.observe(container);
        return () => ro.disconnect();
    }, [initCanvas]);

    // Build drawing style from active settings
    const applyDrawStyle = useCallback((ctx: CanvasRenderingContext2D) => {
        const pen = PEN_CONFIGS.find(p => p.id === activePenId)!;
        const sizeMultiplier = SIZES[sizeIdx].multiplier;

        if (isEraser) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 20 * sizeMultiplier;
            ctx.globalAlpha = 1;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        } else {
            ctx.globalCompositeOperation = pen.compositeOp;
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = pen.lineWidth * sizeMultiplier;
            ctx.globalAlpha = pen.opacity;
            ctx.lineCap = pen.lineCap;
            ctx.lineJoin = pen.lineJoin;
        }
    }, [activePenId, activeColor, sizeIdx, isEraser]);

    const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = getCanvas();
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let clientX: number, clientY: number;
        if ('touches' in e) {
            if (!e.touches[0]) return { x: 0, y: 0 };
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const ctx = getCtx();
        if (!ctx) return;
        applyDrawStyle(ctx);
        const { x, y } = getCoords(e);
        lastPoint.current = { x, y };
        ctx.beginPath();
        ctx.moveTo(x, y);
        // Draw a dot on click
        ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        if (!hasContent) setHasContent(true);
    }, [applyDrawStyle, hasContent]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing) return;
        const ctx = getCtx();
        if (!ctx) return;

        const { x, y } = getCoords(e);
        const pen = PEN_CONFIGS.find(p => p.id === activePenId)!;

        if (pen.pressureVariation && !isEraser && lastPoint.current) {
            // Simulate calligraphy / pencil pressure by varying opacity
            const dx = x - lastPoint.current.x;
            const dy = y - lastPoint.current.y;
            const speed = Math.sqrt(dx * dx + dy * dy);
            const pressureAlpha = Math.min(pen.opacity, Math.max(0.15, pen.opacity - speed * 0.005));
            ctx.globalAlpha = pressureAlpha;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        lastPoint.current = { x, y };
    }, [isDrawing, activePenId, isEraser]);

    const stopDrawing = useCallback(() => {
        if (!isDrawing) return;
        const ctx = getCtx();
        if (ctx) {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        }
        setIsDrawing(false);
        lastPoint.current = null;
        saveSnapshot();
        notifyDrawEnd();
    }, [isDrawing, saveSnapshot, notifyDrawEnd]);

    const handleUndo = useCallback(() => {
        if (historyStepRef.current <= 0) return;
        historyStepRef.current--;
        const snap = historyRef.current[historyStepRef.current];
        if (snap) restoreSnapshot(snap);
        updateHistoryState();
        setHasContent(historyStepRef.current > 0 || !!initialData);
        notifyDrawEnd();
    }, [restoreSnapshot, updateHistoryState, initialData, notifyDrawEnd]);

    const handleRedo = useCallback(() => {
        if (historyStepRef.current >= historyRef.current.length - 1) return;
        historyStepRef.current++;
        const snap = historyRef.current[historyStepRef.current];
        if (snap) restoreSnapshot(snap);
        updateHistoryState();
        setHasContent(true);
        notifyDrawEnd();
    }, [restoreSnapshot, updateHistoryState, notifyDrawEnd]);

    const clearCanvas = useCallback(() => {
        const canvas = getCanvas();
        const ctx = getCtx();
        if (!canvas || !ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasContent(false);
        saveSnapshot();
        notifyDrawEnd();
        if (onClear) onClear();
    }, [saveSnapshot, notifyDrawEnd, onClear]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
                if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); handleRedo(); }
            }
            if (e.key === 'e') setIsEraser(v => !v);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleUndo, handleRedo]);

    const activePen = PEN_CONFIGS.find(p => p.id === activePenId)!;
    const previewSize = activePen.lineWidth * SIZES[sizeIdx].multiplier * (activePen.id === 'highlighter' ? 0.6 : 1);

    return (
        <div className={`flex h-full ${className}`} style={style}>
            {/* === LEFT TOOLBAR === */}
            <div className="flex flex-col gap-2 p-2 bg-[#1e1e1e] border-r border-white/10 shrink-0 overflow-y-auto no-scrollbar w-[68px]">
                
                {/* Pen Tips */}
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest text-center font-bold mb-0.5">Tip</span>
                    {PEN_CONFIGS.map(pen => (
                        <button
                            key={pen.id}
                            onClick={() => { setActivePenId(pen.id); setIsEraser(false); }}
                            title={pen.label}
                            className={`flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                activePenId === pen.id && !isEraser
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {pen.icon}
                            <span className="leading-none">{pen.label}</span>
                        </button>
                    ))}
                    <button
                        onClick={() => setIsEraser(v => !v)}
                        title="Eraser (E)"
                        className={`flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            isEraser
                                ? 'bg-pink-600 text-white shadow-md shadow-pink-900/50'
                                : 'text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        <Eraser size={16} />
                        <span className="leading-none">Eraser</span>
                    </button>
                </div>

                <div className="w-full h-px bg-white/10 my-1" />

                {/* Stroke Size */}
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest text-center font-bold mb-0.5">Size</span>
                    {SIZES.map((s, i) => {
                        const dotSize = Math.max(3, Math.min(18, activePen.lineWidth * s.multiplier * (activePen.id === 'highlighter' ? 0.5 : 1)));
                        return (
                            <button
                                key={s.label}
                                onClick={() => setSizeIdx(i)}
                                title={s.label}
                                className={`flex items-center justify-center h-8 rounded-lg transition-all ${
                                    sizeIdx === i
                                        ? 'bg-white/15 ring-1 ring-white/30'
                                        : 'hover:bg-white/5'
                                }`}
                            >
                                <div
                                    className="rounded-full"
                                    style={{
                                        width: dotSize,
                                        height: dotSize,
                                        backgroundColor: isEraser ? '#fff' : activeColor,
                                        opacity: isEraser ? 0.5 : 1,
                                    }}
                                />
                            </button>
                        );
                    })}
                </div>

                <div className="w-full h-px bg-white/10 my-1" />

                {/* Undo / Redo / Clear */}
                <div className="flex flex-col gap-1">
                    <button
                        onClick={handleUndo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                        className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg text-[10px] font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                        <Undo2 size={16} />
                        <span className="leading-none">Undo</span>
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                        className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg text-[10px] font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                        <Redo2 size={16} />
                        <span className="leading-none">Redo</span>
                    </button>
                    {hasContent && (
                        <button
                            onClick={clearCanvas}
                            title="Clear canvas"
                            className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg text-[10px] font-bold text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all"
                        >
                            <Trash2 size={16} />
                            <span className="leading-none">Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {/* === CANVAS AREA === */}
            <div className="flex flex-col flex-1 min-w-0 min-h-0">
                {/* Color palette bar — compact horizontal strip */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] border-b border-white/10 shrink-0 flex-wrap">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => { setActiveColor(c); setIsEraser(false); }}
                            title={c}
                            className={`rounded-full border-2 transition-all shrink-0 ${
                                activeColor === c && !isEraser
                                    ? 'scale-125 border-blue-400 ring-2 ring-blue-500/40 shadow-sm'
                                    : 'border-transparent hover:scale-110 hover:border-white/30'
                            }`}
                            style={{
                                width: 20,
                                height: 20,
                                backgroundColor: c,
                                boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px rgba(255,255,255,0.3)' : undefined,
                            }}
                        />
                    ))}
                    {/* Live preview of current brush */}
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                        <div className="flex items-center justify-center w-10 h-7 rounded bg-white/10 border border-white/10">
                            <div
                                className="rounded-full"
                                style={{
                                    width: Math.max(3, Math.min(22, previewSize)),
                                    height: Math.max(3, Math.min(22, previewSize)),
                                    backgroundColor: isEraser ? '#fff' : activeColor,
                                    opacity: isEraser ? 0.5 : activePen.opacity,
                                    border: isEraser ? '1px dashed rgba(255,255,255,0.4)' : undefined,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* The actual canvas */}
                <div
                    ref={containerRef}
                    className="flex-1 min-h-0 relative bg-white"
                    style={{ cursor: isEraser ? 'cell' : 'crosshair' }}
                >
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="absolute inset-0 w-full h-full block touch-none"
                    />
                </div>
            </div>
        </div>
    );
};