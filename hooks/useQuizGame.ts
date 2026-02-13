
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { Board, Note, QuizQuestion, QuizState } from '../types';

export const useQuizGame = (board: Board, notes: Note[], userId?: string, isStudent?: boolean, onUpdateBoard?: (updates: Partial<Board>) => void, onActivity?: () => void) => {
    const questions: QuizQuestion[] = board.quizQuestions || [];
    const state: QuizState | 'setup' = (board.quizState as any) || 'setup'; 
    const currentQIndex = board.currentQuestionIndex || 0;
    const currentQ = questions[currentQIndex];
    
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
            // Update immediately on mount/change
            setTimeLeft(calculateTimeLeft());

            const interval = setInterval(() => {
                const remaining = calculateTimeLeft();
                setTimeLeft(remaining);
                
                // Auto-reveal when time is up (Teacher only)
                if (remaining <= 0 && !isStudent && state === 'question' && onUpdateBoard) {
                    onUpdateBoard({ quizState: 'reveal' });
                }
            }, 200); // Check every 200ms
            
            return () => clearInterval(interval);
        } else {
            setTimeLeft(0);
        }
    }, [state, board.quizStartTime, currentQ, isStudent, onUpdateBoard]);

    // Student: Check if answered current question
    const myAnswerNote = useMemo(() => {
        if (!userId) return undefined;
        return notes.find(n => n.author_id === userId && n.title === `Q_${currentQIndex}`);
    }, [notes, userId, currentQIndex]);

    const hasAnswered = !!myAnswerNote;

    // --- NEW: STREAK CALCULATION ---
    const myStreak = useMemo(() => {
        if (!userId) return 0;
        
        let streak = 0;
        // Iterate backwards from current question to 0
        for (let i = currentQIndex - 1; i >= 0; i--) {
            const q = questions[i];
            const ansNote = notes.find(n => n.author_id === userId && n.title === `Q_${i}`);
            
            if (ansNote && parseInt(ansNote.content) === q.correctIndex) {
                streak++;
            } else {
                break; // Streak broken
            }
        }
        return streak;
    }, [notes, userId, currentQIndex, questions]);

    // Score Calculation
    const scores = useMemo(() => {
        // Map: author_id -> { name, score }
        const playerMap: Record<string, { name: string, score: number }> = {};
        
        notes.forEach(n => {
            if (n.type === 'quiz_answer' && n.author_id) { // Ensure author_id exists
                if (!playerMap[n.author_id]) {
                    playerMap[n.author_id] = { name: n.author || 'Unknown', score: 0 };
                }

                const qIdx = parseInt(n.title?.split('_')[1] || '-1');
                const answerIdx = parseInt(n.content);
                
                if (questions[qIdx] && questions[qIdx].correctIndex === answerIdx) {
                    // Base score + (Streak bonus logic could go here in future)
                    playerMap[n.author_id].score += 1000; 
                }
            }
        });

        // Convert to array and sort by score descending
        return Object.entries(playerMap)
            .map(([id, data]) => ({ id, name: data.name, score: data.score }))
            .sort((a, b) => b.score - a.score); // Descending score
    }, [notes, questions]);

    // Actions
    const submitAnswer = async (index: number) => {
        if (!userId || hasAnswered || state !== 'question') return;
        
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.from('notes').insert([{
            board_id: board.id,
            type: 'quiz_answer',
            title: `Q_${currentQIndex}`,
            content: index.toString(),
            author: user?.user_metadata?.full_name || 'Player',
            author_id: userId,
            color: 'bg-white',
            x: 0, y: 0
        }]);
        
        if (onActivity) onActivity();
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
            onUpdateBoard({ 
                quizState: 'question', 
                currentQuestionIndex: 0, 
                quizStartTime: Date.now() 
            });
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
        
        onUpdateBoard({ 
            quizState: 'setup' as any, 
            currentQuestionIndex: 0,
            isPublished: false
        });
        
        await supabase.from('notes').delete().eq('board_id', board.id).eq('type', 'quiz_answer');
    };

    return {
        questions,
        state,
        currentQIndex,
        currentQ,
        timeLeft,
        myAnswerNote,
        hasAnswered,
        myStreak, // Exported streak
        scores,
        submitAnswer,
        enterLobby,
        startGame,
        nextStep,
        resetGame
    };
};
