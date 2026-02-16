import React, { useState } from 'react';
import { Sun, Moon, X, ShieldCheck, Users, ChevronDown, Filter, Layout, LogOut, Home as HomeIcon, PlusSquare, Image as ImageIcon, Activity, Hash, BookOpen, Bell, Check, GraduationCap } from 'lucide-react';
import { Board, BoardFormat, Note, Profile } from '../../types';
import { Home } from './Home';
import { Make } from './Make';
import { Gallery } from './Gallery';
import { SetupModal } from './SetupModal';
import { AdminDashboard } from '../AdminDashboard';
import { SystemDashboard } from '../Admin/SystemDashboard';
import { Documentation } from '../Documentation';
import { Tooltip } from '../Tooltip';
import { useDashboardLogic, TabView } from './logic/useDashboardLogic';
import { SuperAdminNotifications } from '../SuperAdminNotifications';
import { useNotifications } from '../../hooks/useNotifications';
import { Avatar } from '../ui/Avatar';

interface DashboardProps {
  boards: Board[];
  profile: Profile;
  onCreateBoard: (format: BoardFormat, templateData?: Partial<Board>, initialNotes?: Note[]) => void;
  onSelectBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onDuplicateBoard: (boardId: string) => void;
  onToggleFavorite: (id: string) => void;
  onEmptyTrash: () => void;
  onUpdateBoard: (id: string, updates: Partial<Board>) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onJoinByCode: (code: string) => Promise<boolean>;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    boards, profile, onCreateBoard, onSelectBoard, onDeleteBoard, onDuplicateBoard, onToggleFavorite, onEmptyTrash, onUpdateBoard,
    theme, onToggleTheme, onJoinByCode
}) => {
  
  const {
      activeTab, setActiveTab,
      showJoinModal, setShowJoinModal,
      showSetupModal, setShowSetupModal,
      joinCode, setJoinCode,
      joinError, isJoining,
      handleJoinSubmit,
      isSuperAdmin, isStudent,
      selectedClass, setSelectedClass,
      classList,
      showClassMenu, setShowClassMenu,
      showProfileMenu, setShowProfileMenu,
      profileMenuRef,
      handleLogout
  } = useDashboardLogic(profile, onJoinByCode);

  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  
  const { 
      notifications, unreadCount, markAsRead, markAllRead 
  } = useNotifications(isSuperAdmin);

  const handleCreateBoardWrapper = (format: BoardFormat, templateData?: Partial<Board>, initialNotes?: Note[]) => {
      setActiveTab('home'); 
      onCreateBoard(format, templateData, initialNotes);
  };

  const handleSelectBoardWrapper = (boardId: string) => {
      onSelectBoard(boardId);
  };

  const NavButton = ({ tab, label, icon: Icon }: { tab: TabView, label: string, icon?: any }) => (
      <button onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-bold text-sm ${activeTab === tab ? 'text-pink-500 bg-pink-500/10' : (theme === 'light' ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-gray-400 hover:text-white hover:bg-white/5')}`}>
          {Icon && <Icon size={16} />}
          {label}
      </button>
  );

  return (
    <div className={`h-screen flex flex-col ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#111] text-white'} transition-colors duration-300 overflow-hidden`}>
      <SuperAdminNotifications isSuperAdmin={isSuperAdmin} />
      <div className={`h-16 border-b shrink-0 flex items-center justify-between px-4 md:px-6 relative z-50 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161616] border-white/5'}`}>
        <div className="flex items-center gap-3 md:gap-4">
            <div onClick={() => setActiveTab('home')} className="cursor-pointer flex items-center gap-3 group shrink-0">
                <div className="relative w-8 h-8 md:w-9 md:h-9 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <div className="absolute inset-0 bg-yellow-400 rounded-lg transform -rotate-12 translate-x-[-2px] border border-black/5 dark:border-white/5"></div>
                    <div className="absolute inset-0 bg-blue-500 rounded-lg transform rotate-6 translate-x-[2px] border border-black/5 dark:border-white/5"></div>
                    <div className="absolute inset-0 bg-pink-600 rounded-lg flex items-center justify-center shadow-lg border border-black/5 dark:border-white/5 z-10"><Layout size={16} className="text-white md:w-[18px] md:h-[18px]" strokeWidth={3} /></div>
                </div>
                <h1 className={`font-bold text-lg md:text-xl tracking-tight hidden sm:block ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>ClassBoards</h1>
            </div>
            {!isStudent && <div className="hidden lg:flex items-center gap-1 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-pink-500 uppercase tracking-wide shrink-0"><ShieldCheck size={10} /> {isSuperAdmin ? 'Super Admin' : 'Teacher'}</div>}
            <div className="relative group shrink-0 ml-2 sm:ml-0">
                <button onClick={() => setShowClassMenu(!showClassMenu)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border max-w-[140px] sm:max-w-none ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-200' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}>
                    {isStudent ? <GraduationCap size={12} className="shrink-0" /> : <Filter size={12} className="shrink-0" />}
                    <span className="truncate">{selectedClass}</span>
                    <ChevronDown size={12} className="opacity-50 shrink-0" />
                </button>
                {showClassMenu && <><div className="fixed inset-0 z-40" onClick={() => setShowClassMenu(false)}></div><div className="absolute top-full left-0 mt-2 w-48 z-50 animate-in fade-in slide-in-from-top-2"><div className="bg-white dark:bg-[#222] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"><div className="p-2 border-b border-gray-100 dark:border-white/5 text-[10px] font-bold text-gray-500 uppercase">{isStudent ? 'My Classes' : 'Select Class'}</div>{classList.map((cls: string) => <button key={cls} onClick={() => { setSelectedClass(cls); setShowClassMenu(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${selectedClass === cls ? 'text-pink-500 bg-pink-50 dark:bg-pink-900/10' : 'text-gray-600 dark:text-gray-300'}`}>{cls}</button>)}</div></div></>}
            </div>
        </div>
        <div className="flex items-center gap-2 md:gap-6 shrink-0">
            {!isStudent && <nav className="hidden md:flex items-center gap-1"><NavButton tab="home" label="Home" icon={HomeIcon} /><NavButton tab="make" label="Make" icon={PlusSquare} /><NavButton tab="gallery" label="Gallery" icon={ImageIcon} /><NavButton tab="admin" label="Classroom" icon={Users} />{isSuperAdmin && <NavButton tab="system" label="System" icon={Activity} />}</nav>}
            {!isStudent && <div className="h-6 w-px bg-gray-200 dark:bg-white/10 hidden md:block"></div>}
            <Tooltip content="Documentation & Guide"><button onClick={() => setActiveTab('documentation')} className={`p-2 rounded-full transition-colors hidden md:block ${activeTab === 'documentation' ? 'bg-pink-500/20 text-pink-500' : (theme === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white')}`}><BookOpen size={20} /></button></Tooltip>
            {isSuperAdmin && <div className="relative"><Tooltip content="Notifications"><button onClick={() => setShowNotificationMenu(!showNotificationMenu)} className={`p-2 rounded-full transition-colors hidden md:block relative ${showNotificationMenu ? 'bg-pink-500/20 text-pink-500' : (theme === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white')}`}><Bell size={20} />{unreadCount > 0 && <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1a1a]"></div>}</button></Tooltip>{showNotificationMenu && <><div className="fixed inset-0 z-40" onClick={() => setShowNotificationMenu(false)}></div><div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#222] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50"><div className="p-3 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1a1a1a] flex justify-between items-center"><h4 className="font-bold text-sm text-gray-800 dark:text-white">Notifications</h4>{unreadCount > 0 && <button onClick={markAllRead} className="text-[10px] text-blue-500 hover:underline font-bold">Mark all read</button>}</div><div className="max-h-[300px] overflow-y-auto custom-scrollbar">{notifications.length === 0 ? <div className="p-6 text-center text-gray-500 text-xs">No notifications yet.</div> : (notifications as any[]).map((n: any) => <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-3 border-b border-gray-100 dark:border-white/5 flex gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}><Avatar src={n.content.avatar} name={n.content.name || 'User'} size="sm" /><div className="flex-1 min-w-0"><p className="text-xs text-gray-800 dark:text-white"><span className="font-bold">{n.content.name || 'Unknown User'}</span> joined!</p><p className="text-[10px] text-gray-500 truncate">{n.content.email}</p><p className="text-[9px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p></div>{!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"></div>}</div>)}</div></div></>}
                </div>}
            <Tooltip content={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}><button onClick={onToggleTheme} className={`p-2 rounded-full transition-colors hidden md:block ${theme === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button></Tooltip>
            <div className="relative" ref={profileMenuRef as React.RefObject<HTMLDivElement>}>
                <Tooltip content={profile.fullName} position="left"><div onClick={() => setShowProfileMenu(!showProfileMenu)} className={`w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 cursor-pointer shrink-0 hover:scale-105 transition-transform ${theme === 'light' ? 'border-slate-200' : 'border-[#111]'}`}>{profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">{profile.fullName.substring(0, 2).toUpperCase()}</div>}</div></Tooltip>
                {showProfileMenu && <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#222] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50"><div className="p-3 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1a1a1a]"><p className="font-bold text-sm truncate text-gray-800 dark:text-white">{profile.fullName}</p><div className="flex flex-col gap-1 mt-1"><span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit ${isStudent ? 'bg-blue-500/20 text-blue-400' : (isSuperAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400')}`}>{isStudent ? 'Student' : (isSuperAdmin ? 'Super Admin' : 'Teacher')}</span><span className="text-[10px] text-gray-500 truncate" title={profile.email}>{profile.email || 'No Email'}</span></div></div><div className="p-1"><button onClick={onToggleTheme} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg md:hidden flex items-center gap-2">{theme === 'dark' ? <><Sun size={14}/> Light Mode</> : <><Moon size={14}/> Dark Mode</>}</button><button onClick={() => { setActiveTab('documentation'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg md:hidden flex items-center gap-2"><BookOpen size={14} /> Documentation</button><button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 font-bold transition-colors"><LogOut size={14} /> Sign Out</button></div></div>}
            </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative pb-20 md:pb-0">
          {activeTab === 'home' && <Home boards={boards} studentClasses={classList} onSelectBoard={handleSelectBoardWrapper} onDeleteBoard={onDeleteBoard} onDuplicateBoard={onDuplicateBoard} onToggleFavorite={onToggleFavorite} onEmptyTrash={onEmptyTrash} onJoinBoard={() => setShowJoinModal(true)} onNavigateToMake={() => setActiveTab('make')} onOpenSetup={() => setShowSetupModal(true)} onUpdateBoard={onUpdateBoard} profile={profile} theme={theme} isSuperAdmin={isSuperAdmin} isStudent={isStudent} selectedClass={selectedClass} />}
          {activeTab === 'make' && <div className="h-full w-full overflow-y-auto custom-scrollbar relative"><Make onCreateBoard={handleCreateBoardWrapper} theme={theme} /></div>}
          {activeTab === 'gallery' && <div className="h-full w-full overflow-y-auto custom-scrollbar relative"><Gallery onCreateBoard={handleCreateBoardWrapper} theme={theme} /></div>}
          {activeTab === 'admin' && !isStudent && <div className="h-full w-full overflow-y-auto custom-scrollbar relative"><AdminDashboard boards={boards} theme={theme} selectedClass={selectedClass} onSelectBoard={handleSelectBoardWrapper}/></div>}
          {activeTab === 'system' && isSuperAdmin && <div className="h-full w-full overflow-y-auto custom-scrollbar relative p-6 md:p-10"><div className="max-w-6xl mx-auto"><SystemDashboard theme={theme} /></div></div>}
          {activeTab === 'documentation' && <Documentation role={isSuperAdmin ? 'superadmin' : (isStudent ? 'student' : 'teacher')} onBack={() => setActiveTab('home')} theme={theme} />}
      </div>
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex items-center justify-around ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0a0a0a] border-white/10'}`}>
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'home' ? 'text-pink-500' : 'text-gray-500'}`}><HomeIcon size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} /><span className="text-[10px] font-medium">Home</span></button>
          <button onClick={() => setShowJoinModal(true)} className={`flex flex-col items-center justify-center w-full h-full gap-1 text-gray-500`}><Hash size={20} strokeWidth={2} /><span className="text-[10px] font-medium">Join</span></button>
          {!isStudent && <><button onClick={() => setActiveTab('make')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'make' ? 'text-pink-500' : 'text-gray-500'}`}><PlusSquare size={20} strokeWidth={activeTab === 'make' ? 2.5 : 2} /><span className="text-[10px] font-medium">Make</span></button><button onClick={() => setActiveTab('gallery')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'gallery' ? 'text-pink-500' : 'text-gray-500'}`}><ImageIcon size={20} strokeWidth={activeTab === 'gallery' ? 2.5 : 2} /><span className="text-[10px] font-medium">Gallery</span></button><button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'admin' ? 'text-pink-500' : 'text-gray-500'}`}><Users size={20} strokeWidth={activeTab === 'admin' ? 2.5 : 2} /><span className="text-[10px] font-medium">Admin</span></button></>}
      </div>
      {showJoinModal && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"><div className="bg-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-md border border-white/10 p-6"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">Join a ClassBoard</h3><button onClick={() => setShowJoinModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button></div><form onSubmit={handleJoinSubmit} className="space-y-4"><div><label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Join Code</label><input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} placeholder="e.g. A3F9X2" className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white text-lg tracking-widest font-mono text-center focus:border-pink-500 outline-none" autoFocus/>{joinError && <p className="text-red-500 text-xs mt-2">{joinError}</p>}</div><button type="submit" disabled={!joinCode || isJoining} className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">{isJoining && <Activity size={16} className="animate-spin" />} {isJoining ? 'Joining...' : 'Join'}</button></form></div></div>}
      {!isStudent && <SetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} onCreateBoard={onCreateBoard} />}
    </div>
  );
};
