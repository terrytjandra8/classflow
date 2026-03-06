
import React from 'react';

// Custom Renderer for Bold/Italic/List
export const renderFormattedContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
        const isList = line.trim().startsWith('- ');
        const cleanLine = isList ? line.trim().substring(2) : line;
        
        // Robust regex for **bold** and _italic_
        // Matches **text** or _text_
        const parts = cleanLine.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
        
        const children = parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                return <strong key={j} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
                return <em key={j} className="italic text-inherit">{part.slice(1, -1)}</em>;
            }
            return <span key={j}>{part}</span>;
        });

        if (isList) {
            return (
                <div key={i} className="flex gap-2 ml-1 items-start">
                    <span className="select-none mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
                    <div className="flex-1 min-w-0 break-words">{children}</div>
                </div>
            );
        }
        
        return <div key={i} className={`min-h-[1.2em] break-words ${line.trim() === '' ? 'h-2' : ''}`}>{children}</div>;
    });
};
