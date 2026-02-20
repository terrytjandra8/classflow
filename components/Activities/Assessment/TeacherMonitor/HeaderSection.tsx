
import React, { useState } from 'react';
import { CheckCircle, FileText, Key, RefreshCw } from 'lucide-react';

interface HeaderSectionProps {
    activeStudentsCount: number;
    submittedCount: number;
    onPrintMaster: (isKey: boolean) => void;
    onForceRefresh?: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ activeStudentsCount, submittedCount, onPrintMaster, onForceRefresh }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (onForceRefresh) {
            setIsRefreshing(true);
            try {
                await onForceRefresh();
            } finally {
                setTimeout(() => setIsRefreshing(false), 1000);
            }
        }
    };

    return (
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-4 shrink-0 gap-4">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold">Live Monitor</h2>
                    {onForceRefresh && (
                        <button 
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className={`p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all ${isRefreshing ? 'animate-spin text-blue-500' : ''}`}
                            title="Force Refresh Data"
                        >
                            <RefreshCw size={16} />
                        </button>
                    )}
                </div>
                <p className="text-gray-400 text-sm">Real-time status of all participants</p>
            </div>
            <div className="flex flex-col items-end gap-3">
                <div className="flex gap-4 text-sm font-bold">
                    <div className="flex items-center gap-2 text-green-400 bg-green-900/10 px-3 py-1 rounded-full border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> {activeStudentsCount} Online
                    </div>
                    <div className="flex items-center gap-2 text-blue-400 bg-blue-900/10 px-3 py-1 rounded-full border border-blue-500/20">
                        <CheckCircle size={14}/> {submittedCount} Submitted
                    </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Master Copy:</span>
                    <button 
                        onClick={() => onPrintMaster(false)} 
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-gray-300 border border-white/10 flex items-center gap-1 transition-colors"
                    >
                        <FileText size={10} /> Question Paper
                    </button>
                    <button 
                        onClick={() => onPrintMaster(true)} 
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-green-400 border border-white/10 flex items-center gap-1 transition-colors"
                    >
                        <Key size={10} /> Answer Key
                    </button>
                </div>
            </div>
        </div>
    );
};
