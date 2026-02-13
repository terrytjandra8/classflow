
import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Search, ShieldCheck, User } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { Board } from '../../types';
import { Avatar } from '../ui/Avatar';

interface CollaboratorManagerProps {
    board: Board;
    onUpdateBoard: (updates: Partial<Board>) => void;
}

export const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({ board, onUpdateBoard }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Lists
    const [collaboratorProfiles, setCollaboratorProfiles] = useState<any[]>([]);
    const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);

    // Fetch existing collaborators AND all available teachers on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Collaborators
                if (board.collaborators && board.collaborators.length > 0) {
                    const { data: collabs } = await supabase
                        .from('profiles')
                        .select('id, email, full_name, avatar_url')
                        .in('id', board.collaborators);
                    setCollaboratorProfiles(collabs || []);
                } else {
                    setCollaboratorProfiles([]);
                }

                // 2. Fetch All Teachers
                const { data: teachers } = await supabase
                    .from('profiles')
                    .select('id, email, full_name, avatar_url')
                    .eq('role', 'teacher')
                    .neq('id', board.owner_id) // Exclude owner
                    .order('full_name');
                
                if (teachers) {
                    // Filter out those who are already collaborators to avoid duplicates in available list
                    const existingIds = new Set(board.collaborators || []);
                    setAvailableTeachers(teachers.filter(t => !existingIds.has(t.id)));
                }
            } catch (e) {
                console.error("Error fetching data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [board.id]); // Reload if board ID changes, though owner_id/collaborators are better deps but logic handles it

    const addCollaborator = (user: any) => {
        setError(null);
        setSuccess(null);

        try {
            const newCollaborators = [...(board.collaborators || []), user.id];
            
            // Update board
            onUpdateBoard({ collaborators: newCollaborators });
            
            // Update local state immediately
            setCollaboratorProfiles(prev => [...prev, user]);
            setAvailableTeachers(prev => prev.filter(t => t.id !== user.id));
            
            setSuccess(`Added ${user.full_name}`);
            setSearchTerm(''); 
        } catch (err: any) {
            setError(err.message);
        }
    };

    const removeCollaborator = (id: string) => {
        const newCollaborators = (board.collaborators || []).filter(c => c !== id);
        onUpdateBoard({ collaborators: newCollaborators });
        
        // Move back to available
        const profile = collaboratorProfiles.find(p => p.id === id);
        if (profile) {
             setAvailableTeachers(prev => [...prev, profile].sort((a,b) => (a.full_name || '').localeCompare(b.full_name || '')));
        }
        setCollaboratorProfiles(prev => prev.filter(p => p.id !== id));
    };

    // Filter available teachers based on search
    const filteredAvailable = availableTeachers.filter(t => {
        const search = searchTerm.toLowerCase();
        return (t.full_name || '').toLowerCase().includes(search) || (t.email || '').toLowerCase().includes(search);
    });

    return (
        <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
                <ShieldCheck size={20} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-400 mb-1">Teacher Collaboration</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Grant other teachers full control over this board. They can edit settings, moderate posts, and grade students.
                    </p>
                </div>
            </div>

            {/* Search / Add Section */}
            <div className="space-y-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search teachers by name or email..."
                        className="w-full bg-[#111] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Suggestions List */}
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 border border-white/5 rounded-xl bg-black/20 p-1">
                    {loading && <p className="text-xs text-gray-500 text-center py-4">Loading teachers...</p>}
                    
                    {!loading && filteredAvailable.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4 italic">
                            {searchTerm ? "No matching teachers found." : "No other teachers available to invite."}
                        </p>
                    )}

                    {filteredAvailable.map(teacher => (
                        <div key={teacher.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group transition-colors border border-transparent hover:border-white/5">
                            <div className="flex items-center gap-3">
                                <Avatar src={teacher.avatar_url} name={teacher.full_name} size="sm" isTeacher={true} />
                                <div>
                                    <p className="text-sm font-bold text-gray-200">{teacher.full_name}</p>
                                    <p className="text-[10px] text-gray-500">{teacher.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => addCollaborator(teacher)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                            >
                                <UserPlus size={12} /> Add
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {error && <p className="text-xs text-red-400 font-bold bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}
            {success && <p className="text-xs text-green-400 font-bold bg-green-500/10 p-2 rounded border border-green-500/20">{success}</p>}

            {/* Current Team List */}
            <div className="space-y-2 pt-4 border-t border-white/10">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Current Team</h4>
                
                {collaboratorProfiles.length === 0 ? (
                    <p className="text-xs text-gray-600 italic text-center py-2">No collaborators yet.</p>
                ) : (
                    collaboratorProfiles.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Avatar src={p.avatar_url} name={p.full_name} size="sm" isTeacher={true} />
                                <div>
                                    <p className="text-sm font-bold text-white">{p.full_name}</p>
                                    <p className="text-xs text-gray-500">{p.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => removeCollaborator(p.id)}
                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Remove Access"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
