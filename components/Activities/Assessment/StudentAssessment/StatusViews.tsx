
import React from 'react';
import { Lock, Clock, RefreshCw, Eye, Ban, ShieldAlert, Home, CheckCircle, Rocket, UserCheck, Puzzle } from 'lucide-react';
import { AssessmentConfig, AssessmentQuestion, Board } from '../../../../types';

interface StatusViewProps {
    type: 'setup' | 'intro' | 'closed' | 'disqualified' | 'submitted';
    board?: Board;
    config?: AssessmentConfig;
    questions?: AssessmentQuestion[];
    isPreviewMode?: boolean;
    onExitPreview?: () => void;
    onReturnHome?: () => void;
    onStartTest?: () => void;
    onManualRefresh?: () => void;
    submissionData?: any;
    onCheckStatus?: () => void; // Added for checking second chance
}

const PreviewBanner = ({ onExit }: { onExit?: () => void }) => (
    <div className="bg-indigo-600 text-white px-4 py-2 flex justify-between items-center z-50 fixed top-0 left-0 w-full shadow-md">
        <span className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <Eye size={16} /> Student Preview Mode
        </span>
        <button onClick={onExit} className="bg-white text-indigo-600 px-4 py-1 rounded-full text-xs font-bold hover:bg-indigo-50">Exit</button>
    </div>
);

const RuleItem = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-900/50 border border-red-500/20 flex items-center justify-center text-red-400 mt-1">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-white">{title}</h4>
            <p className="text-gray-400 text-sm">{description}</p>
        </div>
    </div>
);

export const StatusViews: React.FC<StatusViewProps> = ({ 
    type, board, config, questions, isPreviewMode, onExitPreview, onReturnHome, onStartTest, onManualRefresh, submissionData, onCheckStatus
}) => {

    if (type === 'setup') {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#050505] text-white p-6">
                <div className="max-w-md w-full text-center space-y-8 animate-in fade-in">
                    
                    <div className="space-y-2">
                        <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto animate-pulse border border-blue-500/20 shadow-lg mb-6">
                            <Clock size={40} className="text-blue-500" />
                        </div>
                        <h1 className="text-2xl font-black mb-2 text-white">Waiting for Teacher</h1>
                        <p className="text-gray-400 text-sm">The assessment will begin shortly. Please wait here.</p>
                    </div>

                    <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/10 text-left shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <UserCheck size={80} className="text-white" />
                        </div>
                        
                        <div className="relative z-10 space-y-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Assessment</span>
                                <h2 className="text-xl font-bold text-white leading-tight">{board?.title || 'Loading...'}</h2>
                            </div>
                            
                            <div className="h-px bg-white/10 w-full"></div>

                            {config && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5">Duration</span>
                                        <span className="text-lg font-mono font-bold text-white">{config.durationMinutes} min</span>
                                    </div>
                                    {questions && (
                                        <div>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5">Questions</span>
                                            <span className="text-lg font-mono font-bold text-white">{questions.filter(q => q.type !== 'section').length}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={onManualRefresh}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 mx-auto transition-colors font-bold bg-blue-900/10 px-4 py-2 rounded-full border border-blue-500/20 hover:bg-blue-900/20"
                    >
                        <RefreshCw size={12} /> Refresh Status
                    </button>
                </div>
            </div>
        );
    }

    if (type === 'intro') {
        const isPractice = config?.status === 'practice';

        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#050505] text-white p-6 relative">
                {isPreviewMode && <PreviewBanner onExit={onExitPreview} />}
                <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in">
                    <div className={`border p-4 rounded-full inline-flex items-center gap-2 font-bold text-sm uppercase tracking-wide mb-4 ${isPractice ? 'bg-teal-500/10 border-teal-500/20 text-teal-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                        {isPractice ? <Rocket size={14} /> : <Lock size={14} />} {isPractice ? 'Practice Mode' : 'Secure Assessment'}
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tight">{board?.title}</h1>
                    
                    {isPractice ? (
                         <div className="bg-teal-900/20 border border-teal-500/30 p-6 rounded-2xl text-left">
                            <h3 className="text-teal-400 font-bold flex items-center gap-2 mb-2">
                                <CheckCircle size={20} /> Open Practice
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                               This is an untimed practice session where you can freely explore the questions.
                            </p>
                            <ul className="list-disc pl-5 mt-3 text-sm text-gray-300 space-y-1">
                                <li>You can leave and return to this activity anytime.</li>
                                <li>Security features like fullscreen lock and tab monitoring are <strong>DISABLED</strong>.</li>
                            </ul>
                        </div>
                    ) : (
                        <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl text-left space-y-6">
                            <h3 className="text-red-400 font-bold flex items-center gap-2">
                                <Ban size={20} /> Assessment Rules
                            </h3>
                            <div className="space-y-5">
                                <RuleItem 
                                    icon={<Eye size={16} />}
                                    title="Stay in the Test Window"
                                    description="Navigating away, switching tabs, or minimizing the browser will result in immediate disqualification."
                                />
                                <RuleItem 
                                    icon={<Puzzle size={16} />}
                                    title="No Browser Extensions"
                                    description="Interacting with extensions (like Grammarly) is treated as leaving the test and will cause disqualification."
                                />
                                <RuleItem 
                                    icon={<Ban size={16} />}
                                    title="No Right-Clicking"
                                    description="Attempting to use the context menu (right-click) is disabled and will trigger a violation."
                                />
                            </div>
                            <div className="bg-red-900/50 text-red-300 text-xs p-3 rounded-lg border border-red-500/20">
                                Breaking these rules will automatically end the assessment and your score will be set to 0. This action is final.
                            </div>
                        </div>
                    )}
                    
                    <button 
                        onClick={onStartTest}
                        className="bg-white text-black font-black text-xl py-4 px-12 rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                        {isPractice ? 'Start Practice' : 'I Understand, Start Now'}
                    </button>
                </div>
            </div>
        );
    }

    if (type === 'closed') {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#111] flex flex-col items-center justify-center text-center p-8 font-sans">
                {isPreviewMode && <PreviewBanner onExit={onExitPreview} />}
                <div className="bg-gray-800/50 p-10 rounded-3xl border border-gray-700 max-w-md w-full">
                    <Lock size={64} className="mx-auto mb-6 text-yellow-500" />
                    <h2 className="text-3xl font-bold text-white mb-2">Session Ended</h2>
                    <p className="text-gray-400 mb-8">
                        {submissionData?.submitted ? "Your assessment has been submitted." : "The teacher has closed this assessment."}
                        <br/>Please wait for grades to be released.
                    </p>
                    <button 
                        onClick={onReturnHome}
                        className="w-full bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={18} /> Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (type === 'disqualified') {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center text-center p-8 font-sans">
                {isPreviewMode && <PreviewBanner onExit={onExitPreview} />}
                <div className="max-w-lg w-full bg-red-900/10 border-2 border-red-600 p-10 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                    <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none"></div>
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-white">
                        <ShieldAlert size={40} />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">Disqualified</h2>
                    <p className="text-red-400 font-bold text-lg mb-6">Focus Mode Violation Detected</p>
                    <div className="bg-black/40 p-4 rounded-xl border border-red-500/20 text-left mb-8">
                        <p className="text-gray-300 text-sm leading-relaxed">
                           You navigated away from the assessment window, or your session was terminated by the teacher.
                           <br/>If you believe this was a mistake, please contact your teacher.
                        </p>
                        <div className="mt-4 pt-4 border-t border-red-500/20">
                            <div className="flex justify-between items-center text-red-300 font-bold text-sm">
                                <span>Final Score:</span>
                                <span className="text-2xl">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={onReturnHome}
                            className="w-full bg-white text-red-900 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors border border-white flex items-center justify-center gap-2"
                        >
                            <Home size={18} /> Return to Dashboard
                        </button>
                         <button 
                            onClick={onCheckStatus}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} /> Check for Second Chance
                        </button>
                    </div>
                     <p className="text-xs text-gray-500 mt-4">
                        If your teacher grants you a second chance, click the button above to rejoin.
                    </p>
                </div>
            </div>
        );
    }

    if (type === 'submitted') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-white bg-[#111] p-6">
                {isPreviewMode && <PreviewBanner onExit={onExitPreview} />}
                <div className="bg-green-500/10 p-10 rounded-3xl border border-green-500/20 text-center max-w-md w-full shadow-2xl">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-black shadow-lg">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-green-400 mb-2">Assessment Completed</h2>
                    <p className="text-gray-400 mb-8">Your answers have been securely recorded.</p>
                    <button 
                        onClick={onReturnHome}
                        className="w-full bg-white text-green-900 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Home size={18} /> Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return null;
};
