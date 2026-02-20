
import React from 'react';

interface PrintHeaderProps {
    ipekaLogoUrl: string;
    ibLogoUrl: string;
    isMasterKey: boolean;
    isRealStudent: boolean;
    participantName: string;
    className?: string;
    score: number | string;
    totalPoints: number;
}

// This component creates a visible line for writing on, used for empty fields.
const BlankLine = () => <div style={{ borderBottom: '1px solid #000', height: '20px' }} />;

export const PrintHeader: React.FC<PrintHeaderProps> = ({
    ipekaLogoUrl, ibLogoUrl, isMasterKey, isRealStudent, participantName, className, score, totalPoints
}) => (
    <div className="print-header">
        <div className="header-logos">
            {ipekaLogoUrl && <img src={ipekaLogoUrl} alt="IPEKA" style={{ height: '60px', width: 'auto' }} />}
            {ibLogoUrl && <img src={ibLogoUrl} alt="IB" style={{ height: '50px', width: 'auto' }} />}
        </div>

        <table className="header-info-table">
            <tbody>
                <tr>
                    <td className="label-cell">Name</td>
                    <td className="value-cell">
                        {/* Show name or a line if it's a real student with no name, otherwise show nothing */}
                        {isMasterKey ? "TEACHER KEY" : (isRealStudent ? (participantName || <BlankLine />) : '')}
                    </td>
                    <td className="label-cell">Class</td>
                    <td className="value-cell">
                        {/* Show class name or nothing, but no line */}
                        {className || ''}
                    </td>
                </tr>
                <tr>
                    <td className="label-cell">Date</td>
                    <td className="value-cell">
                         {/* Show a line for the student to write the date */}
                        {isRealStudent ? <BlankLine /> : ''}
                    </td>
                    <td className="label-cell">Score</td>
                    <td className="value-cell">
                        {/* Show score or just the total marks, no line */}
                        {isRealStudent ? (
                            <><strong>{score}</strong> / {totalPoints} Marks</>
                        ) : (
                            <span style={{color:'#000'}}>/ {totalPoints} Marks</span>
                        )}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
);
