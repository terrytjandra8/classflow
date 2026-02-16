
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { Board, Note, QuizQuestion, QuizState } from '../types';

export const useQuizGame = (board: Board, notes: Note[], userId?: string, isStudent?: boolean, onUpdateBoard?: (updates: Partial<Board>) => void, onActivity?: () => void) => {
    const questions: QuizQuestion[] = board.quizQuestions || [];
    const state: QuizState = board.quizState || 'setup'; 
    const currentQIndex = board.currentQuestionIndex || 0;
    const currentQ = questions[currentQIndex];
    
    const calculateTimeLeft = () => {
        if (state === 'question' && board.quizStartTime && currentQ) {
            const elapsed = (Date.now() - board.quizStartTime) / 1000;
            const remaining = (currentQ.timeLimit || 30) - elapsed;
            return Math.ceil(Math.max(0, remaining));
        }
        return 0;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

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

    const myAnswerNote = useMemo(() => {
        if (!userId) return undefined;
        return notes.find(n => n.authorId === userId && n.title === `Q_${currentQIndex}`);
    }, [notes, userId, currentQIndex]);

    const hasAnswered = !!myAnswerNote;

    const myStreak = useMemo(() => {
        if (!userId) return 0;
        
        let streak = 0;
        for (let i = currentQIndex - 1; i >= 0; i--) {
            const q = questions[i];
            const ansNote = notes.find(n => n.authorId == userId && n.title === `Q_${i}`);
            
            if (ansNote && ansNote.content == q.correctAnswer) {
                streak++;
            } else {
                break; 
            }
        }
        return streak;
    }, [notes, userId, currentQIndex, questions]);

    const scores = useMemo(() => {
        const playerMap: Record<string, { name: string, score: number }> = {};
        
        notes.forEach(n => {
            if (n.type === 'quiz_answer' && n.authorId) {
                if (!playerMap[n.authorId]) {
                    playerMap[n.authorId] = { name: n.authorName || 'Unknown', score: 0 };
                }

                const qIdx = parseInt(n.title?.split('_')[1] || '-1');
                const answer = n.content;
                
                if (questions[qIdx] && questions[qIdx].correctAnswer == answer) {
                    playerMap[n.authorId].score += 1000; 
                }
            }
        });

        return Object.entries(playerMap)
            .map(([id, data]) => ({ id, name: data.name, score: data.score }))
            .sort((a, b) => b.score - a.score);
    }, [notes, questions]);

    const submitAnswer = async (answer: string) => {
        if (!userId || hasAnswered || state !== 'question') return;
        
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.from('notes').insert([{
            board_id: board.id,
            type: 'quiz_answer',
            title: `Q_${currentQIndex}`,
            content: answer,
            author_name: user?.user_metadata?.full_name || 'Player',
            author_id: userId,
            color: 'gray',
            x: 0, 
            y: 0,
            width: 0,
            height: 0,
            likes: 0
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
            quizState: 'setup',
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
        myStreak,
        scores,
        submitAnswer,
        enterLobby,
        startGame,
        nextStep,
        resetGame
    };
};
