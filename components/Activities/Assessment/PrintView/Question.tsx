
import React from 'react';
import { AssessmentQuestion } from '../../../../types';
import { parseMath } from '../../../../utils/mappers';

interface PrintQuestionProps {
    q: AssessmentQuestion;
    qNum: number;
    answer: string;
    gradeInfo: any;
    isMasterKey: boolean;
    isRealStudent: boolean;
    isBlankCopy: boolean;
    includeFeedback?: boolean;
    showModelAnswer?: boolean;
}

const AnswerArea = ({ question, isBlank, studentAnswer }: { question: AssessmentQuestion, isBlank: boolean, studentAnswer?: string }) => {
    const format = question.answerAreaFormat || 'box';
    const minWords = question.minWords || 50;
    const estimatedLines = Math.ceil(minWords / 10);
    const minHeight = Math.max(100, estimatedLines * 24);

    // Parse composite answer format {d: drawingUrl, t: htmlText} used by 'both' mode questions
    const isImageAnswer = (text: string) => {
        return text && typeof text === 'string' && (text.startsWith('data:image') || (text.startsWith('http') && /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(text)));
    };
    const parseAnswer = (raw: string | undefined): { text: string; drawingUrl: string | null } => {
        if (!raw) return { text: '', drawingUrl: null };
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && ('d' in parsed || 't' in parsed)) {
                return { text: parsed.t || '', drawingUrl: parsed.d || null };
            }
        } catch {}
        // Plain string — check if it's a URL/image
        return { text: raw, drawingUrl: null };
    };
    
    const { text: parsedText, drawingUrl: parsedDrawingUrl } = parseAnswer(studentAnswer);
    const effectiveImageUrl = parsedDrawingUrl || (isImageAnswer(studentAnswer || '') ? studentAnswer : null);

    if (effectiveImageUrl && !isBlank) {
        return (
            <>
                <img src={effectiveImageUrl} alt="Student Drawing" className="print-answer-image" />
                {parsedText && <div style={{ border: '1px solid #000', padding: '10px', marginTop: '8px', fontSize: '11pt', backgroundColor: '#fff', color: 'black' }} dangerouslySetInnerHTML={{ __html: parsedText }} />}
            </>
        );
    }

    if (isBlank) {
        const lineContainerStyle: React.CSSProperties = {
            minHeight: `${minHeight}px`,
            padding: '10px',
            position: 'relative',
        };

        if (format === 'box' || format === 'both') {
            lineContainerStyle.border = '1px solid black';
        }

        const lines = Array.from({ length: Math.floor(minHeight / 24) }).map((_, i) => (
            <div key={i} style={{ borderBottom: '1px solid #ccc', height: '24px' }}></div>
        ));

        if (format === 'lines') {
            return <div style={{ minHeight: `${minHeight}px` }}>{lines}</div>;
        }

        if (format === 'both') {
            return <div style={lineContainerStyle}>{lines}</div>;
        }

        return <div style={{ border: '1px solid #000', minHeight: `${minHeight}px`, backgroundColor: '#fff' }}></div>;
    }

    return (
        <div style={{ border: '1px solid #000', padding: '10px', fontSize: '11pt', backgroundColor: '#fff', color: 'black' }}
             dangerouslySetInnerHTML={{ __html: parsedText || '' }}
        />
    );
};

export const PrintQuestion: React.FC<PrintQuestionProps> = ({
    q, qNum, answer, gradeInfo, isMasterKey, isRealStudent, isBlankCopy, includeFeedback = true, showModelAnswer = false
}) => {
    const isMCQ = q.type === 'mcq';
    const obtained = gradeInfo?.score !== undefined ? gradeInfo.score : (isMCQ && answer === q.correctAnswer ? q.points : 0);

    const minWords = q.minWords || 50;
    const estimatedLines = Math.ceil(minWords / 10);
    const blankMinHeight = Math.max(100, estimatedLines * 24);

    return (
        <div className="question-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                    <span style={{ fontWeight: 'bold', marginRight: '8px', fontSize: '11pt' }}>{qNum}.</span>
                    <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: parseMath(q.text) }} />
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
                            const isCorrectOption = q.correctAnswer === idxStr;
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
                                    <span className={shouldMarkCorrect ? 'correct-option' : (shouldMarkWrong ? 'wrong-option' : '')} dangerouslySetInnerHTML={{ __html: parseMath(opt) }} />
                                    {showTick && <span style={{ fontSize: '12pt', color: 'black', fontWeight: 'bold', marginLeft: '5px' }}>✓</span>}
                                    {shouldMarkWrong && <span style={{ fontSize: '12pt', color: 'black', fontWeight: 'bold', marginLeft: '5px' }}>✗</span>}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ marginTop: '10px' }}>
                        {/* Always show student answer area if it's not a master key view */}
                        {!isMasterKey && (
                            <div style={{ marginBottom: (isMasterKey || showModelAnswer) ? '10px' : '0' }}>
                                <AnswerArea 
                                    question={q} 
                                    isBlank={isBlankCopy || (!isMasterKey && !answer)}
                                    studentAnswer={isBlankCopy ? '' : answer}
                                />
                            </div>
                        )}

                        {/* Show Model Answer if requested */}
                        {(isMasterKey || showModelAnswer) && !isBlankCopy && (
                            <div style={{ border: '1px solid #555', borderLeft: '4px solid #333', padding: '10px', fontSize: '11pt', backgroundColor: '#fff', marginTop: !isMasterKey ? '10px' : '0' }}>
                                <strong style={{ color: 'black', display: 'block', fontSize: '9pt', marginBottom: '4px' }}>TEACHER KEY:</strong>
                                <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: parseMath(q.modelAnswer || q.notes || '<em>No reference answer provided.</em>') }} />
                            </div>
                        )}
                    </div>
                )}
                
                {isRealStudent && includeFeedback && gradeInfo?.feedback && (
                    <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid black', fontSize: '10pt', paddingTop: '2px', paddingBottom: '2px' }}>
                        <strong>Feedback:</strong> <span className="rich-text-content" dangerouslySetInnerHTML={{ __html: parseMath(gradeInfo.feedback) }} />
                    </div>
                )}
            </div>
        </div>
    );
};
