
import React from 'react';
import { Layout } from 'lucide-react';
import { BoardFormat, Board, Note } from '../../types';
import { TEMPLATES } from './constants';

interface GalleryProps {
    onCreateBoard: (format: BoardFormat, templateData?: Partial<Board>, initialNotes?: Note[]) => void;
    theme?: 'light' | 'dark';
}

export const Gallery: React.FC<GalleryProps> = ({ onCreateBoard, theme }) => {
    return (
        <div className={`animate-fade-in max-w-7xl mx-auto p-6 md:p-10 min-h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-[#111111]'}`}>
            <div className="flex justify-between items-end mb-8">
                <div>
                     <h2 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Gallery</h2>
                     <p className={theme === 'light' ? 'text-slate-500' : 'text-gray-400'}>Jump start your next class with a template.</p>
                </div>
            </div>

            <div>
                <h3 className={`font-bold text-sm uppercase flex items-center gap-2 tracking-wide mb-4 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                    <Layout size={16} /> Education Templates
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {TEMPLATES.map(t => (
                        <div 
                            key={t.id}
                            onClick={() => onCreateBoard(t.format as BoardFormat, { title: t.title, description: t.desc, wallpaper: t.wallpaper, icon: '🎓', sections: t.sections, guide: t.guide })}
                            className={`rounded-xl p-3 cursor-pointer transition-all flex items-center gap-4 group border ${
                                theme === 'light' 
                                ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md' 
                                : 'bg-[#1a1a1a] border-white/5 hover:bg-[#252525] hover:border-gray-700'
                            }`}
                        >
                            <div className={`w-16 h-16 rounded-lg relative overflow-hidden shrink-0 ${theme === 'light' ? 'bg-slate-100' : 'bg-gray-800'}`}>
                                <div className="absolute inset-0 opacity-60" style={{ background: t.wallpaper, backgroundSize: 'cover' }}></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <t.icon size={24} className="text-white drop-shadow-md" />
                                </div>
                            </div>
                            <div>
                                <h4 className={`font-bold text-sm mb-0.5 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{t.title}</h4>
                                <p className={`text-[10px] line-clamp-2 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>{t.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
