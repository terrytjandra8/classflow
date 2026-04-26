
/**
 * QUIZ SCORING SYSTEM v1.2.0 - "More Fun & Competitive"
 * 
 * This is the SINGLE SOURCE OF TRUTH for scoring.
 */

export type PointSystemType = 'standard' | 'double' | 'none' | 'competitive' | 'streak_boost';

export interface PointSystemConfig {
    id: PointSystemType;
    name: string;
    description: string;
    maxPoints: number;
    useTimer: boolean;
    hasStreak: boolean;
    penalty: number; // New: Risk factor
}

export const POINT_SYSTEMS: PointSystemConfig[] = [
    { 
        id: 'standard', 
        name: 'Standard', 
        description: 'Safe play. Earn up to 1000 points + streak bonus. No penalties for wrong answers.', 
        maxPoints: 1000, 
        useTimer: true, 
        hasStreak: true,
        penalty: 0
    },
    { 
        id: 'double', 
        name: 'Double Points', 
        description: 'High stakes! 2000 points max, but a small -100 penalty if you miss.', 
        maxPoints: 2000, 
        useTimer: true, 
        hasStreak: true,
        penalty: 100
    },
    { 
        id: 'streak_boost', 
        name: 'Streak Boost', 
        description: 'Consistency is key. Massive streak multipliers, but streak resets to 0 on any miss.', 
        maxPoints: 1000, 
        useTimer: true, 
        hasStreak: true,
        penalty: 0
    },
    { 
        id: 'competitive', 
        name: 'Competitive', 
        description: 'ULTRA RISK. Fixed 1000 points for correct answers, but a CRIPPLING -500 penalty for wrong ones!', 
        maxPoints: 1000, 
        useTimer: false, 
        hasStreak: false,
        penalty: 500
    },
    { 
        id: 'none', 
        name: 'No Points', 
        description: 'Casual mode. No scores, just for fun or surveys.', 
        maxPoints: 0, 
        useTimer: false, 
        hasStreak: false,
        penalty: 0
    }
];

export interface ScoreResult {
    base: number;
    speed: number;
    rank: number;
    streak: number;
    total: number;
}

/**
 * Calculates total points for a given answer.
 */
export const calculatePoints = (
    systemId: PointSystemType,
    timeRemainingMs: number,
    timeLimitMs: number,
    isCorrect: boolean,
    currentStreak: number = 0,
    correctRank: number = 0
): ScoreResult => {
    
    const config = POINT_SYSTEMS.find(p => p.id === systemId) || POINT_SYSTEMS[0];

    // 1. INCORRECT ANSWER LOGIC (Risk/Penalty)
    if (!isCorrect) {
        const penalty = -config.penalty;
        return { base: penalty, speed: 0, rank: 0, streak: 0, total: penalty };
    }

    // 2. FAIL-SAFE for "None" system
    if (systemId === 'none') {
        return { base: 0, speed: 0, rank: 0, streak: 0, total: 0 };
    }

    const multiplier = systemId === 'double' ? 2 : 1;

    // 3. BASE POINTS
    const base = config.maxPoints;

    // 4. SPEED BONUS (max 500)
    let speed = 0;
    if (config.useTimer && timeLimitMs > 0) {
        const timeFactor = Math.max(0, Math.min(1, timeRemainingMs / timeLimitMs));
        speed = Math.floor(500 * timeFactor * multiplier);
    }

    // 5. RANK BONUS (First responders get more)
    const rankStep = systemId === 'competitive' ? 100 : 50;
    const maxRankBonus = systemId === 'competitive' ? 1000 : 500;
    const rank = Math.max(0, (maxRankBonus - (correctRank * rankStep)) * multiplier);

    // 6. STREAK BONUS (High scaling for Streak Boost)
    let streak = 0;
    if (config.hasStreak && currentStreak > 0) {
        const streakStep = systemId === 'streak_boost' ? 300 : 100; // Boosted step
        const effectiveStreak = Math.min(currentStreak, 5); // Cap at level 5
        streak = effectiveStreak * streakStep * multiplier;
    }

    const total = base + speed + rank + streak;

    return { base, speed, rank, streak, total };
};
