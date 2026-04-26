import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Plus, Trash2, Save, AlertCircle, Layout, Type, AlignLeft, ExternalLink } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface CarouselItem {
    id: string;
    url: string;
    title: string;
    desc: string;
}

export const LandingPageManager: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
    const [items, setItems] = useState<CarouselItem[]>([]);
    const [newItem, setNewItem] = useState({ url: '', title: '', desc: '' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [bucketFiles, setBucketFiles] = useState<any[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const fetchBucketFiles = useCallback(async () => {
        const { data, error } = await supabase.storage
            .from('Web Bucket')
            .list('landing', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });
        
        if (data && !error) {
            setBucketFiles(data);
        }
    }, []);

    // Load from Supabase
    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'landing_carousel')
                .single();
            
            if (data && !error) {
                setItems(data.value);
            }
        };
        fetchSettings();
        fetchBucketFiles();
    }, [fetchBucketFiles]);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        setStatus(null);

        try {
            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `landing/${fileName}`;

            const { data, error } = await supabase.storage
                .from('Web Bucket')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('Web Bucket')
                .getPublicUrl(filePath);

            setNewItem(prev => ({ ...prev, url: publicUrl }));
            setStatus({ type: 'success', msg: 'Image uploaded successfully!' });
            fetchBucketFiles(); // Refresh list
        } catch (err: any) {
            console.error("Upload error:", err);
            setStatus({ type: 'error', msg: `Upload failed: ${err.message}` });
        } finally {
            setUploading(false);
        }
    };

    // Paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        handleFileUpload(file);
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({ 
                    key: 'landing_carousel', 
                    value: items,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;

            setStatus({ type: 'success', msg: 'Carousel configuration saved to database!' });
            setTimeout(() => setStatus(null), 3000);
            
            window.dispatchEvent(new Event('landing_assets_updated'));
        } catch (err: any) {
            console.error("Save error:", err);
            setStatus({ type: 'error', msg: `Save failed: ${err.message}` });
        }
    };

    const addItem = () => {
        if (!newItem.url || !newItem.title) {
            setStatus({ type: 'error', msg: 'Image and Title are required' });
            return;
        }

        if (editingId) {
            // Update existing
            setItems(items.map(item => item.id === editingId ? { ...newItem, id: editingId } : item));
            setEditingId(null);
        } else {
            // Add new
            const item: CarouselItem = {
                ...newItem,
                id: Math.random().toString(36).substr(2, 9)
            };
            setItems([...items, item]);
        }
        setNewItem({ url: '', title: '', desc: '' });
    };

    const startEdit = (item: CarouselItem) => {
        setNewItem({ url: item.url, title: item.title, desc: item.desc });
        setEditingId(item.id);
        
        // Scroll to form for convenience
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
        if (editingId === id) {
            setEditingId(null);
            setNewItem({ url: '', title: '', desc: '' });
        }
    };

    // --- Drag and Drop Handlers ---
    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        
        // Custom drag image could go here, but opacity change is usually enough
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); 
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const onDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(null);
        
        if (draggedIndex === null || draggedIndex === index) {
            setDraggedIndex(null);
            return;
        }

        const updatedItems = [...items];
        const [movedItem] = updatedItems.splice(draggedIndex, 1);
        updatedItems.splice(index, 0, movedItem);

        setItems(updatedItems);
        setDraggedIndex(null);
    };

    const onDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const inputClass = `w-full px-4 py-2 rounded-lg border text-sm transition-all outline-none ${
        theme === 'light' 
        ? 'bg-white border-slate-200 focus:border-pink-500' 
        : 'bg-[#222] border-white/5 focus:border-pink-500 text-white'
    }`;

    return (
        <div className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5 shadow-2xl'}`}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <ImageIcon size={20} className="text-pink-500" /> Landing Page Assets
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Manage the hero carousel images. Drag items to reorder them!</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                    >
                        <Save size={16} /> Save Changes
                    </button>
                </div>
            </div>

            {status && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                    status.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                    <AlertCircle size={18} />
                    <p className="text-sm font-bold">{status.msg}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Current Items */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center justify-between">
                        Active Slides
                        <span className="text-[9px] lowercase italic opacity-50 font-normal">Drag to reorder</span>
                    </h4>
                    {items.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-gray-500/10 rounded-2xl">
                            <ImageIcon size={32} className="mx-auto text-gray-600 mb-2 opacity-20" />
                            <p className="text-sm text-gray-500 italic">No slides configured</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item, idx) => {
                                const isDragging = draggedIndex === idx;
                                const isDragOver = dragOverIndex === idx && !isDragging;
                                
                                return (
                                <div 
                                    key={item.id} 
                                    draggable
                                    onDragStart={(e) => onDragStart(e, idx)}
                                    onDragOver={(e) => onDragOver(e, idx)}
                                    onDragEnd={onDragEnd}
                                    onDrop={(e) => onDrop(e, idx)}
                                    className={`
                                        group p-3 rounded-xl border flex gap-4 cursor-move transition-all duration-300
                                        ${isDragging ? 'opacity-20 scale-95 grayscale' : 'opacity-100'}
                                        ${isDragOver ? (theme === 'light' ? 'bg-pink-50 border-pink-500 translate-y-1' : 'bg-pink-500/10 border-pink-500/50 translate-y-1') : (theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5')}
                                        hover:shadow-xl relative
                                    `}
                                >
                                    {/* Drop Indicator Line */}
                                    {isDragOver && (
                                        <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-pink-500 rounded-full animate-pulse z-10"></div>
                                    )}

                                    <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-black/20 border border-white/5 shadow-inner">
                                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-[13px] truncate">{item.title}</h5>
                                        <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{item.desc}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => startEdit(item)}
                                            className={`p-2 transition-colors ${editingId === item.id ? 'text-pink-500' : 'text-gray-500 hover:text-blue-500'}`}
                                            title="Edit Slide"
                                        >
                                            <Layout size={14} />
                                        </button>
                                        <button 
                                            onClick={() => removeItem(item.id)}
                                            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                            title="Delete Slide"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>

                {/* Add/Edit Form */}
                <div className={`p-6 rounded-2xl ${theme === 'light' ? 'bg-slate-50' : 'bg-white/5 shadow-inner'}`}>
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                        {editingId ? <ImageIcon size={14} className="text-pink-500" /> : <Plus size={14} />} 
                        {editingId ? 'Edit Slide' : 'Add New Slide'}
                    </h4>
                    
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Hero Image</label>
                            
                            {newItem.url ? (
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden group border border-white/10 shadow-xl">
                                    <img src={newItem.url} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => setNewItem(prev => ({ ...prev, url: '' }))}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
                                        >
                                            Remove & Change
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative group cursor-pointer">
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file);
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={uploading}
                                    />
                                    <div className={`w-full aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all ${
                                        uploading ? 'bg-gray-500/5 border-gray-500/20' : 'bg-white/5 border-white/10 group-hover:border-pink-500/50 group-hover:bg-pink-500/5'
                                    }`}>
                                        {uploading ? (
                                            <>
                                                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-xs font-bold text-gray-500 animate-pulse">Uploading to Web Bucket...</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                                                    <Plus className="text-pink-500" size={24} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold">Click or drag to upload</p>
                                                    <p className="text-[10px] text-gray-500 uppercase mt-1">PNG, JPG, WEBP up to 50MB</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="relative">
                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input 
                                    type="text"
                                    placeholder="Or paste external URL..."
                                    className={`${inputClass} pl-10`}
                                    value={newItem.url}
                                    onChange={e => setNewItem({ ...newItem, url: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Slide Title</label>
                            <div className="relative">
                                <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input 
                                    type="text"
                                    placeholder="e.g. Real-time Collaboration"
                                    className={`${inputClass} pl-10`}
                                    value={newItem.title}
                                    onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Description</label>
                            <div className="relative">
                                <AlignLeft className="absolute left-3 top-4 text-gray-500" size={16} />
                                <textarea 
                                    placeholder="Briefly describe this feature..."
                                    className={`${inputClass} pl-10 h-24 resize-none`}
                                    value={newItem.desc}
                                    onChange={e => setNewItem({ ...newItem, desc: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {editingId && (
                                <button 
                                    onClick={() => {
                                        setEditingId(null);
                                        setNewItem({ url: '', title: '', desc: '' });
                                    }}
                                    className="flex-1 py-3 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded-xl font-bold text-sm transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                            <button 
                                onClick={addItem}
                                className={`flex-[2] py-3 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95 ${
                                    editingId 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' 
                                    : 'bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-black dark:text-white border border-gray-200 dark:border-white/10'
                                }`}
                            >
                                {editingId ? 'Update Slide' : 'Add to Carousel'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Uploads from Bucket */}
            <div className="mt-10 pt-8 border-t border-white/5">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                    <Layout size={14} /> Recent Uploads in Web Bucket
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {bucketFiles.length === 0 ? (
                        <div className="col-span-full py-8 text-center border border-dashed border-white/5 rounded-xl">
                            <p className="text-xs text-gray-500 italic">No files detected in the bucket yet.</p>
                        </div>
                    ) : (
                        bucketFiles.map((file) => {
                            const { data: { publicUrl } } = supabase.storage.from('Web Bucket').getPublicUrl(`landing/${file.name}`);
                            return (
                                <div key={file.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-white/5 hover:border-pink-500/50 transition-all">
                                    <img src={publicUrl} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                        <button 
                                            onClick={() => {
                                                setNewItem(prev => ({ ...prev, url: publicUrl }));
                                                setStatus({ type: 'success', msg: 'URL copied to form!' });
                                            }}
                                            className="px-2 py-1 bg-white text-black text-[10px] font-bold rounded hover:bg-gray-200 transition-all"
                                        >
                                            Pick Image
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                
                <div className="mt-6 p-4 rounded-xl bg-pink-500/5 border border-pink-500/10">
                    <p className="text-[11px] text-pink-400 font-medium">
                        <span className="font-bold">Pro Tip:</span> If you've run the SQL script, click <span className="font-bold text-white">Save Changes</span> at the top right after adding items to make them permanent.
                    </p>
                </div>
            </div>

            {/* Preview Section */}
            <div className="mt-10 pt-8 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 mb-4">
                    <ExternalLink size={14} /> Quick Link
                </div>
                <div className={`p-4 rounded-xl border flex items-center justify-between ${theme === 'light' ? 'bg-blue-50 border-blue-100' : 'bg-blue-500/5 border-blue-500/10'}`}>
                    <p className="text-sm text-blue-500 font-medium">Changes will appear on the landing page for all users after saving.</p>
                    <a href="/" target="_blank" className="text-xs font-bold text-blue-500 hover:underline">View Live Site</a>
                </div>
            </div>
        </div>
    );
};
