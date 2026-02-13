
import React from 'react';
import { Layout, Zap, HelpCircle, GripVertical, ShieldCheck, Settings, Award, Info } from 'lucide-react';
import { TeacherIcons } from './TeacherIcons';
import { TeacherSettingsDoc } from './TeacherSettingsDoc';
import { TeacherGrading } from './TeacherGrading';
import { TeacherLayouts } from './TeacherLayouts';
import { TeacherColumnManagement } from './TeacherColumnManagement';
import { TeacherAdmin } from './TeacherAdmin';
import { TeacherDashboardNav } from './TeacherDashboardNav';

// Reordered to match the "Create Board" flow
export const TEACHER_SECTIONS = [
    { id: 'quick-start', label: 'Quick Start' },
    { id: 'dashboard', label: 'Dashboard & Filters' },
    { id: 'layouts', label: 'Choosing a Layout' },
    { id: 'settings', label: 'Board Settings' },
    { id: 'columns', label: 'Columns & Content' },
    { id: 'management', label: 'Class Management' },
    { id: 'grading', label: 'Grading' },
    { id: 'concepts', label: 'Key Concepts' },
    { id: 'icons', label: 'Icon Legend' },
];

export const TeacherGuide: React.FC = () => {
    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 pb-20">
            <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Teacher Guide</h1>
                <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                    Welcome to ClassBoard. This manual follows the natural flow of setting up a classroom environment, from creation to assessment.
                </p>
            </div>

            <hr className="border-gray-200 dark:border-white/10" />

            <section id="quick-start" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg"><Zap size={24} /></div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quick Start</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-100 dark:bg-[#1a1a1a] p-5 rounded-2xl border border-white/5">
                        <div className="text-xs font-bold uppercase text-gray-500 mb-2">Step 1</div>
                        <p className="text-base font-bold mb-2">Create</p>
                        <p className="text-sm text-slate-600 dark:text-gray-400">Go to "Make", select a layout (like "Wall"), and give it a title.</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-[#1a1a1a] p-5 rounded-2xl border border-white/5">
                        <div className="text-xs font-bold uppercase text-gray-500 mb-2">Step 2</div>
                        <p className="text-base font-bold mb-2">Share</p>
                        <p className="text-sm text-slate-600 dark:text-gray-400">Click the <strong className="text-pink-500">Share</strong> button. Provide the 6-digit code to students.</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-[#1a1a1a] p-5 rounded-2xl border border-white/5">
                        <div className="text-xs font-bold uppercase text-gray-500 mb-2">Step 3</div>
                        <p className="text-base font-bold mb-2">Live</p>
                        <p className="text-sm text-slate-600 dark:text-gray-400">Toggle from <strong>Draft</strong> to <strong>Live</strong> so students can enter.</p>
                    </div>
                </div>
            </section>

            <section id="dashboard" className="scroll-mt-24">
                <TeacherDashboardNav />
            </section>

            <section id="layouts" className="scroll-mt-24">
                <TeacherLayouts />
            </section>

            <section id="settings" className="scroll-mt-24">
                <TeacherSettingsDoc />
            </section>

            <section id="columns" className="scroll-mt-24">
                <TeacherColumnManagement />
            </section>

            <section id="management" className="scroll-mt-24">
                <TeacherAdmin />
            </section>

            <section id="grading" className="scroll-mt-24">
                <TeacherGrading />
            </section>

            <section id="concepts" className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><HelpCircle size={24} /></div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Key Concepts</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111]">
                        <div className="flex items-center gap-2 mb-3">
                            <Info className="text-green-500" size={20}/>
                            <h3 className="font-bold text-lg">Draft vs. Live</h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed mb-4">
                            Think of this like a curtain on a stage.
                        </p>
                        <ul className="space-y-2 text-sm text-slate-500 dark:text-gray-400">
                            <li><strong>Draft (Hidden):</strong> You are setting up the room. Students cannot enter.</li>
                            <li><strong>Live (Open):</strong> You open the curtain. Students can join and participate.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section id="icons" className="scroll-mt-24">
                <TeacherIcons />
            </section>
        </div>
    );
};
