
import { PointSystemType } from './quizUtils';

interface Note {
    author_id: string;
    content: string;
    createdAt: number;
    title: string;
}

interface QuizQuestion {
    correctIndex: number;
    timeLimit: number;
    pointsType: PointSystemType;
}

const calculatePoints = (
    system: PointSystemType,
    timeRemainingMs: number,
    timeLimitMs: number,
    isCorrect: boolean,
    currentStreak: number = 0,
    correctRank: number = 0
) => {
    if (!isCorrect || system === 'none') {
        return { total: 0 };
    }
    return { total: 1000 }; // Simplified
};

const test = () => {
    const questions = [{ correctIndex: 1, timeLimit: 20, pointsType: 'standard' }];
    const sessionAnswers = [
        { author_id: 'user1', content: '0', createdAt: Date.now(), title: 'S1_Q0' } // Wrong answer (content 0, correct 1)
    ];
    const currentSessionId = '1';
    const playerMap: any = {};
    const board = { quizStartTime: Date.now() - 5000 };

    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
        const q = questions[qIdx] as any;
        const qAnswers = sessionAnswers.filter(n => n.title === `S${currentSessionId}_Q${qIdx}`);

        let correctRank = 0;
        qAnswers.forEach(n => {
            if (!playerMap[n.author_id]) playerMap[n.author_id] = { score: 0 };

            const answerIdx = Number(n.content);
            const isCorrect = !isNaN(answerIdx) && Number(q.correctIndex) === answerIdx;

            console.log(`Q${qIdx} User:${n.author_id} Answer:${answerIdx} Correct:${q.correctIndex} isCorrect:${isCorrect}`);

            const timeRemaining = Math.max(0, (q.timeLimit * 1000) - (n.createdAt - (board.quizStartTime || n.createdAt)));
            const pointsResult = calculatePoints('standard', timeRemaining, q.timeLimit * 1000, isCorrect, 0, correctRank);

            playerMap[n.author_id].score += pointsResult.total;
            if (isCorrect) correctRank++;
        });
    }

    console.log('Final Scores:', playerMap);
};

test();
