
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Check, Trash2, Zap, RotateCw, X, ArrowRightLeft, Pipette } from 'lucide-react';

// --- COLOR UTILITIES ---

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0; 
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToRgb(h: number, s: number, v: number) {
  h /= 360; s /= 100; v /= 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

const COMMON_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', 
  '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E', '#881337',
  '#FFFFFF', '#94A3B8', '#475569', '#000000'
];

// --- CUSTOM COLOR PICKER COMPONENT ---

interface ColorPickerProps {
    color: string;
    onChange: (hex: string) => void;
    onClose: () => void;
}

const CustomColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onClose }) => {
    const [hsv, setHsv] = useState({ h: 0, s: 100, v: 100 });
    const [isDraggingSV, setIsDraggingSV] = useState(false);
    const [isDraggingHue, setIsDraggingHue] = useState(false);
    
    const svRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const nativeInputRef = useRef<HTMLInputElement>(null);

    // Initialize HSV from Hex prop on mount or color change
    useEffect(() => {
        const rgb = hexToRgb(color);
        const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHsv(newHsv);
    }, [color]);

    // Update parent when HSV changes locally
    const updateColor = (h: number, s: number, v: number) => {
        setHsv({ h, s, v });
        const rgb = hsvToRgb(h, s, v);
        onChange(rgbToHex(rgb.r, rgb.g, rgb.b));
    };

    const handleSVMouse = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!svRef.current) return;
        const rect = svRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        
        // S goes from 0 to 100 (left to right)
        // V goes from 100 to 0 (top to bottom)
        updateColor(hsv.h, x * 100, (1 - y) * 100);
    }, [hsv.h]);

    const handleHueMouse = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!hueRef.current) return;
        const rect = hueRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        updateColor(x * 360, hsv.s, hsv.v);
    }, [hsv.s, hsv.v]);

    // Global Event Listeners for Dragging
    useEffect(() => {
        const handleUp = () => {
            setIsDraggingSV(false);
            setIsDraggingHue(false);
        };
        const handleMove = (e: MouseEvent) => {
            if (isDraggingSV) handleSVMouse(e);
            if (isDraggingHue) handleHueMouse(e);
        };

        window.addEventListener('mouseup', handleUp);
        window.addEventListener('mousemove', handleMove);
        return () => {
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('mousemove', handleMove);
        };
    }, [isDraggingSV, isDraggingHue, handleSVMouse, handleHueMouse]);

    return (
        <div className="bg-[#111] border border-white/10 p-3 rounded-xl shadow-2xl w-full animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Color</span>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full p-1"><X size={12} /></button>
            </div>

            {/* Quick Swatches */}
            <div className="grid grid-cols-8 gap-1.5 mb-3">
                {COMMON_COLORS.map(c => (
                    <button
                        key={c}
                        onClick={() => onChange(c)}
                        className={`w-6 h-6 rounded-md border transition-all ${color.toUpperCase() === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
            </div>

            {/* Saturation/Value Area */}
            <div 
                ref={svRef}
                className="w-full h-28 rounded-lg relative cursor-crosshair mb-3 border border-white/10 overflow-hidden shadow-inner"
                style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                onMouseDown={(e) => { setIsDraggingSV(true); handleSVMouse(e); }}
            >
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }}></div>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }}></div>
                <div 
                    className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md -ml-2 -mt-2 pointer-events-none mix-blend-difference"
                    style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
                ></div>
            </div>

            {/* Hue Slider */}
            <div 
                ref={hueRef}
                className="w-full h-3 rounded-full relative cursor-pointer mb-3 border border-white/10 shadow-inner"
                style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
                onMouseDown={(e) => { setIsDraggingHue(true); handleHueMouse(e); }}
            >
                <div 
                    className="absolute w-3 h-3 bg-white rounded-full shadow-md -ml-1.5 top-0 border border-black/10 pointer-events-none"
                    style={{ left: `${(hsv.h / 360) * 100}%` }}
                ></div>
            </div>

            {/* Inputs & Native Picker */}
            <div className="flex gap-2 items-center">
                <div className="flex-1 bg-[#222] rounded-lg border border-white/10 flex items-center px-2 py-1.5 focus-within:border-blue-500 transition-colors">
                    <span className="text-gray-500 text-xs mr-1 select-none">#</span>
                    <input 
                        type="text" 
                        value={color.replace('#', '').toUpperCase()}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9A-F]{0,6}$/i.test(val)) {
                                const fullHex = '#' + val;
                                // Only update visually if valid length, otherwise just let them type
                                if (val.length === 6) {
                                    onChange(fullHex);
                                }
                            }
                        }}
                        className="bg-transparent w-full text-xs font-mono font-bold text-white outline-none"
                    />
                </div>
                
                {/* Native OS Picker Button */}
                <div className="relative">
                    <button 
                        onClick={() => nativeInputRef.current?.click()}
                        className="p-1.5 bg-[#222] border border-white/10 rounded-lg hover:bg-white/10 hover:text-white text-gray-400 transition-colors"
                        title="Use System Picker"
                    >
                        <Pipette size={14} />
                    </button>
                    <input 
                        ref={nativeInputRef}
                        type="color" 
                        value={color}
                        onChange={(e) => onChange(e.target.value.toUpperCase())}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
};

// --- MAIN GENERATOR COMPONENT ---

interface GradientGeneratorProps {
    currentValue?: string;
    onUpdate: (value: string) => void;
    onSave: (gradient: string) => void;
    savedGradients: string[];
    presets: { label: string, value: string }[];
    onDelete: (gradient: string) => void;
}

const parseGradient = (gradStr: string) => {
    const match = gradStr.match(/linear-gradient\((\d+)deg,\s*(#[a-fA-F0-9]{6}),\s*(#[a-fA-F0-9]{6})\)/);
    if (match) {
        return {
            angle: parseInt(match[1], 10),
            start: match[2].toUpperCase(),
            end: match[3].toUpperCase()
        };
    }
    return { angle: 135, start: '#FF0080', end: '#7928CA' }; 
};

export const GradientGenerator: React.FC<GradientGeneratorProps> = ({ 
    currentValue, onUpdate, onSave, savedGradients, presets, onDelete 
}) => {
    const [startColor, setStartColor] = useState('#FF0080');
    const [endColor, setEndColor] = useState('#7928CA');
    const [angle, setAngle] = useState(135);
    
    // UI State for Picker
    const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);
    
    useEffect(() => {
        // Prevent updates from props while user is actively dragging the slider to avoid jitter
        if (isDraggingSlider) return;

        if (currentValue && currentValue.includes('linear-gradient')) {
            const parsed = parseGradient(currentValue);
            setStartColor(parsed.start);
            setEndColor(parsed.end);
            setAngle(parsed.angle);
        }
        // Reset saved state when value changes from external source
        setIsSaved(false);
    }, [currentValue, isDraggingSlider]);

    const currentGradient = `linear-gradient(${angle}deg, ${startColor}, ${endColor})`;

    const updateAll = (s: string, e: string, a: number) => {
        setStartColor(s);
        setEndColor(e);
        setAngle(a);
        onUpdate(`linear-gradient(${a}deg, ${s}, ${e})`);
        setIsSaved(false);
    };

    const handleSwap = () => {
        updateAll(endColor, startColor, angle);
    };

    const handleSaveLocal = () => {
        onSave(currentGradient);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
            
            {/* --- EDITOR SECTION --- */}
            <div className="bg-[#1a1a1a] p-1 rounded-2xl border border-white/5 shadow-xl relative overflow-visible group">
                
                {/* 1. Preview Bar */}
                <div 
                    className="h-24 w-full rounded-xl relative overflow-hidden shadow-inner ring-1 ring-white/5 transition-all duration-300 flex items-center justify-center"
                    style={{ background: currentGradient }}
                >
                    {/* Angle Indicator overlay */}
                    <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white font-mono text-xs font-bold shadow-lg flex items-center gap-2">
                       <RotateCw size={12} className="opacity-70" /> {angle}°
                    </div>
                </div>

                <div className="p-3 space-y-4">
                    {/* 2. Color Stops & Swap */}
                    <div className="flex items-center justify-between gap-4 px-2">
                        
                        {/* Start Node */}
                        <div className="flex flex-col items-center gap-2">
                            <button 
                                onClick={() => setActivePicker(activePicker === 'start' ? null : 'start')}
                                className={`w-12 h-12 rounded-full shadow-lg ring-2 transition-all cursor-pointer relative overflow-hidden group/btn ${activePicker === 'start' ? 'ring-white scale-110' : 'ring-white/20 hover:ring-white/50'}`}
                                style={{ background: startColor }}
                            >
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/btn:opacity-100 flex items-center justify-center transition-opacity">
                                    <Pipette size={16} className="text-white drop-shadow-md" />
                                </div>
                            </button>
                            <span className="text-[10px] font-mono font-bold text-gray-400">START</span>
                        </div>

                        {/* Middle Controls */}
                        <div className="flex-1 flex flex-col items-center gap-3">
                            <button 
                                onClick={handleSwap}
                                className="p-2 rounded-full bg-[#222] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors shadow-sm"
                                title="Swap Colors"
                            >
                                <ArrowRightLeft size={14} />
                            </button>
                            
                            <input 
                                type="range" 
                                min="0" 
                                max="360" 
                                value={angle}
                                onMouseDown={() => setIsDraggingSlider(true)}
                                onMouseUp={() => setIsDraggingSlider(false)}
                                onTouchStart={() => setIsDraggingSlider(true)}
                                onTouchEnd={() => setIsDraggingSlider(false)}
                                onChange={(e) => updateAll(startColor, endColor, parseInt(e.target.value))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                            />
                        </div>

                        {/* End Node */}
                        <div className="flex flex-col items-center gap-2">
                            <button 
                                onClick={() => setActivePicker(activePicker === 'end' ? null : 'end')}
                                className={`w-12 h-12 rounded-full shadow-lg ring-2 transition-all cursor-pointer relative overflow-hidden group/btn ${activePicker === 'end' ? 'ring-white scale-110' : 'ring-white/20 hover:ring-white/50'}`}
                                style={{ background: endColor }}
                            >
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/btn:opacity-100 flex items-center justify-center transition-opacity">
                                    <Pipette size={16} className="text-white drop-shadow-md" />
                                </div>
                            </button>
                            <span className="text-[10px] font-mono font-bold text-gray-400">END</span>
                        </div>
                    </div>

                    {/* 3. Inline Picker Panel */}
                    {activePicker && (
                        <CustomColorPicker 
                            color={activePicker === 'start' ? startColor : endColor} 
                            onChange={(hex) => updateAll(
                                activePicker === 'start' ? hex : startColor,
                                activePicker === 'end' ? hex : endColor,
                                angle
                            )}
                            onClose={() => setActivePicker(null)}
                        />
                    )}

                    {/* 4. Action Button */}
                    {!activePicker && (
                        <button 
                            onClick={handleSaveLocal}
                            disabled={isSaved}
                            className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                                isSaved 
                                ? 'bg-green-500/10 text-green-500 border-green-500/20 cursor-default' 
                                : 'bg-white text-black hover:bg-gray-200 border-transparent shadow-lg shadow-white/5'
                            }`}
                        >
                            {isSaved ? <Check size={16} strokeWidth={3} /> : <Save size={16} strokeWidth={2.5} />}
                            {isSaved ? 'Saved to Library' : 'Save Preset'}
                        </button>
                    )}
                </div>
            </div>

            {/* --- LIBRARY SECTION --- */}
            <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-3 px-1 flex items-center justify-between">
                    <span>Your Library</span>
                    <span className="bg-white/10 px-1.5 py-0.5 rounded text-white">{savedGradients.length}</span>
                </p>
                
                {savedGradients.length === 0 ? (
                    <div className="text-center py-4 border-2 border-dashed border-white/5 rounded-xl text-gray-500 text-xs">
                        No saved gradients yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {savedGradients.map((grad, i) => (
                            <div key={`saved-${i}`} className="group relative aspect-square rounded-xl border border-white/10 hover:border-white/40 transition-all cursor-pointer shadow-sm">
                                <div 
                                    className="absolute inset-0 rounded-xl overflow-hidden"
                                    style={{ background: grad }}
                                    onClick={() => {
                                        const p = parseGradient(grad);
                                        updateAll(p.start, p.end, p.angle);
                                    }}
                                />
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        // Deletion uses strict string matching from the array map
                                        onDelete(grad); 
                                    }}
                                    className="absolute -top-2 -right-2 bg-[#222] text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-white hover:scale-110 shadow-md border border-white/10"
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- PRESETS SECTION --- */}
            <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-3 px-1">Trending Presets</p>
                <div className="grid grid-cols-6 gap-2">
                    {presets.slice(0, 12).map((preset, i) => (
                        <button 
                            key={`preset-${i}`}
                            onClick={() => {
                                const p = parseGradient(preset.value);
                                updateAll(p.start, p.end, p.angle);
                            }}
                            className="aspect-square rounded-full border border-white/5 hover:border-white/30 transition-all relative group overflow-hidden"
                            style={{ background: preset.value }}
                            title={preset.label}
                        >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                                <Zap size={12} className="text-white drop-shadow-md" fill="currentColor"/>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
