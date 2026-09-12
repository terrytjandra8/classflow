import React from 'react';
import { Award, BookOpen, CheckCircle, ExternalLink, Plus, User, X } from 'lucide-react';
import { StudentSeatingData, Seat } from '../../types/seating';

interface StudentDetailPopoverProps {
  student: StudentSeatingData;
  seat: Seat;
  theme: 'light' | 'dark';
  onClose: () => void;
  onIncrementParticipation: (studentId: string) => void;
}

export const StudentDetailPopover: React.FC<StudentDetailPopoverProps> = ({
  student,
  seat,
  theme,
  onClose,
  onIncrementParticipation,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#1e1e24] border-white/10 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-md">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{student.name}</h3>
              <p className="text-xs text-pink-500 font-semibold">
                {seat.groupName ? `${seat.groupName} · Seat ${seat.label}` : `Seat ${seat.label}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* LMS Stats Overview */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className={`p-3 rounded-xl border text-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Participation</p>
            <p className="text-xl font-extrabold text-pink-500">{student.participationScore}</p>
          </div>

          <div className={`p-3 rounded-xl border text-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Assignments</p>
            <p className="text-xl font-extrabold text-indigo-400">{student.assignmentsCompleted}/{student.totalAssignments}</p>
          </div>

          <div className={`p-3 rounded-xl border text-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Last Exam</p>
            <p className="text-xl font-extrabold text-emerald-400">{student.lastAssessmentScore}%</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => onIncrementParticipation(student.id)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-90 active:scale-[0.99] transition-all"
          >
            <Award size={16} /> Mark Participation (+1)
          </button>

          <button
            onClick={() => alert(`Opening student profile for ${student.name}`)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-colors ${
              theme === 'light' 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
          >
            <User size={15} /> View Full Student Profile <ExternalLink size={14} className="ml-auto opacity-60" />
          </button>
        </div>
      </div>
    </div>
  );
};
