
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Menu, Info } from 'lucide-react';
import { TeacherGuide, TEACHER_SECTIONS, StudentGuide, STUDENT_SECTIONS, AppHistory } from './guides';
import { DocSidebar } from './DocSidebar';

interface DocumentationProps {
    role: 'teacher' | 'student' | 'superadmin';
    onBack: () => void;
    theme: 'light' | 'dark';
}

type ViewMode = 'teacher' | 'student' | 'about';

export const Documentation: React.FC<DocumentationProps> = ({ role, onBack, theme }) => {
    const [view, setView] = useState<ViewMode>(role === 'student' ? 'student' : 'teacher');
    const [activeSection, setActiveSection] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isSuperAdmin = role === 'superadmin';
    const sections = view === 'teacher' ? TEACHER_SECTIONS : (view === 'student' ? STUDENT_SECTIONS : []);

    useEffect(() => {
        if (view === 'about') return;

        const handleScroll = () => {
            const scrollPosition = document.getElementById('doc-content')?.scrollTop || 0;
            const offset = 100;

            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element && element.offsetTop <= scrollPosition + offset && element.offsetTop + element.offsetHeight > scrollPosition + offset) {
                    setActiveSection(section.id);
                    break;
                }
            }
        };

        const container = document.getElementById('doc-content');
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [sections, view]);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
    };

    const renderContent = () => {
        switch (view) {
            case 'teacher': return <TeacherGuide />;
            case 'student': return <StudentGuide />;
            case 'about': return <AppHistory theme={theme} role={role} />;
            default: return null;
        }
    };
    
    const TabButton: React.FC<{targetView: ViewMode, currentView: ViewMode, children: React.ReactNode}> = ({ targetView, currentView, children }) => (
        <button 
            onClick={() => setView(targetView)}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${currentView === targetView ? 'bg-white text-pink-600 shadow dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {children}
        </button>
    );

    return (
        <div className={`h-full flex flex-col ${theme === 'light' ? 'bg-slate-50' : 'bg-gray-900'}`}>
            <div className={`shrink-0 flex items-center justify-between px-6 py-3 border-b backdrop-blur-md z-20 ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-gray-800/80 border-white/5'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className={`font-bold text-lg flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        <BookOpen size={20} className="text-pink-500"/> Documentation
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                     <div className={`hidden md:flex p-1 rounded-lg border ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-black/20 border-white/10'}`}>
                        {isSuperAdmin && <TabButton targetView='teacher' currentView={view}>Teacher Guide</TabButton>}
                        <TabButton targetView='student' currentView={view}>Student Guide</TabButton>
                    </div>
                    <button 
                        onClick={() => setView('about')}
                        className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === 'about' ? 'bg-purple-500/10 text-purple-500' : 'text-gray-500 hover:bg-white/5'}`}>
                        <Info size={14} /> About
                    </button>
                    {view !== 'about' && (
                         <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu size={20} /></button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {view !== 'about' && (
                    <div className={`hidden md:block w-64 shrink-0 overflow-y-auto p-6 border-r ${theme === 'light' ? 'border-slate-200 bg-white' : 'border-white/5 bg-gray-800/50'}`}>
                        <DocSidebar sections={sections} activeSection={activeSection} onSelect={scrollToSection} theme={theme} />
                    </div>
                )}
                
                {isMobileMenuOpen && view !== 'about' && (
                    <div className={`absolute top-0 left-0 w-full z-10 p-4 border-b shadow-xl md:hidden ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
                         <div className="flex mb-4 pb-4 border-b border-gray-200 dark:border-white/10 gap-2">
                            {isSuperAdmin && <button onClick={() => setView('teacher')} className={`flex-1 py-2 rounded text-xs font-bold ${view === 'teacher' ? 'bg-pink-500 text-white' : 'bg-gray-200 dark:bg-white/10'}`}>Teacher</button>}
                            <button onClick={() => setView('student')} className={`flex-1 py-2 rounded text-xs font-bold ${view === 'student' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-white/10'}`}>Student</button>
                        </div>
                        <DocSidebar sections={sections} activeSection={activeSection} onSelect={scrollToSection} theme={theme} />
                        <button onClick={() => { setView('about'); setIsMobileMenuOpen(false); }} className="w-full mt-4 pt-4 border-t border-gray-200 dark:border-white/10 text-purple-500 text-sm font-bold flex items-center justify-center gap-2"><Info size={14} /> About</button>
                    </div>
                )}

                <div id="doc-content" className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 scroll-smooth">
                    <div className="max-w-4xl mx-auto">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};
