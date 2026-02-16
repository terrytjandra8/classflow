
import React from 'react';
import { AssessmentQuestion } from '../../../../types';
import { parseMath } from '../../../../utils/mappers';

interface GradingInfo {
  score: number;
  feedback: string;
  is_correct?: boolean;
}

interface PrintQuestionProps {
    q: AssessmentQuestion;
    qNum: number;
    answer: string;
    gradeInfo: GradingInfo | null;
    isMasterKey: boolean;
    isRealStudent: boolean;
    isBlankCopy: boolean;
    includeFeedback?: boolean;
}

export const PrintQuestion: React.FC<PrintQuestionProps> = ({
    q, qNum, answer, gradeInfo, isMasterKey, isRealStudent, isBlankCopy, includeFeedback = true
}) => {
    const isMCQ = q.type === 'mcq' || q.type === 'multiple_choice';
    const obtained = gradeInfo?.score !== undefined ? gradeInfo.score : (isMCQ && answer === q.answer ? q.points : 0);

    const isImageAnswer = (text: string) => {
        return text && typeof text === 'string' && (text.startsWith('data:image') || (text.startsWith('http') && /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(text)));
    };

    return (
        <div className="question-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                    <span style={{ fontWeight: 'bold', marginRight: '8px', fontSize: '11pt' }}>{qNum}.</span>
                    <div 
                        className="rich-text-content"
                        dangerouslySetInnerHTML={{ __html: parseMath(q.question) }} 
                    />
                </div>
                <div style={{ fontSize: '10pt', fontWeight: 'bold', border: '1px solid black', padding: '2px 8px', borderRadius: '4px', height: 'fit-content', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                    {isRealStudent ? `${obtained} / ` : ''}{q.points} pts
                </div>
            </div>

            <div style={{ paddingLeft: '20px' }}>
                {isMCQ ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {q.options?.map((opt, optIdx) => {
                            const idxStr = optIdx.toString();
                            const isSelected = answer === idxStr;
                            const isCorrectOption = q.answer === idxStr;
                            
                            const shouldMarkCorrect = !isBlankCopy && ((isMasterKey && isCorrectOption) || (isRealStudent && isCorrectOption && isSelected));
                            const shouldMarkWrong = !isBlankCopy && (isRealStudent && isSelected && !isCorrectOption);
                            const showTick = !isBlankCopy && ((isMasterKey || isRealStudent) && isCorrectOption);
                            const showSelection = !isBlankCopy && (isSelected || (isMasterKey && isCorrectOption));
                            
                            return (
                                <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11pt' }}>
                                    <div style={{ 
                                        width: '18px', height: '18px', borderRadius: '50%', border: '1px solid black', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: showSelection ? 'black' : 'white'
                                    }}>
                                        {showSelection && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />}
                                    </div>
                                    
                                    <span className={shouldMarkCorrect ? 'correct-option' : (shouldMarkWrong ? 'wrong-option' : '')}>
                                        {opt}
                                    </span>

                                    {showTick && <span style={{ fontSize: '12pt', color: 'black', fontWeight: 'bold', marginLeft: '5px' }}>✓</span>}
                                    {shouldMarkWrong && <span style={{ fontSize: '12pt', color: 'black', fontWeight: 'bold', marginLeft: '5px' }}>✗</span>}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ marginTop: '10px' }}>
                        {isMasterKey ? (
                            <div style={{ border: '1px solid black', padding: '10px', fontSize: '11pt', backgroundColor: '#fff', minHeight: '60px' }}>
                                <strong style={{ color: 'black', display: 'block', fontSize: '9pt', marginBottom: '4px' }}>TEACHER KEY:</strong>
                                <span style={{ fontStyle: 'italic' }}>[Model answer or grading rubric would appear here]</span>
                            </div>
                        ) : (
                            !isBlankCopy && isImageAnswer(answer) ? (
                                <img src={answer} alt="Student Drawing" className="print-answer-image" />
                            ) : (
                                <div style={{ 
                                    border: '1px solid #000', 
                                    padding: '10px', 
                                    minHeight: isBlankCopy ? '150px' : '60px',
                                    fontSize: '11pt', 
                                    backgroundColor: '#fff',
                                    color: 'black'
                                }}>
                                    {!isBlankCopy ? (answer || "") : ""}
                                </div>
                            )
                        )}
                    </div>
                )}
                
                {isRealStudent && includeFeedback && gradeInfo?.feedback && (
                    <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid black', fontSize: '10pt', paddingTop: '2px', paddingBottom: '2px' }}>
                        <strong>Feedback:</strong> <span dangerouslySetInnerHTML={{ __html: gradeInfo.feedback }} />
                    </div>
                )}
            </div>
        </div>
    );
};
