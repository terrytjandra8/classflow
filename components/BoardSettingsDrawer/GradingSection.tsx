
import React, { useEffect, useState, useMemo } from 'react';
import { Award, Check, X, Sliders, Hash, Percent, Filter, Search, Eye, UserCheck } from 'lucide-react';
import { Board } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { SUPER_ADMIN_EMAIL } from '../Dashboard/constants';
import { useBoard } from '../BoardView/BoardContext';

interface GradingSectionProps {
    board: Board;
    onUpdate: (updates: Partial<Board>) => void;
    isStudent?: boolean;
}

export const GradingSection: React.FC<GradingSectionProps> = ({ board, onUpdate, isStudent }) => {
    const { highlightedUserId, setHighlightedUserId } = useBoard();
    const [students, setStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<Record<string, number | null>>({});
    const [participatingStudents, setParticipatingStudents] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [availableClasses, setAvailableClasses] = useState<string[]>(['General']);
    const [filterParticipants, setFilterParticipants] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const gradingConfig = board.gradingConfig || { mode: 'numeric', maxScore: 100 };

    useEffect(() => {
        if (!isStudent) {
            fetchClasses();
            fetchData();
        }
    }, [board.id, isStudent, board.targetGrade]);

    const fetchClasses = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const isSuperAdmin = user.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.trim().toLowerCase();
        
        let query = supabase.from('classes').select('name, owner_id').order('name');
        
        if (!isSuperAdmin) {
            query = query.eq('owner_id', user.id);
        }

        const { data } = await query;

        if (data) {
            const rawNames = data.map((c: any) => c.name);
            const validNames: string[] = rawNames.filter((n: any): n is string => typeof n === 'string' && n.trim().length > 0).map((n: string) => n.trim());
            const uniqueNames: string[] = Array.from(new Set(validNames));
            setAvailableClasses(['General', ...uniqueNames.filter((n: string) => n !== 'General')]);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: boardNotes } = await supabase
                .from('notes')
                .select('author_id, author, author_avatar')
                .eq('board_id', board.id);

            const participantsMap = new Map<string, any>();
            const activeIds = new Set<string>();

            if (boardNotes) {
                boardNotes.forEach((n: any) => {
                    if (n.author_id) {
                        activeIds.add(n.author_id);
                        if (!participantsMap.has(n.author_id)) {
                            participantsMap.set(n.author_id, {
                                id: n.author_id,
                                full_name: n.author || 'Unknown',
                                avatar_url: n.author_avatar,
                                is_guest: true
                            });
                        }
                    }
                });
            }
            setParticipatingStudents(activeIds);

            const { data: boardGrades } = await supabase
                .from('grades')
                .select('student_id, score')
                .eq('board_id', board.id);

            const gradeMap: Record<string, number | null> = {};
            if (boardGrades) {
                boardGrades.forEach((g: any) => {
                    gradeMap[g.student_id] = g.score;
                });
                setGrades(gradeMap);
            }

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email, enrolled_classes, role, avatar_url')
                .neq('role', 'teacher')
                .order('full_name');

            let finalList: any[] = [];

            if (profiles) {
                finalList = profiles.filter((p: any) => {
                    if (activeIds.has(p.id) || gradeMap[p.id] !== undefined) {
                        return true;
                    }

                    const target = board.targetGrade || 'General';
                    if (target === 'General') return true;

                    const studentClasses = (Array.isArray(p.enrolled_classes) ? p.enrolled_classes : [])
                        .map((c: string) => c.trim().toLowerCase());
                    
                    return studentClasses.includes(target.trim().toLowerCase());
                });
            }

            const registeredIds = new Set(profiles?.map(p => p.id) || []);
            
            activeIds.forEach(id => {
                if (!registeredIds.has(id)) {
                    const guestInfo = participantsMap.get(id);
                    if (guestInfo) {
                        finalList.push({
                            id: guestInfo.id,
                            full_name: `${guestInfo.full_name} (Guest)`,
                            avatar_url: guestInfo.avatar_url,
                            email: '',
                            enrolled_classes: [],
                            role: 'student'
                        });
                    }
                }
            });

            finalList.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
            setStudents(finalList);

        } catch (e) {
            console.error("Grading fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGrade = async (studentId: string, value: string) => {
        let score: number | null = null;
        
        if (gradingConfig.mode === 'binary') {
            if (value === 'pass') score = gradingConfig.maxScore;
            else if (value === 'fail') score = 0;
            else score = null;
        } else {
            const parsed = parseInt(value);
            score = isNaN(parsed) ? null : parsed;
        }

        const newGrades = { ...grades, [studentId]: score };
        setGrades(newGrades);

        await supabase.from('grades').upsert({
            student_id: studentId,
            board_id: board.id,
            score: score
        }, { onConflict: 'student_id, board_id' });
    };

    const updateConfig = (newConfig: Partial<typeof gradingConfig>) => {
        const updated = { ...gradingConfig, ...newConfig };
        onUpdate({ gradingConfig: updated });
    };

    const displayedStudents = useMemo(() => students.filter(student => {
        const matchesSearch = (student.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesParticipation = !filterParticipants || participatingStudents.has(student.id) || grades[student.id] !== undefined;
        return matchesSearch && matchesParticipation;
    }), [students, searchTerm, filterParticipants, participatingStudents, grades]);

    const submissionStats = useMemo(() => {
        const total = students.length;
        const submitted = students.filter(s => grades[s.id] !== null && grades[s.id] !== undefined).length;
        return { total, submitted };
    }, [students, grades]);

    if (isStudent) return null;

    return (
        <div className="space-y-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Grading & Assessment</h3>
            
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 space-y-6">
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-200">Assigned Class</label>
                    <select 
                        value={board.targetGrade || 'General'}
                        onChange={(e) => onUpdate({ targetGrade: e.target.value })}
                        className="w-full bg-[#111] border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-yellow-500"
                    >
                        {availableClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-gray-500">Links this board to a class roster.</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                    <label className="text-sm font-bold text-gray-200 flex items-center gap-2"><Sliders size={16}/> Grade Scale</label>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => updateConfig({ mode: 'numeric' })}
                            className={`flex-1 p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${gradingConfig.mode === 'numeric' ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                        >
                            <Hash size={14}/> Numeric (0-{gradingConfig.maxScore})
                        </button>
                        <button 
                            onClick={() => updateConfig({ mode: 'binary' })}
                            className={`flex-1 p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${gradingConfig.mode === 'binary' ? 'bg-purple-600 border-purple-500 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                        >
                            <Check size={14}/> Pass / Fail
                        </button>
                    </div>

                    <div className="flex items-center gap-3 bg-[#111] p-2 rounded-lg border border-white/5">
                        <div className="text-xs text-gray-400 flex items-center gap-1 font-bold">
                            <Award size={14} className="text-yellow-500"/> Max Score:
                        </div>
                        <input 
                            type="number" 
                            min="1"
                            max="1000"
                            value={gradingConfig.maxScore}
                            onChange={(e) => updateConfig({ maxScore: Math.max(1, parseInt(e.target.value) || 100) })}
                            className="w-20 bg-transparent border-b border-white/20 text-center text-sm font-bold text-white focus:border-yellow-500 outline-none"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-bold text-gray-200">Student Scores</label>
                                { !loading && submissionStats.total > 0 && (
                                    <span className="text-xs font-mono px-2 py-0.5 bg-yellow-900/50 text-yellow-300 rounded-md border border-yellow-500/30 flex items-center gap-1.5">
                                        <UserCheck size={12}/>
                                        {submissionStats.submitted} / {submissionStats.total} Submitted
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => setFilterParticipants(!filterParticipants)}
                                className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 border transition-colors ${filterParticipants ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                title={filterParticipants ? "Showing only students who posted" : "Showing all enrolled students"}
                            >
                                <Filter size={10} />
                                {filterParticipants ? 'Participants Only' : 'Show All'}
                            </button>
                        </div>

                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="text" 
                                placeholder="Search student..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#111] border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 bg-[#111] rounded-xl border border-white/5 p-1">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500 text-xs">Loading roster...</div>
                        ) : displayedStudents.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-xs">
                                {filterParticipants ? "No active participants matching search." : "No students found matching search."}
                            </div>
                        ) : (
                            displayedStudents.map(student => {
                                const score = grades[student.id];
                                const isPass = score !== null && score !== undefined && score >= gradingConfig.maxScore;
                                const isFail = score !== null && score !== undefined && score === 0;

                                const isHighlighted = highlightedUserId === student.id;

                                return (
                                    <div 
                                        key={student.id} 
                                        className={`flex items-center justify-between p-2 rounded-lg transition-colors group cursor-pointer ${isHighlighted ? 'bg-blue-500/20 border border-blue-500/50 shadow-md' : 'hover:bg-white/5 border border-transparent'}`}
                                        onClick={() => setHighlightedUserId(isHighlighted ? null : student.id)}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0 overflow-hidden">
                                                {student.avatar_url ? (
                                                    <img src={student.avatar_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    student.full_name.substring(0,2).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-xs truncate font-medium ${isHighlighted ? 'text-white' : 'text-gray-300'}`}>{student.full_name}</span>
                                                {participatingStudents.has(student.id) && <span className="text-[9px] text-green-500 font-bold uppercase">Active</span>}
                                            </div>
                                        </div>
                                        
                                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                                            {isHighlighted && <Eye size={14} className="text-blue-400 animate-pulse" />}
                                            
                                            {gradingConfig.mode === 'binary' ? (
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => handleUpdateGrade(student.id, isPass ? 'reset' : 'pass')}
                                                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${isPass ? 'bg-green-500 text-white shadow-md' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                                                        title="Pass"
                                                    >
                                                        <Check size={12} strokeWidth={3} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateGrade(student.id, isFail ? 'reset' : 'fail')}
                                                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${isFail ? 'bg-red-500 text-white shadow-md' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                                                        title="Fail"
                                                    >
                                                        <X size={12} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        min="0"
                                                        max={gradingConfig.maxScore}
                                                        value={score ?? ''}
                                                        onChange={(e) => handleUpdateGrade(student.id, e.target.value)}
                                                        placeholder="-"
                                                        className={`w-12 bg-black/20 border rounded px-1 py-0.5 text-center text-xs outline-none transition-colors ${
                                                            score !== null && score >= (gradingConfig.maxScore * 0.75) 
                                                            ? 'border-green-500/50 text-green-400' 
                                                            : (score !== null ? 'border-white/20 text-white' : 'border-white/10 text-gray-500')
                                                        }`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
