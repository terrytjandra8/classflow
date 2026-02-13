
import React from 'react';
import { Search, Filter, Download, Plus, X, User, ShieldCheck } from 'lucide-react';
import { ClassGroup } from '../../types';

interface StudentsProps {
    theme: 'light' | 'dark';
    students: any[];
    classes: ClassGroup[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onUpdateRole?: (id: string, role: string) => void; // Made optional as we are deprecating usage here
    onUpdateClasses: (id: string, classes: string[]) => void;
    getAvgScore: (id: string) => number;
    getEngagementLevel: (id: string) => { label: string, color: string };
}

export const StudentsList: React.FC<StudentsProps> = ({ 
    theme, students, classes, searchTerm, setSearchTerm, onUpdateClasses, getAvgScore, getEngagementLevel 
}) => {
    
    const handleRemoveClass = (student: any, clsToRemove: string) => {
        const newClasses = (student.enrolled_classes || []).filter((c: string) => c !== clsToRemove);
        onUpdateClasses(student.id, newClasses);
    };

    const handleAddClass = (student: any, clsToAdd: string) => {
        if (!clsToAdd) return;
        const current = student.enrolled_classes || [];
        if (!current.includes(clsToAdd)) {
            onUpdateClasses(student.id, [...current, clsToAdd]);
        }
    };

    return (
        <div className={`rounded-xl border overflow-hidden animate-fade-in ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div className="relative w-full md:w-auto md:min-w-[300px]">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                     <input 
                        type="text" 
                        placeholder="Search students..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-transparent border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-blue-500 w-full"
                     />
                 </div>
                 <div className="flex gap-2 w-full md:w-auto">
                     <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                         <Filter size={14} /> Filter
                     </button>
                     <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                         <Download size={14} /> Export
                     </button>
                 </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className={`text-xs uppercase font-bold text-gray-500 border-b ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black/20 border-white/5'}`}>
                        <tr>
                            <th className="px-6 py-4">Student Name</th>
                            <th className="px-6 py-4">Email Address</th>
                            <th className="px-6 py-4 w-1/4">Enrolled Classes</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Avg Score</th>
                            <th className="px-6 py-4">Engagement</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {students.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-8 text-gray-500">No students found for this filter.</td></tr>
                        ) : (
                            students.map((student) => {
                                const avg = getAvgScore(student.id);
                                const engagement = getEngagementLevel(student.id);
                                const isTeacher = student.role === 'teacher';
                                
                                return (
                                    <tr key={student.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] overflow-hidden">
                                                {student.full_name.substring(0,2).toUpperCase()}
                                            </div>
                                            {student.full_name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{student.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {student.enrolled_classes?.map((cls: string) => (
                                                    <span key={cls} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-bold border border-blue-500/20">
                                                        {cls}
                                                        <button 
                                                            onClick={() => handleRemoveClass(student, cls)} 
                                                            className="hover:text-red-500 transition-colors"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </span>
                                                ))}
                                                <div className="relative group/add">
                                                    <button className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500">
                                                        <Plus size={12} />
                                                    </button>
                                                    {/* Fixed: Use padding-top (pt-2) instead of margin-top (mt-1) to prevent hover gaps */}
                                                    <div className="absolute top-full left-0 pt-2 w-32 hidden group-hover/add:block z-50">
                                                        <div className="bg-[#222] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                                                            {classes.filter(c => !(student.enrolled_classes || []).includes(c.name)).map(c => (
                                                                <button 
                                                                    key={c.id}
                                                                    onClick={() => handleAddClass(student, c.name)}
                                                                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white truncate"
                                                                >
                                                                    {c.name}
                                                                </button>
                                                            ))}
                                                            {classes.length === 0 && <div className="px-3 py-2 text-xs text-gray-500">No classes</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${isTeacher ? 'bg-pink-500/10 text-pink-600 border-pink-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                                                {isTeacher ? <ShieldCheck size={12}/> : <User size={12}/>}
                                                {student.role || 'Student'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${avg >= 90 ? 'text-green-500' : avg >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                                                {avg > 0 ? `${avg}%` : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-${engagement.color}-500/10 text-${engagement.color}-500 border border-${engagement.color}-500/20`}>
                                                <span className={`w-1.5 h-1.5 rounded-full bg-${engagement.color}-500`}></span> {engagement.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
