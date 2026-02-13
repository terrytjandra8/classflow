
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Menu, Info } from 'lucide-react';
import { TeacherGuide, TEACHER_SECTIONS } from './TeacherGuide';
import { StudentGuide, STUDENT_SECTIONS } from './StudentGuide';
import { DocSidebar } from './DocSidebar';
import { AppHistory } from './AppHistory';

interface DocumentationProps {
    role: 'teacher' | 'student' | 'superadmin';
    onBack: () => void;
    theme: 'light' | 'dark';
}

type ViewMode = 'teacher' | 'student' | 'history';

export const Documentation: React.FC<DocumentationProps> = ({ role, onBack, theme }) => {
    const [view, setView] = useState<ViewMode>(role === 'student' ? 'student' : 'teacher');
    const [activeSection, setActiveSection] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isSuperAdmin = role === 'superadmin';
    
    // Determine sections based on view, History has no sidebar sections
    const sections = view === 'teacher' ? TEACHER_SECTIONS : (view === 'student' ? STUDENT_SECTIONS : []);

    // ScrollSpy Logic
    useEffect(() => {
        if (view === 'history') return;

        const handleScroll = () => {
            const scrollPosition = document.getElementById('doc-content')?.scrollTop || 0;
            const offset = 100; // Header height buffer

            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element) {
                    const top = element.offsetTop;
                    const height = element.offsetHeight;
                    if (scrollPosition >= top - offset && scrollPosition < top + height - offset) {
                        setActiveSection(section.id);
                    }
                }
            }
        };

        const container = document.getElementById('doc-content');
        if (container) container.addEventListener('scroll', handleScroll);
        
        return () => {
            if (container) container.removeEventListener('scroll', handleScroll);
        };
    }, [sections, view]);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <div className={`h-full flex flex-col ${theme === 'light' ? 'bg-slate-50' : 'bg-[#111111]'}`}>
            
            {/* Header */}
            <div className={`shrink-0 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md z-50 ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-[#161616]/80 border-white/5'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className={`font-bold text-lg flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        <BookOpen size={20} className="text-pink-500"/> Documentation
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    {/* About Toggle */}
                    <button 
                        onClick={() => setView('history')}
                        className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === 'history' ? 'bg-purple-500/10 text-purple-500' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                        <Info size={14} /> About ClassBoard
                    </button>

                    {/* Mobile Menu Toggle */}
                    {view !== 'history' && (
                        <button 
                            className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-white/10"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <Menu size={20} className={theme === 'light' ? 'text-slate-700' : 'text-white'} />
                        </button>
                    )}

                    {isSuperAdmin && view !== 'history' && (
                        <div className={`hidden md:flex p-1 rounded-lg border ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-black/20 border-white/10'}`}>
                            <button 
                                onClick={() => setView('teacher')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'teacher' ? 'bg-white text-pink-600 shadow dark:bg-[#333] dark:text-white' : 'text-gray-500'}`}
                            >
                                Teacher View
                            </button>
                            <button 
                                onClick={() => setView('student')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'student' ? 'bg-white text-blue-600 shadow dark:bg-[#333] dark:text-white' : 'text-gray-500'}`}
                            >
                                Student View
                            </button>
                        </div>
                    )}
                    
                    {view === 'history' && (
                        <button 
                            onClick={() => setView(role === 'student' ? 'student' : 'teacher')}
                            className="text-xs font-bold text-gray-500 hover:text-white"
                        >
                            Back to Guides
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* Desktop Sidebar (Only for Guides) */}
                {view !== 'history' && (
                    <div className={`hidden md:block w-64 shrink-0 overflow-y-auto p-6 border-r ${theme === 'light' ? 'border-slate-200 bg-white' : 'border-white/5 bg-[#161616]'}`}>
                        <DocSidebar 
                            sections={sections} 
                            activeSection={activeSection} 
                            onSelect={scrollToSection} 
                            theme={theme}
                        />
                    </div>
                )}

                {/* Mobile Dropdown Menu (Absolute) */}
                {isMobileMenuOpen && view !== 'history' && (
                    <div className={`absolute top-0 left-0 w-full z-40 p-4 border-b shadow-xl md:hidden ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/10'}`}>
                        {isSuperAdmin && (
                            <div className="flex mb-4 pb-4 border-b border-gray-200 dark:border-white/10 gap-2">
                                <button onClick={() => setView('teacher')} className={`flex-1 py-2 rounded text-xs font-bold ${view === 'teacher' ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-white/10'}`}>Teacher</button>
                                <button onClick={() => setView('student')} className={`flex-1 py-2 rounded text-xs font-bold ${view === 'student' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10'}`}>Student</button>
                            </div>
                        )}
                        <DocSidebar 
                            sections={sections} 
                            activeSection={activeSection} 
                            onSelect={scrollToSection} 
                            theme={theme}
                        />
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                             <button 
                                onClick={() => { setView('history'); setIsMobileMenuOpen(false); }}
                                className="w-full py-2 bg-purple-500/10 text-purple-500 rounded text-xs font-bold flex items-center justify-center gap-2"
                            >
                                <Info size={14} /> About ClassBoard
                            </button>
                        </div>
                    </div>
                )}

                {/* Content Scroll Area */}
                <div id="doc-content" className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 scroll-smooth">
                    <div className="max-w-4xl mx-auto">
                        {view === 'teacher' && <TeacherGuide />}
                        {view === 'student' && <StudentGuide />}
                        {view === 'history' && <AppHistory theme={theme} role={role} />}
                    </div>
                </div>
            </div>
        </div>
    );
};
