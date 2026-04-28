import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';

// --- Types ---
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

export interface RichTextEditorRef {
    focus: () => void;
    execCommand: (command: string, value?: string) => void;
    insertHTML: (html: string) => void;
    getHTML: () => string;
}

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
    readOnly?: boolean;
}

// --- Constants & Helpers ---
const ALLOWED_PASTE_TAGS = ['B', 'I', 'U', 'STRONG', 'EM', 'P', 'BR', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4'];

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

export const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
};

const sanitizeHTML = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove all script tags
    doc.querySelectorAll('script').forEach(s => s.remove());
    
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
    let node;
    const toRemove: Element[] = [];
    
    while (node = walker.nextNode() as Element) {
        if (!ALLOWED_PASTE_TAGS.includes(node.tagName)) {
            toRemove.push(node);
        } else {
            // Clean styles but preserve alignment
            const style = node.getAttribute('style');
            if (style) {
                const match = style.match(/text-align\s*:\s*([^;]+)/);
                if (match) node.setAttribute('style', `text-align: ${match[1]}`);
                else node.removeAttribute('style');
            }
            node.removeAttribute('class');
        }
    }
    
    toRemove.forEach(el => {
        const fragment = document.createDocumentFragment();
        while (el.firstChild) fragment.appendChild(el.firstChild);
        el.parentNode?.replaceChild(fragment, el);
    });

    return doc.body.innerHTML;
};

// --- Sub-components ---
export const DebouncedRichTextEditor = React.memo(React.forwardRef(({ value, onChange, ...props }: any, ref: any) => {
    const [localValue, setLocalValue] = React.useState(value);
    const lastSentValue = React.useRef<string>(value);
    const isDirty = React.useRef(false);

    React.useEffect(() => {
        if (value !== lastSentValue.current && !isDirty.current) {
            setLocalValue(value || '');
            lastSentValue.current = value;
        }
    }, [value]);

    React.useEffect(() => {
        const handler = setTimeout(() => { 
            if (localValue !== lastSentValue.current) {
                lastSentValue.current = localValue;
                isDirty.current = false;
                onChange(localValue); 
            } else {
                isDirty.current = false;
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [localValue, onChange]);

    return <RichTextEditor {...props} ref={ref} value={localValue} onChange={(val: string) => { isDirty.current = true; setLocalValue(val); }} />;
}));

// --- Main Component ---
const RichTextEditorComponent = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ 
    id, value, onChange, placeholder, className, onKeyDown, onFormatChange, onPaste, autoFocus, style, imageUploadDisabled = false, readOnly = false 
}, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastFormats = useRef<FormatState | null>(null);
    const lastOutgoingValue = useRef<string | null>(null);

    // Security Refs
    const lastInputTime = useRef<number>(0);
    const rapidInputCount = useRef<number>(0);
    const lastContentLength = useRef<number>(0);
    const isPasting = useRef<boolean>(false);
    const [isBlocked, setIsBlocked] = useState(false);

    // --- Core Logic ---
    const handleUpdate = useCallback(() => {
        if (editorRef.current) {
            const currentHTML = editorRef.current.innerHTML;
            lastOutgoingValue.current = currentHTML;
            onChange(currentHTML);
            checkFormats();
        }
    }, [onChange]);

    const checkFormats = useCallback(() => {
        if (onFormatChange && !readOnly) {
            const selection = window.getSelection();
            if (!selection || !editorRef.current || !editorRef.current.contains(selection.anchorNode)) return;

            const getParentTag = (selection: Selection) => {
                let node = selection.anchorNode;
                if (node && node.nodeType === 3) node = node.parentNode;
                while (node && node !== editorRef.current) {
                    if (node.nodeName.match(/^(H[1-4]|P|DIV|BLOCKQUOTE)$/)) return node.nodeName;
                    if (node.nodeName === 'SPAN') {
                        const className = (node as HTMLElement).className;
                        if (className.match(/h[1-4]-inline/)) return className.split('-')[0].toUpperCase();
                    }
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
                h1: parentTag === 'H1', h2: parentTag === 'H2', h3: parentTag === 'H3', h4: parentTag === 'H4',
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
    }, [onFormatChange, readOnly]);

    useImperativeHandle(ref, () => ({
        focus: () => editorRef.current?.focus(),
        execCommand: (command: string, value?: string) => {
            if (editorRef.current) {
                editorRef.current.focus();
                if (command === 'formatBlock' || command.startsWith('inline-h')) {
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        let node = range.startContainer;
                        if (node.nodeType === 3) node = node.parentNode!;
                        if (command.startsWith('inline-h')) {
                            const level = command.split('-')[1];
                            const className = `${level}-inline`;
                            const parentSpan = (node as HTMLElement).closest(`span.${className}`);
                            if (parentSpan) parentSpan.outerHTML = parentSpan.innerHTML;
                            else document.execCommand('insertHTML', false, `<span class="${className}">${selection.toString()}</span>`);
                            handleUpdate(); return;
                        }
                        if (node === editorRef.current) document.execCommand('formatBlock', false, 'p');
                    }
                }
                document.execCommand(command, false, value);
                handleUpdate();
            }
        },
        insertHTML: (html: string) => {
             if (editorRef.current) {
                editorRef.current.focus();
                document.execCommand('insertHTML', false, html);
                handleUpdate();
            }
        },
        getHTML: () => editorRef.current?.innerHTML || ''
    }));

    // --- Effects ---
    useEffect(() => { if (autoFocus && editorRef.current && !readOnly) editorRef.current.focus(); }, [autoFocus, readOnly]);
    
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            if (value !== lastOutgoingValue.current) {
                if (document.activeElement === editorRef.current && !readOnly) return; 
                editorRef.current.innerHTML = value || '';
            }
        }
    }, [value, readOnly]);

    useEffect(() => { if (editorRef.current) editorRef.current.contentEditable = (readOnly || isBlocked) ? 'false' : 'true'; }, [readOnly, isBlocked]);

    useEffect(() => {
        const handleSelectionChange = () => checkFormats();
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [checkFormats]);

    // --- Interaction Handlers ---
    const handleFocus = () => {
        if(readOnly || isBlocked) return;
        document.execCommand('defaultParagraphSeparator', false, 'p');
        checkFormats();
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if(readOnly || isBlocked) return;
        handleUpdate();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if(readOnly || isBlocked) { e.preventDefault(); return; };
        if (onKeyDown) onKeyDown(e);
        if (e.ctrlKey || e.metaKey) {
            const key = e.key.toLowerCase();
            if (['b', 'i', 'u', 'z', 'y'].includes(key)) {
                e.preventDefault();
                if (key === 'b') document.execCommand('bold', false);
                else if (key === 'i') document.execCommand('italic', false);
                else if (key === 'u') document.execCommand('underline', false);
                else if (key === 'z') document.execCommand(e.shiftKey ? 'redo' : 'undo', false);
                else if (key === 'y') document.execCommand('redo', false);
                handleUpdate();
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '8') {
            e.preventDefault();
            document.execCommand('insertUnorderedList', false);
            checkFormats();
        }
    };

    const handlePasteLogic = async (e: React.ClipboardEvent) => {
        if(readOnly || isBlocked) { e.preventDefault(); return; };
        if (onPaste) onPaste(e);
        if (e.defaultPrevented) return;
        
        isPasting.current = true;
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
                        handleUpdate();
                    }
                }
            } catch (err) {
                console.error("Image upload failed:", err);
                editorRef.current?.querySelector(`#${placeholderId}`)?.remove();
                alert("Failed to upload image.");
            }
        } else {
            const html = e.clipboardData.getData('text/html');
            const text = e.clipboardData.getData('text/plain');
            if (html) document.execCommand('insertHTML', false, sanitizeHTML(html));
            else document.execCommand('insertText', false, text);
            handleUpdate();
        }
        isPasting.current = false;
    };

    // --- Image Resize Mutation Observer ---
    useEffect(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;

        const onImageClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'IMG') {
                editor.querySelectorAll('img.resizable-active').forEach(img => img.classList.remove('resizable-active'));
                return;
            }
            const isActive = target.classList.contains('resizable-active');
            editor.querySelectorAll('img.resizable-active').forEach(img => img.classList.remove('resizable-active'));
            if (!isActive) target.classList.add('resizable-active');
        };

        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.classList.contains('resizer')) return;
            e.preventDefault();
            const parent = target.parentElement;
            const img = parent?.querySelector('img');
            if (!img) return;
            const startX = e.pageX;
            const startWidth = img.offsetWidth;
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
                handleUpdate();
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        editor.addEventListener('click', onImageClick);
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node instanceof HTMLImageElement && !node.closest('.resizable-container')) {
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
    }, [handleUpdate]);

    return (
        <>
            <style>{EDITOR_STYLES}</style>
            <div
                id={id} ref={editorRef}
                contentEditable={!(readOnly || isBlocked)}
                className={`rich-text-content outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 overflow-auto break-words ${readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-text'} ${className}`}
                onInput={handleInput} onFocus={handleFocus} onKeyDown={handleKeyDown} onPaste={handlePasteLogic}
                onMouseUp={checkFormats} onKeyUp={checkFormats}
                data-placeholder={placeholder}
                style={{ overflowWrap: 'break-word', wordBreak: 'break-word', ...style }}
                spellCheck={!readOnly} suppressContentEditableWarning={true}
            />
        </>
    );
});

const EDITOR_STYLES = `
    .rich-text-content h1, .rich-text-content .h1-inline { font-size: 2.25rem; font-weight: 800; margin: 1rem 0; line-height: 1.2; color: white; display: block; }
    .rich-text-content h2, .rich-text-content .h2-inline { font-size: 1.875rem; font-weight: 700; margin: 0.875rem 0; line-height: 1.3; color: white; display: block; }
    .rich-text-content h3, .rich-text-content .h3-inline { font-size: 1.5rem; font-weight: 700; margin: 0.75rem 0; line-height: 1.4; color: white; display: block; }
    .rich-text-content h4, .rich-text-content .h4-inline { font-size: 1.25rem; font-weight: 600; margin: 0.625rem 0; line-height: 1.5; color: white; display: block; }
    .rich-text-content .h1-inline, .rich-text-content .h2-inline, .rich-text-content .h3-inline, .rich-text-content .h4-inline { display: inline; margin: 0; }
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
`;

export const RichTextEditor = React.memo(RichTextEditorComponent);
