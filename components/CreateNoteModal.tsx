
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X, Image, Link, Type, PenTool, UploadCloud, ShieldAlert, Palette, Edit3, Check } from 'lucide-react';
import { NoteColor, NoteType, Note } from '../types';
import { supabase } from '../services/supabaseClient';
import { RichTextEditor } from './RichTextEditor';
import { DrawingCanvas } from './ui/DrawingCanvas';
import { getColorName } from '../utils/theme';
import { useBoard } from './BoardView/BoardContext';
import { usePasteProtection } from '../hooks/useSecurity';

// Props interface
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
  activeSectionId?: string;
}

// Constants
const COLORS = Object.values(NoteColor).filter(c => c !== NoteColor.TRANSPARENT);

// --- Sub-Components (Memoized for performance) ---

const ToolButton: React.FC<{ active: boolean, icon: any, label: string, onClick: () => void }> = memo(({ active, icon: Icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 shrink-0 ${active ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
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
            <div className={`absolute -top-10 z-50 transition-all duration-300 transform ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90 pointer-events-none'}`}>
                <div className="bg-black/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-2xl border border-white/10 whitespace-nowrap tracking-wide">
                    {name}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/10"></div>
                </div>
            </div>
            <button 
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`w-8 h-8 rounded-full transition-all duration-300 relative shrink-0 ${color} ${selected ? 'ring-2 ring-white scale-110 z-10 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'hover:scale-110 hover:ring-2 hover:ring-white/20 hover:z-10'}`}
            >
                {selected && <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-200"><Check size={14} className="text-slate-900" strokeWidth={3} /></div>}
            </button>
        </div>
    );
});

// --- Main Component ---

export const CreateNoteModal: React.FC<CreateNoteModalProps> = memo(({ isOpen, onClose, onSubmit, initialImage, defaultAuthor, disablePaste, allowLinks, isStudent, noteToEdit, activeSectionId }) => {
  const { board, setTypingStatus } = useBoard();

  // State management
  const [activeMode, setActiveMode] = useState<NoteType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>(() => COLORS[Math.floor(Math.random() * COLORS.length)] || NoteColor.YELLOW);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [drawingBlob, setDrawingBlob] = useState<Blob | null>(null);
  const [drawingUrl, setDrawingUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [author, setAuthor] = useState(defaultAuthor || 'Student');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null); // Ref for the content area to protect
  const typingTimeoutRef = useRef<any>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  const isEditing = !!noteToEdit;
  // Scope draft per board AND per section/column so different columns keep separate drafts
  const sectionSuffix = activeSectionId ? `_${activeSectionId}` : '';
  const draftKey = `note_draft_${board?.id || 'global'}${sectionSuffix}`;
  
  // Apply the advanced paste protection
  const { pasteWarning, onPaste: honeypotPasteHandler } = usePasteProtection({
      isStudent,
      disablePaste,
      allowLinks,
      targetRef: contentRef // The real listener watches this element
  });

  // --- Effects ---

  useEffect(() => {
    const handleResize = () => setPosition({ x: 0, y: 0 });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
      const fetchIdentity = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
              setAuthor(profile?.full_name || user.user_metadata?.full_name || defaultAuthor || 'Student');
          }
      };
      if (isOpen && !isEditing) fetchIdentity();
      if (isOpen && isEditing && noteToEdit) setAuthor(noteToEdit.author);
  }, [isOpen, defaultAuthor, isEditing, noteToEdit]);

  // State reset and pre-fill logic
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
      if (noteToEdit) {
          setTitle(noteToEdit.title || '');
          setContent(noteToEdit.content || '');
          setSelectedColor(noteToEdit.color);
          setActiveMode(noteToEdit.type as NoteType);
          if (noteToEdit.type === 'image') setImageBase64(noteToEdit.content);
          else if (noteToEdit.type === 'drawing') setDrawingUrl(noteToEdit.content);
          else if (noteToEdit.type === 'link') setAttachmentUrl(noteToEdit.attachmentUrl || '');
      } else {
          // Try to restore a draft from localStorage
          const savedDraft = localStorage.getItem(draftKey);
          if (savedDraft) {
              try {
                  const draft = JSON.parse(savedDraft);
                  setTitle(draft.title || '');
                  setContent(draft.content || '');
                  setAttachmentUrl(draft.attachmentUrl || '');
                  setActiveMode(draft.activeMode || 'text');
                  setHasDraftRestored(true);
                  setTimeout(() => setHasDraftRestored(false), 3000);
              } catch { /* ignore parse errors */ }
          } else {
              setTitle('');
              setContent('');
              setImageBase64(null);
              setImageFile(null);
              setDrawingBlob(null);
              setDrawingUrl(null);
              setAttachmentUrl('');
              setActiveMode('text');
              setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)] || NoteColor.YELLOW);
              if (initialImage) {
                  processImageFile(initialImage);
                  setActiveMode('image');
              }
          }
      }
    } else {
        setTypingStatus(false);
    }
  }, [isOpen, initialImage, noteToEdit]);

  // Auto-save draft to localStorage while typing (text mode only)
  useEffect(() => {
      if (!isOpen || isEditing) return;
      const draft = { title, content, attachmentUrl, activeMode };
      // Only persist if there's something worth saving
      if (title || content || attachmentUrl) {
          localStorage.setItem(draftKey, JSON.stringify(draft));
      }
  }, [title, content, attachmentUrl, activeMode, isOpen, isEditing]);

  // --- Handlers ---

  const handleTyping = () => {
      if (isStudent) {
          setTypingStatus(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingStatus(false), 2000);
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
      const fileName = `${Date.now()}.${fileExt}`;
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
    setTypingStatus(false);
    try {
        let finalContent = content;
        let finalType: NoteType = activeMode;

        if (activeMode === 'image' && imageFile) {
          finalContent = await handleUploadFile(imageFile) || ''
        } else if (activeMode === 'image' && imageBase64) {
          finalContent = imageBase64;
        } else if (activeMode === 'drawing' && drawingBlob) {
          finalContent = await handleUploadFile(drawingBlob) || ''
        } else if (activeMode === 'drawing' && drawingUrl) {
          finalContent = drawingUrl;
        } 
        
        if (!finalContent && !title && !isEditing && activeMode !== 'link') return;
        if (activeMode === 'link' && !attachmentUrl && !isEditing) return;

        await onSubmit({
            title, content: finalContent, author, color: selectedColor, type: finalType,
            attachmentUrl: activeMode === 'link' ? attachmentUrl : undefined
        });
        // Clear draft on success
        localStorage.removeItem(draftKey);
        onClose();
    } catch (e) {
        console.error(e);
        alert("Failed to save note.");
    } finally {
        setIsUploading(false);
    }
  };
  
  const onPaste = (e: React.ClipboardEvent, sourceInput?: 'link-url') => {
      // 1. Handle image pasting first
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
              const file = items[i].getAsFile();
              if (file) {
                  e.preventDefault();
                  processImageFile(file);
                  setActiveMode('image');
                  return; // Stop processing
              }
          }
      }

      // 2. Allow pasting in the link URL field
      if (activeMode === 'link' && sourceInput === 'link-url') {
          return;
      }

      // 3. If no special case matched, call the decoy paste handler.
      // The REAL protection is happening globally from the hook.
      honeypotPasteHandler(e);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (window.innerWidth < 768 || (e.target as HTMLElement).closest('button')) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (isDragging) setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

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
      <div
        ref={modalRef}
        style={{ 
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
        }}
        className="fixed top-1/2 left-1/2 z-[1000] w-full h-full md:h-auto md:max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-2xl border-white/10 md:rounded-3xl shadow-2xl flex flex-col md:max-h-[90vh] animate-in zoom-in-95 duration-300 transition-shadow"
      >
            <div className="absolute inset-0 pointer-events-none z-0 md:rounded-3xl overflow-hidden">
                <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
            </div>

            {pasteWarning && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
                    <ShieldAlert size={14} /> No copy-pasting allowed!
                </div>
            )}

            <div 
                className="relative z-10 p-4 md:p-6 pb-2 border-b border-white/5 md:cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full hidden md:block"></div>

                <div className="flex justify-between items-center mb-4 sm:mb-6 pt-2">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 pointer-events-none">
                        {isEditing ? <Edit3 size={18} className="text-blue-400" /> : <Edit3 size={18} className="text-yellow-400" />}
                        {isEditing ? 'Edit Note' : 'Create'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {hasDraftRestored && (
                            <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 animate-in fade-in">
                                ✏️ Draft restored
                            </span>
                        )}
                        {!isEditing && (title || content || attachmentUrl) && (
                            <button
                                onClick={() => { localStorage.removeItem(draftKey); setTitle(''); setContent(''); setAttachmentUrl(''); }}
                                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                                title="Discard draft"
                            >
                                Discard
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2" onMouseDown={e => e.stopPropagation()}>
                    <ToolButton active={activeMode === 'text'} icon={Type} label="Text" onClick={() => setActiveMode('text')} />
                    <ToolButton active={activeMode === 'image'} icon={Image} label="Image" onClick={() => setActiveMode('image')} />
                    <ToolButton active={activeMode === 'drawing'} icon={PenTool} label="Draw" onClick={() => setActiveMode('drawing')} />
                    <ToolButton active={activeMode === 'link'} icon={Link} label="Link" onClick={() => setActiveMode('link')} />
                </div>
            </div>

            <div ref={contentRef} className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 min-h-[250px] bg-black/20 flex flex-col" onMouseDown={e => e.stopPropagation()}>
                <input 
                    type="text" value={title} onChange={(e) => { setTitle(e.target.value); handleTyping(); }}
                    placeholder="Add a title..."
                    className="w-full bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-white/20 outline-none mb-4 shrink-0"
                    autoFocus={activeMode === 'text' && !isEditing}
                    onPaste={(e) => onPaste(e)}
                />

                {activeMode === 'text' && (
                    <div className="h-full min-h-[200px]">
                        <RichTextEditor value={content} onChange={(val) => { setContent(val); handleTyping(); }} placeholder="Type something amazing..." className="w-full h-full bg-transparent text-lg text-white/80 placeholder-white/20 outline-none leading-relaxed" onPaste={(e) => onPaste(e)} />
                    </div>
                )}

                {activeMode === 'image' && (
                    <div className={`h-48 md:h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden group ${isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`} onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files?.[0]) processImageFile(e.dataTransfer.files[0]); }} onClick={() => !imageBase64 && fileInputRef.current?.click()}>
                        {imageBase64 ? (
                            <><img src={imageBase64} alt="Preview" className="w-full h-full object-contain p-2" /><button onClick={(e) => { e.stopPropagation(); setImageBase64(null); setImageFile(null); }} className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-2 rounded-full transition-colors backdrop-blur-md"><X size={16} /></button></>
                        ) : (
                            <div className="text-center p-6"><div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><UploadCloud size={32} className="text-indigo-400" /></div><p className="text-sm font-bold text-white mb-1">Click or drag image</p><p className="text-xs text-white/40">JPG, PNG, GIF</p></div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0])} />
                    </div>
                )}

                {activeMode === 'drawing' && (
                     <div className="h-full w-full relative min-h-[250px] md:min-h-[300px] flex-1 flex flex-col touch-none">
                        <DrawingCanvas onDrawEnd={setDrawingBlob} initialData={drawingUrl || undefined} onClear={() => { setDrawingBlob(null); setDrawingUrl(null); }} className="w-full h-full" strokeColor={selectedColor === NoteColor.TRANSPARENT ? '#ffffff' : '#000000'} />
                    </div>
                )}

                {activeMode === 'link' && (
                    <div className="space-y-4 pt-4 md:pt-10">
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-indigo-500 focus-within:bg-white/10 transition-all">
                            <div className="p-2 sm:p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><Link size={20} /></div>
                            <input type="url" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} onPaste={(e) => onPaste(e, 'link-url')} placeholder="Paste a URL..." className="w-full bg-transparent text-white outline-none placeholder-white/30 text-base sm:text-lg" autoFocus={!isEditing} />
                        </div>
                        <textarea value={content} onChange={(e) => { setContent(e.target.value); handleTyping(); }} onPaste={(e) => onPaste(e)} placeholder="Add a caption..." className="w-full bg-transparent text-white/70 outline-none resize-none p-2" rows={3} />
                    </div>
                )}
            </div>

            <div className="relative z-10 bg-[#0a0a0a] border-t border-white/5 md:rounded-b-3xl" onMouseDown={e => e.stopPropagation()}>
                <div className="px-4 md:px-6 pt-3 pb-1">
                    <div className="flex items-center gap-1.5 mb-2"><Palette size={12} className="text-gray-500" /><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Color</span></div>
                    <div className="flex flex-wrap gap-2 justify-start py-3">
                        {COLORS.map(color => <ColorOrb key={color} color={color} selected={selectedColor === color} onClick={() => setSelectedColor(color)} /> )}
                    </div>
                </div>

                <div className="px-4 md:px-6 pb-4 pt-2 border-t border-white/5 mt-[-1px]">
                    <button onClick={handleSubmit} disabled={isUploading || (activeMode === 'text' && !content && !title && !isEditing) || (activeMode === 'image' && !imageBase64)} className="w-full sm:w-auto bg-white text-black hover:bg-indigo-50 px-8 py-3 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2">
                        {isUploading ? (isEditing ? 'Updating...' : 'Posting...') : (isEditing ? 'Update Note' : 'Post Note')}
                    </button>
                </div>
            </div>
        </div>
  );
});
