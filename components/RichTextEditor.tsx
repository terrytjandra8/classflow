
import React, { useRef, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient'; // Ensure this path is correct

export interface FormatState {
    bold: boolean;
    italic: boolean;
    list: boolean;
    subscript: boolean;
    superscript: boolean;
}

export const getActiveFormat = (cmd: string, tags: string[] = []): boolean => {
    if (typeof document === 'undefined') return false;
    if (document.queryCommandState(cmd)) return true;
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return false;
    let node: Node | null = sel.anchorNode;
    if (node.nodeType === 3) node = node.parentNode;
    if (node instanceof HTMLElement && tags.length > 0) {
        return node.closest(tags.join(',')) !== null;
    }
    return false;
};

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onFormatChange?: (formats: FormatState) => void;
    onPaste?: (e: React.ClipboardEvent) => void;
    autoFocus?: boolean;
    style?: React.CSSProperties;
}

const RichTextEditorComponent: React.FC<RichTextEditorProps> = ({ 
    value, onChange, placeholder, className, onKeyDown, onFormatChange, onPaste, autoFocus, style 
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastFormats = useRef<FormatState>({ bold: false, italic: false, list: false, subscript: false, superscript: false });
    const isInternalChange = useRef(false);

    useEffect(() => {
        if (autoFocus && editorRef.current) {
            editorRef.current.focus();
        }
    }, [autoFocus]);

    useEffect(() => {
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }
        if (editorRef.current && editorRef.current.innerHTML !== value) {
             if (value === '' || (editorRef.current.innerHTML === '' && value) || (value !== editorRef.current.innerHTML)) {
                 editorRef.current.innerHTML = value;
             }
        }
    }, [value]);

    const checkFormats = useCallback(() => {
        if (onFormatChange) {
            const selection = window.getSelection();
            if (!selection || !editorRef.current || !editorRef.current.contains(selection.anchorNode)) {
                return;
            }
            const newFormats = {
                bold: getActiveFormat('bold', ['B', 'STRONG']),
                italic: getActiveFormat('italic', ['I', 'EM']),
                list: document.queryCommandState('insertUnorderedList'),
                subscript: getActiveFormat('subscript', ['SUB']),
                superscript: getActiveFormat('superscript', ['SUP'])
            };
            lastFormats.current = newFormats;
            onFormatChange(newFormats);
        }
    }, [onFormatChange]);

    useEffect(() => {
        const handleSelectionChange = () => checkFormats();
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [checkFormats]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        isInternalChange.current = true;
        onChange(e.currentTarget.innerHTML);
        checkFormats();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (onKeyDown) onKeyDown(e);
        if (e.ctrlKey || e.metaKey) {
            const key = e.key.toLowerCase();
            if (['b', 'i', 'z', 'y'].includes(key)) e.preventDefault();
            if (key === 'b') document.execCommand('bold', false);
            else if (key === 'i') document.execCommand('italic', false);
            else if (key === 'z') document.execCommand(e.shiftKey ? 'redo' : 'undo', false);
            else if (key === 'y') document.execCommand('redo', false);
            if (['b', 'i', 'z', 'y'].includes(key) && editorRef.current) {
                isInternalChange.current = true;
                onChange(editorRef.current.innerHTML);
                checkFormats();
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '8') {
            e.preventDefault();
            document.execCommand('insertUnorderedList', false);
            checkFormats();
        }
    };

    const handlePasteLogic = async (e: React.ClipboardEvent) => {
        if (onPaste) onPaste(e);
        if (e.defaultPrevented) return;
        
        e.preventDefault();

        const items = Array.from(e.clipboardData.items);
        const imageItem = items.find(item => item.type.startsWith('image'));

        if (imageItem) {
            const file = imageItem.getAsFile();
            if (!file) return;

            const placeholderSrc = URL.createObjectURL(file);
            const placeholderId = `placeholder-${Date.now()}`;
            document.execCommand('insertHTML', false, `<img src="${placeholderSrc}" id="${placeholderId}" style="opacity: 0.5; max-width: 100%;"/>`);

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `pasted-image-${Date.now()}.${fileExt}`;
                const { error } = await supabase.storage.from('uploads').upload(fileName, file);
                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
                
                if (editorRef.current) {
                    const placeholderImg = editorRef.current.querySelector(`#${placeholderId}`);
                    if (placeholderImg) {
                        placeholderImg.setAttribute('src', publicUrl);
                        placeholderImg.removeAttribute('id');
                        placeholderImg.style.opacity = '1';
                        placeholderImg.style.cursor = 'pointer';
                        isInternalChange.current = true;
                        onChange(editorRef.current.innerHTML);
                    }
                }
            } catch (err) {
                console.error("Image upload failed:", err);
                if (editorRef.current) {
                    const placeholderImg = editorRef.current.querySelector(`#${placeholderId}`);
                    placeholderImg?.remove();
                }
                alert("Failed to upload image.");
            }
        } else {
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        }
    };

    // Image resizing logic
    useEffect(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;

        const onMouseDown = (e: MouseEvent) => {
            if ((e.target as HTMLElement).tagName !== 'IMG') return;
            
            const img = e.target as HTMLImageElement;
            if (!editor.contains(img)) return;

            img.style.objectFit = 'contain';
            const startX = e.pageX;
            const startWidth = img.width;

            const onMouseMove = (moveE: MouseEvent) => {
                const newWidth = startWidth + (moveE.pageX - startX);
                img.style.width = `${newWidth > 20 ? newWidth : 20}px`;
                img.style.height = 'auto'; // Maintain aspect ratio
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                isInternalChange.current = true;
                onChange(editor.innerHTML);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        editor.addEventListener('mousedown', onMouseDown);

        return () => {
            editor.removeEventListener('mousedown', onMouseDown);
        };

    }, [onChange]);

    return (
        <>
            <style>{`
                .rich-text-content sub { vertical-align: sub; font-size: smaller; }
                .rich-text-content sup { vertical-align: super; font-size: smaller; }
                .rich-text-content img { max-width: 100%; cursor: move; border-radius: 4px; border: 1px solid transparent; transition: border-color 0.2s; }
                .rich-text-content img:hover { border-color: rgba(0, 122, 255, 0.5); }
            `}</style>
            <div
                ref={editorRef}
                contentEditable
                className={`rich-text-content outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 cursor-text overflow-auto break-words whitespace-pre-wrap ${className}`}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePasteLogic}
                onMouseUp={checkFormats}
                onKeyUp={checkFormats}
                onClick={checkFormats} 
                data-placeholder={placeholder}
                style={{ overflowWrap: 'break-word', wordBreak: 'break-word', ...style }}
                spellCheck={true}
            />
        </>
    );
};

export const RichTextEditor = React.memo(RichTextEditorComponent);
