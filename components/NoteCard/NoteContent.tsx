
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CheckSquare, PenTool, ChevronUp, ChevronDown, X, ZoomIn, PlayCircle, FileText, Globe, ExternalLink, Maximize2, Minimize2, BookOpen, Palette, CopyX } from 'lucide-react';
import { Note, NoteColor } from '../../types';
import { renderFormattedContent } from './utils';
import { useCopyProtection } from '../../hooks/useSecurity';

interface NoteContentProps {
    note: Note;
    contentTextColor?: string;
    isEditing: boolean;
    isStickyNote: boolean;
    isCopyDisabled?: boolean; 
}

// --- DATA POISONING UTILITIES ---

// 1. Homoglyph Map: Swaps Latin chars for identical Cyrillic/Greek chars
// AI sees: Mixed Unicode scripts (garbage). Human sees: Normal text.
const HOMOGLYPH_MAP: Record<string, string> = {
    'a': '\u0430', // Cyrillic small a
    'c': '\u0441', // Cyrillic small es
    'e': '\u0435', // Cyrillic small ie
    'i': '\u0456', // Cyrillic small byelorussian-ukrainian i
    'j': '\u0458', // Cyrillic small je
    'o': '\u03BF', // Greek small omicron
    'p': '\u0440', // Cyrillic small er
    's': '\u0455', // Cyrillic small dze
    'x': '\u0445', // Cyrillic small ha
    'y': '\u0443', // Cyrillic small u
    'A': '\u0391', // Greek Alpha
    'B': '\u0392', // Greek Beta
    'E': '\u0395', // Greek Epsilon
    'H': '\u0397', // Greek Eta
    'I': '\u0399', // Greek Iota
    'K': '\u039A', // Greek Kappa
    'M': '\u039C', // Greek Mu
    'N': '\u039D', // Greek Nu
    'O': '\u039F', // Greek Omicron
    'P': '\u03A1', // Greek Rho
    'T': '\u03A4', // Greek Tau
    'X': '\u03A7', // Greek Chi
    'Y': '\u03A5', // Greek Upsilon
};

// "Dot Attack": Insert dots between characters to break tokenization
const poisonText = (text: string): string => {
    if (!text) return '';

    const processWord = (word: string) => {
        // Skip URLs to prevent breaking links
        if (word.match(/^(http|https|www)/i)) return word;
        
        // Convert to Homoglyphs AND inject dots
        return word.split('').map((char, i) => {
            const homoglyph = HOMOGLYPH_MAP[char] || char;
            // Don't add dot after the last character of the word
            if (i === word.length - 1) return homoglyph;
            return homoglyph + '.';
        }).join('');
    };

    // HTML-Aware Processing
    if (/<\/?[a-z][\s\S]*>/i.test(text)) {
        return text.split(/(<[^>]*>)/g).map(part => {
            // Return HTML tags as-is
            if (part.startsWith('<') && part.endsWith('>')) return part;
            // Process text content
            return part.split(' ').map(processWord).join(' ');
        }).join('');
    }

    // Plain Text Processing
    return text.split(' ').map(processWord).join(' ');
};

// Helper: Decode HTML entities (e.g. &lt;div&gt; -> <div>)
const decodeHtml = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

// Helper: Check for HTML tags
const isHtml = (text: string) => /<\/?[a-z][\s\S]*>/i.test(text);

// SECURITY: Sanitize HTML to prevent XSS
const sanitizeHtml = (input: string) => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(input, 'text/html');
        
        // 1. Remove dangerous tags completely
        const bannedTags = ['script', 'iframe', 'object', 'embed', 'link', 'style', 'base', 'form', 'input', 'button', 'meta', 'applet'];
        bannedTags.forEach(tag => {
            const elements = doc.querySelectorAll(tag);
            elements.forEach(el => el.remove());
        });

        // 2. Scan all remaining elements for dangerous attributes
        const allElements = doc.querySelectorAll('*');
        allElements.forEach(el => {
            const attrs = Array.from(el.attributes);
            attrs.forEach(attr => {
                const name = attr.name.toLowerCase();
                const value = attr.value.toLowerCase().trim();

                // Remove event handlers (onclick, onmouseover, etc.)
                if (name.startsWith('on')) {
                    el.removeAttribute(name);
                }

                // Remove javascript: URIs in href/src
                if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
                    el.removeAttribute(name);
                }
            });
        });

        return doc.body.innerHTML;
    } catch (e) {
        console.error("Failed to sanitize HTML", e);
        return ""; // Fail safe
    }
};

// Helper: Extract all unique URLs from text with cleanup
const extractUrls = (text: string): string[] => {
    if (!text) return [];
    // Regex to capture http/https URLs, properly handling boundaries
    const matches = text.match(/(https?:\/\/[^\s]+)/g);
    
    if (!matches) return [];

    // Clean punctuation from end of URLs (e.g. "google.com." -> "google.com")
    const cleanMatches = matches.map(url => {
        return url.replace(/[.,;:)\]]+$/, '');
    });

    return Array.from(new Set(cleanMatches));
};

// Helper: Generate a readable title from a URL slug
const getUrlTitle = (url: string): string => {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const pathname = urlObj.pathname;
        
        // Case: YouTube
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube Video';
        if (hostname.includes('behance.net')) return 'Behance Project';
        if (hostname.includes('artstation.com')) return 'ArtStation Artwork';

        // Split path, ignore empty segments
        const segments = pathname.split('/').filter(s => s && s.length > 0);
        
        const textSegments = segments.filter(s => !/^\d+$/.test(s));
        
        if (textSegments.length > 0) {
            let slug = textSegments[textSegments.length - 1];
            slug = slug.replace(/\.(html|php|aspx|jsp)$/, '');
            const title = decodeURIComponent(slug).replace(/[-_]/g, ' ');
            if (title.length > 3) { 
                return title.charAt(0).toUpperCase() + title.slice(1);
            }
        }
        
        return hostname.replace('www.', '');
    } catch {
        return url;
    }
};

const getFavicon = (url: string) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
        return null;
    }
};

const getMediaType = (url: string) => {
    if (!url) return 'unknown';
    const cleanUrl = url.toLowerCase();
    if (cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/)) return 'image';
    if (cleanUrl.match(/\.pdf$/)) return 'pdf';
    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be') || cleanUrl.includes('vimeo.com')) return 'video';
    if (cleanUrl.includes('behance.net/gallery') || cleanUrl.includes('artstation.com/artwork')) return 'portfolio';
    return 'website';
};

const getEmbedSrc = (url: string, type: string) => {
    if (type === 'video') {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let v = '';
            if (url.includes('v=')) v = url.split('v=')[1]?.split('&')[0];
            else if (url.includes('youtu.be/')) v = url.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${v}?autoplay=1`;
        }
        if (url.includes('vimeo.com')) {
            const v = url.split('/').pop();
            return `https://player.vimeo.com/video/${v}?autoplay=1`;
        }
    }
    return url;
};

const getYoutubeThumbnail = (url: string) => {
    let v = '';
    if (url.includes('v=')) v = url.split('v=')[1]?.split('&')[0];
    else if (url.includes('youtu.be/')) v = url.split('youtu.be/')[1]?.split('?')[0];
    return v ? `https://img.youtube.com/vi/${v}/mqdefault.jpg` : null;
};

const PreviewModal = ({ url, type, onClose }: { url: string, type: string, onClose: () => void }) => {
    const embedSrc = getEmbedSrc(url, type);
    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50">
                <X size={24} />
            </button>
            <div className="w-full h-full max-w-6xl bg-black rounded-2xl overflow-hidden relative shadow-2xl flex flex-col border border-white/10" onClick={e => e.stopPropagation()}>
                <div className="bg-[#1a1a1a] p-4 flex justify-between items-center shrink-0 border-b border-white/10">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <span className="p-2 bg-white/5 rounded-lg text-white">
                            {type === 'pdf' ? <FileText size={18}/> : type === 'video' ? <PlayCircle size={18}/> : <Globe size={18}/>}
                        </span>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-white text-sm font-bold truncate max-w-[200px] md:max-w-md">
                                {getUrlTitle(url)}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate">{url}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-colors">
                            <ExternalLink size={14} /> Open
                        </a>
                    </div>
                </div>
                <div className="flex-1 relative bg-white overflow-hidden flex flex-col">
                    <iframe src={embedSrc} className="w-full h-full border-0 flex-1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
            </div>
        </div>,
        document.body
    );
};

export const NoteContent: React.FC<NoteContentProps> = ({ note, contentTextColor, isEditing, isStickyNote, isCopyDisabled }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [previewModal, setPreviewModal] = useState<{ url: string, type: string } | null>(null);
    const [expandedUrls, setExpandedUrls] = useState<Record<string, boolean>>({});
    
    const CHAR_LIMIT = 300;
    const isImage = note.type === 'image' || note.type === 'drawing';
    const isExitTicket = note.type === 'exit_ticket';
    const isTransparent = note.color === NoteColor.TRANSPARENT;
    const isColored = note.color !== NoteColor.WHITE && !isTransparent;

    const isLongText = note.content && note.content.length > CHAR_LIMIT;
    const shouldTruncate = !isStickyNote && !isTransparent && !isEditing && !isImage && isLongText;

    // Use Security Hook for Copy Protection
    const { onContextMenu, style: copyStyle } = useCopyProtection(!!isCopyDisabled);

    const displayUrls = useMemo(() => {
        const urls = extractUrls(note.content || '');
        if (note.attachmentUrl && !urls.includes(note.attachmentUrl)) {
            urls.unshift(note.attachmentUrl);
        }
        return urls;
    }, [note.content, note.attachmentUrl]);

    const toggleInlinePreview = (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedUrls(prev => ({ ...prev, [url]: !prev[url] }));
    };

    // Apply Poisoning if watermark is active
    const processedContent = useMemo(() => {
        if (note.isWatermarked && !isEditing) {
            return poisonText(note.content);
        }
        return note.content;
    }, [note.content, note.isWatermarked, isEditing]);

    const renderContent = () => {
        // 1. Check if content is already valid HTML tags
        if (isHtml(processedContent)) {
            const safeHtml = sanitizeHtml(processedContent);
            return <div dangerouslySetInnerHTML={{ __html: safeHtml }} className="rich-text-content" />;
        }
        
        // 2. Check if content is ESCAPED HTML (e.g. from a raw text paste of HTML)
        const decoded = decodeHtml(processedContent);
        if (isHtml(decoded) && decoded !== processedContent) {
             const safeHtml = sanitizeHtml(decoded);
             return <div dangerouslySetInnerHTML={{ __html: safeHtml }} className="rich-text-content" />;
        }

        // 3. Fallback to formatting raw text (Markdown-ish)
        return renderFormattedContent(decodeHtml(processedContent));
    };

    const renderLinkPreview = (url: string) => {
        let urlType = 'website';
        let domain = '';
        let title = '';
        let favicon = null;
        
        try {
            urlType = getMediaType(url);
            const urlObj = new URL(url);
            domain = urlObj.hostname.replace('www.', '');
            title = getUrlTitle(url);
            favicon = getFavicon(url);
        } catch (e) { return null; }

        const ytThumbnail = (urlType === 'video') ? getYoutubeThumbnail(url) : null;
        const embedSrc = getEmbedSrc(url, urlType);
        const isInlineExpanded = expandedUrls[url];

        if (isInlineExpanded) {
            return (
                <div key={url} className="w-full relative rounded-xl overflow-hidden bg-black border border-black/10 shadow-inner group animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-[#222] p-2 flex justify-between items-center border-b border-white/10">
                        <button onClick={(e) => toggleInlinePreview(url, e)} className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1 bg-white/10 px-2 py-1 rounded transition-colors"><Minimize2 size={12} /> Collapse</button>
                        <div className="flex gap-2">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10"><ExternalLink size={14} /></a>
                            <button onClick={(e) => { e.stopPropagation(); setPreviewModal({ url, type: urlType }); }} className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10"><Maximize2 size={14} /></button>
                        </div>
                    </div>
                    <div className={`w-full ${urlType === 'video' ? 'aspect-video' : 'h-[300px]'}`}>
                        <iframe src={embedSrc} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                </div>
            );
        }

        const cardBgClass = isColored ? 'bg-black/5 hover:bg-black/10 border-black/5' : 'bg-white/60 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30 border-black/5 dark:border-white/10';
        const cardTextClass = isColored ? 'text-slate-900' : 'text-slate-800 dark:text-white';
        const cardSubTextClass = isColored ? 'text-slate-600' : 'text-slate-500 dark:text-slate-400';

        return (
            <div key={url} className={`${cardBgClass} border rounded-xl overflow-hidden cursor-pointer transition-all group shadow-sm relative`} onClick={(e) => toggleInlinePreview(url, e)}>
                {urlType === 'video' && ytThumbnail ? (
                    <div className="h-40 w-full relative overflow-hidden bg-black">
                        <img src={ytThumbnail} alt="Video Thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform shadow-2xl">
                                <PlayCircle size={32} className="text-white fill-white/20" />
                            </div>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded truncate max-w-[70%]">{domain}</div>
                    </div>
                ) : (
                    <div className="p-3 flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${urlType === 'pdf' ? 'bg-red-500/10 text-red-500' : 'bg-white/50 border border-black/5'}`}>
                            {favicon ? <img src={favicon} alt="" className="w-6 h-6 object-contain" /> : (urlType === 'pdf' ? <FileText size={20} /> : <Globe size={20} className="text-blue-500" />)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-bold truncate mb-0.5 ${cardTextClass}`} title={title}>{title}</h4>
                            <p className={`text-[10px] truncate opacity-80 font-mono ${cardSubTextClass}`}>{domain}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Clean style (no visual noise)
    const interferenceStyle = {};

    return (
        <>
            <div 
                className={`
                    px-4 pb-2 text-sm leading-relaxed whitespace-pre-wrap break-words flex-1 
                    ${isTransparent ? 'p-0 text-slate-900 dark:text-white' : 'text-slate-800'} 
                    ${isStickyNote ? 'p-5 flex flex-col justify-start overflow-hidden' : ''}
                    ${isCopyDisabled ? 'select-none' : 'select-text'}
                `} 
                style={{ 
                    color: !isTransparent && contentTextColor ? contentTextColor : undefined,
                    ...copyStyle,
                    ...interferenceStyle
                }}
                onContextMenu={onContextMenu}
            >
                {note.title && (
                    <div className={`font-bold mb-3 leading-tight break-words whitespace-pre-wrap ${isTransparent ? 'text-2xl' : 'text-xl'} ${note.isWatermarked ? 'mb-4' : ''}`}>
                        {isExitTicket && <CheckSquare className="text-slate-700 shrink-0 inline mr-2" size={16} />}
                        {note.type === 'drawing' && <PenTool className="text-slate-700 shrink-0 inline mr-2" size={16} />}
                        {note.isWatermarked ? poisonText(note.title) : note.title}
                    </div>
                )}

                {isImage ? (
                <div className="rounded-lg overflow-hidden mb-2 bg-black/5 border border-black/5 relative group cursor-zoom-in" onClick={(e) => { e.stopPropagation(); setIsImageModalOpen(true); }}>
                    <img src={note.content} alt={note.title || "Note image"} className="w-full h-auto object-cover max-h-[300px]" draggable={false} loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><ZoomIn className="text-white drop-shadow-md" size={32} /></div>
                </div>
                ) : (
                <div className="w-full relative">
                    <div className={`w-full break-words transition-all duration-300 ${shouldTruncate && !isExpanded ? 'max-h-[160px] overflow-hidden' : ''}`} style={shouldTruncate && !isExpanded ? { maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' } : undefined}>
                        {renderContent()}
                    </div>
                    {shouldTruncate && (
                        <div className={`mt-2 flex ${isExpanded ? 'justify-end' : 'justify-center'}`}>
                            <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-full hover:bg-blue-500/20">
                                {isExpanded ? <><span className="mr-1">Show less</span><ChevronUp size={12} /></> : <><span className="mr-1">Read more</span><ChevronDown size={12} /></>}
                            </button>
                        </div>
                    )}
                </div>
                )}

                {displayUrls.length > 0 && !isImage && (
                    <div className="mt-4 flex flex-col gap-3 break-inside-avoid">
                        {displayUrls.map(url => renderLinkPreview(url))}
                    </div>
                )}
            </div>

            {isImageModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out" onClick={(e) => { e.stopPropagation(); setIsImageModalOpen(false); }}>
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50" onClick={() => setIsImageModalOpen(false)}><X size={32} /></button>
                    <img src={note.content} alt={note.title || "Full size"} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 cursor-default" onClick={(e) => e.stopPropagation()} />
                </div>, document.body
            )}

            {previewModal && <PreviewModal url={previewModal.url} type={previewModal.type} onClose={() => setPreviewModal(null)} />}
        </>
    );
};
