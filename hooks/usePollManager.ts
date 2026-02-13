
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { Board, Note, PollQuestion } from '../types';

export const usePollManager = (
    board: Board, 
    notes: Note[], 
    userId?: string, 
    onUpdateBoard?: (updates: Partial<Board>) => void, 
    onActivity?: () => void
) => {
    // --- Initialization & Migration ---
    useEffect(() => {
        if ((!board.polls || board.polls.length === 0) && onUpdateBoard) {
            const initialPoll: PollQuestion = {
                id: 'default_poll',
                question: board.title || 'New Poll',
                type: (board as any).pollType || 'multiple_choice',
                options: (board as any).pollOptions || ['Yes', 'No', 'Maybe']
            };
            onUpdateBoard({ 
                polls: [initialPoll],
                currentPollIndex: 0
            });
        }
    }, [board.polls, board.title, onUpdateBoard]);

    const polls = board.polls || [];
    const currentIndex = board.currentPollIndex || 0;
    const currentPoll = polls[currentIndex];

    // --- Computed State ---
    const options = currentPoll?.options || [];
    const pollType = currentPoll?.type || 'multiple_choice';

    const myVote = useMemo(() => {
        return notes.find(n => n.author_id === userId && n.title === currentPoll?.id);
    }, [notes, userId, currentPoll]);

    const hasVoted = !!myVote;

    const results = useMemo(() => {
        if (!currentPoll) return {};
        
        const pollNotes = notes.filter(n => n.title === currentPoll.id);

        if (pollType === 'multiple_choice') {
            const counts: Record<string, number> = {};
            options.forEach(opt => counts[opt] = 0);
            pollNotes.forEach(n => {
                if (options.includes(n.content)) {
                    counts[n.content] = (counts[n.content] || 0) + 1;
                }
            });
            return counts;
        } else if (pollType === 'word_cloud') {
            const words: Record<string, number> = {};
            pollNotes.forEach(n => {
                const w = n.content.trim().toLowerCase();
                if (w) words[w] = (words[w] || 0) + 1;
            });
            return words;
        }
        return {};
    }, [notes, currentPoll, options, pollType]);

    const maxVotes = useMemo(() => {
        const values = Object.values(results as Record<string, number>);
        return values.length > 0 ? Math.max(...values, 1) : 1;
    }, [results]);

    // --- Actions ---

    const castVote = async (value: string) => {
        if (!userId || !currentPoll) return;
        
        if (myVote) {
            await supabase.from('notes').update({ content: value }).eq('id', myVote.id);
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            const authorName = user?.user_metadata?.full_name || 'Student';
            await supabase.from('notes').insert([{
                board_id: board.id,
                type: 'vote',
                title: currentPoll.id,
                content: value,
                author: authorName,
                author_id: userId,
                color: 'bg-white',
                x: 0, y: 0
            }]);
        }
        if (onActivity) onActivity();
    };

    const resetVotes = async () => {
        if (!currentPoll) return;
        await supabase.from('notes').delete().eq('board_id', board.id).eq('title', currentPoll.id);
        if (onActivity) onActivity();
    };

    const addSlide = () => {
        if (!onUpdateBoard) return;
        const newPoll: PollQuestion = {
            id: Math.random().toString(36).substr(2, 9),
            question: `Poll ${polls.length + 1}`,
            type: 'multiple_choice',
            options: ['Option 1', 'Option 2']
        };
        onUpdateBoard({ 
            polls: [...polls, newPoll],
            currentPollIndex: polls.length
        });
    };

    const deleteSlide = (index: number) => {
        if (!onUpdateBoard || polls.length <= 1) return;
        const newPolls = polls.filter((_, i) => i !== index);
        const newIndex = index >= newPolls.length ? newPolls.length - 1 : index;
        onUpdateBoard({ 
            polls: newPolls,
            currentPollIndex: newIndex
        });
    };

    const updatePoll = (updates: Partial<PollQuestion>) => {
        if (!onUpdateBoard || !currentPoll) return;
        const newPolls = [...polls];
        newPolls[currentIndex] = { ...currentPoll, ...updates };
        onUpdateBoard({ polls: newPolls });
    };

    const navigateSlide = (index: number) => {
        if (!onUpdateBoard) return;
        const safeIndex = Math.max(0, Math.min(polls.length - 1, index));
        onUpdateBoard({ currentPollIndex: safeIndex });
    };

    return {
        polls,
        currentIndex,
        currentPoll,
        pollType,
        options,
        results,
        maxVotes,
        myVote,
        hasVoted,
        castVote,
        resetVotes,
        addSlide,
        deleteSlide,
        updatePoll,
        navigateSlide
    };
};
        