
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { Board, Note, QuizQuestion, QuizState } from '../types';

export const useQuizGame = (board: Board, notes: Note[], userId?: string, username?: string, isStudent?: boolean, onUpdateBoard?: (updates: Partial<Board>) => void, onActivity?: () => void) => {
    const questions: QuizQuestion[] = board.quizQuestions || [];
    const state: QuizState | 'setup' = (board.quizState as any) || 'setup'; 
    const currentQIndex = board.currentQuestionIndex || 0;
    const currentQ = questions[currentQIndex];
    const currentSessionId = board.settings?.currentSessionId || null;
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper to calc remaining time immediately
    const calculateTimeLeft = () => {
        if (state === 'question' && board.quizStartTime && currentQ) {
            const elapsed = (Date.now() - board.quizStartTime) / 1000;
            const remaining = currentQ.timeLimit - elapsed;
            return Math.ceil(Math.max(0, remaining));
        }
        return 0;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    // Timer Logic
    useEffect(() => {
        if (state === 'question' && board.quizStartTime && currentQ) {
            setTimeLeft(calculateTimeLeft());

            const interval = setInterval(() => {
                const remaining = calculateTimeLeft();
                setTimeLeft(remaining);
                
                if (remaining <= 0 && !isStudent && state === 'question' && onUpdateBoard) {
                    onUpdateBoard({ quizState: 'reveal' });
                }
            }, 200);
            
            return () => clearInterval(interval);
        } else {
            setTimeLeft(0);
        }
    }, [state, board.quizStartTime, currentQ, isStudent, onUpdateBoard]);

    // Student: Check if answered current question in CURRENT session
    const myAnswerNote = useMemo(() => {
        if (!userId || !currentSessionId) return undefined;
        return notes.find(n => n.author_id === userId && n.title === `S${currentSessionId}_Q${currentQIndex}`);
    }, [notes, userId, currentQIndex, currentSessionId]);

    const hasAnswered = !!myAnswerNote;

    // --- STREAK CALCULATION (Filtered by Session) ---
    const myStreak = useMemo(() => {
        if (!userId || !currentSessionId) return 0;
        
        let streak = 0;
        for (let i = currentQIndex - 1; i >= 0; i--) {
            const q = questions[i];
            const ansNote = notes.find(n => n.author_id === userId && n.title === `S${currentSessionId}_Q${i}`);
            
            if (ansNote && Number(ansNote.content) === Number(q.correctIndex)) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }, [notes, userId, currentQIndex, questions, currentSessionId]);

    // --- SCORE CALCULATION (Advanced Logic) ---
    const scores = useMemo(() => {
        if (!currentSessionId) return [];

        const playerMap: Record<string, { name: string, score: number, lastAnswerTime?: number }> = {};
        
        // 1. Filter notes for current session
        const sessionAnswers = notes.filter(n => n.type === 'quiz_answer' && n.title?.startsWith(`S${currentSessionId}_`));

        // 2. Calculate scores question by question to handle Rank Bonus
        for (let qIdx = 0; qIdx < questions.length; qIdx++) {
            const q = questions[qIdx];
            const qAnswers = sessionAnswers
                .filter(n => n.title === `S${currentSessionId}_Q${qIdx}`)
                .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // Rank by time

            let correctRank = 0;
            qAnswers.forEach(n => {
                if (!n.author_id) return;
                if (!playerMap[n.author_id]) {
                    playerMap[n.author_id] = { name: n.author || 'Player', score: 0 };
                }

                const answerIdx = Number(n.content);
                const isCorrect = !isNaN(answerIdx) && Number(q.correctIndex) === answerIdx;

                // WRONG ANSWER = 0 points, skip entirely
                if (!isCorrect) return;

                // Calculate streak for this specific user up to THIS question
                let streak = 0;
                for (let prevIdx = qIdx - 1; prevIdx >= 0; prevIdx--) {
                    const prevQ = questions[prevIdx];
                    const prevAns = sessionAnswers.find(pa => pa.author_id === n.author_id && pa.title === `S${currentSessionId}_Q${prevIdx}`);
                    if (prevAns && Number(prevAns.content) === Number(prevQ.correctIndex)) streak++;
                    else break;
                }

                // --- SCORING FACTORS ---
                const pointsType = q.pointsType || 'standard';
                if (pointsType === 'none') {
                    correctRank++;
                    return;
                }

                const multiplier = pointsType === 'double' ? 2 : 1;
                
                // 1. BASE POINTS
                const basePoints = 1000 * multiplier;

                // 2. SPEED BONUS (max 500)
                const totalTime = q.timeLimit * 1000;
                const responseTime = Math.max(0, n.createdAt - (board.quizStartTime || n.createdAt));
                const speedMultiplier = Math.max(0, 1 - (responseTime / totalTime));
                const speedBonus = Math.floor(500 * speedMultiplier * multiplier);

                // 3. RANK BONUS (max 500 for 1st, decreases)
                const rankStep = pointsType === 'competitive' ? 100 : 50;
                const maxRankBonus = pointsType === 'competitive' ? 1000 : 500;
                const rankBonus = Math.max(0, (maxRankBonus - (correctRank * rankStep)) * multiplier);
                
                // 4. STREAK BONUS (max 500)
                const streakStep = pointsType === 'streak_boost' ? 200 : 100;
                const streakBonus = Math.min(streak, 5) * streakStep * multiplier;

                // TOTAL (no jitter — clean scoring)
                playerMap[n.author_id].score += basePoints + speedBonus + rankBonus + streakBonus;
                correctRank++;
            });
        }

        return Object.entries(playerMap)
            .map(([id, data]) => ({ id, name: data.name, score: data.score }))
            .sort((a, b) => b.score - a.score);
    }, [notes, questions, currentSessionId, board.quizStartTime]);

    // ACTIONS
    const submitAnswer = async (index: number) => {
        if (!userId || hasAnswered || isSubmitting || state !== 'question' || !currentSessionId) return;
        
        setIsSubmitting(true);
        try {
            await supabase.from('notes').insert([{
                board_id: board.id,
                type: 'quiz_answer',
                title: `S${currentSessionId}_Q${currentQIndex}`,
                content: index.toString(),
                author: username || 'Player',
                author_id: userId,
                author_role: 'student',
                color: 'bg-white',
                x: 0, y: 0,
                created_at: new Date().toISOString()
            }]);
            if (onActivity) onActivity();
        } catch (e) {
            console.error("Submission failed", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const enterLobby = () => {
        if (onUpdateBoard) {
            onUpdateBoard({ 
                quizState: 'lobby', 
                currentQuestionIndex: 0,
                isPublished: true 
            });
        }
    };

    const startGame = () => {
        if (onUpdateBoard) {
            // Generate NEW Session ID on every start
            const newSessionId = Date.now().toString();
            onUpdateBoard({ 
                quizState: 'question', 
                currentQuestionIndex: 0, 
                quizStartTime: Date.now(),
                currentSessionId: newSessionId as any,
            } as any);
        }
    };

    const nextStep = () => {
        if (!onUpdateBoard) return;

        if (state === 'reveal') {
            onUpdateBoard({ quizState: 'leaderboard' });
        } else if (state === 'leaderboard') {
            if (currentQIndex < questions.length - 1) {
                onUpdateBoard({ 
                    quizState: 'question', 
                    currentQuestionIndex: currentQIndex + 1, 
                    quizStartTime: Date.now() 
                });
            } else {
                onUpdateBoard({ quizState: 'finished' });
            }
        }
    };

    const resetGame = async () => {
        if (!onUpdateBoard) return;
        
        // IMPORTANT: Do NOT pass a nested `settings: { ...board.settings }` here.
        // The boardService merges settings via Object.assign, so spreading the old
        // board.settings would re-introduce stale values (e.g. quizState: 'lobby')
        // and overwrite the reset values set at the top level.
        onUpdateBoard({ 
            quizState: 'setup' as any, 
            currentQuestionIndex: 0,
            quizStartTime: undefined,
            isPublished: false,
            currentSessionId: null as any,
        } as any);
    };

    return {
        questions,
        state,
        currentQIndex,
        currentQ,
        timeLeft,
        myAnswerNote,
        hasAnswered,
        myStreak,
        scores,
        submitAnswer,
        enterLobby,
        startGame,
        nextStep,
        resetGame,
        currentSessionId,
        isSubmitting
    };
};
