
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X, Image, Link, Type, PenTool, UploadCloud, ShieldAlert, Palette, Edit3, Check } from 'lucide-react';
import { NoteColor, NoteType, Note } from '../types';
import { supabase } from '../services/supabaseClient';
import { RichTextEditor } from './RichTextEditor';
import { DrawingCanvas } from './ui/DrawingCanvas';
import { getColorName, NOTE_COLORS } from '../utils/theme';
import { useBoard } from './BoardView/BoardContext'; // Import context
import { usePasteProtection } from '../hooks/useSecurity'; // Import security hook

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (noteData: { title: string; content: string; author: string; color: NoteColor; type: NoteType; attachmentUrl?: string }) => void;
  initialImage?: File | null;
  defaultAuthor?: string;
  disablePaste?: boolean; 
  allowLinks?: boolean; 
  isStudent?: boolean; 
  noteToEdit?: Note | null;
}

// Exclude transparent from user selection
const COLORS = Object.values(NOTE_COLORS).filter(c => c !== NOTE_COLORS.TRANSPARENT);

// --- Sub-Components (Memoized) ---

const ToolButton: React.FC<{ active: boolean, icon: any, label: string, onClick: () => void }> = memo(({ active, icon: Icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${active ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
    >
        <Icon size={16} className={active ? "text-indigo-600" : ""} />
        <span>{label}</span>
    </button>
));

const ColorOrb: React.FC<{ color: NoteColor, selected: boolean, onClick: () => void }> = memo(({ color, selected, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const name = getColorName(color);

    return (
        <div className="relative flex flex-col items-center group">
            {/* Custom Aesthetic Tooltip */}
            <div 
                className={`absolute -top-10 z-50 transition-all duration-300 transform ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90 pointer-events-none'}`}
            >
                <div className="bg-black/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-2xl border border-white/10 whitespace-nowrap tracking-wide">
                    {name}
                    {/* Tiny Arrow */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/10"></div>
                </div>
            </div>

            <button 
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                    w-8 h-8 rounded-full transition-all duration-300 relative shrink-0
                    ${color} 
                    ${selected 
                        ? 'ring-2 ring-white scale-110 z-10 shadow-[0_0_15px_rgba(255,255,255,0.5)]' 
                        : 'hover:scale-110 hover:ring-2 hover:ring-white/20 hover:z-10'
                    }
                `}
            >
                {selected && (
                    <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-200">
                        <Check size={14} className="text-slate-900" strokeWidth={3} />
                    </div>
                )}
            </button>
        </div>
    );
});

// --- Main Component ---

export const CreateNoteModal: React.FC<CreateNoteModalProps> = memo(({ isOpen, onClose, onSubmit, initialImage, defaultAuthor, disablePaste, allowLinks, isStudent, noteToEdit }) => {
  // Context for Typing Indicator
  const { setTypingStatus } = useBoard();

  // State
  const [activeMode, setActiveMode] = useState<NoteType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Random color from solid colors only - Safely initialized
  const [selectedColor, setSelectedColor] = useState<NoteColor>(() => {
      if (COLORS.length > 0) return COLORS[Math.floor(Math.random() * COLORS.length)];
      return NOTE_COLORS.YELLOW; // Fallback
  });
  
  const [attachmentUrl, setAttachmentUrl] = useState('');
  
  // Media State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [drawingBlob, setDrawingBlob] = useState<Blob | null>(null);
  const [drawingUrl, setDrawingUrl] = useState<string | null>(null);
  
  // Status
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [author, setAuthor] = useState(defaultAuthor || 'Student');

  // Drag State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const isEditing = !!noteToEdit;

  // Use Security Hook
  const { handlePasteProtection, pasteWarning } = usePasteProtection(isStudent, disablePaste, allowLinks);

  // --- Effects ---

  useEffect(() => {
      const fetchIdentity = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              // We prioritize the profile name if available, otherwise metadata
              const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
              setAuthor(profile?.full_name || user.user_metadata?.full_name || defaultAuthor || 'Student');
          }
      };
      if (isOpen && !isEditing) fetchIdentity(); // Only fetch if creating new
      if (isOpen && isEditing && noteToEdit) setAuthor(noteToEdit.author);
  }, [isOpen, defaultAuthor, isEditing, noteToEdit]);

  useEffect(() => {
    if (isOpen) {
      // Reset position on open
      setPosition({ x: 0, y: 0 });
      
      if (noteToEdit) {
          // Pre-fill for Editing
          setTitle(noteToEdit.title || '');
          setContent(noteToEdit.content || '');
          setSelectedColor(noteToEdit.color as NoteColor);
          
          if (noteToEdit.type === 'image') {
              setActiveMode('image');
              setImageBase64(noteToEdit.content);
          } else if (noteToEdit.type === 'drawing') {
              setActiveMode('drawing');
              setDrawingUrl(noteToEdit.content); 
          } else if (noteToEdit.type === 'link') {
              setActiveMode('link');
              setAttachmentUrl(noteToEdit.attachmentUrl || '');
          } else {
              setActiveMode(noteToEdit.type as NoteType);
          }
      } else if (initialImage) {
          processImageFile(initialImage);
          setActiveMode('image');
      } else {
          // Reset
          setTitle('');
          setContent('');
          setImageBase64(null);
          setImageFile(null);
          setDrawingBlob(null);
          setDrawingUrl(null);
          setAttachmentUrl('');
          setActiveMode('text');
          // Pick a random solid color for new notes
          if (COLORS.length > 0) {
              setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)] as NoteColor);
          } else {
              setSelectedColor(NOTE_COLORS.YELLOW as NoteColor);
          }
      }
    } else {
        // Ensure typing status is cleared when modal closes
        setTypingStatus(false);
    }
  }, [isOpen, initialImage, noteToEdit]);

  // --- Handlers ---

  const handleTyping = () => {
      if (isStudent) {
          setTypingStatus(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
              setTypingStatus(false);
          }, 2000); // 2s debounce
      }
  };

  const processImageFile = (file: File) => {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
  };

  const handleUploadFile = async (file: File | Blob): Promise<string | null> => {
      const fileExt = file instanceof File ? file.name.split('.').pop() : 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const { error } = await supabase.storage.from('uploads').upload(fileName, file);
      if (error) {
          alert(`Upload failed: ${error.message}`);
          return null;
      }
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
      return publicUrl;
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    setTypingStatus(false); // Immediate stop typing
    try {
        let finalContent = content;
        let finalType: NoteType = activeMode;

        // Mode Specific Logic
        if (activeMode === 'image') {
            if (imageFile) {
                const url = await handleUploadFile(imageFile);
                if (!url) throw new Error("Image upload failed");
                finalContent = url;
            } else if (imageBase64) {
                finalContent = imageBase64;
            } else if (!isEditing) {
                return; // Nothing to post
            }
            finalType = 'image';
        } 
        else if (activeMode === 'drawing') {
            if (drawingBlob) {
                const url = await handleUploadFile(drawingBlob);
                if (!url) throw new Error("Drawing upload failed");
                finalContent = url;
            } else if (drawingUrl) {
                finalContent = drawingUrl; // Keep existing drawing
            } else {
                return;
            }
        }
        else if (activeMode === 'link') {
            if (!attachmentUrl && !isEditing) return;
        }
        else if (activeMode === 'text') {
            if (!content && !title && !isEditing) return;
        }

        await onSubmit({
            title,
            content: finalContent,
            author,
            color: selectedColor,
            type: finalType,
            attachmentUrl: activeMode === 'link' ? attachmentUrl : undefined
        });
        onClose();
    } catch (e) {
        console.error(e);
        alert("Failed to save note.");
    } finally {
        setIsUploading(false);
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
      // Image paste handling first (not covered by usePasteProtection)
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
              const file = items[i].getAsFile();
              if (file) {
                  processImageFile(file);
                  setActiveMode('image');
                  e.preventDefault();
                  return;
              }
          }
      }

      if (activeMode === 'link') return; // Allow paste in link mode

      // Use text protection hook
      handlePasteProtection(e);
  };

  // --- Drag Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
      // Only drag if clicking the header itself, not buttons inside
      if ((e.target as HTMLElement).closest('button')) return;
      
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate new position
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      
      setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
      setIsDragging(false);
  }, []);

  useEffect(() => {
      if (isDragging) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      } else {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
        
        {/* Main Card - Now Draggable */}
        <div 
            ref={modalRef}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            className="relative w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 transition-shadow"
        >
            
            {/* Ambient Aurora Effect */}
            <div className="absolute inset-0 pointer-events-none z-0 rounded-3xl overflow-hidden">
                <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
            </div>

            {/* Paste Warning */}
            {pasteWarning && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
                    <ShieldAlert size={14} /> No copy-pasting allowed!
                </div>
            )}

            {/* --- Header / Tabs --- */}
            <div 
                className="relative z-10 p-6 pb-2 border-b border-white/5 cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
            >
                {/* Drag Handle Indicator */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full"></div>

                <div className="flex justify-between items-center mb-6 pt-2">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 pointer-events-none">
                        {isEditing ? <Edit3 size={18} className="text-blue-400" /> : <Edit3 size={18} className="text-yellow-400" />}
                        {isEditing ? 'Edit Note' : 'Create'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Mode Selector */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2" onMouseDown={e => e.stopPropagation()}>
                    <ToolButton active={activeMode === 'text'} icon={Type} label="Text" onClick={() => setActiveMode('text')} />
                    <ToolButton active={activeMode === 'image'} icon={Image} label="Image" onClick={() => setActiveMode('image')} />
                    <ToolButton active={activeMode === 'drawing'} icon={PenTool} label="Draw" onClick={() => setActiveMode('drawing')} />
                    <ToolButton active={activeMode === 'link'} icon={Link} label="Link" onClick={() => setActiveMode('link')} />
                </div>
            </div>

            {/* --- Content Area (Scrollable) --- */}
            <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-6 min-h-[300px] bg-black/20" onMouseDown={e => e.stopPropagation()}>
                
                {/* Title Input (Common) */}
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); handleTyping(); }}
                    placeholder="Add a title..."
                    className="w-full bg-transparent text-2xl font-bold text-white placeholder-white/20 outline-none mb-4"
                    autoFocus={activeMode === 'text' && !isEditing}
                    onPaste={onPaste}
                />

                {/* TEXT MODE */}
                {activeMode === 'text' && (
                    <div className="h-full min-h-[200px]">
                        <RichTextEditor 
                            value={content} 
                            onChange={(val) => { setContent(val); handleTyping(); }}
                            placeholder="Type something amazing..."
                            className="w-full h-full bg-transparent text-lg text-white/80 placeholder-white/20 outline-none leading-relaxed"
                            onPaste={onPaste}
                        />
                    </div>
                )}

                {/* IMAGE MODE */}
                {activeMode === 'image' && (
                    <div 
                        className={`h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden group ${isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            if (e.dataTransfer.files?.[0]) processImageFile(e.dataTransfer.files[0]);
                        }}
                        onClick={() => !imageBase64 && fileInputRef.current?.click()}
                    >
                        {imageBase64 ? (
                            <>
                                <img src={imageBase64} alt="Preview" className="w-full h-full object-contain p-4" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setImageBase64(null); setImageFile(null); }}
                                    className="absolute top-4 right-4 bg-black/50 hover:bg-red-500 text-white p-2 rounded-full transition-colors backdrop-blur-md"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <UploadCloud size={32} className="text-indigo-400" />
                                </div>
                                <p className="text-sm font-bold text-white mb-1">Click or drag image here</p>
                                <p className="text-xs text-white/40">Supports JPG, PNG, GIF</p>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0])} />
                    </div>
                )}

                {/* DRAWING MODE */}
                {activeMode === 'drawing' && (
                    <div className="h-full relative min-h-[300px]">
                        {drawingUrl && !drawingBlob && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                <div className="bg-[#222] p-4 rounded-xl text-center">
                                    <p className="text-sm text-gray-300 mb-3">Edit existing drawing?</p>
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={() => setDrawingUrl(null)} className="bg-red-600 text-white px-3 py-1 rounded text-xs">Clear & Redraw</button>
                                        <img src={drawingUrl} className="h-10 w-10 border border-white/20 rounded bg-white" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <DrawingCanvas 
                            onSave={setDrawingBlob}
                            onClear={() => { setDrawingBlob(null); setDrawingUrl(null); }}
                            width={600}
                            height={300}
                            className="w-full h-full"
                            strokeColor={selectedColor === NOTE_COLORS.TRANSPARENT ? '#ffffff' : '#000000'}
                        />
                    </div>
                )}

                {/* LINK MODE */}
                {activeMode === 'link' && (
                    <div className="space-y-4 pt-10">
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-indigo-500 focus-within:bg-white/10 transition-all">
                            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                                <Link size={24} />
                            </div>
                            <input 
                                type="url" 
                                value={attachmentUrl} 
                                onChange={(e) => setAttachmentUrl(e.target.value)}
                                // Explicitly allow default paste behavior here by NOT preventing default in handlePaste for this mode
                                onPaste={onPaste} 
                                placeholder="Paste URL here (e.g. youtube.com/...)" 
                                className="w-full bg-transparent text-white outline-none placeholder-white/30 text-lg"
                                autoFocus={!isEditing}
                            />
                        </div>
                        <textarea 
                            value={content}
                            onChange={(e) => { setContent(e.target.value); handleTyping(); }}
                            onPaste={onPaste}
                            placeholder="Add a caption (optional)..."
                            className="w-full bg-transparent text-white/70 outline-none resize-none p-2"
                            rows={3}
                        />
                    </div>
                )}

            </div>

            {/* --- Footer --- */}
            <div className="relative z-10 bg-[#0a0a0a] border-t border-white/5 rounded-b-3xl" onMouseDown={e => e.stopPropagation()}>
                
                {/* Color Grid Area */}
                <div className="px-6 pt-3 pb-1">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Palette size={12} className="text-gray-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Color</span>
                    </div>
                    {/* Compact Flow Layout for Colors - Flex wrap to fill width */}
                    <div className="flex flex-wrap gap-2 justify-start py-3">
                        {COLORS.map(color => (
                            <ColorOrb 
                                key={color}
                                color={color as NoteColor}
                                selected={selectedColor === color} 
                                onClick={() => setSelectedColor(color as NoteColor)} 
                            />
                        ))}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="px-6 pb-6 pt-2 flex justify-end items-center border-t border-white/5 mt-[-1px]">
                    <button 
                        onClick={handleSubmit}
                        disabled={isUploading || (activeMode === 'text' && !content && !title && !isEditing) || (activeMode === 'image' && !imageBase64 && !isEditing)}
                        className="w-full sm:w-auto bg-white text-black hover:bg-indigo-50 px-8 py-3 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isUploading ? (isEditing ? 'Updating...' : 'Posting...') : (isEditing ? 'Update Note' : 'Post Note')}
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
});
