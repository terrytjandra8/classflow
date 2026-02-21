import { twMerge } from 'tailwind-merge';

export const getInitials = (name: string): string => {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
};

export const getWordCount = (text: string): number => {
    if (!text) return 0;
    // This regex strips HTML tags and counts words.
    const plainText = text.replace(/<[^>]*>/g, ' ');
    // Correctly split by one or more whitespace characters.
    return plainText.trim().split(/\s+/).filter(Boolean).length;
};

// This regex now correctly handles image URLs with query parameters.
export const isContentImage = (content: string): boolean => {
    return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))(\?.*)?$/.test(content);
};

// Placeholder for parseAnswer - assuming it returns a string
export const parseAnswer = (answer: string, type: string, options?: string[]): string => {
    // This is a simplified placeholder. The actual implementation might be more complex.
    if (type === 'mcq' && options && !isNaN(parseInt(answer))) {
        return options[parseInt(answer)] || answer;
    }
    return answer;
};
