
const ADJECTIVES = [
    'Cosmic', 'Swift', 'Brave', 'Bright', 'Calm', 'Cool', 'Lucky', 'Neon', 'Turbo', 'Wild', 
    'Epic', 'Jolly', 'Silent', 'Hyper', 'Cyber', 'Pixel', 'Sonic', 'Ultra', 'Giga', 'Nano',
    'Mystery', 'Secret', 'Hidden', 'Quiet', 'Rogue', 'Shadow', 'Ghost', 'Magic', 'Happy', 'Wise'
];

const ANIMALS = [
    'Panda', 'Tiger', 'Eagle', 'Fox', 'Wolf', 'Bear', 'Lion', 'Hawk', 'Owl', 'Shark',
    'Dolphin', 'Whale', 'Dragon', 'Phoenix', 'Falcon', 'Badger', 'Otter', 'Koala', 'Bunny', 'Cat',
    'Robot', 'Droid', 'Cyborg', 'Agent', 'Ninja', 'Wizard', 'Ghost', 'Spirit', 'Star', 'Moon'
];

// Simple hash function to get a consistent number from a string ID
const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

export const getAnonymousIdentity = (userId: string) => {
    if (!userId) return { name: 'Anonymous', avatar: null };

    const hash = hashCode(userId);
    const adj = ADJECTIVES[hash % ADJECTIVES.length];
    const noun = ANIMALS[(hash >> 2) % ANIMALS.length]; // Bit shift for variance
    
    // Generate a consistent Dicebear bot avatar based on ID
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}&backgroundColor=transparent`;

    return {
        name: `${adj} ${noun}`,
        avatar: avatar
    };
};
