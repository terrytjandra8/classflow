
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
 * Calculates total points for a given answer including time and streak factors
 */
export const calculatePoints = (
    system: PointSystemType,
    timeRemaining: number,
    timeLimit: number,
    isCorrect: boolean,
    currentStreak: number = 0
): { base: number; bonus: number; total: number } => {
    if (!isCorrect) return { base: 0, bonus: 0, total: 0 };

    const config = POINT_SYSTEMS.find(p => p.id === system) || POINT_SYSTEMS[0];
    
    if (config.id === 'none') return { base: 0, bonus: 0, total: 0 };

    let basePoints = config.maxPoints;
    
    // Apply timer factor if enabled
    if (config.useTimer && timeLimit > 0) {
        const timeFactor = timeRemaining / timeLimit;
        basePoints = Math.round(config.maxPoints * (0.5 + 0.5 * timeFactor));
    }

    // Apply streak bonus if enabled
    const bonusPoints = config.hasStreak ? getStreakBonus(currentStreak, system) : 0;
    
    return {
        base: basePoints,
        bonus: bonusPoints,
        total: basePoints + bonusPoints
    };
};
