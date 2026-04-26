import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Check, Trash2, Zap, RotateCw, X, ArrowRightLeft, Pipette } from 'lucide-react';

// ════════════════════════════════════════════
//  COLOR UTILITIES
// ════════════════════════════════════════════

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
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
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
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

function hsvToHex(h: number, s: number, v: number) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

const SWATCHES = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E', '#881337',
  '#FFFFFF', '#94A3B8', '#475569', '#000000'
];

// ════════════════════════════════════════════
//  COLOR PICKER — 100% DOM-driven pointer
//  The pointer position is NEVER driven by React state.
//  This eliminates snap-back caused by parent re-renders.
// ════════════════════════════════════════════

interface ColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
  onClose: () => void;
}

const CustomColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onClose }) => {
  // All mutable values in one ref — React never drives pointer
  const state = useRef({ h: 0, s: 100, v: 100, drag: null as 'sv' | 'hue' | null });
  const lastEmitted = useRef(color);

  // DOM element refs
  const svAreaRef = useRef<HTMLDivElement>(null);
  const hueBarRef = useRef<HTMLDivElement>(null);
  const svDotRef = useRef<HTMLDivElement>(null);
  const hueDotRef = useRef<HTMLDivElement>(null);
  const svBgRef = useRef<HTMLDivElement>(null);
  const hexInputRef = useRef<HTMLInputElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // ---- Direct DOM paint functions ----
  const paint = useCallback(() => {
    const { h, s, v } = state.current;
    if (svDotRef.current) { svDotRef.current.style.left = `${s}%`; svDotRef.current.style.top = `${100 - v}%`; }
    if (hueDotRef.current) { hueDotRef.current.style.left = `${(h / 360) * 100}%`; }
    if (svBgRef.current) { svBgRef.current.style.backgroundColor = `hsl(${h}, 100%, 50%)`; }
    if (hexInputRef.current) { hexInputRef.current.value = hsvToHex(h, s, v).replace('#', ''); }
  }, []);

  // ---- Emit to parent ----
  const emit = useCallback(() => {
    const hex = hsvToHex(state.current.h, state.current.s, state.current.v);
    lastEmitted.current = hex;
    onChangeRef.current(hex);
  }, []);

  // ---- Set internal HSV from hex (used by swatches, native picker, etc.) ----
  const setFromHex = useCallback((hex: string) => {
    const rgb = hexToRgb(hex);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    state.current.h = hsv.h; state.current.s = hsv.s; state.current.v = hsv.v;
    lastEmitted.current = hex.toUpperCase();
    paint();
  }, [paint]);

  // ---- Mouse handlers ----
  const handleSvMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = svAreaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    state.current.s = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    state.current.v = Math.max(0, Math.min(100, (1 - (e.clientY - r.top) / r.height) * 100));
    paint();
    emit();
  }, [paint, emit]);

  const handleHueMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = hueBarRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    state.current.h = Math.max(0, Math.min(360, ((e.clientX - r.left) / r.width) * 360));
    paint();
    emit();
  }, [paint, emit]);

  // ---- Single global listener (stable, never re-registered) ----
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (state.current.drag === 'sv') handleSvMove(e);
      else if (state.current.drag === 'hue') handleHueMove(e);
    };
    const onUp = () => { state.current.drag = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [handleSvMove, handleHueMove]);

  // ---- Sync from external prop (swatch picked outside, etc.) ----
  useEffect(() => {
    if (state.current.drag) return;
    if (color.toUpperCase() === lastEmitted.current.toUpperCase()) return;
    setFromHex(color);
  }, [color, setFromHex]);

  // ---- Init on mount ----
  useEffect(() => {
    setFromHex(color);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ════════════════════════════════════════════
  //  RENDER — pointer positions set via refs, not state
  // ════════════════════════════════════════════

  return (
    <div className="bg-[#111] border border-white/10 p-3 rounded-xl shadow-2xl w-full animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Color</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full p-1"><X size={12} /></button>
      </div>

      {/* Swatches */}
      <div className="grid grid-cols-8 gap-1.5 mb-3">
        {SWATCHES.map(c => (
          <button key={c} onClick={() => { setFromHex(c); onChange(c); }}
            className={`w-6 h-6 rounded-md border transition-all ${color.toUpperCase() === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-110'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* SV Area */}
      <div ref={svAreaRef} className="w-full h-28 rounded-lg relative cursor-crosshair mb-3 border border-white/10 overflow-hidden shadow-inner"
        onMouseDown={(e) => { state.current.drag = 'sv'; handleSvMove(e); }}
      >
        <div ref={svBgRef} className="absolute inset-0" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }} />
        <div ref={svDotRef} className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md -ml-2 -mt-2 pointer-events-none mix-blend-difference" />
      </div>

      {/* Hue Bar */}
      <div ref={hueBarRef} className="w-full h-3 rounded-full relative cursor-pointer mb-3 border border-white/10 shadow-inner"
        style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
        onMouseDown={(e) => { state.current.drag = 'hue'; handleHueMove(e); }}
      >
        <div ref={hueDotRef} className="absolute w-3 h-3 bg-white rounded-full shadow-md -ml-1.5 top-0 border border-black/10 pointer-events-none" />
      </div>

      {/* Hex Input & Native Picker */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 bg-[#222] rounded-lg border border-white/10 flex items-center px-2 py-1.5 focus-within:border-blue-500 transition-colors">
          <span className="text-gray-500 text-xs mr-1 select-none">#</span>
          <input ref={hexInputRef} type="text" defaultValue={color.replace('#', '').toUpperCase()}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[0-9A-F]{6}$/i.test(val)) { const hex = '#' + val.toUpperCase(); setFromHex(hex); onChange(hex); }
            }}
            className="bg-transparent w-full text-xs font-mono font-bold text-white outline-none"
          />
        </div>
        <div className="relative">
          <button onClick={() => nativeRef.current?.click()} className="p-1.5 bg-[#222] border border-white/10 rounded-lg hover:bg-white/10 hover:text-white text-gray-400 transition-colors" title="System Picker">
            <Pipette size={14} />
          </button>
          <input ref={nativeRef} type="color" value={color}
            onChange={(e) => { const hex = e.target.value.toUpperCase(); setFromHex(hex); onChange(hex); }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
//  GRADIENT GENERATOR
// ════════════════════════════════════════════

interface GradientGeneratorProps {
  currentValue?: string;
  onUpdate: (value: string) => void;
  onSave: (gradient: string) => void;
  savedGradients: string[];
  presets: { label: string; value: string }[];
  onDelete: (gradient: string) => void;
}

const parseGradient = (str: string) => {
  const m = str.match(/linear-gradient\((\d+)deg,\s*(#[a-fA-F0-9]{6}),\s*(#[a-fA-F0-9]{6})\)/);
  return m
    ? { angle: parseInt(m[1], 10), start: m[2].toUpperCase(), end: m[3].toUpperCase() }
    : { angle: 135, start: '#FF0080', end: '#7928CA' };
};

export const GradientGenerator: React.FC<GradientGeneratorProps> = ({
  currentValue, onUpdate, onSave, savedGradients, presets, onDelete,
}) => {
  const [startColor, setStartColor] = useState('#FF0080');
  const [endColor, setEndColor] = useState('#7928CA');
  const [angle, setAngle] = useState(135);
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const lastEmitted = useRef('');
  const rafRef = useRef(0);

  // Sync from external prop changes only
  useEffect(() => {
    if (!currentValue || !currentValue.includes('linear-gradient')) return;
    if (currentValue === lastEmitted.current) return;
    const p = parseGradient(currentValue);
    setStartColor(p.start);
    setEndColor(p.end);
    setAngle(p.angle);
    setIsSaved(false);
  }, [currentValue]);

  const gradientCSS = `linear-gradient(${angle}deg, ${startColor}, ${endColor})`;

  const apply = useCallback((s: string, e: string, a: number) => {
    setStartColor(s);
    setEndColor(e);
    setAngle(a);
    setIsSaved(false);
    const css = `linear-gradient(${a}deg, ${s}, ${e})`;
    lastEmitted.current = css;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => onUpdate(css));
  }, [onUpdate]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const handleSwap = () => apply(endColor, startColor, angle);

  const handleSave = () => {
    onSave(gradientCSS);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
      {/* Editor */}
      <div className="bg-[#1a1a1a] p-1 rounded-2xl border border-white/5 shadow-xl relative overflow-visible group">
        {/* Preview */}
        <div className="h-24 w-full rounded-xl relative overflow-hidden shadow-inner ring-1 ring-white/5 flex items-center justify-center"
          style={{ background: gradientCSS }}>
          <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white font-mono text-xs font-bold shadow-lg flex items-center gap-2">
            <RotateCw size={12} className="opacity-70" /> {angle}°
          </div>
        </div>

        <div className="p-3 space-y-4">
          {/* Color Stops & Slider */}
          <div className="flex items-center justify-between gap-4 px-2">
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => setActivePicker(activePicker === 'start' ? null : 'start')}
                className={`w-12 h-12 rounded-full shadow-lg ring-2 transition-all cursor-pointer relative overflow-hidden group/btn ${activePicker === 'start' ? 'ring-white scale-110' : 'ring-white/20 hover:ring-white/50'}`}
                style={{ background: startColor }}>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/btn:opacity-100 flex items-center justify-center transition-opacity">
                  <Pipette size={16} className="text-white drop-shadow-md" />
                </div>
              </button>
              <span className="text-[10px] font-mono font-bold text-gray-400">START</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-3">
              <button onClick={handleSwap} className="p-2 rounded-full bg-[#222] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors shadow-sm" title="Swap Colors">
                <ArrowRightLeft size={14} />
              </button>
              <input type="range" min="0" max="360" value={angle}
                onChange={(e) => apply(startColor, endColor, parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              <button onClick={() => setActivePicker(activePicker === 'end' ? null : 'end')}
                className={`w-12 h-12 rounded-full shadow-lg ring-2 transition-all cursor-pointer relative overflow-hidden group/btn ${activePicker === 'end' ? 'ring-white scale-110' : 'ring-white/20 hover:ring-white/50'}`}
                style={{ background: endColor }}>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/btn:opacity-100 flex items-center justify-center transition-opacity">
                  <Pipette size={16} className="text-white drop-shadow-md" />
                </div>
              </button>
              <span className="text-[10px] font-mono font-bold text-gray-400">END</span>
            </div>
          </div>

          {/* Inline Picker */}
          {activePicker && (
            <CustomColorPicker
              color={activePicker === 'start' ? startColor : endColor}
              onChange={(hex) => apply(
                activePicker === 'start' ? hex : startColor,
                activePicker === 'end' ? hex : endColor,
                angle,
              )}
              onClose={() => setActivePicker(null)}
            />
          )}

          {/* Save Button */}
          {!activePicker && (
            <button onClick={handleSave} disabled={isSaved}
              className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                isSaved ? 'bg-green-500/10 text-green-500 border-green-500/20 cursor-default'
                  : 'bg-white text-black hover:bg-gray-200 border-transparent shadow-lg shadow-white/5'
              }`}>
              {isSaved ? <Check size={16} strokeWidth={3} /> : <Save size={16} strokeWidth={2.5} />}
              {isSaved ? 'Saved to Library' : 'Save Preset'}
            </button>
          )}
        </div>
      </div>

      {/* Library */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase mb-3 px-1 flex items-center justify-between">
          <span>Your Library</span>
          <span className="bg-white/10 px-1.5 py-0.5 rounded text-white">{savedGradients.length}</span>
        </p>
        {savedGradients.length === 0 ? (
          <div className="text-center py-4 border-2 border-dashed border-white/5 rounded-xl text-gray-500 text-xs">No saved gradients yet.</div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {savedGradients.map((grad, i) => (
              <div key={`saved-${i}`} className="group relative aspect-square rounded-xl border border-white/10 hover:border-white/40 transition-all cursor-pointer shadow-sm">
                <div className="absolute inset-0 rounded-xl overflow-hidden" style={{ background: grad }}
                  onClick={() => { const p = parseGradient(grad); apply(p.start, p.end, p.angle); }} />
                <button onClick={(e) => { e.stopPropagation(); onDelete(grad); }}
                  className="absolute -top-2 -right-2 bg-[#222] text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-white hover:scale-110 shadow-md border border-white/10">
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Presets */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase mb-3 px-1">Trending Presets</p>
        <div className="grid grid-cols-6 gap-2">
          {presets.slice(0, 12).map((preset, i) => (
            <button key={`preset-${i}`}
              onClick={() => { const p = parseGradient(preset.value); apply(p.start, p.end, p.angle); }}
              className="aspect-square rounded-full border border-white/5 hover:border-white/30 transition-all relative group overflow-hidden"
              style={{ background: preset.value }} title={preset.label}>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                <Zap size={12} className="text-white drop-shadow-md" fill="currentColor" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
