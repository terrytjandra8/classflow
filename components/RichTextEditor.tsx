
import React, { useRef, useEffect, useCallback } from 'react';

export interface FormatState {
    bold: boolean;
    italic: boolean;
    list: boolean;
    subscript: boolean;
    superscript: boolean;
}

// Robust check for format state
export const getActiveFormat = (cmd: string, tags: string[] = []): boolean => {
    if (typeof document === 'undefined') return false;
    
    // 1. Try native command state
    if (document.queryCommandState(cmd)) return true;
    
    // 2. Fallback: Check DOM tree for tags
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return false;
    
    let node: Node | null = sel.anchorNode;
    if (node.nodeType === 3) node = node.parentNode; // Text node -> Element
    
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

    // Handle external value changes (reset or initial load)
    useEffect(() => {
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }

        if (editorRef.current && editorRef.current.innerHTML !== value) {
             // Only update if value is different to avoid cursor jumps
             if (value === '' || (editorRef.current.innerHTML === '' && value) || (value !== editorRef.current.innerHTML)) {
                 editorRef.current.innerHTML = value;
             }
        }
    }, [value]);

    const checkFormats = useCallback(() => {
        if (onFormatChange) {
            // We must check if the selection is actually inside this editor
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
            
            // Dispatch update
            lastFormats.current = newFormats;
            onFormatChange(newFormats);
        }
    }, [onFormatChange]);

    useEffect(() => {
        const handleSelectionChange = () => {
            checkFormats();
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
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
            if (key === 'b') {
                e.preventDefault();
                document.execCommand('bold', false);
                checkFormats();
            } else if (key === 'i') {
                e.preventDefault();
                document.execCommand('italic', false);
                checkFormats();
            } else if (key === 'z') {
                e.preventDefault();
                if (e.shiftKey) document.execCommand('redo', false);
                else document.execCommand('undo', false);
                if (editorRef.current) {
                    isInternalChange.current = true;
                    onChange(editorRef.current.innerHTML);
                }
            } else if (key === 'y') {
                e.preventDefault();
                document.execCommand('redo', false);
                if (editorRef.current) {
                    isInternalChange.current = true;
                    onChange(editorRef.current.innerHTML);
                }
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '8') {
            e.preventDefault();
            document.execCommand('insertUnorderedList', false);
            checkFormats();
        }
    };

    const handlePasteLogic = (e: React.ClipboardEvent) => {
        if (onPaste) onPaste(e);
        if (e.defaultPrevented) return;
        
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    return (
        <>
            <style>{`
                .rich-text-content sub { vertical-align: sub; font-size: smaller; }
                .rich-text-content sup { vertical-align: super; font-size: smaller; }
            `}</style>
            <div
                ref={editorRef}
                contentEditable
                className={`
                    rich-text-content outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 
                    cursor-text overflow-auto break-words whitespace-pre-wrap 
                    ${className}
                `}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePasteLogic}
                onMouseUp={checkFormats}
                onKeyUp={checkFormats}
                onClick={checkFormats} 
                data-placeholder={placeholder}
                style={{ 
                    overflowWrap: 'break-word', 
                    wordBreak: 'break-word',
                    ...style 
                }}
                spellCheck={true}
            />
        </>
    );
};

export const RichTextEditor = React.memo(RichTextEditorComponent);
