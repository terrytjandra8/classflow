import React from 'react';
import { Eye, BookOpen, AlertCircle, RefreshCcw, Clock, Rocket } from 'lucide-react';
import { formatTime } from './utils';
import { AssessmentConfig } from '../../../../types';

interface TestHeaderProps {
    boardTitle: string;
    config: AssessmentConfig;
    timeLeft: number | null;
    isSyncing: boolean;
    onSync: () => void;
    isPreviewMode?: boolean;
    onExitPreview?: () => void;
    isReadingMode: boolean;
    isPracticeMode?: boolean;
    isRevision?: boolean;
}

export const TestHeader: React.FC<TestHeaderProps> = ({ boardTitle, config, timeLeft, isSyncing, onSync, isPreviewMode, onExitPreview, isReadingMode, isPracticeMode, isRevision }) => {
    return (
        <>
            {isPreviewMode && (
                <div className="bg-indigo-600 text-white px-4 py-2 flex justify-between items-center z-50 sticky top-0 shadow-md shrink-0">
                    <span className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><Eye size={16} /> Student Preview Mode</span>
                    <button onClick={onExitPreview} className="bg-white text-indigo-600 px-4 py-1 rounded-full text-xs font-bold hover:bg-indigo-50">Exit Preview</button>
                </div>
            )}
            
            {isRevision && (
                <div className="bg-orange-600/20 border-b border-orange-500/30 p-3 text-center text-orange-200 text-sm font-medium leading-relaxed">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Rocket size={16} /> 
                        <h3 className="font-bold">You are in revision mode.</h3>
                    </div>
                    <p className="text-xs text-orange-300">Only questions marked for revision by your teacher can be edited. Once you are finished, you can re-submit your assessment.</p>
                </div>
            )}

            <div className={`h-16 shrink-0 flex items-center justify-between px-6 border-b z-20 ${isReadingMode ? 'bg-blue-900/20 border-blue-500/30' : (isPracticeMode ? 'bg-teal-900/20 border-teal-500/30' : 'bg-[#161616] border-white/10')}`}>
                <div className="flex items-center gap-4">
                    <div className="font-bold truncate max-w-[200px]">{boardTitle}</div>
                    <button 
                        onClick={onSync}
                        disabled={isSyncing}
                        className={`p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`}
                        title="Sync & Save answers manually"
                    >
                        <RefreshCcw size={14} />
                    </button>
                    {config.autoLockTime && !isPracticeMode && (
                        <div className="text-xs text-red-300 font-bold flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded border border-red-500/20 shadow-sm">
                            <Clock size={12} /> Due: {new Date(config.autoLockTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    )}
                </div>
                
                <div className={`flex flex-col items-center ${timeLeft !== null && timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    <span className="text-2xl font-mono font-bold leading-none">
                        {isPracticeMode ? 'Untimed' : (timeLeft !== null ? formatTime(timeLeft) : '--:--')}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-widest opacity-70">
                        {isReadingMode ? 'Reading Time' : (isPracticeMode ? 'Practice Mode' : 'Time Remaining')}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {isReadingMode ? (
                        <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            <BookOpen size={14} /> Reading Mode
                        </div>
                    ) : isPracticeMode ? (
                        <div className="flex items-center gap-2 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            <Rocket size={14} /> Practice
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-green-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div> Active
                        </div>
                    )}
                </div>
            </div>

            {isReadingMode && (
                <div className="bg-blue-600/20 border-b border-blue-500/30 p-2 text-center text-blue-200 text-xs font-bold">
                    <AlertCircle size={12} className="inline mr-2" />
                    Answering is disabled during reading time. Review the questions carefully.
                </div>
            )}
        </>
    );
};