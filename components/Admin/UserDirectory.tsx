
import React, { useState } from 'react';
import { 
    Search, Shield, User, ArrowUpCircle, ArrowDownCircle, HardDrive, 
    Filter, ShieldCheck, Mail, ArrowDownWideNarrow, ArrowUpNarrowWide, 
    Merge, Plus, X 
} from 'lucide-react';
import { MergeModal } from './MergeModal';
import { adminService } from '../../services/adminService';

interface UserDirectoryProps {
    theme: 'light' | 'dark';
    users: any[];
    classes: any[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onPromote: (id: string) => void;
    onDemote: (id: string) => void;
    onUpdateClasses: (id: string, classIds: string[]) => Promise<void>;
    storageStats?: Record<string, { bytes: number; items: number; boards: number }>;
    onlineUserIds: Set<string>; 
}

export const UserDirectory: React.FC<UserDirectoryProps> = ({ 
    theme, users, classes, searchTerm, setSearchTerm, onPromote, onDemote, onUpdateClasses, storageStats, onlineUserIds
}) => {
    const [filterRole, setFilterRole] = useState<'all' | 'teacher' | 'student'>('all');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'newest'>('newest');
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const formatBytes = (bytes: number) => {
        if (!+bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const handleClassToggle = async (userId: string, classIdOrName: string, currentClasses: string[]) => {
        setUpdatingUserId(userId);
        let nextClasses = [...(currentClasses || [])];
        if (nextClasses.includes(classIdOrName)) {
            nextClasses = nextClasses.filter(id => id !== classIdOrName);
        } else {
            nextClasses.push(classIdOrName);
        }
        await onUpdateClasses(userId, nextClasses);
        setUpdatingUserId(null);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const userClasses = user.enrolled_classes || [];
        const matchesClass = filterClass === 'all' || userClasses.includes(filterClass);
        return matchesSearch && matchesRole && matchesClass;
    }).sort((a, b) => {
        if (sortBy === 'newest') {
            return (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0);
        }
        return (a.full_name || '').localeCompare(b.full_name || '');
    });

    const handleMerge = async (oldId: string, newId: string) => {
        try {
            await adminService.mergeUsers(oldId, newId);
            setIsMergeModalOpen(false);
            window.location.reload(); 
        } catch (e) {
            console.error(e);
            alert("Merge failed. See console.");
        }
    };

    return (
        <div className={`rounded-xl border overflow-hidden animate-fade-in ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-white/5 flex flex-col gap-4">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div className="relative w-full md:w-auto flex-1 max-w-md">
                         <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                         <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-transparent border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-blue-500 w-full"
                         />
                     </div>
                     
                     <div className="flex flex-wrap items-center gap-2">
                         <button 
                            onClick={() => setIsMergeModalOpen(true)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-lg mr-2"
                         >
                             <Merge size={14} /> Merge Users
                         </button>

                         {/* Class Filter */}
                         <div className="relative group/class-filter">
                             <button className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-gray-300'}`}>
                                 <Filter size={12} />
                                 {filterClass === 'all' ? 'All Classes' : filterClass}
                             </button>
                             <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-2xl z-[60] opacity-0 invisible group-hover/class-filter:opacity-100 group-hover/class-filter:visible transition-all duration-200 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#222] border-white/10'}`}>
                                 <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                     <button onClick={() => setFilterClass('all')} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold mb-0.5 ${filterClass === 'all' ? 'bg-blue-600 text-white' : (theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5')}`}>All Classes</button>
                                     {classes.map(cls => (
                                         <button key={cls.id} onClick={() => setFilterClass(cls.name)} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold ${filterClass === cls.name ? 'bg-blue-600 text-white' : (theme === 'light' ? 'hover:bg-slate-50 text-gray-400' : 'hover:bg-white/5 text-gray-400')}`}>{cls.name}</button>
                                     ))}
                                 </div>
                             </div>
                         </div>

                         {/* Sort Toggle */}
                         <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1 mr-2">
                             <button
                                onClick={() => setSortBy('newest')}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${sortBy === 'newest' ? 'bg-white dark:bg-[#333] shadow text-black dark:text-white' : 'text-gray-500'}`}
                                title="Newest First"
                             >
                                 <ArrowDownWideNarrow size={12}/> Newest
                             </button>
                             <button
                                onClick={() => setSortBy('name')}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${sortBy === 'name' ? 'bg-white dark:bg-[#333] shadow text-black dark:text-white' : 'text-gray-500'}`}
                                title="Alphabetical"
                             >
                                 <ArrowUpNarrowWide size={12}/> A-Z
                             </button>
                         </div>

                         <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-lg shrink-0">
                             <button 
                                onClick={() => setFilterRole('all')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterRole === 'all' ? 'bg-white dark:bg-[#333] shadow text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                             >
                                 All
                             </button>
                             <button 
                                onClick={() => setFilterRole('teacher')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${filterRole === 'teacher' ? 'bg-white dark:bg-[#333] shadow text-pink-600 dark:text-pink-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                             >
                                 <ShieldCheck size={12} /> Teachers
                             </button>
                             <button 
                                onClick={() => setFilterRole('student')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${filterRole === 'student' ? 'bg-white dark:bg-[#333] shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                             >
                                 <User size={12} /> Students
                             </button>
                         </div>
                     </div>
                 </div>
            </div>

            <div className="overflow-x-auto min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className={`text-xs uppercase font-bold text-gray-500 border-b sticky top-0 z-10 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Class Groups</th>
                            <th className="px-6 py-4">Storage</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-12 text-gray-500">No users found.</td></tr>
                        ) : (
                            filteredUsers.map((user) => {
                                const stats = storageStats?.[user.id] || { bytes: 0, items: 0, boards: 0 };
                                const isTeacher = user.role === 'teacher';
                                const isOnline = onlineUserIds.has(user.id);
                                const isRecovered = (user.full_name || '').includes('(Recovered)');
                                const userClasses = user.enrolled_classes || [];

                                return (
                                <tr key={user.id} className={`group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isRecovered ? 'bg-yellow-500/5' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden border-2 ${isTeacher ? 'bg-pink-600 text-white border-pink-400' : 'bg-blue-500 text-white border-blue-400'}`}>
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        user.full_name?.substring(0,2).toUpperCase() || '?'
                                                    )}
                                                </div>
                                                {isOnline && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1a1a1a] animate-pulse"></div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    {user.full_name}
                                                    {isOnline && <span className="text-[9px] bg-green-500/10 text-green-500 px-1.5 rounded border border-green-500/20 font-bold uppercase">Online</span>}
                                                    {isRecovered && <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-1.5 rounded border border-yellow-500/20 font-bold uppercase">Recovered</span>}
                                                </span>
                                                <span className="text-[10px] text-gray-500 flex items-center gap-1"><Mail size={10}/> {user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${isTeacher ? 'bg-pink-500/10 text-pink-600 border-pink-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                                            {isTeacher ? <ShieldCheck size={12}/> : <User size={12}/>}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center -space-x-1 hover:space-x-1 transition-all duration-300 group/stack max-w-[200px] flex-wrap">
                                            {/* Currently Enrolled Classes (Compact Initials) */}
                                            {userClasses.slice(0, 5).map((classIdOrName: string) => {
                                                const cls = classes.find(c => c.id === classIdOrName || c.name === classIdOrName);
                                                if (!cls) return null;
                                                const initials = cls.name.substring(0, 2).toUpperCase();
                                                return (
                                                    <div 
                                                        key={cls.id}
                                                        className="relative group/cls"
                                                    >
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all cursor-default shadow-sm ${theme === 'light' ? 'bg-white border-slate-100 text-blue-600 hover:z-10 hover:scale-110' : 'bg-[#222] border-white/5 text-blue-400 hover:z-10 hover:scale-110'}`}>
                                                            {initials}
                                                        </div>
                                                        
                                                        {/* Hover Tooltip/Label */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover/cls:opacity-100 group-hover/cls:visible transition-all z-50">
                                                            <div className={`px-2 py-1 rounded-lg border shadow-xl flex items-center gap-2 whitespace-nowrap ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/10'}`}>
                                                                <span className="text-[10px] font-black uppercase text-gray-500">{cls.name}</span>
                                                                <button 
                                                                    onClick={() => handleClassToggle(user.id, cls.name, userClasses)}
                                                                    className="text-red-500 hover:scale-125 transition-transform"
                                                                >
                                                                    <X size={10} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {userClasses.length > 5 && (
                                                <div className="relative group/more">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedUserId(expandedUserId === user.id ? null : user.id);
                                                        }}
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all hover:scale-110 active:scale-95 ${theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white/5 border-white/5 text-gray-500'}`}
                                                    >
                                                        +{userClasses.length - 5}
                                                    </button>
                                                    
                                                    {/* Full List Popover */}
                                                    <div className={`absolute bottom-full left-0 mb-2 w-52 p-2 rounded-xl border shadow-2xl z-50 transition-all duration-200 transform origin-bottom-left ${expandedUserId === user.id ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'} ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1e1e1e] border-white/10'}`}>
                                                        <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 px-1 mb-1">All Enrolled Classes</p>
                                                            {userClasses.map((classIdOrName: string) => {
                                                                const cls = classes.find(c => c.id === classIdOrName || c.name === classIdOrName);
                                                                if (!cls) return null;
                                                                return (
                                                                    <div key={cls.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                                                        <span className="text-[10px] font-bold text-blue-500">{cls.name}</span>
                                                                        <button onClick={() => handleClassToggle(user.id, cls.name, userClasses)} className="text-red-500 hover:scale-110 transition-transform"><X size={10}/></button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unified Add Button */}
                                            <div className="relative group/add ml-2">
                                                <button 
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center border border-dashed transition-all hover:scale-110 active:scale-95 ${theme === 'light' ? 'border-slate-300 text-slate-400 hover:border-blue-500 hover:text-blue-500' : 'border-white/10 text-white/20 hover:border-blue-500/50 hover:text-blue-400'}`}
                                                >
                                                    <Plus size={12} />
                                                </button>
                                                
                                                {/* Simple Dropdown */}
                                                <div className={`absolute left-0 top-full mt-2 w-48 rounded-xl border shadow-2xl z-50 opacity-0 invisible group-hover/add:opacity-100 group-hover/add:visible transition-all duration-200 transform origin-top-left scale-95 group-hover/add:scale-100 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1e1e1e] border-white/10'}`}>
                                                    <div className="p-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                        {classes.filter(cls => !userClasses.includes(cls.id) && !userClasses.includes(cls.name)).map(cls => (
                                                            <button
                                                                key={cls.id}
                                                                onClick={() => handleClassToggle(user.id, cls.name, userClasses)}
                                                                className={`w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between group/item ${theme === 'light' ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-white/5 text-gray-300'}`}
                                                            >
                                                                {cls.name}
                                                                <Plus size={10} className="text-blue-500 opacity-0 group-hover/item:opacity-100" />
                                                            </button>
                                                        ))}
                                                        {classes.filter(cls => !userClasses.includes(cls.id) && !userClasses.includes(cls.name)).length === 0 && (
                                                            <p className="text-[9px] text-gray-500 font-bold p-2 text-center">In all classes</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400">
                                                <HardDrive size={12} />
                                                {formatBytes(stats.bytes)}
                                            </div>
                                            <span className="text-[9px] text-gray-400">{stats.boards} Boards • {stats.items} Items</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isTeacher ? (
                                            <button 
                                                onClick={() => onDemote(user.id)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-all border border-red-500/20"
                                            >
                                                <ArrowDownCircle size={14} /> Demote
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => onPromote(user.id)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white rounded-lg text-xs font-bold transition-all border border-green-500/20"
                                            >
                                                <ArrowUpCircle size={14} /> Promote
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>

            <MergeModal 
                isOpen={isMergeModalOpen}
                onClose={() => setIsMergeModalOpen(false)}
                users={users}
                onConfirm={handleMerge}
            />
        </div>
    );
};
