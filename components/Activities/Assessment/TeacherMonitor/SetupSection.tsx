
import React from 'react';
import { Timer, BookOpen, CalendarClock, Radio } from 'lucide-react';
import { AssessmentConfig } from '../../../../types';
import { DebouncedInput } from '../../../ui/DebouncedInput';

interface SetupSectionProps {
    config: AssessmentConfig;
    onUpdateConfig: (config: Partial<AssessmentConfig>) => void;
}

const SettingsIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

export const SetupSection: React.FC<SetupSectionProps> = ({ config, onUpdateConfig }) => {

    // Helper to handle the local timezone shift for datetime-local input
    const getLocalISOString = (timestamp: number) => {
        const date = new Date(timestamp);
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    };

    return (
        <div className="mb-6 p-6 bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-xl animate-in slide-in-from-top-4 shrink-0">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <SettingsIcon /> Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                        <Timer size={16} className="text-green-500" /> Test Duration (Minutes)
                    </label>
                    <DebouncedInput
                        type="number"
                        value={config.durationMinutes}
                        onChange={(val) => onUpdateConfig({ durationMinutes: parseInt(val) || 60 })}
                        min={1}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                        <BookOpen size={16} className="text-blue-500" /> Reading Time (Minutes)
                    </label>
                    <DebouncedInput
                        type="number"
                        value={config.readingMinutes}
                        onChange={(val) => onUpdateConfig({ readingMinutes: parseInt(val) || 0 })}
                        min={0}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-500">Students can view questions but cannot answer.</p>
                </div>

                {/* Auto Live Date */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                        <Radio size={16} className="text-green-500" /> Scheduled Start (Auto-Live)
                    </label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="datetime-local"
                            value={config.autoLiveTime ? getLocalISOString(config.autoLiveTime) : ''}
                            onChange={(e) => onUpdateConfig({ autoLiveTime: e.target.value ? new Date(e.target.value).getTime() : null })}
                            className="flex-1 bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 outline-none text-sm font-mono"
                        />
                        {config.autoLiveTime && (
                            <button
                                onClick={() => onUpdateConfig({ autoLiveTime: null })}
                                className="text-xs text-red-400 hover:text-white px-3 py-2 bg-red-900/20 hover:bg-red-900/40 rounded-lg transition-colors border border-red-500/20"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                        Assessment automatically starts at this time.
                    </p>
                </div>

                {/* Auto Lock Date */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                        <CalendarClock size={16} className="text-red-500" /> Scheduled End (Auto-Close)
                    </label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="datetime-local"
                            value={config.autoLockTime ? getLocalISOString(config.autoLockTime) : ''}
                            onChange={(e) => onUpdateConfig({ autoLockTime: e.target.value ? new Date(e.target.value).getTime() : null })}
                            className="flex-1 bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-red-500 outline-none text-sm font-mono"
                        />
                        {config.autoLockTime && (
                            <button
                                onClick={() => onUpdateConfig({ autoLockTime: null })}
                                className="text-xs text-red-400 hover:text-white px-3 py-2 bg-red-900/20 hover:bg-red-900/40 rounded-lg transition-colors border border-red-500/20"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                        The assessment will automatically close at this time.
                    </p>
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.allowLineInBox}
                            onChange={(e) => onUpdateConfig({ allowLineInBox: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-500 bg-black/50 border-white/20 focus:ring-blue-500"
                        />
                        Allow Lines Inside Boxes
                    </label>
                    <p className="text-[10px] text-gray-500">
                        When enabled, students can insert horizontal lines within a bordered answer box.
                    </p>
                </div>
            </div>
        </div>
    );
};
