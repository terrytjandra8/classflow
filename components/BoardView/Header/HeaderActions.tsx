
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MonitorPlay, Settings, Share2, Layout, MoreVertical, Eye, Radio } from 'lucide-react';
import { useHeaderLogic } from './useHeaderLogic';
import { Tooltip } from '../../Tooltip';
import { Avatar } from '../../ui/Avatar';
import { BoardFormat } from '../../../types';
import { IconVisible } from '../../Icons'; 
import { useBoard } from '../BoardContext';

const HeaderButton = ({ icon: Icon, label, onClick, ...props }: any) => (
    <button 
        onClick={onClick} 
        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md font-medium text-gray-300 hover:bg-white/10 transition-colors"
        {...props}
    >
        <Icon size={16} />
        <span>{label}</span>
    </button>
);

export const HeaderActions: React.FC = () => {
    const {
        board, canManageBoard, isSimulatingStudent, toggleStudentSimulation, 
        openSettings, openShare, onlineUsers, updateBoard, launchProjectorMode,
        activeCount, userPreviews, typingUsers, userId
    } = useHeaderLogic();
    const { embeddedMode } = useBoard();

    const [showUserList, setShowUserList] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
    const userListRef = useRef<HTMLDivElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const layoutMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userListRef.current && !userListRef.current.contains(event.target as Node)) {
                setShowUserList(false);
            }
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setIsMoreMenuOpen(false);
            }
            if (layoutMenuRef.current && !layoutMenuRef.current.contains(event.target as Node)) {
                setIsLayoutMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortedOnlineUsers = useMemo(() => {
        if (!onlineUsers) return [];
        return [...onlineUsers].sort((a, b) => {
            if (a.id === userId) return -1;
            if (b.id === userId) return 1;
            return (a.user || '').localeCompare(b.user || '');
        });
    }, [onlineUsers, userId]);

    const MoreMenu = () => (
        <div ref={moreMenuRef} className="absolute top-full right-0 mt-2 w-56 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
            {canManageBoard && (
                 <>
                    <HeaderButton onClick={() => { toggleStudentSimulation(); setIsMoreMenuOpen(false); }} icon={IconVisible} label={isSimulatingStudent ? "Exit Student View" : "View as Student"} />
                    {!embeddedMode && (
                        <>
                            <HeaderButton onClick={() => { launchProjectorMode(); setIsMoreMenuOpen(false); }} icon={MonitorPlay} label="Projector Mode" />
                            <HeaderButton onClick={() => { openSettings(); setIsMoreMenuOpen(false); }} icon={Settings} label="Board Settings" />
                        </>
                    )}
                 </>
            )}
        </div>
    );

    return (
        <div className="flex items-center gap-3 pointer-events-auto shrink-0">
            {typingUsers && typingUsers.length > 0 && (
                <div className="flex items-center gap-2 bg-pink-500 text-white px-4 py-1.5 rounded-full animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg shadow-pink-500/30 border border-pink-400">
                    <div className="flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">
                        {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} typing...`}
                    </span>
                </div>
            )}

            <div className="relative" ref={userListRef}>
                <div 
                    onClick={() => setShowUserList(!showUserList)}
                    className={`flex items-center gap-3 pl-2 pr-4 py-2 bg-black/40 backdrop-blur-xl rounded-full border shadow-lg cursor-pointer transition-all ${showUserList ? 'border-white/30 bg-black/60' : 'border-white/10 hover:bg-black/60'}`}
                >
                    <div className="flex -space-x-3">
                        {userPreviews.map((user: any, i: number) => (
                            <div key={i} className="relative z-10 transition-transform">
                                <Avatar src={user.avatar} name={user.user} size="sm" className="ring-2 ring-[#1a1a1a] shadow-md" />
                            </div>
                        ))}
                        {activeCount > 10 && (
                            <div className="relative z-10 w-7 h-7 rounded-full bg-[#333] flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[#1a1a1a]">
                                +{activeCount - 10}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 ml-1">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        </span>
                        <span className="text-sm font-bold text-white tabular-nums">{activeCount}</span>
                    </div>
                </div>

                {showUserList && (
                    <div className="absolute top-full right-0 mt-3 w-64 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 z-50">
                        <div className="px-3 py-2 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex justify-between items-center">
                            <span>Active Users</span>
                            <button onClick={() => setShowUserList(false)} className="text-gray-500 hover:text-white">Close</button>
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                            {sortedOnlineUsers.map((u: any, i: number) => (
                                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${u.id === userId ? 'bg-green-500/10 border border-green-500/20' : 'hover:bg-white/5'}`}>
                                    <Avatar src={u.avatar} name={u.user} size="xs" />
                                    <span className={`text-xs font-medium truncate ${u.id === userId ? 'text-green-400 font-bold' : 'text-gray-200'}`}>{u.user}</span>
                                    {u.id === userId && <span className="ml-auto text-[9px] font-bold text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded">YOU</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- Desktop Control Bar --- */}
            <div className="hidden md:flex items-center gap-1.5 bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                 {canManageBoard && (
                    <div className="relative" ref={layoutMenuRef}>
                        <button 
                            onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)}
                            className={`p-2.5 rounded-xl transition-colors flex items-center gap-2 ${isLayoutMenuOpen ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                        >
                            <Layout size={18} />
                        </button>
                        {isLayoutMenuOpen && (
                            <div className="absolute top-full right-0 mt-3 w-36 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                                {['wall', 'grid', 'canvas', 'columns', 'stream'].map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => { updateBoard({ format: fmt as BoardFormat }); setIsLayoutMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-white/10 transition-colors capitalize flex items-center gap-2 ${board.format === fmt ? 'bg-white/10 text-white font-bold' : 'text-gray-400'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${board.format === fmt ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-transparent'}`}></div>
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {(canManageBoard || isSimulatingStudent) && (
                    <Tooltip content={isSimulatingStudent ? "Exit Student View" : "View as Student"}>
                        <button onClick={toggleStudentSimulation} className={`p-2.5 rounded-xl transition-all duration-300 ${isSimulatingStudent ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                            <IconVisible size={18} />
                        </button>
                    </Tooltip>
                )}
                {!embeddedMode && canManageBoard && (
                    <>
                        <Tooltip content="Launch Projector Mode">
                            <button onClick={launchProjectorMode} className="p-2.5 rounded-xl text-gray-300 hover:text-green-400 hover:bg-white/10 transition-colors"><MonitorPlay size={18} /></button>
                        </Tooltip>
                        <Tooltip content="Settings">
                            <button onClick={openSettings} className="p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"><Settings size={18} /></button>
                        </Tooltip>
                    </>
                )}
                {!embeddedMode && canManageBoard && (
                    <Tooltip content="Share">
                        <button onClick={openShare} className="p-2.5 rounded-xl text-white bg-gradient-to-tr from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-900/20 transition-all transform hover:scale-105 active:scale-95">
                            <Share2 size={18} strokeWidth={2.5} />
                        </button>
                    </Tooltip>
                )}
            </div>

            {/* --- Mobile Control Bar --- */}
            <div className="flex md:hidden items-center gap-2 bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                {canManageBoard && (
                    <Tooltip content="Share">
                        <button onClick={openShare} className="p-2.5 rounded-xl text-white bg-gradient-to-tr from-pink-600 to-purple-600"><Share2 size={18} strokeWidth={2.5} /></button>
                    </Tooltip>
                )}
                <div className="relative">
                     <Tooltip content="More options">
                        <button onClick={() => setIsMoreMenuOpen(true)} className="p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"><MoreVertical size={18} /></button>
                    </Tooltip>
                    {isMoreMenuOpen && <MoreMenu />}
                </div>
            </div>
        </div>
    );
};