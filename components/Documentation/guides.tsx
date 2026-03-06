
import React from 'react';
import { Zap, HelpCircle, User, Palette, MessageSquare } from 'lucide-react';

// Placeholder components for detailed sections
const PlaceholderSection: React.FC<{ title: string }> = ({ title }) => (
    <div className="p-6 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Detailed documentation coming soon...</p>
    </div>
);

const TeacherDashboardNav = () => <PlaceholderSection title="Dashboard & Filters" />;
const TeacherLayouts = () => <PlaceholderSection title="Choosing a Layout" />;
const TeacherSettingsDoc = () => <PlaceholderSection title="Board Settings" />;
const TeacherColumnManagement = () => <PlaceholderSection title="Columns & Content" />;
const TeacherAdmin = () => <PlaceholderSection title="Class Management" />;
const TeacherGrading = () => <PlaceholderSection title="Grading" />;
const TeacherIcons = () => <PlaceholderSection title="Icon Legend" />;
const StudentBasics = () => <PlaceholderSection title="Joining & Basics" />;
const StudentContent = () => <PlaceholderSection title="Creating Content" />;

// --- TEACHER GUIDE ---
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

export const TeacherGuide: React.FC = () => (
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
        <section id="dashboard" className="scroll-mt-24"><TeacherDashboardNav /></section>
        <section id="layouts" className="scroll-mt-24"><TeacherLayouts /></section>
        <section id="settings" className="scroll-mt-24"><TeacherSettingsDoc /></section>
        <section id="columns" className="scroll-mt-24"><TeacherColumnManagement /></section>
        <section id="management" className="scroll-mt-24"><TeacherAdmin /></section>
        <section id="grading" className="scroll-mt-24"><TeacherGrading /></section>
        <section id="concepts" className="scroll-mt-24 space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><HelpCircle size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Key Concepts</h2>
            </div>
            <div className="p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111]">
                <h3 className="font-bold text-lg mb-2">Draft vs. Live</h3>
                <p className="text-sm text-slate-600 dark:text-gray-300">Think of this like a curtain on a stage. 'Draft' is when you are setting up; 'Live' is when students can join.</p>
            </div>
        </section>
        <section id="icons" className="scroll-mt-24"><TeacherIcons /></section>
    </div>
);

// --- STUDENT GUIDE ---
export const STUDENT_SECTIONS = [
    { id: 'getting-started', label: 'Joining & Basics' },
    { id: 'creating-posts', label: 'Creating Posts' },
    { id: 'interaction', label: 'Interacting' },
];

export const StudentGuide: React.FC = () => (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 pb-20">
        <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Student Guide</h1>
            <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                Everything you need to know to participate in ClassBoard activities.
            </p>
        </div>
        <hr className="border-gray-200 dark:border-white/10" />
        <section id="getting-started" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6"><User size={24} className="text-blue-500"/> <h2 className="text-2xl font-bold">Joining & Basics</h2></div>
            <StudentBasics />
        </section>
        <section id="creating-posts" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6"><Palette size={24} className="text-pink-500"/> <h2 className="text-2xl font-bold">Creating Content</h2></div>
            <StudentContent />
        </section>
        <section id="interaction" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6"><MessageSquare size={24} className="text-purple-500"/> <h2 className="text-2xl font-bold">Interacting</h2></div>
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

// --- ABOUT SECTION ---
export const AppHistory: React.FC<{ theme: string, role: string }> = ({ theme, role }) => (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 pb-20">
         <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">About ClassBoard</h1>
            <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                ClassBoard is a real-time collaborative platform for the modern classroom, designed to foster engagement, creativity, and critical thinking.
            </p>
        </div>
    </div>
);
