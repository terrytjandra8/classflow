
import React, { useState, useMemo } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { UserDirectory } from './UserDirectory';
import { DataManagement } from './DataManagement';
import { ImageManager } from './ImageManager';
import { LandingPageManager } from './LandingPageManager';
import { ConfirmModal } from '../ConfirmModal';
import { 
    Loader2, Users, HardDrive, ShieldCheck, Activity, UserPlus, 
    Clock, Layout, Database, Settings, Menu, X, ChevronRight,
    PieChart, BarChart3
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface SystemDashboardProps {
    theme: 'light' | 'dark';
}

type AdminTab = 'overview' | 'users' | 'landing' | 'storage' | 'data';

export const SystemDashboard: React.FC<SystemDashboardProps> = ({ theme }) => {
    const { 
        loading, students: allProfiles, storageStats, onlineUserIds, 
        updateUserRole, updateStudentClasses, classes, refresh 
    } = useAdminData('global');

    const [activeTab, setActiveTabState] = useState<AdminTab>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- Sub-routing Logic ---
    const setActiveTab = (tab: AdminTab) => {
        setActiveTabState(tab);
        window.location.hash = `#/system/${tab}`;
    };

    React.useEffect(() => {
        const syncTabFromHash = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#/system/')) {
                const subTab = hash.replace('#/system/', '') as AdminTab;
                const validTabs: AdminTab[] = ['overview', 'users', 'landing', 'storage', 'data'];
                if (validTabs.includes(subTab) && subTab !== activeTab) {
                    setActiveTabState(subTab);
                }
            } else if (hash === '#/system') {
                // Default to overview if on /system
                window.location.hash = '#/system/overview';
            }
        };

        window.addEventListener('hashchange', syncTabFromHash);
        syncTabFromHash(); // Initial sync

        return () => window.removeEventListener('hashchange', syncTabFromHash);
    }, [activeTab]);
    
    const [confirmModal, setConfirmModal] = useState<{ 
        isOpen: boolean; 
        type: 'promote' | 'demote'; 
        id: string | null; 
        name?: string; 
    }>({ isOpen: false, type: 'promote', id: null });

    const totalTeachers = allProfiles.filter(s => s.role === 'teacher').length;
    const totalStudents = allProfiles.filter(s => s.role === 'student').length;
    const recentUsers = [...allProfiles].sort((a: any, b: any) => 
        (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0)
    ).slice(0, 50);

    const totalStorageBytes = Object.values(storageStats).reduce<number>((acc, curr: any) => acc + (curr.bytes || 0), 0);
    const formatBytes = (bytes: number) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const openConfirmModal = (type: 'promote' | 'demote', id: string) => {
        const user = allProfiles.find(s => s.id === id);
        setConfirmModal({ isOpen: true, type, id, name: user?.full_name || 'this user' });
    };

    const handleConfirmAction = async () => {
        const { type, id } = confirmModal;
        if (id) await updateUserRole(id, type === 'promote' ? 'teacher' : 'student');
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const tabs = [
        { id: 'overview' as const, label: 'Overview', icon: PieChart, color: 'text-blue-500' },
        { id: 'users' as const, label: 'User Directory', icon: Users, color: 'text-purple-500' },
        { id: 'landing' as const, label: 'Landing Page', icon: Layout, color: 'text-pink-500' },
        { id: 'storage' as const, label: 'Storage & Assets', icon: HardDrive, color: 'text-orange-500' },
        { id: 'data' as const, label: 'System Ops', icon: Database, color: 'text-green-500' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="animate-spin text-pink-500" size={32} />
            </div>
        );
    }

    const NavItem = ({ tab }: { tab: typeof tabs[0] }) => {
        const isActive = activeTab === tab.id;
        return (
            <button
                onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                    isActive 
                    ? (theme === 'light' ? 'bg-pink-50 text-pink-600' : 'bg-pink-500/10 text-pink-500 border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.1)]')
                    : (theme === 'light' ? 'text-gray-600 hover:bg-slate-50' : 'text-gray-400 hover:bg-white/5')
                }`}
            >
                <div className="flex items-center gap-3">
                    <tab.icon size={18} className={isActive ? 'text-pink-500' : 'text-gray-400 group-hover:text-pink-400'} />
                    <span className="text-sm font-bold">{tab.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="animate-in slide-in-from-left-2" />}
            </button>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh]">
            {/* Mobile Header & Navbar */}
            <div className="lg:hidden flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className={`text-2xl font-black ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>System Dashboard</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                            <ShieldCheck size={10} className="text-purple-500" /> SuperAdmin Portal
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`p-2 rounded-lg ${theme === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Scrollable Tabs */}
                <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${
                                activeTab === tab.id
                                ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-500/20'
                                : (theme === 'light' ? 'bg-white border-slate-200 text-gray-500' : 'bg-white/5 border-white/5 text-gray-400')
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 shrink-0">
                <div className="sticky top-8 space-y-6">
                    <div>
                        <h2 className={`text-2xl font-black ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>System</h2>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Monitor</span>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {tabs.map(tab => <NavItem key={tab.id} tab={tab} />)}
                    </nav>

                    <div className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={14} className="text-purple-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Privileged Access</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                            Authorized personnel only. All actions are logged for security audits.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard theme={theme} title="Teachers" val={totalTeachers} icon={ShieldCheck} color="purple" />
                                <StatCard theme={theme} title="Students" val={totalStudents} icon={Users} color="blue" />
                                <StatCard theme={theme} title="Storage" val={formatBytes(totalStorageBytes)} icon={HardDrive} color="orange" progress={15} />
                            </div>

                            <div className={`rounded-2xl border overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                                <div className="p-5 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-transparent to-pink-500/5">
                                    <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                        <UserPlus size={16} className="text-green-500" /> Recent Registrations
                                    </h3>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Last 50 Users</span>
                                </div>
                                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {recentUsers.map((user: any) => (
                                        <RecentUserRow key={user.id} user={user} isOnline={onlineUserIds.has(user.id)} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className={`text-2xl font-black ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>User Directory</h3>
                            </div>
                            <UserDirectory 
                                theme={theme}
                                users={allProfiles}
                                classes={classes}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                onPromote={(id) => openConfirmModal('promote', id)}
                                onDemote={(id) => openConfirmModal('demote', id)}
                                onUpdateClasses={updateStudentClasses}
                                storageStats={storageStats}
                                onlineUserIds={onlineUserIds}
                            />
                        </div>
                    )}

                    {activeTab === 'landing' && <LandingPageManager theme={theme} />}
                    
                    {activeTab === 'storage' && (
                        <div className="space-y-6">
                             <div className="flex items-center justify-between mb-2">
                                <h3 className={`text-2xl font-black ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Storage Management</h3>
                            </div>
                            <ImageManager />
                        </div>
                    )}

                    {activeTab === 'data' && <DataManagement theme={theme} onRefresh={refresh} />}
                </div>
            </main>

            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmModal.type === 'promote' ? "Promote User?" : "Demote Staff?"}
                message={
                    confirmModal.type === 'promote' 
                    ? `Are you sure you want to promote ${confirmModal.name} to Teacher? They will gain access to teacher controls.`
                    : `Are you sure you want to demote ${confirmModal.name} to Student? They will lose access to teacher controls.`
                }
                confirmText={confirmModal.type === 'promote' ? "Promote" : "Demote"}
                isDangerous={confirmModal.type === 'demote'}
            />
        </div>
    );
};

const StatCard = ({ theme, title, val, icon: Icon, color, progress }: any) => {
    const colors: any = {
        purple: 'bg-purple-500/10 text-purple-500',
        blue: 'bg-blue-500/10 text-blue-500',
        orange: 'bg-orange-500/10 text-orange-500'
    };
    return (
        <div className={`p-6 rounded-2xl border flex flex-col justify-between h-36 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5 shadow-xl'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</p>
                    <h3 className="text-3xl font-black mt-1">{val}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colors[color]}`}><Icon size={24}/></div>
            </div>
            {progress && (
                <div className="w-full bg-gray-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            )}
        </div>
    );
};

const RecentUserRow = ({ user, isOnline }: any) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
        <div className="flex items-center gap-3">
            <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
            <div>
                <p className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    {user.full_name}
                    {isOnline && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online now"></div>}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">{user.email}</p>
            </div>
        </div>
        <div className="text-right">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${user.role === 'teacher' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                {user.role}
            </span>
            <div className="text-[9px] text-gray-400 mt-1.5 flex items-center gap-1 justify-end font-medium">
                <Clock size={10} /> {new Date(user.created_at).toLocaleDateString()}
            </div>
        </div>
    </div>
);

