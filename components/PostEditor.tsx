
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { X, Type, Image, Link as LinkIcon, Film, Mic, Paperclip, Drawing, UploadCloud, Smile, Hash, Palette, Check, Trash2, Brush, Eraser, Move, Maximize, Minimize } from 'lucide-react';
import { Post, NoteColor, Column, Board } from '../types';
import { getNoteColorClasses } from '../utils/theme';
import { ColorPicker } from './ColorPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { DrawingCanvas } from './Drawing/DrawingCanvas';
import { useUpload } from '../hooks/useUpload';
import { useBoard } from '../contexts/BoardContext';
import { EmojiPicker } from './EmojiPicker';

interface PostEditorProps {
  board: Board;
  column: Column;
  post?: Post | null;
  onClose: () => void;
  isStudent?: boolean;
}

type EditorMode = 'text' | 'image' | 'draw' | 'link';

export const PostEditor: React.FC<PostEditorProps> = ({
  board,
  column,
  post,
  onClose,
  isStudent,
}) => {
  const { user } = useAuth();
  const { addPost, updatePost } = useBoard();
  
  const [mode, setMode] = useState<EditorMode>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>(NoteColor.YELLOW);
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrawingFullScreen, setIsDrawingFullScreen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { isUploading, progress, uploadFile } = useUpload();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  const draftKey = post ? `classboard_draft_${post.id}` : (column ? `classboard_draft_new_${column.id}` : null);

  // Load draft from local storage on mount
  useEffect(() => {
    if (draftKey) {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setTitle(draft.title || '');
                setContent(draft.content || '');
                setColor(draft.color || NoteColor.YELLOW);
                setImageUrl(draft.imageUrl || '');
                setLinkUrl(draft.linkUrl || '');
                setDrawingData(draft.drawingData || null);
                setMode(draft.mode || 'text');
            } catch (e) {
                console.error("Failed to parse draft:", e);
                localStorage.removeItem(draftKey); // Clear corrupted draft
            }
        } else {
            // No draft, so initialize from post prop
            setTitle(post?.title || '');
            setContent(post?.content || '');
            setColor(post?.color || NoteColor.YELLOW);
            const postType = post?.type || 'text';
            setMode(postType);
            if (postType === 'image') setImageUrl(post?.content || '');
            if (postType === 'link') setLinkUrl(post?.content || '');
            if (postType === 'drawing') setDrawingData(post?.content || null);
        }
    }
  }, [post, draftKey]);

  const saveDraft = () => {
      if (draftKey) {
          const draft = { title, content, color, imageUrl, linkUrl, drawingData, mode };
          if (title.trim() || content.trim() || imageUrl || linkUrl || drawingData) {
              localStorage.setItem(draftKey, JSON.stringify(draft));
          } else {
              localStorage.removeItem(draftKey);
          }
      }
  };

  const clearDraft = () => {
      if (draftKey) {
          localStorage.removeItem(draftKey);
      }
  };

  const handleClose = () => {
      saveDraft();
      onClose();
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newUrl = await uploadFile(file);
      if (newUrl) {
        setImageUrl(newUrl);
        if (mode !== 'image') setMode('image');
      }
    }
  };

  const handlePost = async () => {
    if (!user || !column) return;
    setIsSubmitting(true);

    let postType: Post['type'] = mode;
    let postContent = content;

    switch (mode) {
      case 'image': postContent = imageUrl; break;
      case 'drawing': postContent = drawingData || ''; break;
      case 'link': postContent = linkUrl; break;
    }

    const postData = { title, content: postContent, color, type: postType };

    if (post) {
      await updatePost(post.id, postData);
    } else {
      await addPost(column.id, postData);
    }
    
    clearDraft();
    setIsSubmitting(false);
    onClose();
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      contentRef.current?.focus();
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    if (contentRef.current) {
      const { selectionStart, selectionEnd } = contentRef.current;
      const newContent = content.substring(0, selectionStart) + emoji + content.substring(selectionEnd);
      setContent(newContent);
      setShowEmojiPicker(false);
      setTimeout(() => {
        contentRef.current?.focus();
        contentRef.current!.selectionStart = contentRef.current!.selectionEnd = selectionStart + emoji.length;
      }, 0);
    }
  };
  
  const EditorModeButton: React.FC<{ selfMode: EditorMode; icon: React.ReactNode; label: string }> = ({ selfMode, icon, label }) => (
    <button onClick={() => setMode(selfMode)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-colors ${mode === selfMode ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      {icon} {label}
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm pointer-events-none"
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
            key="modal"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`pointer-events-auto relative bg-[#202020] border border-white/10 rounded-2xl shadow-2xl w-full flex flex-col ${isDrawingFullScreen ? 'h-[95vh] max-w-6xl' : 'max-w-xl'}`}>
            
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Brush size={20} className="text-pink-400"/>
                {post ? 'Edit Post' : 'Create Post'}
              </h3>
              <button className="text-gray-400 hover:text-white transition-colors" onClick={handleClose}>
                <X size={24} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
              {!isStudent && (
                  <div className="bg-black/40 rounded-lg p-1 flex items-stretch">
                    <EditorModeButton selfMode="text" icon={<Type size={16}/>} label="Text" />
                    <EditorModeButton selfMode="image" icon={<Image size={16}/>} label="Image" />
                    <EditorModeButton selfMode="draw" icon={<Drawing size={16}/>} label="Draw" />
                    <EditorModeButton selfMode="link" icon={<LinkIcon size={16}/>} label="Link" />
                  </div>
              )}

              {mode === 'text' && (
                <div className="space-y-2">
                  <input type="text" placeholder="Add a title..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={handleTitleKeyDown} className="w-full bg-transparent text-xl font-bold text-white placeholder-gray-500 focus:outline-none" />
                  <div className="relative">
                    <textarea ref={contentRef} placeholder="Type something amazing..." value={content} onChange={(e) => setContent(e.target.value)} rows={5} className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none leading-relaxed custom-scrollbar" />
                    <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute bottom-1 right-1 p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white"><Smile size={16} /></button>
                    {showEmojiPicker && <div className="absolute right-0 bottom-8 z-10"><EmojiPicker onEmojiSelect={handleInsertEmoji} /></div>}
                  </div>
                </div>
              )}

              {mode === 'image' && (
                <div className="space-y-3">
                  <input type="text" placeholder="Add a title..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={handleTitleKeyDown} className="w-full bg-transparent text-lg font-bold text-white placeholder-gray-500 focus:outline-none" />
                  {isUploading && <div className="w-full bg-white/5 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>}
                  {imageUrl && <img src={imageUrl} alt="Uploaded preview" className="w-full rounded-lg object-cover" />}
                  <label htmlFor="file-upload" className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-sm rounded-lg transition-colors">
                    <UploadCloud size={16} />
                    {isUploading ? `Uploading... ${progress.toFixed(0)}%` : (imageUrl ? 'Change Image' : 'Upload Image')}
                  </label>
                  <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </div>
              )}

              {mode === 'draw' && (
                <div className={`relative ${isDrawingFullScreen ? 'flex-1' : 'h-80'}`}>
                    <DrawingCanvas initialData={drawingData} onSave={setDrawingData} isFullScreen={isDrawingFullScreen} />
                    <button onClick={() => setIsDrawingFullScreen(!isDrawingFullScreen)} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/80">
                        {isDrawingFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                </div>
              )}
              
              {mode === 'link' && (
                <div className="space-y-3">
                   <input type="text" placeholder="Add a title..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={handleTitleKeyDown} className="w-full bg-transparent text-lg font-bold text-white placeholder-gray-500 focus:outline-none" />
                  <div className="relative">
                    <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="url" placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 mt-auto border-t border-white/10 flex items-center justify-between">
              <ColorPicker selectedColor={color} onSelectColor={setColor} isStudent={isStudent} />
              <div className="flex items-center gap-4">
                {post && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this post?')) {
                        await updatePost(post.id, { is_trashed: true });
                        onClose();
                      }
                    }}
                    className="text-red-500/80 hover:text-red-500 font-bold text-sm transition-colors"
                  >
                   <Trash2 size={16}/>
                  </button>
                )}
                <button onClick={handlePost} disabled={isSubmitting || isUploading} className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_14px_rgba(219,39,119,0.3)] hover:shadow-[0_6px_20px_rgba(219,39,119,0.4)] disabled:opacity-50">
                  {isSubmitting ? 'Posting...' : (post ? 'Save Changes' : 'Post Note')}
                </button>
              </div>
            </div>
        </motion.div>
    </div>
  </AnimatePresence>
);
};
