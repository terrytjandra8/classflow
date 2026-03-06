
import React from 'react';

interface DocSidebarProps {
  sections: { id: string; label: string }[];
  activeSection: string;
  onSelect: (id: string) => void;
  theme: 'light' | 'dark';
}

export const DocSidebar: React.FC<DocSidebarProps> = ({ sections, activeSection, onSelect, theme }) => {
  return (
    <nav>
      <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>On this page</p>
      <ul className="space-y-2">
        {sections.map(section => (
          <li key={section.id}>
            <button
              onClick={() => onSelect(section.id)}
              className={`w-full text-left text-sm font-medium transition-colors rounded-md px-3 py-1.5 ${activeSection === section.id 
                ? (theme === 'light' ? 'bg-pink-100 text-pink-700' : 'bg-pink-500/10 text-pink-400') 
                : (theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-gray-300 hover:bg-white/5')}`}>
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
