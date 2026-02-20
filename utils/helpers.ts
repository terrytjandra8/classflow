export const isContentImage = (content: string): boolean => {
    return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))(\?.*)?$/i.test(content);
};

export const parseAnswer = (answer: string, questionType: string, options?: string[]): string => {
    if (questionType === 'mcq' && options && options[Number(answer)]) {
        return options[Number(answer)];
    }
    return answer;
};
