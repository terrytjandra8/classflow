
import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, X, Type, Image, Link, PenTool, CheckSquare, Sparkles, ShieldAlert } from 'lucide-react';
import { Note, NoteColor } from '../../types';
import { RichTextEditor, FormatState } from '../RichTextEditor';
import { useBoard } from '../BoardView/BoardContext';
import { DynamicTextarea } from './DynamicTextarea';
import { usePasteProtection } from '../../hooks/useSecurity'; // Use hook

interface EditModeProps {
    note: Note;
    onSave: (title: string, content: string, color: NoteColor) => void;
    onCancel: () => void;
    onUpdate?: (content: string) => void;
    externalColor?: NoteColor;
    setExternalColor?: (color: NoteColor) => void;
    disablePaste?: boolean;
    isStudent?: boolean;
}

const markdownToHtml = (text: string) => {
    if (!text) return '';
    if (/<\/?[a-z][\s\S]*>/i.test(text)) return text;
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/_(.*?)_/g, '<i>$1</i>')
        .replace(/\n/g, '<br>');
    return html;
};

export const EditMode: React.FC<EditModeProps> = ({ note, onSave, onCancel, onUpdate, externalColor, setExternalColor, disablePaste, isStudent }) => {
    const { board } = useBoard();
    const allowLinks = board.allowLinks;

    const [editTitle, setEditTitle] = useState(note.title || '');
    const [editContent, setEditContent] = useState(markdownToHtml(note.content || ''));
    const [localColor, setLocalColor] = useState<NoteColor>(note.color);
    
    // Security Hook
    const { handlePasteProtection, pasteWarning } = usePasteProtection(isStudent, disablePaste, allowLinks);
    
    const currentColor = externalColor || localColor;
    const setColor = setExternalColor || setLocalColor;

    const [formats, setFormats] = useState<FormatState>({ bold: false, italic: false, list: false, subscript: false, superscript: false });
    const isTransparent = note.color === NoteColor.TRANSPARENT;
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSave();
        }
    };

    const handleSave = () => {
        onSave(editTitle, editContent, currentColor);
    };

    const onPaste = (e: React.ClipboardEvent) => {
        handlePasteProtection(e);
    };

    const execCmd = (cmd: string) => {
        document.execCommand(cmd, false, undefined);
        const content = document.getElementById('rich-text-editor')?.innerHTML || editContent;
        setFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            list: document.queryCommandState('insertUnorderedList'),
            subscript: document.queryCommandState('subscript'),
            superscript: document.queryCommandState('superscript')
        });
        if (onUpdate) {
            onUpdate(content);
        }
    };

    const TypeIcon = () => {
        switch(note.type) {
            case 'image': return <Image size={18} />;
            case 'link': return <Link size={18} />;
            case 'drawing': return <PenTool size={18} />;
            case 'exit_ticket': return <CheckSquare size={18} />;
            default: return <Type size={18} />;
        }
    };

    return (
        <div className="flex flex-col h-full relative" style={{ minHeight: '400px', maxHeight: '90vh' }}>
            
            {pasteWarning && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-6 py-3 rounded-full shadow-2xl z-[110] animate-in slide-in-from-top-4 fade-in flex items-center gap-2 border-2 border-red-400">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>Heads up! Large copy-pasting is disabled. Please type your answer.</span>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-start p-6 pb-2 shrink-0">
                <button 
                    onClick={onCancel} 
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-60 hover:opacity-100"
                >
                   <X size={20} />
                </button>
                
                <button 
                    onClick={handleSave} 
                    className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    Update
                </button>
            </div>

            {/* Content Area */}
            <div className="px-6 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                {/* Title */}
                {!isTransparent && (
                    <DynamicTextarea
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onPaste={onPaste}
                        className="w-full bg-transparent text-2xl font-bold placeholder-black/30 dark:placeholder-white/30 outline-none border-none p-0 resize-none overflow-hidden break-words whitespace-pre-wrap mb-6 text-inherit block"
                        placeholder="Title"
                        autoFocus
                        onKeyDown={(e) => { if(e.key === 'Enter') e.preventDefault(); }}
                    />
                )}

                {/* Rich Text Toolbar */}
                <div className="flex items-center gap-1 mb-2 opacity-50 hover:opacity-100 transition-opacity">
                    <button 
                        onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} 
                        className={`p-1.5 rounded transition-colors ${formats.bold ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold size={16}/>
                    </button>
                    <button 
                        onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} 
                        className={`p-1.5 rounded transition-colors ${formats.italic ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic size={16}/>
                    </button>
                    <button 
                        onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} 
                        className={`p-1.5 rounded transition-colors ${formats.list ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                        title="List"
                    >
                        <List size={16}/>
                    </button>
                </div>

                <div className="flex-1 min-h-[150px]">
                    <RichTextEditor
                        id="rich-text-editor"
                        value={editContent}
                        onChange={setEditContent}
                        onFormatChange={setFormats}
                        onKeyDown={handleKeyDown}
                        onPaste={onPaste}
                        className={`w-full h-full bg-transparent placeholder-black/30 dark:placeholder-white/30 outline-none text-lg leading-relaxed break-words whitespace-pre-wrap text-inherit ${isTransparent ? 'text-xl font-medium' : ''}`}
                        placeholder="Take a note..."
                    />
                </div>
            </div>

            {/* Footer: Tools & Colors */}
            <div className="p-4 pt-2 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/10 flex items-center justify-between shrink-0">
                 
                 <div className="flex items-center gap-1 opacity-50" title={`Editing ${note.type} note`}>
                    <div className="p-2 rounded-lg bg-black/5 dark:bg-white/10">
                        <TypeIcon />
                    </div>
                 </div>

                 <div className="flex items-center gap-1.5">
                    {Object.values(NoteColor).map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setColor(color)}
                            className={`w-5 h-5 rounded-full border border-black/10 dark:border-white/10 ${color} ${currentColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent scale-110' : 'hover:scale-110'} transition-all`}
                            title={color}
                        />
                    ))}
                 </div>
            </div>
        </div>
    );
};
