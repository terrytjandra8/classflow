
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AssessmentQuestion } from '../../../types';
import { PrintStyles } from './PrintView/PrintStyles';
import { PrintHeader } from './PrintView/Header';
import { PrintQuestion } from './PrintView/Question';
import { SectionHeader } from './PrintView/SectionHeader';

interface AssessmentPrintViewProps {
    participants: any[]; 
    questions: AssessmentQuestion[];
    ipekaLogoUrl: string;
    ibLogoUrl: string;
    className?: string; 
    onAfterPrint: () => void;
    showAnswerKey?: boolean; 
    includeFeedback?: boolean;
}

export const AssessmentPrintView: React.FC<AssessmentPrintViewProps> = ({ 
    participants, 
    questions, 
    ipekaLogoUrl, 
    ibLogoUrl, 
    className, 
    onAfterPrint, 
    showAnswerKey = false,
    includeFeedback = true
}) => {
    const totalPoints = questions.reduce((a, q) => a + (q.points || 0), 0);

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 300);

        const handleAfterPrint = () => {
            onAfterPrint();
        };

        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [onAfterPrint]);

    return createPortal(
        <div id="assessment-print-view">
            <PrintStyles />
            
            {participants.map((participant, pIndex) => {
                const isRealStudent = !!participant.id && participant.id !== 'master-copy';
                const isMasterKey = !isRealStudent && showAnswerKey;
                const isBlankCopy = !isRealStudent && !showAnswerKey;

                return (
                    <div key={participant.id || pIndex} className="print-student-container">
                        <PrintHeader 
                            ipekaLogoUrl={ipekaLogoUrl}
                            ibLogoUrl={ibLogoUrl}
                            isMasterKey={isMasterKey}
                            isRealStudent={isRealStudent}
                            participantName={participant.name}
                            className={className}
                            score={participant.score}
                            totalPoints={totalPoints}
                        />

                        <div style={{ flex: 1 }}>
                            {questions.map((q, i) => {
                                if (q.type === 'section') {
                                    return <SectionHeader key={q.id} title={q.question} />;
                                }

                                const qNum = questions.slice(0, i + 1).filter(item => item.type !== 'section').length;
                                const answer = participant.data?.answers?.[q.id];
                                const gradeInfo = participant.data?.grading?.[q.id];

                                return (
                                    <PrintQuestion 
                                        key={q.id}
                                        q={q}
                                        qNum={qNum}
                                        answer={answer}
                                        gradeInfo={gradeInfo}
                                        isMasterKey={isMasterKey}
                                        isRealStudent={isRealStudent}
                                        isBlankCopy={isBlankCopy}
                                        includeFeedback={includeFeedback}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>,
        document.body
    );
};
