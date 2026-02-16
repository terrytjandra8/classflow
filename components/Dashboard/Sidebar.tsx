import React from 'react';
import { Search, Hash, Clock, User, Trash2, Heart, Database, Quote, Folder, GripVertical, Globe, ShieldCheck } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { ClassGroup } from '../../types';
import { useSortableList } from '../../src/logic/dnd/useSortableList';
import { classService } from '../../services/classService';

interface SidebarProps {
    username: string;
    userAvatar: string | null;
    theme: 'light' | 'dark';
    sidebarFilter: string;
    setSidebarFilter: (filter: string) => void;
    classes: ClassGroup[];
    setClasses: (classes: ClassGroup[]) => void;
    onJoinBoard: () => void;
    onOpenSetup: () => void;
    filter: string;
    setFilter: (val: string) => void;
    randomQuote: string;
    isSuperAdmin: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    username, userAvatar, theme, sidebarFilter, setSidebarFilter, 
    classes, setClasses,
    onJoinBoard, onOpenSetup, filter, setFilter, randomQuote, isSuperAdmin
}) => {
    
    // Hook implementation
    const { handleDragStart, handleDragEnter, handleDragEnd, draggedItem } = useSortableList({
        items: classes,
        onReorder: (newItems: any) => {
            setClasses(newItems);
        }
    });

    // We persist on drag end to save DB writes
    const onDropPersist = (e: React.DragEvent) => {
        handleDragEnd(e);
        classService.reorderClasses(classes);
    };

    return (
        <>
            <div className="hidden md:flex mb-8 items-center gap-3">
                <Avatar 
                    src={userAvatar} 
                    name={username} 
                    size="lg" 
                    className="shrink-0"
                />
                <div>
                    <h2 className={`font-bold truncate max-w-[140px] ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{username}</h2>
                    <p className="text-gray-500 text-xs">Happy {new Date().toLocaleDateString('en-US', { weekday: 'long' })}!</p>
                </div>
            </div>

            <div className="relative mb-6 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                    type="text" 
                    placeholder="Search boards" 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className={`w-full border rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-pink-500 transition-colors ${
                        theme === 'light' ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm' : 'bg-[#1a1a1a] border-white/10 text-white'
                    }`}
                />
            </div>

            <button 
                onClick={onJoinBoard}
                className={`w-full hidden md:flex items-center justify-center gap-2 font-bold py-2 rounded-lg mb-4 transition-colors border ${
                    theme === 'light' ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm' : 'bg-[#2a2a2a] hover:bg-pink-600 hover:text-white text-gray-300 border-white/5'
                }`}
            >
                <Hash size={16} /> Join a board
            </button>

            <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {/* Default Categories */}
                {(['recents', 'madeByMe', 'favourites', 'trashed'] as const).map(f => (
                    <button 
                        key={f}
                        onClick={() => setSidebarFilter(f)} 
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                            sidebarFilter === f 
                            ? (theme === 'light' ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'bg-[#2a2a2a] text-yellow-500') 
                            : (theme === 'light' ? 'text-slate-500 hover:bg-slate-200 hover:text-slate-900' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]')
                        }`}
                    >
                        {f === 'recents' && <Clock size={16} />}
                        {f === 'madeByMe' && <User size={16} />}
                        {f === 'favourites' && <Heart size={16} />}
                        {f === 'trashed' && <Trash2 size={16} />}
                        <span className="hidden md:inline capitalize">{f === 'trashed' ? 'My Trash' : f.replace(/_/g, ' ')}</span>
                    </button>
                ))}

                {/* Super Admin Section */}
                {isSuperAdmin && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                        <div className="px-3 mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-500">
                            <ShieldCheck size={12} /> Admin
                        </div>
                        
                        <button 
                            onClick={() => setSidebarFilter('all_boards')} 
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                                sidebarFilter === 'all_boards'
                                ? (theme === 'light' ? 'bg-white shadow-sm border border-slate-200 text-purple-600' : 'bg-[#2a2a2a] text-purple-400') 
                                : (theme === 'light' ? 'text-slate-500 hover:bg-slate-200 hover:text-slate-900' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]')
                            }`}
                        >
                            <Globe size={16} />
                            <span className="hidden md:inline">Global View</span>
                        </button>

                        <button 
                            onClick={() => setSidebarFilter('global_trash')} 
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                                sidebarFilter === 'global_trash'
                                ? (theme === 'light' ? 'bg-white shadow-sm border border-slate-200 text-red-600' : 'bg-[#2a2a2a] text-red-400') 
                                : (theme === 'light' ? 'text-slate-500 hover:bg-slate-200 hover:text-slate-900' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]')
                            }`}
                        >
                            <Trash2 size={16} />
                            <span className="hidden md:inline">Global Trash</span>
                        </button>
                    </div>
                )}

                {/* Divider & Class Groups (Draggable) */}
                {classes.length > 0 && (
                    <>
                        <div className={`h-px my-4 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>
                        <div className="flex items-center justify-between px-3 mb-2 group/label">
                            <p className="text-[10px] uppercase font-bold text-gray-500">My Classes</p>
                            <span className="text-[9px] text-gray-400 opacity-0 group-hover/label:opacity-100 transition-opacity">Drag to sort</span>
                        </div>
                        
                        <div className="space-y-1 relative">
                            {classes.map(cls => (
                                <div
                                    key={cls.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, cls)}
                                    onDragEnter={(e) => handleDragEnter(e, cls)}
                                    onDragEnd={onDropPersist}
                                    onDragOver={(e) => e.preventDefault()}
                                    className={`
                                        group flex items-center rounded-lg transition-all cursor-move
                                        ${draggedItem?.id === cls.id ? 'opacity-30 bg-blue-500/20 dashed border border-blue-500/50' : 'border border-transparent'}
                                        ${sidebarFilter === cls.name 
                                            ? (theme === 'light' ? 'bg-white shadow-sm border-slate-200' : 'bg-[#2a2a2a]') 
                                            : 'hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'}
                                    `}
                                >
                                    <div className="pl-2 pr-1 text-gray-400 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
                                        <GripVertical size={12} />
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSidebarFilter(cls.name); }}
                                        className={`flex-1 flex items-center gap-3 py-2 pr-2 text-sm font-bold text-left overflow-hidden ${
                                            sidebarFilter === cls.name 
                                            ? (theme === 'light' ? 'text-blue-600' : 'text-blue-400') 
                                            : (theme === 'light' ? 'text-slate-500' : 'text-gray-400 group-hover:text-white')
                                        }`}
                                    >
                                        <Folder size={16} className="shrink-0" />
                                        <span className="truncate">{cls.name}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </nav>

            <div className={`mt-auto pt-6 border-t space-y-4 hidden md:block ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                {isSuperAdmin && (
                    <button 
                        onClick={onOpenSetup} 
                        className="w-full flex items-center gap-2 px-3 py-2 text-blue-400 hover:text-blue-300 bg-blue-900/10 hover:bg-blue-900/20 border border-blue-900/30 rounded-lg text-xs font-bold transition-colors"
                    >
                        <Database size={14} /> Database Setup
                    </button>
                )}

                <div className={`p-3 border rounded-xl group relative overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-white/5'}`}>
                    <Quote size={20} className="text-pink-500 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <p className={`text-xs italic leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-gray-400 group-hover:text-gray-200'}`}>
                        "{randomQuote}"
                    </p>
                </div>
            </div>
        </>
    );
};
