
import React from 'react';
import { ShieldCheck, EyeOff, Lock, Copy, FileCode } from 'lucide-react';

export const TeacherAdmin: React.FC = () => (
    <div className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8 last:border-0">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Admin & Security</h2>
        </div>
        <div className="space-y-6 text-slate-600 dark:text-gray-300 leading-relaxed">
            
            <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><Lock size={16}/> Privacy Controls</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-[#222] p-3 rounded-lg border border-gray-200 dark:border-white/5">
                        <span className="block text-xs font-bold uppercase text-gray-500 mb-1">Blur Mode</span>
                        <p className="text-sm">Enable <strong>"Blur Other Posts"</strong> so students can only see their own work. Great for tests or private reflection.</p>
                    </div>
                    <div className="bg-white dark:bg-[#222] p-3 rounded-lg border border-gray-200 dark:border-white/5">
                        <span className="block text-xs font-bold uppercase text-gray-500 mb-1">Status</span>
                        <p className="text-sm">Set board to <strong>"Read Only"</strong> to freeze activity, or <strong>"Comments Only"</strong> for peer review sessions.</p>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><FileCode size={16}/> Data Integrity & Safety</h4>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong>Anti-Cheat:</strong> Enable "Disable Copy/Paste" to force students to type out their answers manually.
                    </li>
                    <li>
                        <strong>HTML Sanitization:</strong> All student posts are automatically sanitized to prevent harmful scripts (XSS). You can safely allow rich text and links.
                    </li>
                    <li>
                        <strong>Grading:</strong> Use the built-in Gradebook to assign participation scores (0-100) or toggle "Automatic Grading" based on post count.
                    </li>
                </ul>
            </div>
        </div>
    </div>
);
