import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PenTool, Trash2, Undo, Redo, Eraser, Check } from 'lucide-react';

interface DrawingCanvasProps {
    onSave?: (blob: Blob) => void;
    onClear?: () => void;
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties; // Added to fix TS2322 error
    strokeColor?: string;
    manualSave?: boolean;
}

const COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
    onSave, 
    onClear, 
    width = 500, 
    height = 300, 
    className = "",
    style,
    strokeColor = '#000000',
    manualSave = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const [activeColor, setActiveColor] = useState(strokeColor);
    const [isEraser, setIsEraser] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyStep, setHistoryStep] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if(ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = 3;
                const blank = ctx.getImageData(0, 0, width, height);
                setHistory([blank]);
                setHistoryStep(0);
            }
        }
        setHasContent(false);
        setIsEraser(false);
        setActiveColor(strokeColor);
    }, [width, height, strokeColor]);

    const saveHistoryStep = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setHistory(prev => {
                const newHistory = prev.slice(0, historyStep + 1);
                newHistory.push(data);
                if (newHistory.length > 20) newHistory.shift();
                return newHistory;
            });
            setHistoryStep(prev => {
                const anticipated = history.slice(0, prev + 1).length;
                return anticipated > 19 ? 19 : anticipated;
            });
        }
    };

    const notifySave = () => {
        if (manualSave) return;
        const canvas = canvasRef.current;
        if (canvas && onSave) {
            canvas.toBlob((blob) => { if (blob) onSave(blob); });
        }
    };

    const triggerManualSave = () => {
        const canvas = canvasRef.current;
        if (canvas && onSave) {
            canvas.toBlob((blob) => { if (blob) onSave(blob); });
        }
    };

    const handleUndo = useCallback(() => {
        if (historyStep > 0) {
            const newStep = historyStep - 1;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            const previousState = history[newStep];
            if (canvas && ctx && previousState) {
                ctx.putImageData(previousState, 0, 0);
                setHistoryStep(newStep);
                setHasContent(newStep > 0);
                if (!manualSave) {
                     canvas.toBlob((blob) => { if (blob && onSave) onSave(blob); });
                }
            }
        }
    }, [history, historyStep, onSave, manualSave]);

    const handleRedo = useCallback(() => {
        if (historyStep < history.length - 1) {
            const newStep = historyStep + 1;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            const nextState = history[newStep];
            if (canvas && ctx && nextState) {
                ctx.putImageData(nextState, 0, 0);
                setHistoryStep(newStep);
                setHasContent(newStep > 0);
                if (!manualSave) {
                    canvas.toBlob((blob) => { if (blob && onSave) onSave(blob); });
                }
            }
        }
    }, [history, historyStep, onSave, manualSave]);

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
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY;
        }
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        setIsDrawing(true);
        const { x, y } = getCanvasCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = isEraser ? '#ffffff' : activeColor;
        ctx.lineWidth = isEraser ? 20 : 3;
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
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
            notifySave();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                setHasContent(false);
                saveHistoryStep();
                notifySave();
                if (onClear) onClear();
            }
        }
    };

    return (
        <div className={`flex flex-col gap-3 ${className}`} style={style}>
            <div className="relative rounded-xl overflow-hidden shadow-inner border-2 border-black/5 dark:border-white/10 bg-white cursor-crosshair w-full flex-1 min-h-0">
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
                        className={`p-1.5 rounded-lg transition-colors flex flex-col items-center justify-center ${isEraser ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 dark:text-gray-400'}`}
                    >
                        <Eraser size={16} />
                    </button>
                </div>
                <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                        <PenTool size={12} /> {isEraser ? 'Eraser' : 'Draw'}
                    </div>
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={handleUndo} disabled={historyStep <= 0} className="text-xs text-gray-500 hover:text-blue-500 font-bold px-2 py-1.5 rounded-lg disabled:opacity-30"><Undo size={14} /></button>
                        <button type="button" onClick={handleRedo} disabled={historyStep >= history.length - 1} className="text-xs text-gray-500 hover:text-blue-500 font-bold px-2 py-1.5 rounded-lg disabled:opacity-30"><Redo size={14} /></button>
                        {hasContent && (
                            <>
                                <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1"></div>
                                <button type="button" onClick={clearCanvas} className="text-xs text-red-500 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><Trash2 size={14} /> Clear</button>
                                {manualSave && (
                                     <button type="button" onClick={triggerManualSave} className="text-xs text-white bg-green-600 hover:bg-green-700 font-bold px-4 py-1.5 rounded-lg flex items-center gap-1 ml-2"><Check size={14} /> Done</button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};