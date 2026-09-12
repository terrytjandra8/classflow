import React, { useState } from 'react';
import { X, ShieldAlert, Plus, Trash2, Sliders } from 'lucide-react';
import { SeatingConstraint, StudentSeatingData, ConstraintType } from '../../types/seating';

interface SeatingConstraintsModalProps {
  theme: 'light' | 'dark';
  students: StudentSeatingData[];
  constraints: SeatingConstraint[];
  onClose: () => void;
  onSaveConstraints: (constraints: SeatingConstraint[]) => void;
}

export const SeatingConstraintsModal: React.FC<SeatingConstraintsModalProps> = ({
  theme,
  students,
  constraints: initialConstraints,
  onClose,
  onSaveConstraints,
}) => {
  const [constraints, setConstraints] = useState<SeatingConstraint[]>(initialConstraints);
  const [type, setType] = useState<ConstraintType>('keep_apart');
  const [studentId1, setStudentId1] = useState(students[0]?.id || '');
  const [studentId2, setStudentId2] = useState(students[1]?.id || '');

  const handleAdd = () => {
    if (!studentId1) return;
    const newConstraint: SeatingConstraint = {
      id: `const_${Date.now()}`,
      type,
      studentId1,
      studentId2: type === 'front_row_priority' ? undefined : studentId2,
    };
    setConstraints([...constraints, newConstraint]);
  };

  const handleRemove = (id: string) => {
    setConstraints(constraints.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#18181c] border-white/10 text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Sliders size={20} className="text-pink-500" /> Randomization Rules & Constraints
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Add Constraint Section */}
        <div className="space-y-4 my-4 p-4 rounded-xl border bg-black/20 border-white/5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400">Add New Rule</h4>
          
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Rule Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ConstraintType)}
              className={`w-full px-3 py-2 rounded-xl border text-sm ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#222228] border-white/10'
              }`}
            >
              <option value="keep_apart">Keep Certain Students Apart</option>
              <option value="keep_together">Keep Certain Students Together</option>
              <option value="front_row_priority">Front-Row Priority</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Student 1</label>
              <select
                value={studentId1}
                onChange={(e) => setStudentId1(e.target.value)}
                className={`w-full px-2.5 py-2 rounded-xl border text-xs ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#222228] border-white/10'
                }`}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {type !== 'front_row_priority' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Student 2</label>
                <select
                  value={studentId2}
                  onChange={(e) => setStudentId2(e.target.value)}
                  className={`w-full px-2.5 py-2 rounded-xl border text-xs ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#222228] border-white/10'
                  }`}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 font-bold text-xs border border-pink-500/30 transition-colors"
          >
            <Plus size={14} /> Add Constraint
          </button>
        </div>

        {/* Existing Constraints List */}
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar my-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Rules ({constraints.length})</h4>
          {constraints.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No rules configured. Pure randomization active.</p>
          ) : (
            constraints.map(c => {
              const s1 = students.find(s => s.id === c.studentId1)?.name;
              const s2 = students.find(s => s.id === c.studentId2)?.name;
              return (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs">
                  <div>
                    <span className="font-semibold text-pink-400 capitalize">{c.type.replace(/_/g, ' ')}: </span>
                    <span>{s1}</span>
                    {s2 && <span> & {s2}</span>}
                  </div>
                  <button onClick={() => handleRemove(c.id)} className="text-gray-400 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              onSaveConstraints(constraints);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 font-bold text-sm text-white shadow-lg shadow-pink-500/25"
          >
            Save Rules
          </button>
        </div>
      </div>
    </div>
  );
};
