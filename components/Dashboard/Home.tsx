
import React, { useMemo } from 'react';
import { Search, Trash2, Layout, Plus, ExternalLink, Link as LinkIcon, Copy, RotateCcw, Edit2, Calendar, ChevronDown, ListFilter, Heart, Clock } from 'lucide-react';
import { Board } from '../../types';
import { QUOTES } from './constants';
import { BoardCard } from './BoardCard';
import { ConfirmModal } from '../ConfirmModal';
import { WALLPAPERS_MAP } from '../../utils/theme';
import { Sidebar } from './Sidebar';
import { useBoardBrowser } from './logic/useBoardBrowser';

interface HomeProps {
    boards: Board[];
    onSelectBoard: (id: string) => void;
    onDeleteBoard: (id: string) => void;
    onDuplicateBoard: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onEmptyTrash: () => void;
    onJoinBoard: () => void;
    onNavigateToMake: () => void;
    onOpenSetup: () => void;
    onUpdateBoard: (id: string, updates: Partial<Board>) => void;
    username: string;
    userAvatar: string | null;
    userId?: string;
    theme: 'light' | 'dark';
    isSuperAdmin: boolean;
    isStudent: boolean;
    selectedClass: string;
    studentClasses: string[];
}

export const Home: React.FC<HomeProps> = ({ 
    boards, onSelectBoard, onDeleteBoard, onDuplicateBoard, onToggleFavorite, onEmptyTrash,
    onJoinBoard, onNavigateToMake, onOpenSetup, onUpdateBoard, username, userAvatar, userId, theme, isSuperAdmin, isStudent, selectedClass, studentClasses
}) => {
    
    const randomQuote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

    const {
        sidebarFilter, setSidebarFilter,
        filter, setFilter,
        sortBy, setSortBy,
        classes, setClasses,
        menu,
        isSortMenuOpen, setIsSortMenuOpen,
        renamingId, setRenamingId,
        exitingBoardId,
        confirmModal, setConfirmModal,
        menuRef, sortMenuRef,
        filteredBoards,
        groupedBoards,
        handleMenuOpen,
        handleRestore,
        openConfirmModal,
        handleConfirmAction,
        handleMenuAction
    } = useBoardBrowser(boards, userId, onDeleteBoard, onEmptyTrash, selectedClass, onSelectBoard, onDuplicateBoard, onToggleFavorite, isStudent, studentClasses);

    const getDisplayTitle = () => {
        if (isStudent) {
            if (sidebarFilter === 'my_class') return selectedClass;
            return sidebarFilter.replace(/_/g, ' ');
        }
        if (sidebarFilter === 'all_boards') return 'Global View';
        if (sidebarFilter === 'global_trash') return 'Global Trash';
        if (sidebarFilter === 'trashed') return 'My Trash';
        if (classes.some(c => c.name === sidebarFilter)) return sidebarFilter;
        return sidebarFilter.replace(/_/g, ' ');
    };

    const displayTitle = getDisplayTitle();

    const renderBoardGrid = (items: Board[]) => (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {items.map(board => (
                <BoardCard 
                    key={board.id}
                    board={board}
                    viewMode={sidebarFilter as any}
                    onSelect={onSelectBoard}
                    onDelete={() => openConfirmModal('soft_delete', board.id)}
                    onRestore={handleRestore}
                    onToggleFavorite={onToggleFavorite}
                    onMenuOpen={handleMenuOpen}
                    wallpapersMap={WALLPAPERS_MAP}
                    theme={theme}
                    onUpdate={(updates) => onUpdateBoard(board.id, updates)}
                    isRenaming={renamingId === board.id}
                    onRenameClose={() => setRenamingId(null)}
                    isExiting={exitingBoardId === board.id}
                    classes={classes}
                    userId={userId} // Pass userId for permission checks
                />
            ))}
        </div>
    );

    return (
        <div className="flex h-full flex-col md:flex-row pb-16 md:pb-0 relative overflow-hidden">
            {/* Desktop Sidebar */}
            {!isStudent && (
                <div className={`w-64 shrink-0 flex-col py-6 pr-4 pl-6 hidden md:flex border-r h-full ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#111111] border-white/5'}`}>
                    <Sidebar 
                        username={username}
                        userAvatar={userAvatar}
                        theme={theme}
                        sidebarFilter={sidebarFilter}
                        setSidebarFilter={setSidebarFilter}
                        classes={classes}
                        setClasses={setClasses}
                        onJoinBoard={onJoinBoard}
                        onOpenSetup={onOpenSetup}
                        filter={filter}
                        setFilter={setFilter}
                        randomQuote={randomQuote}
                        isSuperAdmin={isSuperAdmin}
                    />
                </div>
            )}

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col h-full min-w-0 ${theme === 'light' ? 'bg-slate-50' : 'bg-[#111111]'}`}>
                {!isStudent && (
                    <div className={`md:hidden overflow-x-auto no-scrollbar border-b p-2 flex gap-2 shrink-0 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161616] border-white/5'}`}>
                        {(['recents', 'made_by_me', 'favourites', 'trashed', ...(isSuperAdmin ? ['all_boards'] : [])] as const).map(f => (
                            <button 
                                key={f}
                                onClick={() => setSidebarFilter(f)} 
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                                    sidebarFilter === f
                                    ? (theme === 'light' ? 'bg-slate-900 text-white' : 'bg-white text-black') 
                                    : (theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-[#222] text-gray-400')
                                }`}
                            >
                                {f.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                        <div>
                            <h2 className={`text-3xl font-bold mb-1 capitalize ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                {displayTitle}
                            </h2>
                            <p className={theme === 'light' ? 'text-slate-500' : 'text-gray-400'}>
                                {sidebarFilter === 'trashed' || sidebarFilter === 'global_trash' ? 'Boards are permanently deleted after 30 days.' : `${filteredBoards.length} boards`}
                            </p>
                        </div>
                        
                        {!isStudent && (
                            <div className="flex items-center gap-3">
                                {sidebarFilter !== 'trashed' && sidebarFilter !== 'global_trash' && sidebarFilter !== 'favourites' && (
                                    <div className="relative z-20" ref={sortMenuRef}>
                                        <button 
                                            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all shadow-sm ${theme === 'light' ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700' : 'bg-[#1a1a1a] border-white/10 hover:bg-white/5 text-gray-200'}`}
                                        >
                                            <ListFilter size={14} className={theme === 'light' ? "text-slate-400" : "text-gray-500"} />
                                            <span className="text-xs font-bold">
                                                {sortBy === 'created' ? 'Created Date' : 'Last Active'}
                                            </span>
                                            <ChevronDown size={12} className={`opacity-50 transition-transform duration-200 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isSortMenuOpen && (
                                            <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 origin-top-right ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/10'}`}>
                                                <div className={`p-2 border-b text-[10px] font-bold uppercase tracking-wider ${theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-[#111] border-white/5 text-gray-500'}`}>
                                                    Sort Boards By
                                                </div>
                                                <div className="p-1">
                                                    <button 
                                                        onClick={() => { setSortBy('created'); setIsSortMenuOpen(false); }}
                                                        className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 rounded-lg transition-colors ${sortBy === 'created' ? (theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400') : (theme === 'light' ? 'text-slate-600 hover:bg-slate-50' : 'text-gray-300 hover:bg-white/5 hover:text-gray-200')}`}
                                                    >
                                                        <Calendar size={14} className={sortBy === 'created' ? "text-blue-500" : "text-gray-400"} />
                                                        <div className="flex flex-col">
                                                            <span>Created Date</span>
                                                            <span className={`text-[9px] font-normal ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>Timeline view</span>
                                                        </div>
                                                        {sortBy === 'created' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSortBy('updated'); setIsSortMenuOpen(false); }}
                                                        className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 rounded-lg transition-colors ${sortBy === 'updated' ? (theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400') : (theme === 'light' ? 'text-slate-600 hover:bg-slate-50' : 'text-gray-300 hover:bg-white/5 hover:text-gray-200')}`}
                                                    >
                                                        <Clock size={14} className={sortBy === 'updated' ? "text-blue-500" : "text-gray-400"} />
                                                        <div className="flex flex-col">
                                                            <span>Last Active</span>
                                                            <span className={`text-[9px] font-normal ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>Recents first</span>
                                                        </div>
                                                        {sortBy === 'updated' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(sidebarFilter === 'trashed' || sidebarFilter === 'global_trash') && (
                                    <button 
                                        onClick={() => openConfirmModal('empty_trash')}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 size={16} /> Empty Trash
                                    </button>
                                )}
                                {(sidebarFilter !== 'trashed' && sidebarFilter !== 'global_trash') && (
                                    <button 
                                        onClick={onNavigateToMake}
                                        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-pink-500/20"
                                    >
                                        <Plus size={18} /> New Board
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {filteredBoards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                            {(sidebarFilter === 'trashed' || sidebarFilter === 'global_trash') ? (
                                <Trash2 size={48} className="mb-4 text-gray-400" />
                            ) : (
                                <Layout size={48} className="mb-4 text-gray-400" />
                            )}
                            <p className="text-lg font-bold text-gray-500">No boards found</p>
                            <p className="text-sm text-gray-400">
                                {isStudent ? `No activities in ${selectedClass} yet.` : (selectedClass !== 'All Classes' ? `No boards in ${selectedClass}` : "Try adjusting your filters.")}
                            </p>
                        </div>
                    ) : (
                        <div className="pb-20">
                            {groupedBoards ? (
                                <div className="space-y-12">
                                    {groupedBoards.map((group) => (
                                        <div key={group.title} className="animate-fade-in">
                                            <div className="flex items-center gap-4 mb-4">
                                                <h3 className={`text-sm font-bold uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {group.title}
                                                </h3>
                                                <div className={`h-px flex-1 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/5'}`}></div>
                                            </div>
                                            {renderBoardGrid(group.items)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                renderBoardGrid(filteredBoards)
                            )}
                        </div>
                    )}
                </div>
            </div>

            {menu.visible && (
                <div 
                    ref={menuRef}
                    className={`fixed z-50 w-48 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-left ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#222] border-white/10'}`}
                    style={{ top: menu.y, left: Math.min(menu.x, window.innerWidth - 200) }}
                >
                    <div className="p-1 space-y-0.5">
                        <button onClick={() => handleMenuAction('open')} className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}>
                            <ExternalLink size={14} /> Open
                        </button>
                        <button onClick={() => handleMenuAction('copyLink')} className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}>
                            <LinkIcon size={14} /> Copy link
                        </button>
                        {!isStudent && (
                            <>
                                <button onClick={() => handleMenuAction('rename')} className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}>
                                    <Edit2 size={14} /> Rename
                                </button>
                                <button onClick={() => handleMenuAction('toggleFav')} className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}>
                                    <Heart size={14} /> Favorite
                                </button>
                                <button onClick={() => handleMenuAction('duplicate')} className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${theme === 'light' ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}>
                                    <Copy size={14} /> Duplicate
                                </button>
                            </>
                        )}
                    </div>
                    {!isStudent && (
                        <>
                            <div className={`h-px my-1 ${theme === 'light' ? 'bg-slate-100' : 'bg-white/10'}`}></div>
                            <div className="p-1">
                                {(sidebarFilter === 'trashed' || sidebarFilter === 'global_trash') ? (
                                    <>
                                        <button onClick={() => handleMenuAction('restore')} className="w-full text-left px-3 py-2 text-xs font-bold text-green-500 hover:bg-green-500/10 rounded-lg flex items-center gap-2">
                                            <RotateCcw size={14} /> Restore
                                        </button>
                                        <button onClick={() => handleMenuAction('hard_delete')} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2">
                                            <Trash2 size={14} /> Delete Forever
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => handleMenuAction('delete')} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2">
                                        <Trash2 size={14} /> Move to Trash
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmModal.type === 'empty_trash' ? "Empty Trash?" : (confirmModal.type === 'hard_delete' ? "Delete Forever?" : "Move to Trash?")}
                message={
                    confirmModal.type === 'empty_trash' 
                    ? "This will permanently delete all boards in the trash. This action cannot be undone." 
                    : (confirmModal.type === 'hard_delete' ? "This board will be permanently deleted. This action cannot be undone." : "You can restore this board from the Trash.")
                }
                confirmText={confirmModal.type === 'soft_delete' ? "Move to Trash" : (confirmModal.type === 'empty_trash' ? "Empty All" : "Delete Forever")}
                isDangerous={true}
            />
        </div>
    );
};