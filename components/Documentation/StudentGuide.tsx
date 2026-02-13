
import React from 'react';
import { User, Image, Link, MessageSquare, Palette, Lock, Hash } from 'lucide-react';
import { StudentBasics } from './StudentBasics';
import { StudentContent } from './StudentContent';

export const STUDENT_SECTIONS = [
    { id: 'getting-started', label: 'Joining & Basics' },
    { id: 'creating-posts', label: 'Creating Posts' },
    { id: 'interaction', label: 'Interacting' },
];

export const StudentGuide: React.FC = () => {
    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Student Guide</h1>
                <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                    Everything you need to know to participate in ClassBoard activities, share your ideas, and collaborate with classmates.
                </p>
            </div>

            <hr className="border-gray-200 dark:border-white/10" />

            {/* Getting Started */}
            <section id="getting-started" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><User size={24} /></div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Joining & Basics</h2>
                </div>
                <StudentBasics />
            </section>

            {/* Creating Posts */}
            <section id="creating-posts" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg"><Palette size={24} /></div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Creating Content</h2>
                </div>
                <StudentContent />
            </section>

            {/* Interaction */}
            <section id="interaction" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><MessageSquare size={24} /></div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Interacting</h2>
                </div>
                
                <p className="text-slate-600 dark:text-gray-300">
                    ClassBoard is built for collaboration. Here is how you can interact with others:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="font-bold text-blue-500 mb-2">Comments</div>
                        <p className="text-xs text-gray-500">Click the bubble icon on any post to start a thread or reply to someone else.</p>
                    </div>
                    <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="font-bold text-red-500 mb-2">Reactions</div>
                        <p className="text-xs text-gray-500">Tap the heart icon to show appreciation for a classmate's idea.</p>
                    </div>
                    <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="font-bold text-orange-500 mb-2">Connections</div>
                        <p className="text-xs text-gray-500">In Canvas mode, drag lines between notes to visually link related concepts.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};
