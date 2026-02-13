
import React from 'react';
import { Settings, Palette, Layout, MessageCircle, Lock, MousePointer2, Ghost, EyeOff, ShieldAlert, CalendarClock, CameraOff } from 'lucide-react';

export const TeacherSettingsDoc: React.FC = () => (
    <div className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8 last:border-0">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-500/10 text-gray-500 rounded-lg">
                <Settings size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Board Settings Reference</h2>
        </div>

        <p className="text-slate-600 dark:text-gray-300 mb-8">
            Detailed guides on how to configure your board. Access these by clicking the <Settings size={14} className="inline"/> <strong>Settings</strong> icon.
        </p>

        <div className="grid grid-cols-1 gap-8">
            
            {/* 1. ANONYMITY */}
            <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-[#1a1a1a]">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-500">
                    <Ghost size={20}/> Anonymous Mode
                </h3>
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Hide student names from each other. Students see "Anonymous" or animal names, but you see real names.
                    </p>
                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl text-sm space-y-2 border border-gray-100 dark:border-white/5">
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">1.</span>
                            <span>Open <strong>Settings</strong>.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">2.</span>
                            <span>Go to the <strong>Engagement</strong> tab.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">3.</span>
                            <span>Toggle <strong>Anonymous Mode</strong> to ON (Green).</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. BLURRING */}
            <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-[#1a1a1a]">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-indigo-500">
                    <EyeOff size={20}/> Focus Mode (Blur)
                </h3>
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Prevent cheating or influence. Students can only see their OWN posts. Everything else is blurred.
                    </p>
                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl text-sm space-y-2 border border-gray-100 dark:border-white/5">
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">1.</span>
                            <span>Open <strong>Settings</strong> &rarr; <strong>Engagement</strong>.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">2.</span>
                            <span>Toggle <strong>Blur Other Posts</strong> to ON.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">3.</span>
                            <span>(Optional) Toggle <strong>Also Blur Teacher</strong> if you want to hide your own posts too.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. ANTI SCREENSHOT */}
            <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-[#1a1a1a]">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-yellow-500">
                    <CameraOff size={20}/> Note Watermark
                </h3>
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Deter leaks and unauthorized sharing of sensitive questions. You can add a dynamic watermark to specific notes.
                        When a student views the note, <strong>their own name</strong> will appear tiled over it.
                    </p>
                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl text-sm space-y-2 border border-gray-100 dark:border-white/5">
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">1.</span>
                            <span>Create or find a note you want to protect.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">2.</span>
                            <span>Click the <strong>Menu (Three Dots)</strong> on the note card.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">3.</span>
                            <span>Select <strong>Apply Watermark</strong>.</span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500 italic mt-2">
                            <span>Note: This is useful for exam questions or confidential material.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. ANTI CHEAT */}
            <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-[#1a1a1a]">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-500">
                    <ShieldAlert size={20}/> Disable Copy/Paste
                </h3>
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Force students to type out their answers manually. Good for language classes or original writing.
                    </p>
                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl text-sm space-y-2 border border-gray-100 dark:border-white/5">
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">1.</span>
                            <span>Open <strong>Settings</strong> &rarr; <strong>Engagement</strong>.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">2.</span>
                            <span>Toggle <strong>Disable Copy/Paste</strong> to ON.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">3.</span>
                            <span>(Optional) Toggle <strong>Allow Links</strong> if you want them to paste URLs but not text blocks.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. LAYOUTS */}
            <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-[#1a1a1a]">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-500">
                    <Layout size={20}/> Changing Layouts
                </h3>
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Switch between Wall, Grid, Stream, or Columns view instantly. Data is never lost.
                    </p>
                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl text-sm space-y-2 border border-gray-100 dark:border-white/5">
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">1.</span>
                            <span>Open <strong>Settings</strong>.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">2.</span>
                            <span>Go to the <strong>Layout</strong> tab.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">3.</span>
                            <span>Click any format button (e.g., "Stream" or "Columns"). The board updates instantly.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. AESTHETICS */}
            <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-[#1a1a1a]">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-pink-500">
                    <Palette size={20}/> Custom Wallpaper
                </h3>
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Make the board look engaging with themes or custom images.
                    </p>
                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl text-sm space-y-2 border border-gray-100 dark:border-white/5">
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">1.</span>
                            <span>Open <strong>Settings</strong> &rarr; <strong>Appearance</strong>.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">2.</span>
                            <span>Click a color, gradient, or texture.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">3.</span>
                            <span>To use your own image: Click the <strong>Upload</strong> button next to "Wallpaper".</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">4.</span>
                            <span>To make custom gradients: Click <strong>Open Builder</strong> under Gradients.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 7. ADVANCED: AUTO LOCK */}
            <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-[#1a1a1a]">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-500">
                    <CalendarClock size={20}/> Schedule Auto-Lock
                </h3>
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Automatically freeze the board at a specific time (e.g., at the end of class).
                    </p>
                    <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl text-sm space-y-2 border border-gray-100 dark:border-white/5">
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">1.</span>
                            <span>Open <strong>Settings</strong> &rarr; <strong>Advanced</strong>.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">2.</span>
                            <span>Find <strong>Schedule Auto-Lock</strong>.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">3.</span>
                            <span>Click the calendar icon to pick a date and time.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">4.</span>
                            <span>The board will switch to <strong>Read Only</strong> mode automatically at that time.</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
);
