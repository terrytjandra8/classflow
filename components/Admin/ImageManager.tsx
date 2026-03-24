
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
    Eye, Download, Trash2, User, Clock, Hash, AlertCircle, RefreshCw, 
    ChevronLeft, ChevronRight, Shield, CheckCircle, X, Search, Maximize2, Calendar
} from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../Dashboard/constants';

// Adjusted interface to match the actual structure from Supabase storage
interface ImageFile {
    id: string;
    name: string;
    created_at: string;
    metadata: {
        [key: string]: any;
    };
    board_id?: string;
    author_id?: string;
    author_name?: string;
    board_title?: string;
}

const PAGE_SIZE = 12;

export const ImageManager: React.FC = () => {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
    const [selectedImageNames, setSelectedImageNames] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [actionStatus, setActionStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{names: string[], type: 'single' | 'bulk'} | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [userRole, setUserRole] = useState<string | null>(null);

    const fetchImages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found.");

            const isSuperAdmin = user.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.trim().toLowerCase();

            let roleStr = 'student';
            if (isSuperAdmin) {
                 roleStr = 'superadmin';
                 setUserRole(roleStr);
            } else {
                 const { data: profile, error: profileError } = await supabase
                     .from('profiles')
                     .select('role')
                     .eq('id', user.id)
                     .single();

                 if (profileError) throw profileError;
                 roleStr = profile.role;
                 setUserRole(roleStr);
            }

            const { data: files, error: filesError } = await supabase.storage.from('uploads').list('', {
                limit: 1000, 
                sortBy: { column: 'created_at', order: 'desc' },
            });
            if (filesError) throw filesError;

            const imageFiles = files.filter(f => f.metadata?.mimetype?.startsWith('image/'));

            const { data: notes, error: notesError } = await supabase.from('notes').select('id, board_id, author_id, author, connections, content, type');
            if (notesError) throw notesError;

            let enrichedImages: ImageFile[] = imageFiles.map((file): ImageFile => {
                let board_id, author_id, author_name;

                const associatedNote = notes.find(note => {
                    if (note.content && typeof note.content === 'string' && note.content.includes(file.name)) return true;
                    if (note.type === 'assessment_submission' && note.connections) {
                        const conns = note.connections as any;
                        if (conns.answers) {
                            for (const key in conns.answers) {
                                const answer = conns.answers[key];
                                if (typeof answer === 'string'){
                                     try {
                                        const parsed = JSON.parse(answer);
                                        if (parsed.drawing && parsed.drawing.includes(file.name)) return true;
                                    } catch (e) {
                                        if (answer.includes(file.name)) return true;
                                    }
                                }
                            }
                        }
                    }
                    return false;
                });

                if (associatedNote) {
                    board_id = associatedNote.board_id;
                    author_id = associatedNote.author_id;
                    author_name = associatedNote.author;
                }
                
                return { 
                    ...file, 
                    board_id, 
                    author_id, 
                    author_name, 
                    board_title: '' 
                };
            });

            if (roleStr !== 'superadmin') {
                enrichedImages = enrichedImages.filter(img => img.board_id); 
            }

            if (roleStr === 'teacher') {
                const { data: teacherBoards, error: boardsError } = await supabase
                    .from('boards')
                    .select('id')
                    .eq('owner_id', user.id);
                if (boardsError) throw boardsError;
                const teacherBoardIds = new Set(teacherBoards.map(b => b.id));
                enrichedImages = enrichedImages.filter(img => img.board_id && teacherBoardIds.has(img.board_id));
            }

            const boardIds = [...new Set(enrichedImages.map(img => img.board_id).filter(Boolean))];
            if (boardIds.length > 0) {
                const { data: boards, error: boardsError } = await supabase.from('boards').select('id, title').in('id', boardIds as string[]);
                if (boardsError) throw boardsError;
                const boardTitleMap = new Map(boards.map(b => [b.id, b.title]));
                enrichedImages.forEach(img => {
                    if (img.board_id) {
                        img.board_title = boardTitleMap.get(img.board_id) || 'Unknown Board';
                    }
                });
            }

            setImages(enrichedImages);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const totalPages = Math.ceil(images.length / PAGE_SIZE);
    const paginatedImages = images.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    const handleDelete = async (imageName: string) => {
        setConfirmDelete({ names: [imageName], type: 'single' });
    }

    const handleBulkDelete = async () => {
        if (selectedImageNames.size === 0) return;
        setConfirmDelete({ names: Array.from(selectedImageNames), type: 'bulk' });
    }

    const executeDeletion = async () => {
        if (!confirmDelete) return;
        const imagesToDelete = confirmDelete.names;
        setIsDeleting(true);
        setActionStatus(null);
        
        try {
            const { data, error: storageError } = await supabase.storage.from('uploads').remove(imagesToDelete);
            if (storageError) throw storageError;
            
            // Update local state
            setImages(prev => prev.filter(img => !imagesToDelete.includes(img.name)));
            
            // Clean up selections
            const newSelection = new Set(selectedImageNames);
            imagesToDelete.forEach(name => newSelection.delete(name));
            setSelectedImageNames(newSelection);
            
            if (confirmDelete.type === 'single') setSelectedImage(null);
            
            setActionStatus({ 
                message: `Successfully deleted ${imagesToDelete.length} image(s).`, 
                type: 'success' 
            });
            setConfirmDelete(null);
        } catch (err: any) {
            setActionStatus({ 
                message: "Failed to delete: " + (err.message || "Unknown error"), 
                type: 'error' 
            });
        } finally {
            setIsDeleting(false);
            setTimeout(() => setActionStatus(null), 5000);
        }
    }

    const toggleSelection = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedImageNames);
        if (newSet.has(name)) newSet.delete(name);
        else newSet.add(name);
        setSelectedImageNames(newSet);
    }

    const selectAll = () => {
        const allNames = images.map(img => img.name);
        setSelectedImageNames(new Set(allNames));
    }

    const selectPage = () => {
        const pageNames = paginatedImages.map(img => img.name);
        const newSet = new Set(selectedImageNames);
        pageNames.forEach(name => newSet.add(name));
        setSelectedImageNames(newSet);
    }

    const deselectAll = () => {
        setSelectedImageNames(new Set());
    }

    return (
        <div className="bg-[#161616] border-t border-white/5 mt-8 pt-6">
            <div className="px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
                           <Shield className="text-pink-500" size={20}/> Storage Ops / Image Manager
                        </h3>
                        <p className="text-sm text-gray-500">Global maintainance view for all stored assets.</p>
                    </div>
                    {!loading && images.length > 0 && (
                        <div className="flex gap-2">
                            <button onClick={selectPage} className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 font-bold px-2 py-1 rounded border border-white/10 transition-colors uppercase">Select Page</button>
                            <button onClick={selectAll} className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 font-bold px-2 py-1 rounded border border-white/10 transition-colors uppercase">Select All ({images.length})</button>
                            {selectedImageNames.size > 0 && (
                                <button onClick={deselectAll} className="text-[10px] bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 font-bold px-2 py-1 rounded border border-pink-500/20 transition-colors uppercase">Deselect All</button>
                            )}
                        </div>
                    )}
                </div>
                {userRole && <span className="text-xs font-bold uppercase flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400"><Shield size={14}/> {userRole.replace('_',' ')} View</span>}
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20 text-white"><RefreshCw className="animate-spin mr-3" /> Fetching Storage Content...</div>
            ) : error ? (
                <div className="p-6 mx-8 mb-8 bg-red-900/10 border border-red-500/30 text-red-300 rounded-lg flex items-center gap-3"><AlertCircle /> Error: {error}</div>
            ) : (
                <div className="flex flex-col">
                    {actionStatus && (
                        <div className={`px-5 py-3 mx-8 mb-4 rounded-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-1 ${actionStatus.type === 'success' ? 'bg-green-900/10 border-green-500/30 text-green-400' : 'bg-red-900/10 border-red-500/30 text-red-400'}`}>
                            {actionStatus.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
                            <span className="font-bold text-sm tracking-wide">{actionStatus.message}</span>
                            <button onClick={() => setActionStatus(null)} className="ml-auto hover:text-white"><X size={14}/></button>
                        </div>
                    )}



                    {selectedImageNames.size > 0 && !confirmDelete && (
                        <div className="px-5 py-3 flex justify-between items-center bg-pink-900/20 border border-pink-500/30 rounded-lg mb-4 mx-8 animate-in fade-in slide-in-from-top-1">
                            <span className="text-pink-300 font-bold text-sm">{selectedImageNames.size} image(s) selected</span>
                            <div className="flex gap-3 items-center">
                                <button onClick={() => setSelectedImageNames(new Set())} className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider">Clear</button>
                                <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg">
                                    <Trash2 size={16} /> Delete Selected
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 px-8 pb-10">
                        {paginatedImages.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                                No storage items found.
                            </div>
                        ) : (
                            paginatedImages.map(image => {
                                const isSelected = selectedImageNames.has(image.name);
                                return (
                                    <div 
                                        key={image.name} 
                                        className={`group relative aspect-square bg-black rounded-xl overflow-hidden border transition-all cursor-pointer ${isSelected ? 'border-pink-500 shadow-lg scale-[0.98]' : 'border-white/5 hover:border-white/20'}`}
                                        onClick={() => setSelectedImage(image)}
                                    >
                                        <img 
                                            src={supabase.storage.from('uploads').getPublicUrl(image.name).data.publicUrl} 
                                            alt={image.name}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        
                                        <div 
                                            className={`absolute top-2 left-2 w-6 h-6 rounded border flex items-center justify-center transition-all z-20 cursor-pointer shadow-sm ${isSelected ? 'bg-pink-500 border-pink-500 scale-110' : 'bg-black/50 border-white/30 hover:border-white/60 hover:bg-black/70'}`}
                                            onClick={(e) => toggleSelection(image.name, e)}
                                            title={isSelected ? "Deselect" : "Select"}
                                        >
                                            {isSelected && <CheckCircle size={16} className="text-white" />}
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                                            <p className="text-[10px] text-gray-300 font-bold truncate">{image.name}</p>
                                            <p className="text-[9px] text-gray-500">{new Date(image.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {images.length > PAGE_SIZE && (
                        <div className="flex justify-center items-center gap-4 mt-2 pb-10">
                            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronLeft size={20}/></button>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Page {currentPage + 1} / {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"><ChevronRight size={20}/></button>
                        </div>
                    )}
                </div>
            )}

            {selectedImage && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in transition-all" onClick={() => setSelectedImage(null)}>
                    <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="md:w-2/3 bg-black flex items-center justify-center p-4 relative min-h-[300px]">
                            <img src={supabase.storage.from('uploads').getPublicUrl(selectedImage.name).data.publicUrl} alt={selectedImage.name} className="max-w-full max-h-full object-contain shadow-2xl" />
                        </div>
                        <div className="md:w-1/3 p-8 flex flex-col text-white bg-[#1c1c1c]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-xl font-bold tracking-tight">Asset Details</h4>
                                    <p className="text-[10px] text-gray-500 font-mono mt-1 break-all uppercase tracking-tighter opacity-70 leading-none">{selectedImage.id}</p>
                                </div>
                                <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
                            </div>

                            <div className="space-y-5 text-sm flex-1">
                                <section>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">File Info</label>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5"><Search size={14} className="text-blue-500" /><span className="text-xs font-medium truncate">{selectedImage.name}</span></div>
                                        <div className="flex items-center gap-3"><Hash size={14} className="text-gray-500" /><span className="text-xs">Size: <span className="font-bold text-gray-300">{selectedImage.metadata?.size ? (selectedImage.metadata.size / 1024).toFixed(2) : '?' } KB</span></span></div>
                                        <div className="flex items-center gap-3"><Calendar size={14} className="text-gray-500" /><span className="text-xs">Created: <span className="font-bold text-gray-300">{new Date(selectedImage.created_at).toLocaleString()}</span></span></div>
                                    </div>
                                </section>

                                <section>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Associations</label>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <User size={14} className="text-gray-500" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500 uppercase font-black">Creator</span>
                                                <span className="text-xs font-bold">{selectedImage.author_name || 'System / Unlinked'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Maximize2 size={14} className="text-gray-500" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500 uppercase font-black">Target Board</span>
                                                <span className="text-xs font-bold truncate max-w-[150px]">{selectedImage.board_title || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
                                <a 
                                    href={supabase.storage.from('uploads').getPublicUrl(selectedImage.name).data.publicUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all uppercase tracking-widest"
                                >
                                    <Eye size={16} /> Preview
                                </a>
                                <button 
                                    onClick={() => handleDelete(selectedImage.name)} 
                                    className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-500 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-red-500/20 transition-all uppercase tracking-widest"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {confirmDelete && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] w-[calc(100%-4rem)] max-w-2xl animate-in zoom-in-95">
                    <div className="px-6 py-5 bg-[#1c1c1c] border border-orange-500/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(234,88,12,0.2)]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/20 rounded-full text-orange-400">
                                <Trash2 size={28} />
                            </div>
                            <div>
                                <h4 className="font-bold text-orange-50 text-lg uppercase tracking-tight">Confirm Deletion</h4>
                                <p className="text-sm text-orange-200/70">Permanently delete <span className="text-white font-black underline">{confirmDelete.names.length}</span> items? This is irreversible.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                disabled={isDeleting}
                                onClick={() => setConfirmDelete(null)} 
                                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs transition-all border border-white/10 uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button 
                                disabled={isDeleting}
                                onClick={executeDeletion} 
                                className="px-8 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg flex items-center gap-2 uppercase tracking-widest"
                            >
                                {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
