import React, { useState } from 'react';
import { X, UserPlus, Users, Plus, Trash2, Check } from 'lucide-react';
import { StudentSeatingData } from '../../types/seating';

interface StudentRosterModalProps {
  theme: 'light' | 'dark';
  students: StudentSeatingData[];
  registeredStudents: any[];
  onClose: () => void;
  onUpdateRoster: (students: StudentSeatingData[]) => void;
}

export const StudentRosterModal: React.FC<StudentRosterModalProps> = ({
  theme,
  students: initialStudents,
  registeredStudents,
  onClose,
  onUpdateRoster,
}) => {
  const [students, setStudents] = useState<StudentSeatingData[]>(initialStudents);
  const [customName, setCustomName] = useState('');
  const [customGender, setCustomGender] = useState<'male' | 'female' | 'other'>('male');

  const handleAddCustomStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newStudent: StudentSeatingData = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: customName.trim(),
      gender: customGender,
      participationScore: 0,
      assignmentsCompleted: 0,
      totalAssignments: 10,
      lastAssessmentScore: 0,
    };

    setStudents(prev => [...prev, newStudent]);
    setCustomName('');
  };

  const handleAddFromRegistered = (regStudent: any) => {
    if (students.some(s => s.id === regStudent.id)) return;

    const newStudent: StudentSeatingData = {
      id: regStudent.id,
      name: regStudent.full_name || regStudent.email?.split('@')[0] || 'Registered Student',
      avatar: regStudent.avatar_url,
      gender: 'other',
      participationScore: 0,
      assignmentsCompleted: 0,
      totalAssignments: 10,
      lastAssessmentScore: 0,
    };

    setStudents(prev => [...prev, newStudent]);
  };

  const handleRemoveStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-2xl rounded-2xl p-6 shadow-2xl border transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#18181c] border-white/10 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Users size={20} className="text-pink-500" /> Classroom Roster & Students ({students.length})
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          {/* Add Manual / Custom Student Form */}
          <div className="space-y-3 p-4 rounded-xl border bg-black/20 border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <UserPlus size={14} /> Add Custom Student
            </h4>

            <form onSubmit={handleAddCustomStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Student Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#222228] border-white/10'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Gender (for balance rules)</label>
                <select
                  value={customGender}
                  onChange={(e) => setCustomGender(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#222228] border-white/10'
                  }`}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other / Unspecified</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-md transition-colors"
              >
                <Plus size={14} /> Add to Roster
              </button>
            </form>

            {/* Quick Pick Registered Accounts */}
            {registeredStudents.length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <p className="text-[11px] font-bold text-gray-400 mb-2">Pick from Signed-Up Accounts:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                  {registeredStudents.map(rs => {
                    const isAdded = students.some(s => s.id === rs.id);
                    return (
                      <button
                        key={rs.id}
                        onClick={() => handleAddFromRegistered(rs)}
                        disabled={isAdded}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isAdded 
                            ? 'opacity-40 bg-white/5 text-gray-500 cursor-not-allowed' 
                            : 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20'
                        }`}
                      >
                        <span className="truncate">{rs.full_name || rs.email}</span>
                        {isAdded ? <Check size={12} /> : <Plus size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Current Roster List */}
          <div className="flex flex-col h-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Active Seating Roster ({students.length})
            </h4>

            <div className="flex-1 max-h-64 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
              {students.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-4 text-center">No students added to layout yet.</p>
              ) : (
                students.map((st) => (
                  <div 
                    key={st.id} 
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-[10px] text-white">
                        {st.name.charAt(0)}
                      </div>
                      <span className="truncate max-w-[140px]">{st.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(st.id)}
                      className="text-gray-400 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              onUpdateRoster(students);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 font-bold text-sm text-white shadow-lg shadow-pink-500/25"
          >
            Save & Update Seating
          </button>
        </div>
      </div>
    </div>
  );
};
