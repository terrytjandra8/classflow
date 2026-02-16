import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, ShieldCheck, School } from 'lucide-react';
import { Board } from '../types';
import { Overview } from './Admin/Overview';
import { Gradebook } from './Admin/Gradebook';
import { StudentsList } from './Admin/Students';
import { ClassesList } from './Admin/Classes';
import { ConfirmModal } from './ConfirmModal';
import { useAdminData } from '../hooks/useAdminData';

interface AdminDashboardProps {
  boards: Board[];
  theme: 'light' | 'dark';
  selectedClass?: string;
  onSelectBoard: (boardId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ boards, theme, selectedClass = 'All Classes', onSelectBoard }) => {
  const [activeTab, setActiveTabState] = useState<'overview' | 'students' | 'classes' | 'gradebook'>(() => {
      return (localStorage.getItem('cb_admin_tab') as any) || 'overview';
  });

  const setActiveTab = (tab: 'overview' | 'students' | 'classes' | 'gradebook') => {
      setActiveTabState(tab);
      localStorage.setItem('cb_admin_tab', tab);
  };

  const [searchTerm, setSearchTerm] = useState('');
  
  const { 
      loading, students, grades, classes, engagementStats, isSuperAdmin, userId,
      addClass, deleteClass, updateClass, updateStudentClasses, updateGradeScore
  } = useAdminData('my_classes');

  const filteredBoards = useMemo(() => {
      if (loading || !userId) return []; 
      return boards.filter(b => b.owner_id === userId);
  }, [boards, userId, loading]);

  const [newClassName, setNewClassName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState('');

  const [confirmModal, setConfirmModal] = useState<{ 
      isOpen: boolean; 
      type: 'delete_class'; 
      id: string | null; 
  }>({ isOpen: false, type: 'delete_class', id: null });

  const handleAddClassWrapper = async (autoEnroll: boolean) => {
      const res = await addClass(newClassName, autoEnroll);
      if (res) {
          setNewClassName('');
          setIsAddingClass(false);
      }
  };

  const handleSaveEditClass = async (autoEnroll: boolean) => {
      if (!editingClassId || !editClassName.trim()) return;
      await updateClass(editingClassId, editClassName, autoEnroll);
      setEditingClassId(null);
      setEditClassName('');
  };

  const openDeleteClassModal = (id: string) => {
      setConfirmModal({ isOpen: true, type: 'delete_class', id });
  };

  const handleConfirmAction = async () => {
      const { type, id } = confirmModal;
      if (type === 'delete_class' && id) await deleteClass(id);
      setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const getAvgScore = (studentId: string) => {
      const studentGrades = grades.filter((g: any) => g.student_id === studentId);
      if (studentGrades.length === 0) return 0;
      const sum = studentGrades.reduce((acc, curr) => acc + (curr.score || 0), 0);
      return Math.round(sum / studentGrades.length);
  };

  const getEngagementLevel = (studentId: string) => {
      const count = engagementStats[studentId] || 0;
      if (count > 10) return { label: 'High', color: 'green' };
      if (count > 3) return { label: 'Medium', color: 'amber' };
      return { label: 'Low', color: 'red' };
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s: any) => {
        if (s.role === 'teacher') return false;

        if (selectedClass !== 'All Classes') {
            const hasClass = (s.enrolled_classes || []).some(
                (c: string) => c.trim().toLowerCase() === selectedClass.trim().toLowerCase()
            );
            if (!hasClass) return false;
        }

        return (
            (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (s.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    });
  }, [students, searchTerm, selectedClass]);

  const totalStudents = filteredStudents.length;
  const avgParticipation = useMemo(() => {
      if (totalStudents === 0) return 0;
      const activeStudents = filteredStudents.filter(s => (engagementStats[s.id] || 0) > 0).length;
      return Math.round((activeStudents / totalStudents) * 100);
  }, [engagementStats, totalStudents, filteredStudents]);
  
  const highEngagementCount = useMemo(() => filteredStudents.filter(s => (engagementStats[s.id] || 0) > 10).length, [filteredStudents, engagementStats]);
  const medEngagementCount = useMemo(() => filteredStudents.filter(s => { 
      const c = engagementStats[s.id] || 0; 
      return c > 3 && c <= 10 
  }).length, [filteredStudents, engagementStats]);
  
  const avgGPA = useMemo(() => {
      if (totalStudents === 0) return 0;
      const totalScore = filteredStudents.reduce((acc, s) => acc + getAvgScore(s.id), 0);
      return Math.round(totalScore / totalStudents);
  }, [filteredStudents, grades, totalStudents]);

  if (loading) {
      return (
          <div className="flex items-center justify-center h-full min-h-[400px]">
              <Loader2 className="animate-spin text-pink-500" size={32} />
          </div>
      );
  }

  const tabs = ['overview', 'students', 'classes', 'gradebook'] as const;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 min-h-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <div className="flex items-center gap-3">
                    <h2 className={`text-3xl font-bold mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        Classroom Admin
                    </h2>
                    {isSuperAdmin && (
                        <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 uppercase tracking-wide">
                            <ShieldCheck size={12} /> Super Admin
                        </span>
                    )}
                    {!isSuperAdmin && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 uppercase tracking-wide">
                            <School size={12} /> Teacher
                        </span>
                    )}
                </div>
                <p className="text-gray-500 text-sm">Manage your students, view analytics, and grade participation.</p>
                {selectedClass !== 'All Classes' && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase rounded border border-blue-500/20">
                        Viewing: {selectedClass}
                    </span>
                )}
            </div>
            
            <div className={`flex p-1 rounded-xl border overflow-x-auto no-scrollbar max-w-full ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
                {tabs.map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap shrink-0 ${activeTab === tab ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        {activeTab === 'overview' && (
            <Overview 
                theme={theme}
                totalStudents={totalStudents}
                activeBoards={filteredBoards.length}
                avgParticipation={avgParticipation}
                avgGPA={avgGPA}
                highEngagementCount={highEngagementCount}
                medEngagementCount={medEngagementCount}
                classes={classes}
                students={filteredStudents as any}
                grades={grades as any}
                boards={filteredBoards}
                selectedClass={selectedClass}
                onSelectBoard={onSelectBoard}
                onUpdateGrade={updateGradeScore}
                onNavigateToGradebook={() => setActiveTab('gradebook')}
            />
        )}

        {activeTab === 'students' && (
            <StudentsList 
                theme={theme}
                students={filteredStudents as any}
                classes={classes}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onUpdateClasses={updateStudentClasses}
                getAvgScore={getAvgScore}
                getEngagementLevel={getEngagementLevel}
            />
        )}

        {activeTab === 'classes' && (
            <ClassesList 
                theme={theme}
                classes={classes}
                students={filteredStudents as any}
                isAddingClass={isAddingClass}
                setIsAddingClass={setIsAddingClass}
                newClassName={newClassName}
                setNewClassName={setNewClassName}
                handleAddClass={handleAddClassWrapper}
                handleDeleteClass={openDeleteClassModal}
                editingClassId={editingClassId}
                editClassName={editClassName}
                setEditClassName={setEditClassName}
                startEditingClass={(cls) => { setEditingClassId(cls.id); setEditClassName(cls.name); }}
                saveEditClass={handleSaveEditClass}
                cancelEditClass={() => { setEditingClassId(null); setEditClassName(''); }}
            />
        )}

        {activeTab === 'gradebook' && (
            <Gradebook 
                theme={theme}
                students={filteredStudents as any}
                grades={grades as any}
                boards={filteredBoards}
                selectedClass={selectedClass}
                onSelectBoard={onSelectBoard}
                onUpdateGrade={updateGradeScore}
            />
        )}

        <ConfirmModal 
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            onConfirm={handleConfirmAction}
            title={"Delete Class?"}
            message={"Deleting a class does not delete students, but unassigns them. This action cannot be undone."}
            confirmText={"Delete Class"}
            isDangerous={true}
        />
    </div>
  );
};
