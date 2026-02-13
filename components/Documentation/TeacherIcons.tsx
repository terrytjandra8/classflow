
import React from 'react';
import { 
    Lock, Unlock, Eye, EyeOff, Ghost, MessageSquare, 
    Move, ShieldCheck, Zap, MonitorPlay, Radio, 
    VenetianMask, GripVertical, Ban, Copy, CalendarClock
} from 'lucide-react';

export const TeacherIcons: React.FC = () => (
    <div className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8 last:border-0">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <span className="text-2xl font-bold">?</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Icon Reference</h2>
        </div>

        <p className="text-slate-600 dark:text-gray-300 mb-6">
            A quick guide to the symbols you will see on your board controls and student posts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Visibility & Privacy */}
            <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-white/5">
                <h4 className="font-bold text-sm text-gray-500 uppercase mb-3 tracking-wider">Privacy & Control</h4>
                <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Lock size={20} /></div>
                        <div>
                            <strong className="block text-sm font-bold">Locked</strong>
                            <p className="text-xs text-gray-500">The board or column is frozen. Students cannot post or edit anything.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg"><VenetianMask size={20} /></div>
                        <div>
                            <strong className="block text-sm font-bold">Blurred (Focus Mode)</strong>
                            <p className="text-xs text-gray-500">Content is hidden from students. They can only see their own work. Great for tests.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Ghost size={20} /></div>
                        <div>
                            <strong className="block text-sm font-bold">Anonymous</strong>
                            <p className="text-xs text-gray-500">Student names are hidden from each other. You (the teacher) can still see who wrote what.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><CalendarClock size={20} /></div>
                        <div>
                            <strong className="block text-sm font-bold">Auto-Lock Timer</strong>
                            <p className="text-xs text-gray-500">Indicates a scheduled time when the board will automatically switch to Read Only mode.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><EyeOff size={20} /></div>
                        <div>
                            <strong className="block text-sm font-bold">Hidden</strong>
                            <p className="text-xs text-gray-500">The column is completely invisible to students. Use this to prep work before class.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interaction & Status */}
            <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-white/5">
                <h4 className="font-bold text-sm text-gray-500 uppercase mb-3 tracking-wider">Interaction & Status</h4>
                <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><Radio size={20} /></div>
                        <div>
                            <strong className="block text-sm font-bold">Live</strong>
                            <p className="text-xs text-gray-500">The board is open and students can enter. If this is off (Draft), students are blocked.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><MonitorPlay size={20} /></div>
                        <div>
                            <strong className="block text-sm font-bold">Projector Mode</strong>
                            <p className="text-xs text-gray-500">Opens a clean view for the classroom TV. Hides admin buttons and grades.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><Move size={20} /></div>
                        <div>
                            <strong className="block text-sm font-bold">Draggable</strong>
                            <p className="text-xs text-gray-500">Indicates students are allowed to move cards around in this section.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg"><ShieldCheck size={20} /></div>
                        <div>
                            <strong className="block text-sm font-bold">Teacher Badge</strong>
                            <p className="text-xs text-gray-500">Appears next to your name so students know a post is from you.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
);
