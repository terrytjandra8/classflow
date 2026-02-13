
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sun, Moon, Hash, Clock, LogOut, Search, ArrowRight, Layout, BookOpen, User, Home, Grid, Filter, X, Quote, Sparkles, Trophy, Calendar, Folder, ChevronDown, ListFilter, GripVertical, Menu, GraduationCap } from 'lucide-react';
import { Board } from '../types';
import { supabase } from '../services/supabaseClient';
import { Tooltip } from './Tooltip';
import { QUOTES } from './Dashboard/constants';
import { resolveBackgroundStyle } from '../utils/theme';
import { classService } from '../services/classService';
import { profileService } from '../services/profileService';
import { Avatar } from './ui/Avatar';
import { useSortableList } from '../src/logic/dnd/useSortableList';
import { Documentation } from './Documentation';
import { StudentGrades } from './StudentGrades';

interface StudentDashboardProps {
  boards: Board[];
  onSelectBoard: (boardId: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  username: string;
  userAvatar: string | null;
  userClasses: string[];
}

// Helper for Date Grouping
const getDateCategory = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    const d = new Date(date); d.setHours(0,0,0,0);
    const n = new Date(now); n.setHours(0,0,0,0);
    
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
    
    if (weekStart.getTime() === currentWeekStart.getTime()) {
        return "This Week";
    }
    
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    if (weekStart.getTime() === lastWeekStart.getTime()) {
        return "Last Week";
    }
    
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('en-US', { month: 'long' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  boards, onSelectBoard, theme, onToggleTheme, username, userAvatar, userClasses 
}) => {
  // Persist Active Tab
  const [activeTab, setActiveTabState] = useState<'home' | 'join' | 'documentation' | 'grades'>(() => {
      return (localStorage.getItem('cb_student_tab') as any) || 'home';
  });

  const setActiveTab = (tab: 'home' | 'join' | 'documentation' | 'grades') => {
      setActiveTabState(tab);
      localStorage.setItem('cb_student_tab', tab);
  };

  // Persist Class Filter
  const [selectedClassFilter, setSelectedClassFilterState] = useState<string>(() => {
      return localStorage.getItem('cb_student_class_filter') || 'All';
  });

  const setSelectedClassFilter = (filter: string) => {
      setSelectedClassFilterState(filter);
      localStorage.setItem('cb_student_class_filter', filter);
  };

  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'updated'>('created');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  // Get User ID for Grade Fetching
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Local state for rearrangeable classes
  const [localClasses, setLocalClasses] = useState<{id: string, name: string}[]>([]);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const [joinedBoards, setJoinedBoards] = useState<string[]>(() => {
      try {
          const saved = localStorage.getItem('classboard_student_joined');
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });

  const randomQuote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  useEffect(() => {
      // Get ID
      supabase.auth.getUser().then(({data}) => {
          if(data.user) setCurrentUserId(data.user.id);
      });
  }, []);

  // Sync props to local state for DND
  useEffect(() => {
      setLocalClasses(userClasses.map(c => ({ id: c, name: c })));
  }, [userClasses]);

  // Click Outside Handlers
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
              setIsSortMenuOpen(false);
          }
          if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
              setIsMobileMenuOpen(false);
          }
      };
      window.addEventListener('mousedown', handleClickOutside);
      return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsJoining(true);
      
      try {
          const code = joinCode.trim().toUpperCase();
          if (code.length < 6) {
              setError('Code must be 6 characters.');
              setIsJoining(false);
              return;
          }

          // 1. Try finding in loaded boards
          let board = boards.find(b => b.classCode === code);

          // 2. If not found locally, try finding in DB
          if (!board) {
              const { data, error } = await supabase
                  .from('boards')
                  .select('id, target_grade, format, settings, is_published, class_code')
                  .eq('class_code', code)
                  .single();
              
              if (data && !error) {
                  // Partial mapping to satisfy logic below
                  board = {
                      id: data.id,
                      classCode: data.class_code,
                      targetGrade: data.target_grade,
                      format: data.format as any,
                      isPublished: data.is_published,
                      quizState: (data.settings as any)?.quizState,
                      assessmentState: (data.settings as any)?.assessmentState,
                      title: 'Loading...' // Placeholder
                  } as Board;
              }
          }
          
          if (board) {
              // 1. One-Time Access (Local Storage)
              const newJoined = [...joinedBoards, board.id];
              setJoinedBoards(newJoined);
              localStorage.setItem('classboard_student_joined', JSON.stringify(newJoined));
              
              // 2. Enrollment Logic (If configured)
              if (board.targetGrade && board.targetGrade !== 'General') {
                  const targetClass = await classService.getClassByName(board.targetGrade);
                  
                  if (targetClass && targetClass.autoEnroll !== false) {
                      if (!userClasses.includes(board.targetGrade)) {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (user) {
                              const newClasses = [...userClasses, board.targetGrade];
                              await profileService.updateClasses(user.id, newClasses);
                          }
                      }
                  }
              }

              const isQuizActive = board.format === 'quiz' && board.quizState && (board.quizState as string) !== 'setup';
              const isAssessmentActive = board.format === 'assessment' && board.assessmentState === 'active';

              if (board.isPublished || isQuizActive || isAssessmentActive) {
                  onSelectBoard(board.id);
              } else {
                  setError('Board joined, but it is currently hidden by the teacher.');
              }
          } else {
              setError('Board not found. Please check the code.');
          }
      } catch (err) {
          console.error(err);
          setError('Failed to join. Please try again.');
      } finally {
          setIsJoining(false);
      }
  };

  const handleLogout = async () => {
      localStorage.removeItem('cb_student_tab');
      await supabase.auth.signOut();
  };

  // --- DND Hook for Sidebar ---
  const { handleDragStart, handleDragEnter, handleDragEnd, draggedItem } = useSortableList({
      items: localClasses,
      onReorder: (newItems: any) => {
          setLocalClasses(newItems);
      }
  });

  const onDropPersist = async (e: React.DragEvent) => {
      handleDragEnd(e);
      // Persist order to DB
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const newClassStrings = localClasses.map(c => c.name);
          await profileService.updateClasses(user.id, newClassStrings);
      }
  };

  // --- Filtering Logic ---
  const accessibleBoards = useMemo(() => {
      return boards.filter(b => {
          if (b.isTrashed) return false;
          
          const isQuizActive = b.format === 'quiz' && b.quizState && (b.quizState as string) !== 'setup';
          const isAssessmentActive = b.format === 'assessment' && b.assessmentState === 'active';
          
          if (!b.isPublished && !isQuizActive && !isAssessmentActive) return false;

          const target = b.targetGrade || 'General';
          const isAssigned = userClasses.includes(target); 
          const isJoined = joinedBoards.includes(b.id);
          return isAssigned || isJoined;
      });
  }, [boards, userClasses, joinedBoards]);

  const filteredBoards = accessibleBoards.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(filter.toLowerCase());
      const matchesClass = selectedClassFilter === 'All' || (b.targetGrade || 'General') === selectedClassFilter;
      return matchesSearch && matchesClass;
  }).sort((a, b) => {
      const timeA = sortBy === 'created' ? a.createdAt : (a.updatedAt || a.createdAt);
      const timeB = sortBy === 'created' ? b.createdAt : (b.updatedAt || b.createdAt);
      return timeB - timeA;
  });

  // Grouping
  const groupedBoards = useMemo(() => {
      if (filter.trim() || selectedClassFilter !== 'All') return null; // Disable grouping when filtering specific things

      const getTimestamp = (b: Board) => sortBy === 'created' ? b.createdAt : (b.updatedAt || b.createdAt);
      const categories = Array.from(new Set(filteredBoards.map(b => getDateCategory(getTimestamp(b)))));
      
      return categories.map(category => ({
          title: category,
          items: filteredBoards.filter(b => getDateCategory(getTimestamp(b)) === category)
      }));
  }, [filteredBoards, filter, selectedClassFilter, sortBy]);

  const BoardGrid = ({ items }: { items: Board[] }) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(board => {
              const showClassBadge = board.targetGrade && board.targetGrade !== 'General';
              const bgStyle = resolveBackgroundStyle(board.wallpaper, theme);
              
              return (
                  <div 
                      key={board.id} 
                      onClick={() => onSelectBoard(board.id)}
                      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl h-64 flex flex-col border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}
                  >
                      <div className={`h-32 relative overflow-hidden`} style={bgStyle}>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                          {board.icon && (
                              <div className="absolute -bottom-5 left-4 text-5xl drop-shadow-xl font-emoji group-hover:scale-110 transition-transform duration-300">
                                  {board.icon}
                              </div>
                          )}
                          {showClassBadge && (
                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1 text-[10px] font-bold text-white shadow-sm border border-white/10 uppercase tracking-wide">
                                    {board.targetGrade}
                                </div>
                          )}
                      </div>
                      <div className="p-5 pt-6 flex-1 flex flex-col justify-between">
                          <div>
                              <h4 className={`font-bold text-base truncate mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{board.title}</h4>
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{board.description || 'No description provided.'}</p>
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>
  );

  return (
    <div className={`h-screen flex ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#050505] text-white'} transition-colors duration-300 font-sans overflow-hidden`}>
      
      {/* --- DESKTOP SIDEBAR --- */}
      <div className={`w-64 shrink-0 flex-col py-6 pr-4 pl-6 hidden md:flex border-r h-full ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#111] border-white/5'}`}>
          
          {/* User Profile */}
          <div className="flex mb-8 items-center gap-3">
              <Avatar src={userAvatar} name={username} size="lg" className="shrink-0" />
              <div>
                  <h2 className={`font-bold truncate max-w-[140px] ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{username}</h2>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide">Student</p>
              </div>
          </div>

          <button 
              onClick={() => setActiveTab('join')}
              className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl mb-6 transition-all shadow-lg hover:scale-[1.02] active:scale-95 ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-gray-200'}`}
          >
              <Hash size={16} /> Join a Class
          </button>

          <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-2">
              <button 
                  onClick={() => { setActiveTab('home'); setSelectedClassFilter('All'); }} 
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                      activeTab === 'home' && selectedClassFilter === 'All'
                      ? (theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#222] text-white') 
                      : (theme === 'light' ? 'text-slate-500 hover:bg-slate-50' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]')
                  }`}
              >
                  <Home size={16} /> All Boards
              </button>

              <button 
                  onClick={() => setActiveTab('grades')} 
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                      activeTab === 'grades'
                      ? (theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#222] text-white') 
                      : (theme === 'light' ? 'text-slate-500 hover:bg-slate-50' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]')
                  }`}
              >
                  <GraduationCap size={16} /> Grades
              </button>

              <button 
                  onClick={() => setActiveTab('documentation')} 
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                      activeTab === 'documentation'
                      ? (theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#222] text-white') 
                      : (theme === 'light' ? 'text-slate-500 hover:bg-slate-50' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]')
                  }`}
              >
                  <BookOpen size={16} /> Guide
              </button>

              <div className={`h-px my-4 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>
              
              <div className="flex items-center justify-between px-3 mb-2 group/label">
                  <p className="text-[10px] uppercase font-bold text-gray-500">My Classes</p>
                  <span className="text-[9px] text-gray-400 opacity-0 group-hover/label:opacity-100 transition-opacity">Drag to sort</span>
              </div>

              {localClasses.length > 0 ? (
                  <div className="space-y-1">
                      {localClasses.map((cls) => (
                          <div
                              key={cls.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, cls)}
                              onDragEnter={(e) => handleDragEnter(e, cls)}
                              onDragEnd={onDropPersist}
                              onDragOver={(e) => e.preventDefault()}
                              className={`
                                  group flex items-center rounded-lg transition-all cursor-move
                                  ${draggedItem?.id === cls.id ? 'opacity-30 bg-blue-500/20 border border-blue-500/50' : 'border border-transparent'}
                                  ${selectedClassFilter === cls.name 
                                      ? (theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400') 
                                      : 'hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'}
                              `}
                          >
                              <div className="pl-2 pr-1 text-gray-400 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
                                  <GripVertical size={12} />
                              </div>
                              <button
                                  onClick={() => { setActiveTab('home'); setSelectedClassFilter(cls.name); }}
                                  className={`flex-1 flex items-center gap-3 py-2 pr-2 text-sm font-bold text-left overflow-hidden`}
                              >
                                  <Folder size={16} className="shrink-0" />
                                  <span className="truncate">{cls.name}</span>
                              </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="px-3 py-4 text-center border-2 border-dashed border-gray-500/10 rounded-lg">
                      <p className="text-xs text-gray-500">No classes yet</p>
                  </div>
              )}
          </nav>

          <div className={`mt-auto pt-4 border-t space-y-3 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
              <button 
                  onClick={onToggleTheme}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${theme === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}
              >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                  <LogOut size={16} /> Sign Out
              </button>
          </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
          
          {/* Mobile Header */}
          <div className="md:hidden h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-[#111] z-20">
              <div className="flex items-center gap-2">
                  <Layout size={24} className="text-pink-600" />
                  <span className="font-bold text-lg">ClassBoard</span>
              </div>
              <div className="relative" ref={mobileMenuRef}>
                  <div onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                      <Avatar src={userAvatar} name={username} size="md" className="cursor-pointer border border-gray-200 dark:border-white/10" />
                  </div>
                  {isMobileMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                          <div className="p-3 border-b border-gray-100 dark:border-white/5">
                              <p className="font-bold text-sm truncate">{username}</p>
                              <p className="text-xs text-gray-500">Student</p>
                          </div>
                          <div className="p-1">
                              <button onClick={() => { setActiveTab('grades'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                                  <GraduationCap size={14} /> Grades
                              </button>
                              <button onClick={() => { setActiveTab('documentation'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                                  <BookOpen size={14} /> Guide
                              </button>
                              <button onClick={onToggleTheme} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                                  {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>} Theme
                              </button>
                              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center gap-2 font-bold">
                                  <LogOut size={14} /> Sign Out
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-8">
              
              {activeTab === 'documentation' ? (
                  <Documentation role="student" onBack={() => setActiveTab('home')} theme={theme} />
              ) : activeTab === 'grades' ? (
                  <StudentGrades userId={currentUserId} onSelectBoard={onSelectBoard} theme={theme} userClasses={userClasses} userName={username} />
              ) : activeTab === 'join' ? (
                  <div className="flex flex-col items-center justify-center py-10 animate-in fade-in slide-in-from-bottom-2 relative min-h-[50vh]">
                       <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                           <button 
                                onClick={() => setActiveTab('home')}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                           >
                                <X size={20} />
                           </button>
                           <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 border border-blue-500/20 shadow-lg">
                               <Hash size={40} />
                           </div>
                           <h2 className="text-2xl font-bold text-white mb-2">Join a Class</h2>
                           <p className="text-gray-400 text-sm mb-8 px-4">Enter the 6-digit code provided by your teacher.</p>
                           
                           <form onSubmit={handleJoin} className="space-y-6">
                               <input 
                                   type="text" 
                                   value={joinCode}
                                   onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                   placeholder="CODE"
                                   maxLength={6}
                                   className="w-full bg-black/30 border-2 border-white/10 rounded-2xl py-5 text-3xl font-mono tracking-[0.5em] text-center text-white focus:border-blue-500 outline-none uppercase transition-colors placeholder-white/10"
                                   autoFocus
                               />
                               {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                               <button 
                                    type="submit"
                                    disabled={!joinCode || isJoining}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all shadow-lg"
                               >
                                   {isJoining ? 'Joining...' : 'Join Board'}
                               </button>
                           </form>
                       </div>
                  </div>
              ) : (
                  <>
                      {/* HOME VIEW */}
                      {/* ... (rest of Home view logic) ... */}
                      {/* Hero */}
                      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white shadow-2xl animate-in fade-in slide-in-from-top-4 shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
                          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                          
                          <div className="relative z-10">
                              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4 border border-white/10">
                                  <Sparkles size={12} className="text-yellow-300" /> Daily Inspiration
                              </div>
                              <h2 className="text-2xl md:text-4xl font-extrabold mb-4 leading-tight">
                                  Ready to learn, {username.split(' ')[0]}?
                              </h2>
                              <div className="flex gap-2 max-w-2xl items-start">
                                  <Quote size={20} className="text-white/50 shrink-0 mt-1" />
                                  <p className="text-lg font-medium text-white/90 italic leading-relaxed">"{randomQuote}"</p>
                              </div>
                          </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                          <div className="relative w-full md:max-w-md">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                              <input 
                                  type="text"
                                  placeholder="Search your boards..."
                                  value={filter}
                                  onChange={(e) => setFilter(e.target.value)}
                                  className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-blue-500 shadow-sm transition-all ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-[#1a1a1a] border border-white/10 text-white'}`}
                              />
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-auto relative" ref={sortMenuRef}>
                              <button 
                                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-[#1a1a1a] border-white/10 text-gray-300 hover:bg-white/5'}`}
                              >
                                  <ListFilter size={14} />
                                  {sortBy === 'created' ? 'Created Date' : 'Last Active'}
                                  <ChevronDown size={12} className={`transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isSortMenuOpen && (
                                  <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 z-50 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/10'}`}>
                                      <button 
                                          onClick={() => { setSortBy('created'); setIsSortMenuOpen(false); }}
                                          className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
                                      >
                                          <Calendar size={14} /> Created Date
                                      </button>
                                      <button 
                                          onClick={() => { setSortBy('updated'); setIsSortMenuOpen(false); }}
                                          className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
                                      >
                                          <Clock size={14} /> Last Active
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Content Grid */}
                      {filteredBoards.length === 0 ? (
                          <div className="text-center py-20 opacity-60 border-2 border-dashed border-gray-500/20 rounded-3xl bg-gray-50 dark:bg-white/5">
                              <Trophy size={48} className="mx-auto mb-4 text-gray-400" />
                              <p className="text-base font-bold text-gray-500">No boards found</p>
                              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or join a new class.</p>
                          </div>
                      ) : (
                          <div className="space-y-12 pb-20">
                              {groupedBoards ? groupedBoards.map((group) => (
                                  <div key={group.title} className="animate-fade-in">
                                      <div className="flex items-center gap-4 mb-4">
                                          <h3 className={`text-sm font-bold uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                              {group.title}
                                          </h3>
                                          <div className={`h-px flex-1 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/5'}`}></div>
                                      </div>
                                      <BoardGrid items={group.items} />
                                  </div>
                              )) : (
                                  <BoardGrid items={filteredBoards} />
                              )}
                          </div>
                      )}
                  </>
              )}
          </div>
      </div>

      {/* Mobile Bottom Join Button (Floating) */}
      <button 
          onClick={() => setActiveTab('join')}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
          <Hash size={24} />
      </button>

    </div>
  );
};
