
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

export const PrintHeader: React.FC<PrintHeaderProps> = ({
    ipekaLogoUrl, ibLogoUrl, isMasterKey, isRealStudent, participantName, className, score, totalPoints
}) => (
    <div className="print-header">
        <div className="header-logos">
            {ipekaLogoUrl && <img src={ipekaLogoUrl} alt="IPEKA" style={{ height: '60px', width: 'auto' }} />}
            {ibLogoUrl && <img src={ibLogoUrl} alt="IB" style={{ height: '50px', width: 'auto' }} />}
            {!ipekaLogoUrl && !ibLogoUrl && (
                <div className="main-title">ASSESSMENT</div>
            )}
        </div>

        <table className="header-info-table">
            <tbody>
                <tr>
                    <td className="label-cell">Name</td>
                    <td className="value-cell">
                        {isMasterKey ? "TEACHER KEY" : (isRealStudent ? participantName : "")}
                    </td>
                    <td className="label-cell">Class</td>
                    <td className="value-cell">{className || ''}</td>
                </tr>
                <tr>
                    <td className="label-cell">Date</td>
                    <td className="value-cell">{isRealStudent ? new Date().toLocaleDateString() : ""}</td>
                    <td className="label-cell">Score</td>
                    <td className="value-cell">
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
