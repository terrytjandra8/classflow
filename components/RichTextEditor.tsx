
import React, { useRef, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient'; // Ensure this path is correct

export interface FormatState {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikeThrough: boolean;
    list: boolean;
    orderedList: boolean;
    subscript: boolean;
    superscript: boolean;
    blockquote: boolean;
    h1: boolean;
    h2: boolean;
    h3: boolean;
    h4: boolean;
    alignLeft: boolean;
    alignCenter: boolean;
    alignRight: boolean;
    alignJustify: boolean;
}

export const getActiveFormat = (cmd: string, tags: string[] = []): boolean => {
    if (typeof document === 'undefined') return false;
    if (cmd && document.queryCommandState(cmd)) return true;
    
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
    id?: string;
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onFormatChange?: (formats: FormatState) => void;
    onPaste?: (e: React.ClipboardEvent) => void;
    autoFocus?: boolean;
    style?: React.CSSProperties;
    imageUploadDisabled?: boolean;
}

const RichTextEditorComponent: React.FC<RichTextEditorProps> = ({ 
    id, value, onChange, placeholder, className, onKeyDown, onFormatChange, onPaste, autoFocus, style, imageUploadDisabled = false 
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastFormats = useRef<FormatState>({
        bold: false, italic: false, underline: false, strikeThrough: false,
        list: false, orderedList: false, subscript: false, superscript: false,
        blockquote: false, h1: false, h2: false, h3: false, h4: false,
        alignLeft: true, alignCenter: false, alignRight: false, alignJustify: false,
    });
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

            const getParentTag = (selection: Selection) => {
                let node = selection.anchorNode;
                if (node && node.nodeType === 3) node = node.parentNode;
                while (node) {
                    if (node.nodeName.match(/^(H[1-4]|P|DIV|BLOCKQUOTE)$/)) return node.nodeName;
                    if ((node as HTMLElement).isContentEditable === false) break;
                    node = node.parentNode;
                }
                return null;
            }
            
            const parentTag = getParentTag(selection);

            const newFormats: FormatState = {
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                strikeThrough: document.queryCommandState('strikeThrough'),
                list: document.queryCommandState('insertUnorderedList'),
                orderedList: document.queryCommandState('insertOrderedList'),
                subscript: document.queryCommandState('subscript'),
                superscript: document.queryCommandState('superscript'),
                blockquote: getActiveFormat('', ['BLOCKQUOTE']),
                h1: parentTag === 'H1',
                h2: parentTag === 'H2',
                h3: parentTag === 'H3',
                h4: parentTag === 'H4',
                alignLeft: document.queryCommandState('justifyLeft'),
                alignCenter: document.queryCommandState('justifyCenter'),
                alignRight: document.queryCommandState('justifyRight'),
                alignJustify: document.queryCommandState('justifyFull'),
            };

            if (JSON.stringify(lastFormats.current) !== JSON.stringify(newFormats)) {
                lastFormats.current = newFormats;
                onFormatChange(newFormats);
            }
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
            if (['b', 'i', 'u', 'z', 'y'].includes(key)) e.preventDefault();
            
            if (key === 'b') document.execCommand('bold', false);
            else if (key === 'i') document.execCommand('italic', false);
            else if (key === 'u') document.execCommand('underline', false);
            else if (key === 'z') document.execCommand(e.shiftKey ? 'redo' : 'undo', false);
            else if (key === 'y') document.execCommand('redo', false);
            
            if (['b', 'i', 'u', 'z', 'y'].includes(key) && editorRef.current) {
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

        if (imageItem && !imageUploadDisabled) {
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
                    const placeholderImg = editorRef.current.querySelector<HTMLImageElement>(`#${placeholderId}`);
                    if (placeholderImg) {
                        placeholderImg.src = publicUrl;
                        placeholderImg.removeAttribute('id');
                        placeholderImg.style.opacity = '1';
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

    useEffect(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;

        const onImageClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'IMG') {
                editor.querySelectorAll('img.resizable-active').forEach(img => {
                    img.classList.remove('resizable-active');
                });
                return;
            }
            
            const isActive = target.classList.contains('resizable-active');
            editor.querySelectorAll('img.resizable-active').forEach(img => {
                img.classList.remove('resizable-active');
            });
            if (!isActive) {
                target.classList.add('resizable-active');
            }
        };

        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.classList.contains('resizer')) return;

            e.preventDefault();
            
            const parent = target.parentElement;
            if (!parent) return;

            const img = parent.querySelector('img');
            if (!img) return;

            const startX = e.pageX;
            const startY = e.pageY;
            const startWidth = img.offsetWidth;
            const startHeight = img.offsetHeight;

            const handle = target.dataset.handle;

            const onMouseMove = (moveE: MouseEvent) => {
                let newWidth = startWidth;
                const dX = moveE.pageX - startX;

                if (handle?.includes('right')) newWidth = startWidth + dX;
                if (handle?.includes('left')) newWidth = startWidth - dX;

                img.style.width = `${newWidth > 20 ? newWidth : 20}px`;
                img.style.height = 'auto'; 
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

        editor.addEventListener('click', onImageClick);

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node instanceof HTMLImageElement) {
                        if (!node.closest('.resizable-container')) {
                            const container = document.createElement('div');
                            container.className = 'resizable-container';
                            node.parentNode?.insertBefore(container, node);
                            container.appendChild(node);

                            ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(handle => {
                                const resizer = document.createElement('div');
                                resizer.className = `resizer ${handle}`;
                                resizer.dataset.handle = handle;
                                container.appendChild(resizer);
                            });
                        }
                    }
                });
            });
        });

        observer.observe(editor, { childList: true, subtree: true });
        editor.addEventListener('mousedown', onMouseDown);

        return () => {
            editor.removeEventListener('click', onImageClick);
            editor.removeEventListener('mousedown', onMouseDown);
            observer.disconnect();
        };

    }, [onChange]);

    return (
        <>
            <style>{`
                .rich-text-content sub { vertical-align: sub; font-size: smaller; }
                .rich-text-content sup { vertical-align: super; font-size: smaller; }
                .rich-text-content blockquote { border-left: 4px solid #4a5568; margin-left: 1rem; padding-left: 1rem; color: #a0aec0; font-style: italic; }
                .rich-text-content .resizable-container { display: inline-block; position: relative; line-height: 0; }
                .rich-text-content img { max-width: 100%; border-radius: 4px; vertical-align: middle; }
                .resizer { position: absolute; width: 12px; height: 12px; background: #007aff; border: 2px solid white; border-radius: 50%; display: none; z-index: 10; }
                .resizable-container:hover .resizer, .rich-text-content img.resizable-active + .resizer, .rich-text-content img.resizable-active ~ .resizer { display: block; }
                .rich-text-content img.resizable-active { outline: 2px solid #007aff; }
                .resizer.top-left { top: -6px; left: -6px; cursor: nwse-resize; }
                .resizer.top-right { top: -6px; right: -6px; cursor: nesw-resize; }
                .resizer.bottom-left { bottom: -6px; left: -6px; cursor: nesw-resize; }
                .resizer.bottom-right { bottom: -6px; right: -6px; cursor: nwse-resize; }
            `}</style>
            <div
                id={id}
                ref={editorRef}
                contentEditable
                className={`rich-text-content outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 cursor-text overflow-auto break-words whitespace-pre-wrap ${className}`}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePasteLogic}
                onMouseUp={checkFormats}
                onKeyUp={checkFormats}
                data-placeholder={placeholder}
                style={{ overflowWrap: 'break-word', wordBreak: 'break-word', ...style }}
                spellCheck={true}
                suppressContentEditableWarning={true}
            />
        </>
    );
};

export const RichTextEditor = React.memo(RichTextEditorComponent);
