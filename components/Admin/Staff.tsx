
import React from 'react';
import { Search, ShieldAlert, ArrowDownCircle, HardDrive } from 'lucide-react';

interface StaffProps {
    theme: 'light' | 'dark';
    staff: any[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onDemote: (id: string) => void;
    storageStats?: Record<string, { bytes: number; items: number; boards: number }>;
}

export const StaffList: React.FC<StaffProps> = ({ 
    theme, staff, searchTerm, setSearchTerm, onDemote, storageStats 
}) => {

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <div className={`rounded-xl border overflow-hidden animate-fade-in ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="relative w-full sm:w-auto sm:min-w-[300px]">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                     <input 
                        type="text" 
                        placeholder="Search staff..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-transparent border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-blue-500 w-full"
                     />
                 </div>
                 <div className="text-xs text-gray-500 font-bold uppercase flex items-center gap-2">
                     <ShieldAlert size={14} className="text-pink-500" /> Admin Area
                 </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className={`text-xs uppercase font-bold text-gray-500 border-b ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black/20 border-white/5'}`}>
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Storage Used</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {staff.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No staff members found.</td></tr>
                        ) : (
                            staff.map((user) => {
                                const stats = storageStats?.[user.id] || { bytes: 0, items: 0, boards: 0 };
                                const usagePercent = Math.min((stats.bytes / (50 * 1024 * 1024)) * 100, 100); // 50MB Cap visual

                                return (
                                <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold overflow-hidden border-2 border-white/10">
                                            {user.full_name?.substring(0,2).toUpperCase() || 'T'}
                                        </div>
                                        {user.full_name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-500/10 text-pink-500 rounded text-xs font-bold border border-pink-500/20 uppercase tracking-wide">
                                            Teacher
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 w-32">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                <HardDrive size={12} className="text-blue-500" />
                                                {formatBytes(stats.bytes)}
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(usagePercent, 5)}%` }}></div>
                                            </div>
                                            <span className="text-[9px] text-gray-400">{stats.boards} Boards • {stats.items} Items</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => onDemote(user.id)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-all border border-red-500/20"
                                        >
                                            <ArrowDownCircle size={14} /> Demote to Student
                                        </button>
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
