
import React, { useState } from 'react';
import { Plus, Users, Check, X, Edit2, Trash2, LayoutGrid, List, UserPlus } from 'lucide-react';
import { ClassGroup } from '../../types';

interface ClassesProps {
    theme: 'light' | 'dark';
    classes: ClassGroup[];
    students: any[];
    isAddingClass: boolean;
    setIsAddingClass: (val: boolean) => void;
    newClassName: string;
    setNewClassName: (val: string) => void;
    handleAddClass: (autoEnroll: boolean) => void;
    handleDeleteClass: (id: string) => void;
    editingClassId: string | null;
    editClassName: string;
    setEditClassName: (val: string) => void;
    startEditingClass: (cls: ClassGroup) => void;
    saveEditClass: (autoEnroll: boolean) => void;
    cancelEditClass: () => void;
}

export const ClassesList: React.FC<ClassesProps> = ({ 
    theme, classes, students, isAddingClass, setIsAddingClass, newClassName, setNewClassName, handleAddClass,
    handleDeleteClass, editingClassId, editClassName, setEditClassName, startEditingClass, saveEditClass, cancelEditClass
}) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [newAutoEnroll, setNewAutoEnroll] = useState(true);
    const [editAutoEnroll, setEditAutoEnroll] = useState(true);

    const getStudentCount = (className: string) => {
        const normalizedClassName = className.trim().toLowerCase();
        
        return students.filter(s => {
            // Strict role check
            if (s.role !== 'student') return false;
            
            const enrolled = s.enrolled_classes || [];
            return enrolled.some((c: string) => c.trim().toLowerCase() === normalizedClassName);
        }).length;
    };

    const handleStartEditing = (cls: ClassGroup) => {
        startEditingClass(cls);
        setEditAutoEnroll(cls.autoEnroll !== false); // Default to true if undefined
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Class Groups</h3>
                    <p className="text-sm text-gray-500">Create and manage your class lists.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1 shrink-0">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-[#333] shadow' : 'text-gray-500'}`}><LayoutGrid size={16}/></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-[#333] shadow' : 'text-gray-500'}`}><List size={16}/></button>
                    </div>
                    <button 
                    onClick={() => setIsAddingClass(true)}
                    className="flex-1 sm:flex-none bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors"
                    >
                        <Plus size={16} /> Add Class
                    </button>
                </div>
            </div>

            {isAddingClass && (
                <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'} flex flex-col gap-3 animate-in slide-in-from-top-2`}>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input 
                          type="text" 
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          placeholder="Enter Class Name (e.g. History 101)"
                          className="w-full sm:flex-1 bg-transparent border border-gray-500/30 rounded-lg px-3 py-2 outline-none focus:border-pink-500"
                          autoFocus
                        />
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => handleAddClass(newAutoEnroll)} className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs">Save</button>
                            <button onClick={() => setIsAddingClass(false)} className="flex-1 sm:flex-none bg-gray-500 text-white px-4 py-2 rounded-lg font-bold text-xs">Cancel</button>
                        </div>
                    </div>
                    {/* Enrollment Toggle */}
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="autoEnrollNew" 
                            checked={newAutoEnroll} 
                            onChange={(e) => setNewAutoEnroll(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-500 text-pink-600 focus:ring-pink-500"
                        />
                        <label htmlFor="autoEnrollNew" className="text-xs text-gray-500 font-medium select-none cursor-pointer flex items-center gap-1">
                            Permanent Enrollment <span className="text-[10px] text-gray-400 font-normal">(Students joining a board are added to this class roster automatically)</span>
                        </label>
                    </div>
                </div>
            )}

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(cls => (
                        <div key={cls.id} className={`p-5 rounded-xl border group flex flex-col gap-3 transition-all hover:border-pink-500/50 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                            {editingClassId === cls.id ? (
                                <div className="space-y-3 animate-in fade-in">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={editClassName}
                                            onChange={(e) => setEditClassName(e.target.value)}
                                            className={`flex-1 bg-transparent border rounded px-2 py-1.5 text-base font-bold outline-none ${theme === 'light' ? 'border-pink-500 text-slate-800' : 'border-pink-500 text-white'}`}
                                            autoFocus
                                            onKeyDown={(e) => { if(e.key === 'Enter') saveEditClass(editAutoEnroll); if(e.key === 'Escape') cancelEditClass(); }}
                                        />
                                        <button onClick={() => saveEditClass(editAutoEnroll)} className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors"><Check size={16}/></button>
                                        <button onClick={cancelEditClass} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"><X size={16}/></button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            id={`editAutoEnroll-${cls.id}`}
                                            checked={editAutoEnroll} 
                                            onChange={(e) => setEditAutoEnroll(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-500 text-pink-600 focus:ring-pink-500"
                                        />
                                        <label htmlFor={`editAutoEnroll-${cls.id}`} className="text-xs text-gray-500 font-medium select-none cursor-pointer">
                                            Permanent Enrollment
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base">{cls.name}</h4>
                                            <p className="text-xs text-gray-500">{getStudentCount(cls.name)} Students</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleStartEditing(cls)} className="p-2 hover:bg-blue-500/10 text-gray-400 hover:text-blue-500 rounded-lg transition-colors" title="Edit Class">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteClass(cls.id)} className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors" title="Delete Class">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${cls.autoEnroll !== false ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                                        {cls.autoEnroll !== false ? <Check size={10} /> : <UserPlus size={10} />}
                                        {cls.autoEnroll !== false ? 'Auto-Enroll On' : 'One-Time Join'}
                                    </span>
                                </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border overflow-hidden border-gray-200 dark:border-white/5 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Class Name</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Students</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Enrollment Mode</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {classes.map(cls => (
                                <tr key={cls.id} className="group hover:bg-gray-50 dark:hover:bg-white/5">
                                    <td className="px-6 py-4 font-bold">
                                        {editingClassId === cls.id ? (
                                            <input value={editClassName} onChange={(e) => setEditClassName(e.target.value)} className="bg-transparent border border-pink-500 rounded px-2 py-1 outline-none" autoFocus />
                                        ) : cls.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {getStudentCount(cls.name)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingClassId === cls.id ? (
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" checked={editAutoEnroll} onChange={(e) => setEditAutoEnroll(e.target.checked)} />
                                                <span className="text-xs">Permanent</span>
                                            </div>
                                        ) : (
                                            <span className={`text-[10px] font-bold ${cls.autoEnroll !== false ? 'text-green-500' : 'text-orange-500'}`}>
                                                {cls.autoEnroll !== false ? 'Permanent' : 'One-Time'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {editingClassId === cls.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => saveEditClass(editAutoEnroll)} className="text-green-500 font-bold text-xs">Save</button>
                                                <button onClick={cancelEditClass} className="text-gray-500 text-xs">Cancel</button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleStartEditing(cls)} className="text-blue-500 hover:underline text-xs font-bold">Edit</button>
                                                <button onClick={() => handleDeleteClass(cls.id)} className="text-red-500 hover:underline text-xs font-bold">Delete</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {classes.length === 0 && (
                <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-500/20 rounded-xl">
                    <p className="text-gray-500">No classes found. Add one above!</p>
                </div>
            )}
        </div>
    );
};
