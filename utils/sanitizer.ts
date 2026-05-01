import DOMPurify from 'dompurify';

/**
 * Sanitizer Utility
 * 
 * Centralized source of truth for HTML sanitization.
 * Uses DOMPurify to prevent XSS while allowing safe formatting.
 */
export const Sanitizer = {
    /**
     * Sanitizes HTML content for safe rendering.
     * @param html The raw HTML string.
     * @returns A sanitized HTML string.
     */
    sanitize: (html: string): string => {
        if (!html) return '';
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
                'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'img',
                'blockquote', 'code', 'pre'
            ],
            ALLOWED_ATTR: ['href', 'src', 'target', 'rel', 'style', 'class', 'alt', 'title'],
            ADD_ATTR: ['target'],
            FORBID_ATTR: ['onerror', 'onclick', 'onmouseover'],
        }) as string;
    },

    /**
     * Sanitizes a single line of text (removes all HTML).
     */
    stripHtml: (text: string): string => {
        if (!text) return '';
        // Use DOMPurify with no allowed tags to strip everything
        return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] }) as string;
    }
};
