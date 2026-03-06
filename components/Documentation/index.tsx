
import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Layout, Zap, HelpCircle, GripVertical, ShieldCheck, Settings, Award, Info, User, Image, Link as LinkIcon, MessageSquare, Palette, Lock, Hash, Users, Star, BrainCircuit, GitBranch } from 'lucide-react';
import { FeatureCard } from './FeatureCard';

interface DocumentationProps {
    role: 'teacher' | 'student' | 'superadmin';
    onBack: () => void;
    theme: 'light' | 'dark';
}

type ViewMode = 'teacher' | 'student' | 'about';

const teacherFeatures = [
  { icon: <Layout size={24} />, title: 'Multiple Layouts', description: 'Choose between Wall, Canvas, or Columns to structure your classroom activities. Each layout offers a unique way to organize and visualize content.' },
  { icon: <Zap size={24} />, title: 'Real-Time Interaction', description: 'Engage with your students in real-time. See their posts, comments, and reactions as they happen. Anonymity is also supported.' },
  { icon: <GripVertical size={24} />, title: 'Column Management', description: 'In Column view, you can add, rename, and rearrange columns to create a structured learning environment for your students.' },
  { icon: <ShieldCheck size={24} />, title: 'Class Management', description: 'Easily manage your students. You can view their work, provide feedback, and control their access to the board.' },
  { icon: <Settings size={24} />, title: 'Powerful Settings', description: 'Customize your board with a wide range of settings, including anonymity, content moderation, and participation controls.', pro: true },
  { icon: <Award size={24} />, title: 'Grading & Assessment', description: 'Assess student participation and provide feedback. You can grade their work and export the results to your gradebook.' , pro: true},
  { icon: <Users size={24} />, title: 'Group-Based Activities', description: 'Assign students to groups and facilitate collaborative learning. You can also create group-specific content and activities.', pro: true },
  { icon: <Star size={24} />, title: 'Templates', description: 'Create and reuse board templates to save time and ensure consistency across your classes.', pro: true },

];

const studentFeatures = [
  { icon: <User size={24} />, title: 'Join & Participate', description: 'Join a board with a 6-digit code and start participating in classroom activities. No account needed!' },
  { icon: <Palette size={24} />, title: 'Create & Express', description: 'Create notes with rich text, images, and links. Express yourself with a variety of colors and formatting options.' },
  { icon: <MessageSquare size={24} />, title: 'Comment & React', description: 'Engage with your classmates by commenting on their posts and adding reactions. You can also reply to comments and start threads.' },
  { icon: <GitBranch size={24} />, title: 'Connections', description: 'In Canvas mode, you can draw connections between notes to show relationships and build a shared understanding.' },
  { icon: <BrainCircuit size={24} />, title: 'AI-Powered Features', description: 'Use AI to enhance your posts. You can generate ideas, summarize content, and get feedback on your writing.' },
  
];

export const Documentation: React.FC<DocumentationProps> = ({ role, onBack, theme }) => {
    const [view, setView] = useState<ViewMode>(role === 'student' ? 'student' : 'teacher');

    const renderContent = () => {
        switch (view) {
            case 'teacher':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teacherFeatures.map((feature, index) => <FeatureCard key={index} {...feature} />)}
                    </div>
                );
            case 'student':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {studentFeatures.map((feature, index) => <FeatureCard key={index} {...feature} />)}
                    </div>
                );
            case 'about':
                return (
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">About ClassBoard</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                            ClassBoard is a real-time collaborative platform designed for modern classrooms. Our mission is to empower teachers and students to create engaging, interactive learning experiences that foster creativity, critical thinking, and collaboration.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                            This tool was developed by a team of passionate educators and developers who believe in the power of technology to transform education. We are committed to providing a simple, intuitive, and powerful platform that is accessible to everyone.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className={`h-full flex flex-col ${theme === 'light' ? 'bg-slate-50' : 'bg-gray-900'}`}>
            <div className={`shrink-0 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md z-10 ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-gray-800/80 border-white/5'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className={`font-bold text-lg flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        <BookOpen size={20} className="text-pink-500"/> Documentation
                    </h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 md:p-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                            <div className="flex items-center gap-4 mb-4 md:mb-0">
                                <div className={`flex p-1 rounded-lg border ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-black/20 border-white/10'}`}>
                                    <button 
                                        onClick={() => setView('teacher')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${view === 'teacher' ? 'bg-white text-pink-600 shadow-md dark:bg-gray-700 dark:text-white' : 'text-gray-500'}`}
                                    >
                                        Teacher Guide
                                    </button>
                                    <button 
                                        onClick={() => setView('student')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${view === 'student' ? 'bg-white text-blue-600 shadow-md dark:bg-gray-700 dark:text-white' : 'text-gray-500'}`}
                                    >
                                        Student Guide
                                    </button>
                                </div>
                            </div>
                            <button 
                                onClick={() => setView('about')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === 'about' ? 'bg-purple-500/10 text-purple-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <Info size={16} /> About
                            </button>
                        </div>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};
