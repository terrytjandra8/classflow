
import React from 'react';
import { Bold, Italic, Underline, List, ListOrdered, ImagePlus } from 'lucide-react';
import { RichTextEditorRef, FormatState } from '../../../../../RichTextEditor';

interface FeedbackToolbarProps {
    editorRef: React.RefObject<RichTextEditorRef>;
    onImageUpload: () => void;
    activeFormats: FormatState;
}

export const FeedbackToolbar: React.FC<FeedbackToolbarProps> = ({ editorRef, onImageUpload, activeFormats }) => {
    const getBtnClass = (isActive: boolean) => 
        `p-1.5 rounded transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`;
    
    const handleCommand = (cmd: string) => {
        // Prevent editor from losing focus
        editorRef.current?.focus();
        editorRef.current?.execCommand(cmd);
    };

    // Use onMouseDown to prevent the editor from losing focus when a button is clicked.
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>, cmd?: string) => {
        e.preventDefault();
        if (cmd) {
            handleCommand(cmd);
        }
    };

    return (
        <div className="flex items-center gap-1 p-1 border-b border-white/10 bg-[#111] rounded-t-xl">
            <button onMouseDown={(e) => handleMouseDown(e, 'bold')} className={getBtnClass(activeFormats.bold)} title="Bold"><Bold size={14}/></button>
            <button onMouseDown={(e) => handleMouseDown(e, 'italic')} className={getBtnClass(activeFormats.italic)} title="Italic"><Italic size={14}/></button>
            <button onMouseDown={(e) => handleMouseDown(e, 'underline')} className={getBtnClass(activeFormats.underline)} title="Underline"><Underline size={14}/></button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onMouseDown={(e) => handleMouseDown(e, 'insertUnorderedList')} className={getBtnClass(activeFormats.list)} title="Bulleted List"><List size={14}/></button>
            <button onMouseDown={(e) => handleMouseDown(e, 'insertOrderedList')} className={getBtnClass(activeFormats.orderedList)} title="Numbered List"><ListOrdered size={14}/></button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onMouseDown={(e) => { e.preventDefault(); onImageUpload(); }} className={getBtnClass(false)} title="Upload Image"><ImagePlus size={14}/></button>
        </div>
    );
};
