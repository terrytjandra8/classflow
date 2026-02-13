import React, { useState } from 'react';
import { User, ArrowRight, Merge, AlertTriangle, X, Check } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface MergeModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: any[];
    onConfirm: (oldId: string, newId: string) => void;
}

export const MergeModal: React.FC<MergeModalProps> = ({ isOpen, onClose, users, onConfirm }) => {
    const [oldId, setOldId] = useState('');
    const [newId, setNewId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const filteredUsers = users.filter(u => 
        (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const oldUser = users.find(u => u.id === oldId);
    const newUser = users.find(u => u.id === newId);

    const isReady = oldId && newId && oldId !== newId;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600/20 p-2 rounded-lg text-purple-400">
                            <Merge size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Merge Duplicate Accounts</h3>
                            <p className="text-sm text-gray-400">Transfer data from an old profile to a new one.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-6 text-yellow-200 text-sm flex items-start gap-3">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block mb-1">Warning: Irreversible Action</span>
                            All notes, grades, and boards from the <strong>Source User</strong> will be moved to the <strong>Target User</strong>. The Source User profile will then be permanently deleted.
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-center justify-center mb-8">
                        {/* Source Selection */}
                        <div className={`flex-1 w-full border-2 rounded-xl p-4 transition-all cursor-pointer ${oldId ? 'border-red-500/50 bg-red-500/5' : 'border-dashed border-gray-600 hover:border-gray-400'}`}>
                            <div className="text-xs font-bold text-gray-500 uppercase mb-2 text-center">Source (Old / Recovered)</div>
                            {oldUser ? (
                                <div className="text-center">
                                    <Avatar src={oldUser.avatar_url} name={oldUser.full_name} size="lg" className="mx-auto mb-2" />
                                    <div className="font-bold text-white">{oldUser.full_name}</div>
                                    <div className="text-xs text-gray-400">{oldUser.email || 'No Email'}</div>
                                    <button onClick={() => setOldId('')} className="mt-2 text-xs text-red-400 hover:underline">Change</button>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500">Select Source Below</div>
                            )}
                        </div>

                        <ArrowRight size={24} className="text-gray-600 rotate-90 md:rotate-0" />

                        {/* Target Selection */}
                        <div className={`flex-1 w-full border-2 rounded-xl p-4 transition-all cursor-pointer ${newId ? 'border-green-500/50 bg-green-500/5' : 'border-dashed border-gray-600 hover:border-gray-400'}`}>
                            <div className="text-xs font-bold text-gray-500 uppercase mb-2 text-center">Target (New / Active)</div>
                            {newUser ? (
                                <div className="text-center">
                                    <Avatar src={newUser.avatar_url} name={newUser.full_name} size="lg" className="mx-auto mb-2" />
                                    <div className="font-bold text-white">{newUser.full_name}</div>
                                    <div className="text-xs text-gray-400">{newUser.email || 'No Email'}</div>
                                    <button onClick={() => setNewId('')} className="mt-2 text-xs text-red-400 hover:underline">Change</button>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500">Select Target Below</div>
                            )}
                        </div>
                    </div>

                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 mb-4"
                    />

                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-[#222] rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                                    <div>
                                        <div className="font-bold text-sm text-gray-200">{user.full_name}</div>
                                        <div className="text-[10px] text-gray-500">{user.email || 'No Email'} • {new Date(user.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setOldId(user.id)}
                                        disabled={newId === user.id}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${oldId === user.id ? 'bg-red-500 text-white' : 'bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 disabled:opacity-30'}`}
                                    >
                                        Set Source
                                    </button>
                                    <button 
                                        onClick={() => setNewId(user.id)}
                                        disabled={oldId === user.id}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${newId === user.id ? 'bg-green-500 text-white' : 'bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 disabled:opacity-30'}`}
                                    >
                                        Set Target
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#161616]">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
                    <button 
                        onClick={() => onConfirm(oldId, newId)}
                        disabled={!isReady}
                        className="px-6 py-2 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
                    >
                        <Merge size={16} /> Confirm Merge
                    </button>
                </div>
            </div>
        </div>
    );
};
