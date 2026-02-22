
import React, { useState } from 'react';
import { ArrowLeft, Play, Pause, Lock, BookOpen, SkipForward, Eye, Share2, Settings, Radio, EyeOff, Printer, Users, ChevronDown, Rocket } from 'lucide-react';
import { AssessmentConfig } from '../../../../types';

interface ControlHeaderProps {
    title: string;
    status: string;
    timeLeft: number | null;
    config: AssessmentConfig;
    isPublished: boolean;
    onBack: () => void;
    onTransition: (status: any) => void;
    onTogglePublish: () => void;
    view: 'editor' | 'monitor';
    setView: (v: 'editor' | 'monitor') => void;
    onPreview: () => void;
    onOpenSettings?: () => void;
    onOpenShare?: () => void;
    onPrint?: () => void;
    // New Class Props
    classList?: string[];
    currentClass?: string;
    onUpdateClass?: (cls: string) => void;
}

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const ControlHeader: React.FC<ControlHeaderProps> = ({ 
    title, status, timeLeft, config, isPublished, onBack, onTransition, onTogglePublish, view, setView, onPreview,
    onOpenSettings, onOpenShare, onPrint, classList, currentClass, onUpdateClass
}) => {
    const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);

    return (
        <div className="bg-[#161616] border-b border-white/10 flex flex-wrap items-center justify-between gap-y-3 gap-x-4 px-4 sm:px-6 py-3 shrink-0 no-print relative z-50">
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 min-w-0">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"><ArrowLeft size={20}/></button>
                <h1 className="font-bold text-lg flex items-center gap-2">
                    <Lock size={16} className="text-red-500 shrink-0"/>
                    <span className="truncate">{title}</span>
                </h1>
                
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${status === 'active' ? 'bg-green-500/20 text-green-500 border-green-500/30' : (status === 'reading' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' : (status === 'practice' ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'))}`}>
                    {status}
                </span>

                {/* Class Selector Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsClassMenuOpen(!isClassMenuOpen)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                        <Users size={10} /> {currentClass || 'General'} <ChevronDown size={10} />
                    </button>

                    {isClassMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsClassMenuOpen(false)}></div>
                            <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1">
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {classList && classList.length > 0 ? (
                                        classList.map(cls => (
                                            <button
                                                key={cls}
                                                onClick={() => {
                                                    if(onUpdateClass) onUpdateClass(cls);
                                                    setIsClassMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors truncate ${currentClass === cls ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-gray-300'}`}
                                            >
                                                {cls}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-xs text-gray-500 italic">No classes available</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Live Toggle */}
                <button 
                    onClick={onTogglePublish}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                        isPublished 
                        ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30' 
                        : 'bg-gray-800/50 border-white/10 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                >
                    {isPublished ? (
                        <>
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                            </span>
                            Live
                        </>
                    ) : (
                        <>
                            <EyeOff size={10} /> Draft
                        </>
                    )}
                </button>
            </div>

            {/* CENTRAL TIMER DISPLAY FOR TEACHER */}
            <div className="flex-shrink-0 order-first w-full text-center md:w-auto md:order-none">
                <div className={`text-2xl font-mono font-bold ${timeLeft !== null && timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {timeLeft !== null ? formatTime(timeLeft) : (status === 'practice' ? '∞' : '--:--')}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                    {status === 'reading' ? 'Reading Time' : (status === 'practice' ? 'Untimed Practice' : 'Time Remaining')}
                </div>
            </div>

            <div className="flex items-center flex-wrap justify-end gap-x-2 gap-y-3">
                {/* View Switcher */}
                <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                    <button 
                        onClick={() => setView('editor')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${view === 'editor' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        Editor
                    </button>
                    <button 
                        onClick={() => setView('monitor')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${view === 'monitor' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        Monitor
                    </button>
                </div>
                
                {/* Settings & Share & Preview */}
                <div className="flex items-center gap-1">
                    {onOpenShare && (
                        <button 
                            onClick={onOpenShare}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Share Board"
                        >
                            <Share2 size={20} />
                        </button>
                    )}
                    {onOpenSettings && (
                        <button 
                            onClick={onOpenSettings}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
                    )}
                    {onPrint && (
                        <button 
                            onClick={onPrint}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Print Assessment"
                        >
                            <Printer size={20} />
                        </button>
                    )}
                    <button 
                        onClick={onPreview}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Student Preview"
                    >
                        <Eye size={20} />
                    </button>
                </div>

                
                {/* CONTROL ACTIONS */}
                <div className="flex items-center flex-wrap gap-2">
                {config.status === 'setup' && (
                    <div className="flex gap-2 flex-wrap">
                        {config.readingMinutes > 0 && (
                            <button 
                                onClick={() => onTransition('reading')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"
                            >
                                <BookOpen size={14} /> Start Reading
                            </button>
                        )}
                        <button 
                            onClick={() => onTransition('practice')}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"
                        >
                            <Rocket size={14} /> Practice
                        </button>
                        <button 
                            onClick={() => onTransition('active')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"
                        >
                            <Play size={14} /> Start Test
                        </button>
                    </div>
                )}

                {config.status === 'reading' && (
                    <button 
                        onClick={() => onTransition('active')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"
                    >
                        <SkipForward size={14} /> Skip to Test
                    </button>
                )}

                {(config.status === 'active' || config.status === 'reading' || config.status === 'practice') && (
                    <button 
                        onClick={() => onTransition('closed')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"
                    >
                        <Pause size={14} /> Stop
                    </button>
                )}
                
                {config.status === 'closed' && (
                    <button 
                        onClick={() => onTransition('setup')}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"
                    >
                        Reset
                    </button>
                )}
                </div>
            </div>
        </div>
    );
};
