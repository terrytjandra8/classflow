
import React, { useState, useMemo } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { UserDirectory } from './UserDirectory';
import { DataManagement } from './DataManagement';
import { ImageManager } from './ImageManager';
import { ConfirmModal } from '../ConfirmModal';
import { Loader2, Users, HardDrive, ShieldCheck, Activity, UserPlus, Clock } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface SystemDashboardProps {
    theme: 'light' | 'dark';
}

export const SystemDashboard: React.FC<SystemDashboardProps> = ({ theme }) => {
    // Use 'global' scope to see ALL users and stats for system administration
    const { 
        loading, students: allProfiles, storageStats, onlineUserIds, updateUserRole, refresh 
    } = useAdminData('global');

    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState<{ 
        isOpen: boolean; 
        type: 'promote' | 'demote'; 
        id: string | null; 
        name?: string; 
    }>({ 
        isOpen: false, 
        type: 'promote', 
        id: null 
    });

    const totalTeachers = allProfiles.filter(s => s.role === 'teacher').length;
    const totalStudents = allProfiles.filter(s => s.role === 'student').length;
    
    // Recent Users (last 50, sorted by date)
    const recentUsers = [...allProfiles].sort((a: any, b: any) => {
        return (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0);
    }).slice(0, 50);

    // Aggregated Storage
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
        setConfirmModal({ 
            isOpen: true, 
            type, 
            id, 
            name: user?.full_name || 'this user' 
        });
    };

    const handleConfirmAction = async () => {
        const { type, id } = confirmModal;
        if (id) {
            await updateUserRole(id, type === 'promote' ? 'teacher' : 'student');
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="animate-spin text-pink-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3">
                    <h2 className={`text-3xl font-bold mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        System Monitor
                    </h2>
                    <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 uppercase tracking-wide">
                        <ShieldCheck size={12} /> Super Admin
                    </span>
                </div>
                <p className="text-gray-500 text-sm">Oversee school usage, manage teacher accounts, and handle data backups.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-6 rounded-2xl border flex flex-col justify-between h-32 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Active Teachers</p>
                            <h3 className="text-3xl font-bold mt-1">{totalTeachers}</h3>
                        </div>
                        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl"><ShieldCheck size={24}/></div>
                    </div>
                </div>
                <div className={`p-6 rounded-2xl border flex flex-col justify-between h-32 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Total Students</p>
                            <h3 className="text-3xl font-bold mt-1">{totalStudents}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Users size={24}/></div>
                    </div>
                </div>
                <div className={`p-6 rounded-2xl border flex flex-col justify-between h-32 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">System Storage</p>
                            <h3 className="text-3xl font-bold mt-1">{formatBytes(totalStorageBytes)}</h3>
                        </div>
                        <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl"><HardDrive size={24}/></div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: '15%' }}></div>
                    </div>
                </div>
            </div>

            {/* Recent Registrations Table */}
            <div className={`rounded-xl border overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <UserPlus size={16} className="text-green-500" /> Recent Registrations
                    </h3>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Last 50 Users</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {recentUsers.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        {user.full_name}
                                        {onlineUserIds.has(user.id) && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online now"></div>}
                                    </p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${user.role === 'teacher' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                    {user.role}
                                </span>
                                <div className="text-[9px] text-gray-400 mt-1 flex items-center gap-1 justify-end">
                                    <Clock size={10} /> {new Date(user.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Directory (Replaces Teacher Monitor) */}
            <div className="space-y-4">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                    <Activity size={20} className="text-pink-500" /> User Directory
                </h3>
                <UserDirectory 
                    theme={theme}
                    users={allProfiles}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onPromote={(id) => openConfirmModal('promote', id)}
                    onDemote={(id) => openConfirmModal('demote', id)}
                    storageStats={storageStats}
                    onlineUserIds={onlineUserIds} // Pass presence data
                />
            </div>

            {/* Data Ops */}
            <div className="space-y-4 pt-4 border-t border-white/5">
                <DataManagement theme={theme} onRefresh={refresh} />
            </div>

            {/* Storage Ops */}
            <div className="space-y-4 pt-8 border-t border-white/5 mt-8">
                <ImageManager />
            </div>

            {/* Modals */}
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
