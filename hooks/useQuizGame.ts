
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { Board, Note, QuizQuestion, QuizState } from '../types';

export const useQuizGame = (board: Board, notes: Note[], userId?: string, isStudent?: boolean, onUpdateBoard?: (updates: Partial<Board>) => void, onActivity?: () => void) => {
    const questions: QuizQuestion[] = board.quiz_questions || [];
    const state: QuizState = board.quiz_state || 'setup'; 
    const currentQIndex = board.current_question_index || 0;
    const currentQ = questions[currentQIndex];
    
    const calculateTimeLeft = () => {
        if (state === 'question' && board.quiz_start_time && currentQ) {
            const elapsed = (Date.now() - board.quiz_start_time) / 1000;
            const remaining = (currentQ.time_limit || 30) - elapsed;
            return Math.ceil(Math.max(0, remaining));
        }
        return 0;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (state === 'question' && board.quiz_start_time && currentQ) {
            setTimeLeft(calculateTimeLeft());

            const interval = setInterval(() => {
                const remaining = calculateTimeLeft();
                setTimeLeft(remaining);
                
                if (remaining <= 0 && !isStudent && state === 'question' && onUpdateBoard) {
                    onUpdateBoard({ quiz_state: 'reveal' });
                }
            }, 200);
            
            return () => clearInterval(interval);
        } else {
            setTimeLeft(0);
        }
    }, [state, board.quiz_start_time, currentQ, isStudent, onUpdateBoard]);

    const myAnswerNote = useMemo(() => {
        if (!userId) return undefined;
        return notes.find(n => n.author_id === userId && n.title === `Q_${currentQIndex}`);
    }, [notes, userId, currentQIndex]);

    const hasAnswered = !!myAnswerNote;

    const myStreak = useMemo(() => {
        if (!userId) return 0;
        
        let streak = 0;
        for (let i = currentQIndex - 1; i >= 0; i--) {
            const q = questions[i];
            const ansNote = notes.find(n => n.author_id === userId && n.title === `Q_${i}`);
            
            if (ansNote && ansNote.content === q.correct_answer) {
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
            if (n.type === 'quiz_answer' && n.author_id) {
                if (!playerMap[n.author_id]) {
                    playerMap[n.author_id] = { name: n.author_name || 'Unknown', score: 0 };
                }

                const qIdx = parseInt(n.title?.split('_')[1] || '-1');
                const answer = n.content;
                
                if (questions[qIdx] && questions[qIdx].correct_answer === answer) {
                    playerMap[n.author_id].score += 1000; 
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
            position_x: 0, 
            position_y: 0,
            width: 0,
            height: 0,
            likes: 0
        }]);
        
        if (onActivity) onActivity();
    };

    const enterLobby = () => {
        if (onUpdateBoard) {
            onUpdateBoard({ 
                quiz_state: 'lobby', 
                current_question_index: 0,
                is_published: true 
            });
        }
    };

    const startGame = () => {
        if (onUpdateBoard) {
            onUpdateBoard({ 
                quiz_state: 'question', 
                current_question_index: 0, 
                quiz_start_time: Date.now()
            });
        }
    };

    const nextStep = () => {
        if (!onUpdateBoard) return;

        if (state === 'reveal') {
            onUpdateBoard({ quiz_state: 'leaderboard' });
        } else if (state === 'leaderboard') {
            if (currentQIndex < questions.length - 1) {
                onUpdateBoard({ 
                    quiz_state: 'question', 
                    current_question_index: currentQIndex + 1, 
                    quiz_start_time: Date.now()
                });
            } else {
                onUpdateBoard({ quiz_state: 'finished' });
            }
        }
    };

    const resetGame = async () => {
        if (!onUpdateBoard) return;
        
        onUpdateBoard({ 
            quiz_state: 'setup',
            current_question_index: 0,
            is_published: false
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
