
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Eye, Download, Trash2, User, Clock, Hash, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Shield } from 'lucide-react';

interface ImageFile {
    id: string;
    name: string;
    created_at: string;
    metadata: {
        size: number;
        mimetype: string;
        cacheControl: string;
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
    const [currentPage, setCurrentPage] = useState(0);
    const [userRole, setUserRole] = useState<string | null>(null);

    const fetchImages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get current user and their role
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found.");

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;
            setUserRole(profile.role);

            // 2. Fetch all files from the 'uploads' bucket
            const { data: files, error: filesError } = await supabase.storage.from('uploads').list('', {
                limit: 1000, 
                sortBy: { column: 'created_at', order: 'desc' },
            });
            if (filesError) throw filesError;

            const imageFiles = files.filter(f => f.metadata.mimetype.startsWith('image/'));

            // 3. Fetch all notes to find associations
            const { data: notes, error: notesError } = await supabase.from('notes').select('id, board_id, author_id, author, connections, content, type');
            if (notesError) throw notesError;

            // 4. Create a map of images with associated metadata from notes
            let enrichedImages: ImageFile[] = imageFiles.map(file => {
                const publicURL = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/uploads/${file.name}`;
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
                return { ...file, board_id, author_id, author_name, board_title: '' } as ImageFile;
            }).filter(img => img.board_id); // Only include images we can link to a board

            // 5. Filter images based on user role
            if (profile.role === 'teacher') {
                const { data: teacherBoards, error: boardsError } = await supabase
                    .from('boards')
                    .select('id')
                    .eq('author_id', user.id);
                if (boardsError) throw boardsError;
                const teacherBoardIds = new Set(teacherBoards.map(b => b.id));
                enrichedImages = enrichedImages.filter(img => img.board_id && teacherBoardIds.has(img.board_id));
            }

            // 6. Fetch board titles for the filtered images
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
        if (window.confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
            try {
                const { error } = await supabase.storage.from('uploads').remove([imageName]);
                if (error) throw error;
                setImages(images.filter(img => img.name !== imageName));
                setSelectedImage(null);
            } catch (err: any) { alert("Failed to delete image: " + err.message); }
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center p-10 text-white"><RefreshCw className="animate-spin mr-2" /> Loading image data...</div>;
    }
    if (error) {
        return <div className="p-6 bg-red-900/10 border border-red-500/30 text-red-300 rounded-lg flex items-center gap-3"><AlertCircle /> Error: {error}</div>;
    }

    return (
        <div className="bg-[#161616] border-t border-white/5 mt-8 pt-6">
            <div className="px-8 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-white">Image & Asset Manager</h3>
                    <p className="text-sm text-gray-500 pb-6">Browse and manage all uploaded images from student submissions.</p>
                </div>
                 {userRole && <span className="text-xs font-bold uppercase flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400"><Shield size={14}/> {userRole.replace('_',' ')} View</span>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-8">
                {paginatedImages.map(image => {
                    const publicURL = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/uploads/${image.name}`;
                    return (
                        <div key={image.id} className="group relative border border-white/10 rounded-lg overflow-hidden bg-[#1a1a1a] shadow-md aspect-square flex items-center justify-center">
                            <img src={publicURL} alt={image.name} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                <button onClick={() => setSelectedImage(image)} className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700"><Eye size={20} /></button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {images.length === 0 && !loading && (
                 <div className="text-center py-20 px-8">
                    <p className="text-gray-500">No images found.</p>
                    {userRole === 'teacher' && <p className="text-xs text-gray-600 mt-2">Only images from boards you have created are shown here.</p>}
                </div>
            )}

            {images.length > PAGE_SIZE && (
                <div className="flex justify-center items-center gap-4 mt-6 py-4">
                    <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-3 py-1 rounded bg-white/10 disabled:opacity-50"><ChevronLeft size={16} /></button>
                    <span className="text-xs font-bold text-white">Page {currentPage + 1} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1} className="px-3 py-1 rounded bg-white/10 disabled:opacity-50"><ChevronRight size={16} /></button>
                </div>
            )}

            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedImage(null)}>
                    <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl flex gap-6 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="w-2/3 bg-black flex items-center justify-center p-4">
                            <img src={`${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/uploads/${selectedImage.name}`} alt={selectedImage.name} className="max-w-full max-h-[80vh] object-contain" />
                        </div>
                        <div className="w-1/3 p-6 flex flex-col text-white">
                            <h4 className="text-lg font-bold mb-1">Asset Details</h4>
                            <p className="text-xs text-gray-500 break-all mb-4">{selectedImage.name}</p>

                            <div className="space-y-3 text-sm flex-1">
                                <div className="flex items-center gap-3"><Hash size={14} className="text-gray-500" /><span className="font-bold">Size:</span> <span>{(selectedImage.metadata.size / 1024).toFixed(2)} KB</span></div>
                                <div className="flex items-center gap-3"><Clock size={14} className="text-gray-500" /><span className="font-bold">Created:</span> <span>{new Date(selectedImage.created_at).toLocaleString()}</span></div>
                                <hr className="border-white/10"/>
                                {selectedImage.author_name ? 
                                    <div className="flex items-center gap-3"><User size={14} className="text-gray-500" /><span className="font-bold">Author:</span> <span>{selectedImage.author_name}</span></div>
                                    : <div className="text-gray-500 text-xs italic">No author linked</div>
                                }
                                {selectedImage.board_title ?
                                    <div className="flex items-center gap-3"><Eye size={14} className="text-gray-500" /><span className="font-bold">Board:</span> <span>{selectedImage.board_title}</span></div>
                                    : <div className="text-gray-500 text-xs italic">No board linked</div>
                                }
                            </div>

                            <div className="flex gap-3 mt-4">
                                <a href={`${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/uploads/${selectedImage.name}`} download target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"><Download size={16} /> Download</a>
                                <button onClick={() => handleDelete(selectedImage.name)} className="flex-1 bg-red-800 hover:bg-red-700 text-white text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"><Trash2 size={16} /> Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
