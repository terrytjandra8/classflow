
import React from 'react';
import { ChevronRight, Hash } from 'lucide-react';

interface Section {
    id: string;
    label: string;
}

interface DocSidebarProps {
    sections: Section[];
    activeSection: string;
    onSelect: (id: string) => void;
    theme: 'light' | 'dark';
}

export const DocSidebar: React.FC<DocSidebarProps> = ({ sections, activeSection, onSelect, theme }) => {
    return (
        <div className="h-full flex flex-col">
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 px-2 opacity-50">On This Page</h4>
            <nav className="space-y-1 relative">
                {/* Active Indicator Line */}
                <div className={`absolute left-0 w-0.5 bg-pink-500 transition-all duration-300 ease-out`} 
                     style={{ 
                         top: Math.max(0, sections.findIndex(s => s.id === activeSection) * 32), 
                         height: '24px',
                         opacity: activeSection ? 1 : 0
                     }} 
                />

                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => onSelect(section.id)}
                        className={`w-full text-left px-4 py-1.5 text-sm transition-all duration-200 border-l-2 border-transparent flex items-center gap-2
                        ${activeSection === section.id 
                            ? 'text-pink-500 font-bold bg-pink-500/5' 
                            : (theme === 'light' ? 'text-slate-500 hover:text-slate-900 hover:border-slate-300' : 'text-gray-400 hover:text-white hover:border-white/20')
                        }`}
                    >
                        {activeSection === section.id && <ChevronRight size={12} className="animate-in fade-in slide-in-from-left-1" />}
                        <span className="truncate">{section.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};
