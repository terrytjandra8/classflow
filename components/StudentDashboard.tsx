import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sun, Moon, Hash, Clock, LogOut, Search, Layout, BookOpen, User, Home, Grid, Filter, X, Quote, Sparkles, Trophy, Calendar, Folder, ChevronDown, ListFilter, GraduationCap, Menu, GripVertical } from 'lucide-react';
import { Board } from '../types';
import { supabase } from '../services/supabaseClient';
import { Tooltip } from './Tooltip';
import { QUOTES } from './Dashboard/constants';
import { resolveBackgroundStyle, WALLPAPERS_MAP } from '../utils/theme';
import { Avatar } from './ui/Avatar';
import { Documentation } from './Documentation';
import { StudentGrades } from './StudentGrades';
import { BoardCard } from './Dashboard/BoardCard';
import { Logo } from './Logo';

// This utility function determines the time-based category for a board.
const getDateCategory = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const n = new Date(now); n.setHours(0, 0, 0, 0);
    const diffTime = n.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (86400000));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";

    const day = d.getDay();
    const diffToSunday = d.getDate() - day;
    const weekStart = new Date(d);
    weekStart.setDate(diffToSunday);

    const currentDay = n.getDay();
    const currentDiffToSunday = n.getDate() - currentDay;
    const currentWeekStart = new Date(n);
    currentWeekStart.setDate(currentDiffToSunday);

    if (weekStart.getTime() === currentWeekStart.getTime()) return "This Week";

    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    if (weekStart.getTime() === lastWeekStart.getTime()) return "Last Week";

    if (date.getFullYear() === now.getFullYear()) return date.toLocaleDateString('en-US', { month: 'long' });

    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

interface StudentDashboardProps {
    boards: Board[];
    onSelectBoard: (boardId: string) => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    username: string;
    userAvatar: string | null;
    userClasses: string[];
    onJoinByCode: (code: string) => Promise<boolean>;
}

// GLOBAL TRACKER: Persists across component unmounts during the session.
// This is the "Blink Killer" - it ensures we remember seen boards even during aggressive polling.
const sessionSeenBoardIds = new Set<string>();

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
    boards: boardsProp, onSelectBoard, theme, onToggleTheme, username, userAvatar, userClasses, onJoinByCode
}) => {
    // === STATE MANAGEMENT ===
    // Active tab for navigation (home, grades, etc.)
    const [activeTab, setActiveTabState] = useState<'home' | 'join' | 'documentation' | 'grades'>(() => (localStorage.getItem('cb_student_tab') as any) || 'home');
    // Currently selected class for filtering the board list
    const [selectedClassFilter, setSelectedClassFilterState] = useState<string>(() => localStorage.getItem('cb_student_class_filter') || 'All Boards');
    // Search input text
    const [filter, setFilter] = useState('');
    // State for the "Join a Class" modal
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    // Other UI states
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // --- EXIT ANIMATION BUFFER ---
    // This state holds the boards that are currently being rendered, including those animating out.
    const [renderedBoards, setRenderedBoards] = useState<Board[]>([]);
    const boardsRef = useRef<Board[]>(boardsProp);
    useEffect(() => { boardsRef.current = boardsProp; }, [boardsProp]);

    const randomQuote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

    // Persist active tab and class filter to localStorage
    const setActiveTab = (tab: 'home' | 'join' | 'documentation' | 'grades') => {
        setActiveTabState(tab);
        localStorage.setItem('cb_student_tab', tab);
    };
    const setSelectedClassFilter = (filter: string) => {
        setSelectedClassFilterState(filter);
        localStorage.setItem('cb_student_class_filter', filter);
    };

    useEffect(() => {
        // Get the current user's ID once
        const fetchUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        fetchUserId();
    }, []);

    // --- CORE LOGIC: Synchronize boardsProp with renderedBoards ---
    useEffect(() => {
        // 1. Calculate what SHOULD be visible based on filters
        let nextVisible = boardsProp.filter(b =>
            !b.isTrashed &&
            (
                b.isPublished ||
                (b.format === 'quiz' && b.quizState && b.quizState !== 'setup') ||
                (b.format === 'assessment' && (b.assessmentState === 'active' || b.assessmentState === 'reading'))
            )
        );

        if (selectedClassFilter !== 'All Boards') {
            nextVisible = nextVisible.filter(b => b.targetGrade === selectedClassFilter);
        }

        if (filter.trim()) {
            nextVisible = nextVisible.filter(b => b.title.toLowerCase().includes(filter.toLowerCase()));
        }

        setRenderedBoards(prev => {
            // Find boards that are in prev but NOT in nextVisible
            // We mark them as isExiting instead of removing them immediately
            const currentlyExitingIds = new Set(prev.filter(b => b.isExiting).map(b => b.id));
            
            const stillVisible = nextVisible.map(b => ({ ...b, isExiting: false }));
            
            const boardsToAnimateOut = prev.filter(b => 
                !nextVisible.some(nb => nb.id === b.id) && !currentlyExitingIds.has(b.id)
            ).map(b => ({ ...b, isExiting: true }));

            // For boards that were already exiting, keep them until the timeout hits
            const persistentExiting = prev.filter(b => currentlyExitingIds.has(b.id));

            const combined = [...stillVisible, ...boardsToAnimateOut, ...persistentExiting];
            
            // Sort to keep layout stable (newest first)
            return combined.sort((a, b) => b.createdAt - a.createdAt);
        });

        // Set timeouts for boards marked as isExiting to eventually remove them
        const boardsToKill = renderedBoards.filter(b => !nextVisible.some(nb => nb.id === b.id) && !b.isExiting);
        if (boardsToKill.length > 0) {
            // We just triggered isExiting: true for these. Now set a timer to remove them from state.
            setTimeout(() => {
                setRenderedBoards(current => current.filter(b => 
                    nextVisible.some(nb => nb.id === b.id) || !boardsToKill.some(bk => bk.id === b.id)
                ));
            }, 1000); // Matches exit-card duration in tailwind.config.js
        }

    }, [boardsProp, selectedClassFilter, filter]);

    const displayBoards = renderedBoards;

    // Track seen boards for entrance animations
    useEffect(() => {
        const seenTimer = setTimeout(() => {
            boardsProp.forEach(b => sessionSeenBoardIds.add(b.id));
        }, 3000);
        return () => clearTimeout(seenTimer);
    }, [boardsProp]);

    const groupedBoards = useMemo(() => {
        // Only group if there's no active search or class filter
        if (filter.trim() || selectedClassFilter !== 'All Boards') return null;

        const getTimestamp = (b: Board) => b.createdAt;
        const categories = [...new Set(displayBoards.map(b => getDateCategory(getTimestamp(b))))];

        return categories.map(category => ({
            title: category,
            items: displayBoards.filter(b => getDateCategory(getTimestamp(b)) === category)
        }));
    }, [displayBoards, filter, selectedClassFilter]);

    // === EVENT HANDLERS ===
    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setJoinError('');
        setIsJoining(true);
        const success = await onJoinByCode(joinCode.trim());
        if (success) {
            setJoinCode('');
            setActiveTab('home'); // Switch back to home view on success
        } else {
            setJoinError('Invalid code or you already joined this class.');
        }
        setIsJoining(false);
    };

    const handleLogout = async () => {
        localStorage.removeItem('cb_student_tab');
        localStorage.removeItem('cb_student_class_filter');
        await supabase.auth.signOut();
    };

    // === RENDER COMPONENTS ===
    const renderBoardGrid = (items: Board[]) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((board, idx) => {
                const isNew = !sessionSeenBoardIds.has(board.id);

                return (
                    <div
                        key={board.id}
                        style={{ animationDelay: isNew ? `${idx * 150}ms` : '0ms' }}
                        className={isNew ? '' : '[&_.animate-enter-card]:animate-none'}
                    >
                        <BoardCard
                            board={board}
                            viewMode="recents"
                            onSelect={onSelectBoard}
                            onDelete={() => { }}
                            onRestore={() => { }}
                            onToggleFavorite={() => { }}
                            onMenuOpen={() => { }}
                            wallpapersMap={WALLPAPERS_MAP}
                            theme={theme}
                            disableAnimation={!isNew}
                            isExiting={board.isExiting}
                        />
                    </div>
                );
            })}
        </div>
    );

    const SidebarNav = ({
        isMobile,
        activeTab,
        selectedClassFilter,
        userClasses,
        onTabChange,
        onFilterChange,
        onCloseMobileMenu
    }: {
        isMobile: boolean,
        activeTab: string,
        selectedClassFilter: string,
        userClasses: string[],
        onTabChange: (tab: any) => void,
        onFilterChange: (filter: string) => void,
        onCloseMobileMenu: () => void
    }) => {
        const buttonClass = (tab: string, filter?: string) => `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === tab && (filter === undefined || selectedClassFilter === filter)
                ? 'bg-slate-100 dark:bg-[#222] text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'
            }`;

        const handleFilterClick = (filterName: string) => {
            onTabChange('home');
            onFilterChange(filterName);
            if (isMobile) onCloseMobileMenu();
        }

        return (
            <nav className={`space-y-1 flex-1 overflow-y-auto custom-scrollbar ${isMobile ? 'px-4' : 'pr-2'}`}>
                <button onClick={() => handleFilterClick('All Boards')} className={buttonClass('home', 'All Boards')}><Home size={16} /> All Boards</button>
                <button onClick={() => { onTabChange('grades'); if (isMobile) onCloseMobileMenu(); }} className={buttonClass('grades')}><GraduationCap size={16} /> Grades</button>
                <button onClick={() => { onTabChange('documentation'); if (isMobile) onCloseMobileMenu(); }} className={buttonClass('documentation')}><BookOpen size={16} /> Guide</button>

                <div className="h-px my-4 bg-slate-200 dark:bg-white/10"></div>
                <p className="px-3 mb-2 text-[10px] uppercase font-bold text-gray-500">My Classes</p>

                {userClasses.length > 0 ? (
                    <div className="space-y-1">
                        {userClasses.map((className) => (
                            <button key={className} onClick={() => handleFilterClick(className)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-left overflow-hidden transition-colors ${selectedClassFilter === className ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'}`}>
                                <Folder size={16} className="shrink-0" /> <span className="truncate">{className}</span>
                            </button>
                        ))}
                    </div>
                ) : <div className="px-3 py-4 text-center border-2 border-dashed border-gray-500/10 rounded-lg"><p className="text-xs text-gray-500">No classes yet</p></div>}
            </nav>
        );
    };

    const Sidebar = ({
        isMobile = false,
        userAvatar,
        username,
        activeTab,
        selectedClassFilter,
        userClasses,
        theme,
        onTabChange,
        onFilterChange,
        onCloseMobileMenu,
        onToggleTheme,
        onLogout
    }: {
        isMobile?: boolean,
        userAvatar: string | null,
        username: string,
        activeTab: string,
        selectedClassFilter: string,
        userClasses: string[],
        theme: 'light' | 'dark',
        onTabChange: (tab: any) => void,
        onFilterChange: (filter: string) => void,
        onCloseMobileMenu: () => void,
        onToggleTheme: () => void,
        onLogout: () => void
    }) => (
        <div className={`flex flex-col h-full ${isMobile ? 'flex w-full' : 'hidden md:flex w-64 shrink-0'} bg-white dark:bg-[#111] ${!isMobile ? 'py-6 pr-4 pl-6 border-r border-slate-200 dark:border-white/5' : ''}`}>
            <div className={isMobile ? 'px-6 pt-10' : ''}>
                {!isMobile && (
                    <div className="flex mb-8 items-center gap-3">
                        <Avatar src={userAvatar} name={username} size="lg" className="shrink-0" />
                        <div>
                            <h2 className="font-bold truncate max-w-[140px] text-slate-800 dark:text-white">{username}</h2>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide">Student</p>
                        </div>
                    </div>
                )}
                <button onClick={() => { onTabChange('join'); if (isMobile) onCloseMobileMenu(); }} className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl mb-6 transition-all shadow-lg hover:scale-[1.02] active:scale-95 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                    <Hash size={16} /> Join a Class
                </button>
            </div>
            <SidebarNav
                isMobile={isMobile}
                activeTab={activeTab}
                selectedClassFilter={selectedClassFilter}
                userClasses={userClasses}
                onTabChange={onTabChange}
                onFilterChange={onFilterChange}
                onCloseMobileMenu={onCloseMobileMenu}
            />
            <div className={`mt-auto pt-4 space-y-3 ${isMobile ? 'px-6 pb-6' : ''} border-t border-slate-200 dark:border-white/5`}>
                <button onClick={onToggleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#1a1a1a]"><Sun size={16} /><span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span></button>
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"><LogOut size={16} /> Sign Out</button>
            </div>
        </div>
    );

    // === MAIN RENDER ===
    return (
        <div className="h-screen flex bg-slate-50 text-slate-900 dark:bg-[#050505] dark:text-white transition-colors duration-300 font-sans overflow-hidden">
            {/* Mobile Sidebar */}
            <div className={`md:hidden fixed inset-0 bg-black/50 z-[90] transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className={`md:hidden fixed top-0 left-0 h-full w-4/5 max-w-[280px] z-[100] transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar
                    isMobile={true}
                    userAvatar={userAvatar}
                    username={username}
                    activeTab={activeTab}
                    selectedClassFilter={selectedClassFilter}
                    userClasses={userClasses}
                    theme={theme}
                    onTabChange={setActiveTab}
                    onFilterChange={setSelectedClassFilter}
                    onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                    onToggleTheme={onToggleTheme}
                    onLogout={handleLogout}
                />
            </div>

            {/* Desktop Sidebar */}
            <Sidebar
                userAvatar={userAvatar}
                username={username}
                activeTab={activeTab}
                selectedClassFilter={selectedClassFilter}
                userClasses={userClasses}
                theme={theme}
                onTabChange={setActiveTab}
                onFilterChange={setSelectedClassFilter}
                onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                onToggleTheme={onToggleTheme}
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative pb-16 md:pb-0">
                {/* Mobile Header */}
                <div className="md:hidden h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-[#111] z-50">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-full text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5"><Menu size={20} /></button>
                    
                    <div className="flex items-center gap-2">
                        <Logo size="sm" />
                        <span className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">ClassBoards</span>
                    </div>

                    <div className="relative" ref={profileMenuRef}>
                        <div 
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 cursor-pointer shrink-0 hover:scale-105 transition-transform ${theme === 'light' ? 'border-slate-200' : 'border-[#111]'}`}
                        >
                            {userAvatar ? (
                                <img src={userAvatar} alt={username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                                    {username.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {showProfileMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                                    <div className="p-3 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111]">
                                        <p className="font-bold text-sm truncate text-gray-800 dark:text-white">{username}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5 tracking-wider">Student</p>
                                    </div>
                                    <div className="p-1">
                                        <button 
                                            onClick={() => { onToggleTheme(); setShowProfileMenu(false); }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg flex items-center gap-2"
                                        >
                                            {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                        </button>
                                        <button 
                                            onClick={() => { setActiveTab('documentation'); setShowProfileMenu(false); }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg flex items-center gap-2"
                                        >
                                            <BookOpen size={14} /> Guide
                                        </button>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 font-bold transition-colors"
                                        >
                                            <LogOut size={14} /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-8">
                    {activeTab === 'documentation' ? <Documentation role="student" onBack={() => setActiveTab('home')} theme={theme} />
                        : activeTab === 'grades' ? <StudentGrades userId={currentUserId} onSelectBoard={onSelectBoard} theme={theme} userClasses={userClasses} userName={username} />
                            : activeTab === 'join' ? (
                                <div className="flex flex-col items-center justify-center py-10 animate-in fade-in slide-in-from-bottom-2 relative min-h-[50vh]">
                                    <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                                        <button onClick={() => setActiveTab('home')} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"><X size={20} /></button>
                                        <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 border border-blue-500/20 shadow-lg"><Hash size={40} /></div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Join a Class</h2>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 px-4">Enter the 6-digit code provided by your teacher.</p>
                                        <form onSubmit={handleJoinSubmit} className="space-y-6">
                                            <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="CODE" maxLength={6} className="w-full bg-slate-100 dark:bg-black/30 border-2 border-slate-200 dark:border-white/10 rounded-2xl py-5 text-3xl font-mono tracking-[0.5em] text-center text-slate-900 dark:text-white focus:border-blue-500 outline-one uppercase transition-colors placeholder:text-slate-400 dark:placeholder-white/10" autoFocus />
                                            {joinError && <p className="text-red-500 dark:text-red-400 text-xs font-bold">{joinError}</p>}
                                            <button type="submit" disabled={!joinCode || isJoining} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all shadow-lg">{isJoining ? 'Joining...' : 'Join Class'}</button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white shadow-2xl animate-in fade-in slide-in-from-top-4 shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                        <div className="relative z-10">
                                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4 border border-white/10"><Sparkles size={12} className="text-yellow-300" /> Daily Inspiration</div>
                                            <h2 className="text-2xl md:text-4xl font-extrabold mb-4 leading-tight">Ready to learn, {username.split(' ')[0]}?</h2>
                                            <div className="flex gap-2 max-w-2xl items-start"><Quote size={20} className="text-white/50 shrink-0 mt-1" /><p className="text-lg font-medium text-white/90 italic leading-relaxed">"{randomQuote}"</p></div>
                                        </div>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="flex">
                                        <div className="relative w-full md:max-w-md">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input type="text" placeholder="Search your boards..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-blue-500 shadow-sm transition-all bg-white border border-slate-200 dark:bg-[#1a1a1a] dark:border-white/10 dark:text-white" />
                                        </div>
                                    </div>

                                    {/* Board Display */}
                                    {displayBoards.length === 0 ? (
                                        <div className="text-center py-20 opacity-60 border-2 border-dashed border-gray-500/20 rounded-3xl bg-gray-50 dark:bg-white/5">
                                            <Trophy size={48} className="mx-auto mb-4 text-gray-400" />
                                            <p className="text-base font-bold text-gray-500">No boards found</p>
                                            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or class filter.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-12">
                                            {groupedBoards ? groupedBoards.map((group) => (
                                                <div key={group.title} className="animate-fade-in">
                                                    <div className="flex items-center gap-4 mb-4"><h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{group.title}</h3><div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div></div>
                                                    {renderBoardGrid(group.items)}
                                                </div>
                                            )) : renderBoardGrid(displayBoards)}
                                        </div>
                                    )}
                                </>
                            )}
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex items-center justify-around ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0a0a0a] border-white/10'}`}>
                <button 
                    onClick={() => setActiveTab('home')} 
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'home' ? 'text-pink-500' : 'text-gray-500'}`}
                >
                    <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Home</span>
                </button>
                
                <button 
                    onClick={() => setActiveTab('join')} 
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'join' ? 'text-pink-500' : 'text-gray-500'}`}
                >
                    <Hash size={20} strokeWidth={activeTab === 'join' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Join</span>
                </button>

                <button 
                    onClick={() => setActiveTab('grades')} 
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'grades' ? 'text-pink-500' : 'text-gray-500'}`}
                >
                    <GraduationCap size={20} strokeWidth={activeTab === 'grades' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Grades</span>
                </button>
            </div>
        </div>
    );
};
