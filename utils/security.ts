
/**
 * ClassBoard Security Utility
 * Handles encrypted storage for sensitive student data (like focus violations).
 * Uses a basic XOR-cipher with checksum to prevent manual tampering via DevTools.
 */

const SECRET_KEY = "cb_v_salt_2026"; // Internal salt for tampering prevention

/**
 * Encrypts a number into a secure string.
 */
export const encryptViolationCount = (count: number): string => {
    const data = `${count}:${SECRET_KEY}:${count * 7}`; // Simple checksum
    return btoa(data.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join(''));
};

/**
 * Decrypts a string and verifies the integrity.
 * Returns the count if valid, or 0 if tampered.
 */
export const decryptViolationCount = (encrypted: string | null): number => {
    if (!encrypted) return 0;
    try {
        const decoded = atob(encrypted);
        const decrypted = decoded.split('').map((char, i) => 
            String.fromCharCode(char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
        ).join('');
        
        const [countStr, key, checksum] = decrypted.split(':');
        const count = parseInt(countStr);
        
        // Verify Integrity
        if (key === SECRET_KEY && parseInt(checksum) === count * 7) {
            return isNaN(count) ? 0 : count;
        }
        
        console.error("[Security] Tampering detected in violation count! Resetting to 0 for safety.");
        return 0;
    } catch (e) {
        return 0;
    }
};

/**
 * Helper to manage note-specific violation keys
 */
export const getViolationKey = (noteId: string) => `cb_v_v4_${noteId}`;
