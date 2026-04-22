
export type PointSystemType = 'standard' | 'double' | 'none' | 'competitive' | 'streak_boost';

export interface PointSystemConfig {
    id: PointSystemType;
    name: string;
    description: string;
    maxPoints: number;
    useTimer: boolean;
    hasStreak: boolean;
}

export const POINT_SYSTEMS: PointSystemConfig[] = [
    {
        id: 'standard',
        name: 'Standard',
        description: 'Time-based points (1000 max) + Dynamic Streak Bonus.',
        maxPoints: 1000,
        useTimer: true,
        hasStreak: true
    },
    {
        id: 'double',
        name: 'Double Points',
        description: 'Double rewards (2000 max) + Dynamic Streak Bonus.',
        maxPoints: 2000,
        useTimer: true,
        hasStreak: true
    },
    {
        id: 'streak_boost',
        name: 'Streak Boost',
        description: 'Massive rewards for long streaks. Perfect for consistent students.',
        maxPoints: 1000,
        useTimer: true,
        hasStreak: true
    },
    {
        id: 'competitive',
        name: 'Competitive',
        description: 'Fixed 1000 points if correct. No timer, no streak.',
        maxPoints: 1000,
        useTimer: false,
        hasStreak: false
    },
    {
        id: 'none',
        name: 'No Points',
        description: 'No scores tracked. Use for surveys or icebreakers.',
        maxPoints: 0,
        useTimer: false,
        hasStreak: false
    }
];

/**
 * Calculates the streak bonus based on consecutive correct answers
 */
export const getStreakBonus = (streak: number, system: PointSystemType): number => {
    if (streak <= 1) return 0;
    
    // Default streak bonus: 100 per streak level, capped at 500
    let bonusPerLevel = 100;
    let maxBonus = 500;

    // Boosted streak system
    if (system === 'streak_boost') {
        bonusPerLevel = 250; // High reward for consistency
        maxBonus = 1500; 
    }

    return Math.min((streak - 1) * bonusPerLevel, maxBonus);
};

/**
 * Calculates total points for a given answer including time, rank, and streak factors.
 * This is the SINGLE SOURCE OF TRUTH for scoring in the application.
 */
export const calculatePoints = (
    system: PointSystemType,
    timeRemainingMs: number,
    timeLimitMs: number,
    isCorrect: boolean,
    currentStreak: number = 0,
    correctRank: number = 0 // 0 = first person to answer correctly
): { base: number; speed: number; rank: number; streak: number; total: number } => {
    // 1. ABSOLUTE GUARD: If not correct, zero points across the board.
    if (!isCorrect || system === 'none') {
        return { base: 0, speed: 0, rank: 0, streak: 0, total: 0 };
    }

    const config = POINT_SYSTEMS.find(p => p.id === system) || POINT_SYSTEMS[0];
    const multiplier = system === 'double' ? 2 : 1;
    
    // 2. BASE POINTS (Standard is 1000)
    const basePoints = config.maxPoints;

    // 3. SPEED BONUS (max 500)
    let speedBonus = 0;
    if (config.useTimer && timeLimitMs > 0) {
        // Linear decay from 500 to 0 based on time elapsed
        const timeFactor = Math.max(0, Math.min(1, timeRemainingMs / timeLimitMs));
        speedBonus = Math.floor(500 * timeFactor * multiplier);
    }

    // 4. RANK BONUS (Dynamic based on system)
    let rankBonus = 0;
    if (system !== 'none') {
        const rankStep = system === 'competitive' ? 100 : 50;
        const maxRankBonus = system === 'competitive' ? 1000 : 500;
        rankBonus = Math.max(0, (maxRankBonus - (correctRank * rankStep)) * multiplier);
    }

    // 5. STREAK BONUS (Capped at level 5)
    let streakBonus = 0;
    if (config.hasStreak) {
        const streakStep = system === 'streak_boost' ? 200 : 100;
        streakBonus = Math.min(currentStreak, 5) * streakStep * multiplier;
    }

    return {
        base: basePoints,
        speed: speedBonus,
        rank: rankBonus,
        streak: streakBonus,
        total: basePoints + speedBonus + rankBonus + streakBonus
    };
};
