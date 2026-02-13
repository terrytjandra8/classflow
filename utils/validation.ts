
/**
 * robustly checks if a string is a URL.
 * Permissive to allow pasting of complex links with query params.
 */
export const isValidUrl = (text: string): boolean => {
    if (!text) return false;
    
    // 1. Sanitize: Remove Zero-width spaces and trim
    const trimmed = text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    
    // 2. Protocol Check (Most Permissive)
    // If it starts with http/https/www, we treat it as a URL intent.
    // We only check that it DOES NOT contain spaces to distinguish from sentences.
    if (/^(http:\/\/|https:\/\/|www\.)/i.test(trimmed)) {
        return !/\s/.test(trimmed);
    }

    // 3. Fallback for domain-like strings without protocol (e.g. google.com/maps)
    // Must look like domain.tld and have no spaces
    const domainLikeRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/;
    if (domainLikeRegex.test(trimmed)) {
        return !/\s/.test(trimmed);
    }

    // 4. Try Native URL as final fallback
    try {
        new URL(trimmed);
        return true;
    } catch {
        return false;
    }
};

/**
 * Checks if a word appears to be keyboard mash/gibberish.
 * Heuristics:
 * 1. Must contain at least one vowel (or y).
 * 2. Cannot have > 5 consecutive consonants.
 * 3. Cannot have > 3 repeating characters.
 */
export const isGibberish = (word: string): boolean => {
    // Remove punctuation to check the core word
    const clean = word.replace(/[^a-zA-Z]/g, '');
    
    // Short words (I, a, to) or numbers are usually fine
    if (clean.length < 2) return false; 
    
    // 1. Must contain at least one vowel (including y)
    // Exceptions: 'hmm', 'shh', 'psst' etc. can be ignored for strict academic validation
    if (!/[aeiouy]/i.test(clean)) return true;

    // 2. Max 5 consecutive consonants (e.g. 'strengths' has 5: n-g-t-h-s, but 6 is almost certainly garbage)
    if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(clean)) return true;

    // 3. Repeating characters (e.g. "aaaaa")
    if (/(.)\1{3,}/.test(clean)) return true;

    return false;
};

/**
 * Counts valid words in a text string, excluding detected gibberish.
 */
export const countQualityWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(w => {
        const clean = w.replace(/^[^\w]+|[^\w]+$/g, ''); // Trim punctuation from ends
        if (clean.length === 0) return false; // was just punctuation
        if (!isNaN(Number(clean))) return true; // Numbers count
        return !isGibberish(clean);
    }).length;
};
