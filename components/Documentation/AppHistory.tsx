
import React, { useState } from 'react';
import { Rocket, Layout, Palette, ShieldCheck, Zap, Heart, School, Users, Lightbulb, Lock, Construction, Globe, RefreshCw } from 'lucide-react';

interface AppHistoryProps {
    theme: 'light' | 'dark';
    role: 'teacher' | 'student' | 'superadmin';
}

const TIMELINE_DATA = [
    {
        date: "Jan 6-7",
        version: "Idea",
        title: "The Spark",
        icon: Lightbulb,
        color: "yellow",
        teacherDesc: "Attended a seminar where speakers utilized tools like Padlet and Mentimeter. I realized how fun and engaging these tools were and saw the potential for my own classes.",
        studentDesc: "Our teacher went to a seminar and came back with some big ideas for making class more interactive."
    },
    {
        date: "Jan 8",
        version: "Decision",
        title: "The Decision",
        icon: Lock,
        color: "red",
        teacherDesc: "Explored existing market solutions but hit paywalls and limitations. I decided: 'You know what? I'll make it myself.'",
        studentDesc: "The teacher looked for apps for us to use but didn't like the restrictions. They decided to build a custom one just for us."
    },
    {
        date: "Jan 9",
        version: "v0.1",
        title: "Inception",
        icon: Rocket,
        color: "blue",
        teacherDesc: "Development began. Built the skeleton of the application, focusing on the core concept of a digital board.",
        studentDesc: "ClassBoard was born! The very first version was built."
    },
    {
        date: "Jan 10 - 16",
        version: "v1.0",
        title: "Foundation",
        icon: Construction,
        color: "indigo",
        teacherDesc: "Intensive development phase. Implemented the board interface, real-time capabilities, database connections, storage buckets, grading system, and core settings.",
        studentDesc: "Things started working fast. We could post notes, see them update in real-time, and get grades."
    },
    {
        date: "Jan 17 - 23",
        version: "v2.0",
        title: "Security & Engagement",
        icon: ShieldCheck,
        color: "green",
        teacherDesc: "Implemented security protocols and engagement features. Focused on ensuring a safe and focused environment for students.",
        studentDesc: "The app got safer and more fun. New features helped us stay focused on the lesson."
    },
    {
        date: "Jan 24 - 27",
        version: "v3.0",
        title: "Expansion",
        icon: Users,
        color: "purple",
        teacherDesc: "Implemented multi-user support so other teachers in the school could utilize the platform. Scaled the infrastructure.",
        studentDesc: "Other classes started using ClassBoard too! It became a tool for the whole school."
    },
    {
        date: "Jan 28",
        version: "v4.0",
        title: "Granular Control",
        icon: Layout,
        color: "pink",
        teacherDesc: "Implemented advanced per-column functionalities. Added Anonymity Mode, Blur (Focus Mode), and specific column controls.",
        studentDesc: "New privacy tools arrived. Sometimes names are hidden, or columns are blurred so we focus on our own work."
    },
    {
        date: "Jan 29",
        version: "v5.0",
        title: "Sync & Automation",
        icon: RefreshCw,
        color: "cyan",
        teacherDesc: "Implemented Real-time Setting Synchronization and Schedule Auto-Lock. Board permissions now update instantly across all student devices without refreshing.",
        studentDesc: "Everything is instant now! If the teacher locks the board or changes the wallpaper, it happens immediately for everyone."
    }
];

export const AppHistory: React.FC<AppHistoryProps> = ({ theme, role }) => {
    // If student, force 'student' view. If teacher/admin, default to 'teacher' but allow toggle.
    const [view, setView] = useState<'teacher' | 'student'>(role === 'student' ? 'student' : 'teacher');

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header Area */}
            <div className="text-center mb-12 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <h1 className="relative text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-6 tracking-tight">
                    ClassBoard
                </h1>
                <p className={`relative text-xl font-medium max-w-3xl mx-auto leading-relaxed italic ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>
                    "I want to leverage technology to gather student insights and provide an interactive experience tailored to my class needs."
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 font-mono">
                    <span>Est. Jan 9</span>
                    <span>•</span>
                    <span className="text-pink-500 font-bold">Today: Jan 29</span>
                </div>
            </div>

            {/* Toggle Switch - Only visible if NOT a student */}
            {role !== 'student' && (
                <div className="flex justify-center mb-16">
                    <div className={`p-1 rounded-xl flex border ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                        <button 
                            onClick={() => setView('teacher')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'teacher' ? 'bg-white text-slate-900 shadow-md dark:bg-[#333] dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <School size={16} /> Teacher View
                        </button>
                        <button 
                            onClick={() => setView('student')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'student' ? 'bg-white text-slate-900 shadow-md dark:bg-[#333] dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <Users size={16} /> Student View
                        </button>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 opacity-30 md:-translate-x-1/2"></div>

                <div className="space-y-12">
                    {TIMELINE_DATA.map((item, index) => {
                        const isEven = index % 2 === 0;
                        const Icon = item.icon;
                        const isToday = item.date.includes("Jan 29");
                        
                        return (
                            <div key={index} className={`flex flex-col md:flex-row gap-8 items-start md:items-center relative ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                
                                {/* Date Badge (Desktop Center / Mobile Left) */}
                                <div className="absolute left-[9px] md:left-1/2 top-0 md:-translate-x-1/2 z-10">
                                    <div className={`w-9 h-9 rounded-full border-4 ${theme === 'light' ? 'bg-white border-slate-100' : 'bg-[#111] border-[#222]'} flex items-center justify-center shadow-lg ${isToday ? 'ring-4 ring-pink-500/30' : ''}`}>
                                        <div className={`w-3 h-3 rounded-full bg-${item.color}-500 ${isToday ? 'animate-pulse' : ''}`}></div>
                                    </div>
                                </div>

                                {/* Content Card */}
                                <div className={`ml-16 md:ml-0 flex-1 w-full md:w-[calc(50%-40px)]`}>
                                    <div className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'} ${isToday ? 'border-pink-500/50 shadow-pink-500/10' : ''}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${item.color}-500/10 text-${item.color}-500 border border-${item.color}-500/20`}>
                                                {item.date}
                                            </span>
                                            <span className="text-xs font-mono text-gray-400">{item.version}</span>
                                        </div>
                                        
                                        <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                            <Icon size={20} className={`text-${item.color}-500`} />
                                            {item.title}
                                        </h3>
                                        
                                        <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                                            {view === 'teacher' ? item.teacherDesc : item.studentDesc}
                                        </p>
                                    </div>
                                </div>

                                {/* Spacer for flex layout alignment */}
                                <div className="hidden md:block flex-1"></div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Quote */}
            <div className="mt-20 text-center p-8 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl border border-white/5">
                <Heart size={24} className="mx-auto text-pink-500 mb-4 animate-pulse" fill="currentColor" />
                <p className="italic text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
                    "This is just the beginning. We are dedicated to continuous innovation, with many more exciting features on the horizon to redefine the interactive classroom."
                </p>
                <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest">- The Developer</p>
            </div>

        </div>
    );
};
