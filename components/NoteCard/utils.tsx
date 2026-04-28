
import React from 'react';

// Custom Renderer for Bold/Italic/List
export const renderFormattedContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
        const trimmed = line.trim();
        
        // Unordered List Detection: -, *, •
        const isUnordered = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
        
        // Ordered List Detection: 1. 2. etc.
        const orderedMatch = trimmed.match(/^(\d+)\.\s/);
        const isOrdered = !!orderedMatch;

        const isList = isUnordered || isOrdered;
        
        let cleanLine = line;
        if (isUnordered) {
            cleanLine = trimmed.substring(2);
        } else if (isOrdered && orderedMatch) {
            cleanLine = trimmed.substring(orderedMatch[0].length);
        }
        
        // Robust regex for **bold** and _italic_
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
                <div key={i} className="flex gap-3 ml-3 items-start mb-1">
                    <div className="flex justify-center items-center shrink-0 w-5 h-6">
                        {isUnordered ? (
                            <span className="select-none w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        ) : (
                            <span className="select-none text-[11px] font-bold opacity-60 font-mono">{orderedMatch?.[1]}.</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 break-words leading-relaxed">{children}</div>
                </div>
            );
        }
        
        return <div key={i} className={`min-h-[1.2em] break-words ${line.trim() === '' ? 'h-2' : ''}`}>{children}</div>;
    });
};

