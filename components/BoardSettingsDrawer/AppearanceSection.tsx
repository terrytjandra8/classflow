
import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, PaintBucket, Camera, Loader2, UploadCloud, Type, Save, Trash2, Plus, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { Board } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { SOLIDS, GRADIENTS, TEXTURES, IMAGES } from './constants';
import { profileService, UserPreferences } from '../../services/profileService';
import { GradientGenerator } from './GradientGenerator';

interface AppearanceSectionProps {
    board: Board;
    onUpdate: (updates: Partial<Board>) => void;
    prefs: UserPreferences;
    loadPreferences: () => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({ board, onUpdate, prefs, loadPreferences }) => {
    const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
    const [showGradientBuilder, setShowGradientBuilder] = useState(false);
    const [customColor, setCustomColor] = useState('#ffffff');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveColor = async () => {
        await profileService.saveColor(customColor);
        await loadPreferences();
    };

    const handleDeleteColor = async (color: string) => {
        await profileService.deleteColor(color);
        await loadPreferences();
    };

    const handleSaveGradient = async (gradient: string) => {
        await profileService.saveGradient(gradient);
        await loadPreferences();
    };

    const handleDeleteGradient = async (gradient: string) => {
        await profileService.deleteGradient(gradient);
        await loadPreferences();
    };

    const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingWallpaper(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `wallpaper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(fileName);

            onUpdate({ wallpaper: `url('${publicUrl}')` });
        } catch (error: any) {
            console.error("Wallpaper upload failed:", error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploadingWallpaper(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Appearance</h3>
            
            <div className="bg-[#1a1a1a] rounded-xl p-5 border border-white/5 space-y-8">
                
                {/* Wallpaper Section */}
                <div className="space-y-5">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-200">Wallpaper</span>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleWallpaperUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="flex items-center gap-2 text-[10px] font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors text-white border border-white/5"
                            disabled={isUploadingWallpaper}
                        >
                            {isUploadingWallpaper ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={14} />}
                            {isUploadingWallpaper ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>

                    {/* Gradient Builder */}
                    <div className="space-y-3">
                        <div 
                            className="flex items-center justify-between cursor-pointer group"
                            onClick={() => setShowGradientBuilder(!showGradientBuilder)}
                        >
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer group-hover:text-gray-300">
                                <Palette size={12}/> Gradients
                            </label>
                            <button className="text-[10px] font-bold px-2 py-1 rounded transition-colors text-gray-500 group-hover:text-white flex items-center gap-1">
                                {showGradientBuilder ? 'Hide Builder' : 'Open Builder'}
                                {showGradientBuilder ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        </div>
                        
                        {showGradientBuilder ? (
                            <GradientGenerator 
                                currentValue={board.wallpaper}
                                onUpdate={(val) => onUpdate({ wallpaper: val })}
                                onSave={handleSaveGradient}
                                onDelete={handleDeleteGradient}
                                savedGradients={prefs.saved_gradients || []}
                                presets={GRADIENTS}
                            />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {/* Saved Gradients */}
                                {prefs.saved_gradients?.map(grad => (
                                    <button 
                                        key={grad}
                                        onClick={() => onUpdate({ wallpaper: grad })}
                                        className={`w-9 h-9 rounded-lg border border-white/5 shadow-sm transition-all ${board.wallpaper === grad ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1a1a1a]' : 'hover:scale-105'}`}
                                        style={{ background: grad }}
                                        title="Saved Gradient"
                                    />
                                ))}
                                
                                {/* Preset Gradients */}
                                {GRADIENTS.slice(0, 7).map(grad => (
                                    <button 
                                        key={grad.label}
                                        onClick={() => onUpdate({ wallpaper: grad.value })}
                                        className={`w-9 h-9 rounded-lg border border-white/5 shadow-sm transition-all ${board.wallpaper === grad.value ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1a1a1a]' : 'hover:scale-105'}`}
                                        style={{ background: grad.value }}
                                        title={grad.label}
                                    />
                                ))}
                                <button 
                                    onClick={() => setShowGradientBuilder(true)}
                                    className="w-9 h-9 rounded-lg border border-dashed border-white/20 hover:border-white/40 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Solid Colors */}
                    <div className="space-y-3">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center justify-between">
                            <span className="flex items-center gap-1"><PaintBucket size={12}/> Solids</span>
                            {/* Save Button for Current Custom Color */}
                            {customColor && !SOLIDS.includes(customColor) && !prefs.saved_colors?.includes(customColor) && (
                                <button onClick={handleSaveColor} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                                    <Save size={10} /> Save
                                </button>
                            )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors group">
                                <input 
                                    type="color" 
                                    value={customColor}
                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 m-0 border-0"
                                    onChange={(e) => {
                                        setCustomColor(e.target.value);
                                        onUpdate({ wallpaper: e.target.value });
                                    }}
                                    title="Custom Color"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white mix-blend-difference">
                                    <Plus size={16} strokeWidth={3} />
                                </div>
                            </div>
                            
                            {/* Saved Colors */}
                            {prefs.saved_colors?.map(color => (
                                <div key={color} className="relative group">
                                    <button 
                                        onClick={() => {
                                            setCustomColor(color);
                                            onUpdate({ wallpaper: color });
                                        }}
                                        className={`w-9 h-9 rounded-lg border border-white/5 shadow-sm transition-all ${board.wallpaper === color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1a1a1a]' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteColor(color); }}
                                        className="absolute -top-1 -right-1 bg-black/80 text-red-500 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black"
                                    >
                                        <Trash2 size={8} />
                                    </button>
                                </div>
                            ))}

                            {SOLIDS.map(color => (
                                <button 
                                    key={color}
                                    onClick={() => onUpdate({ wallpaper: color })}
                                    className={`w-9 h-9 rounded-lg border border-white/5 shadow-sm transition-all ${board.wallpaper === color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1a1a1a]' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Textures */}
                    <div className="space-y-3">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1"><ImageIcon size={12}/> Textures</label>
                        <div className="flex flex-wrap gap-2">
                            {TEXTURES.map(tex => (
                                <button 
                                    key={tex.id}
                                    onClick={() => onUpdate({ wallpaper: tex.id })}
                                    className={`w-9 h-9 rounded-lg border border-white/5 bg-[#222] shadow-sm transition-all ${board.wallpaper === tex.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1a1a1a]' : 'hover:scale-105'}`}
                                    style={{ backgroundImage: tex.value }}
                                    title={tex.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Pictures */}
                    <div className="space-y-3">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1"><Camera size={12}/> Gallery</label>
                        <div className="flex flex-wrap gap-2">
                            {IMAGES.map(img => (
                                <button 
                                    key={img.id}
                                    onClick={() => onUpdate({ wallpaper: img.id })}
                                    className={`w-14 h-14 md:w-12 md:h-12 rounded-lg border border-white/5 bg-[#222] shadow-sm transition-all bg-cover bg-center ${board.wallpaper === img.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1a1a1a]' : 'hover:scale-105'}`}
                                    style={{ backgroundImage: img.value }}
                                    title={img.label}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 my-2"></div>

                {/* Color Scheme */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-200">Color scheme</span>
                    <div className="bg-[#111] p-1 rounded-lg flex border border-white/10">
                        <button 
                            onClick={() => onUpdate({ colorScheme: 'dark' })}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${board.colorScheme === 'dark' ? 'bg-[#222] text-white shadow ring-1 ring-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Dark
                        </button>
                        <button 
                            onClick={() => onUpdate({ colorScheme: 'light' })}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${board.colorScheme === 'light' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Light
                        </button>
                    </div>
                </div>

                <div className="border-t border-white/5 my-2"></div>

                {/* Font */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-200">Font</span>
                    <div className="bg-[#111] p-1 rounded-lg flex border border-white/10 overflow-x-auto max-w-[200px] no-scrollbar">
                        {(['sans', 'serif', 'mono', 'hand'] as const).map(font => (
                            <button 
                                key={font}
                                onClick={() => onUpdate({ font })}
                                className={`px-3 py-2 md:py-1 text-xs font-bold rounded-md transition-all capitalize whitespace-nowrap ${board.font === font ? 'bg-yellow-500 text-black shadow' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {font}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-white/5 my-2"></div>

                {/* Custom Header Text Color */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-200 flex items-center gap-2"><Type size={16}/> Header Text Color</span>
                    <div className="flex items-center gap-2">
                        {board.textColor && (
                            <button 
                                onClick={() => onUpdate({ textColor: undefined })}
                                className="text-[10px] text-gray-500 hover:text-white underline"
                            >
                                Reset
                            </button>
                        )}
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-white transition-colors">
                            <input 
                                type="color" 
                                value={board.textColor || '#ffffff'}
                                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 m-0 border-0"
                                onChange={(e) => onUpdate({ textColor: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 my-2"></div>

                {/* Custom Post Content Text Color */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-200 flex items-center gap-2"><Type size={16}/> Post Text Color</span>
                    <div className="flex items-center gap-2">
                        {board.contentTextColor && (
                            <button 
                                onClick={() => onUpdate({ contentTextColor: undefined })}
                                className="text-[10px] text-gray-500 hover:text-white underline"
                            >
                                Reset
                            </button>
                        )}
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-white transition-colors">
                            <input 
                                type="color" 
                                value={board.contentTextColor || '#1e293b'}
                                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 m-0 border-0"
                                onChange={(e) => onUpdate({ contentTextColor: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 my-2"></div>

                {/* Disable Modal Blur */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-200">Disable Modal Blur</span>
                    <button
                        onClick={() => onUpdate({ disableModalBlur: !board.disableModalBlur })}
                        className={`relative inline-flex h-6 w-11 items-center flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${board.disableModalBlur ? 'bg-indigo-600' : 'bg-gray-600'}`}>
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${board.disableModalBlur ? 'translate-x-5' : 'translate-x-0'}`}/>
                    </button>
                </div>
            </div>
        </div>
    );
};
