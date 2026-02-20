
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

const BlankLine = () => <div style={{ borderBottom: '1px solid #000', minHeight: '1.2em' }} />;

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
                    <td className="label-cell" style={{ width: '70px' }}>Name</td>
                    <td className="value-cell">
                        { (isMasterKey ? "TEACHER KEY" : (isRealStudent ? participantName : null)) || <BlankLine /> }
                    </td>
                    <td className="label-cell" style={{ width: '70px' }}>Class</td>
                    <td className="value-cell">
                        { className || <BlankLine /> }
                    </td>
                </tr>
                <tr>
                    <td className="label-cell" style={{ width: '70px' }}>Date</td>
                    <td className="value-cell">
                        { (isRealStudent ? new Date().toLocaleDateString() : null) || <BlankLine /> }
                    </td>
                    <td className="label-cell" style={{ width: '70px' }}>Score</td>
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
