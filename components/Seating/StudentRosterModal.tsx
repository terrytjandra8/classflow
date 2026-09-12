import React, { useState } from 'react';
import { X, UserPlus, Users, Plus, Trash2, Check, Upload, Link, Link2Off } from 'lucide-react';
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
  const [bulkText, setBulkText] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [linkingStudentId, setLinkingStudentId] = useState<string | null>(null);

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

  const handleBulkUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n');
    const newStudents: StudentSeatingData[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parts = trimmed.split(',').map(p => p.trim());
      const name = parts[0];
      const rawGender = (parts[1] || 'male').toLowerCase();
      const gender: 'male' | 'female' | 'other' = 
        rawGender === 'female' || rawGender === 'f' ? 'female' :
        rawGender === 'other' || rawGender === 'o' ? 'other' : 'male';

      if (name) {
        newStudents.push({
          id: `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name,
          gender,
          participationScore: 0,
          assignmentsCompleted: 0,
          totalAssignments: 10,
          lastAssessmentScore: 0,
        });
      }
    });

    if (newStudents.length > 0) {
      setStudents(prev => [...prev, ...newStudents]);
      setBulkText('');
      setShowBulkUpload(false);
    }
  };

  const handleLinkProfile = (studentId: string, profile: any) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          linkedProfileId: profile.id,
          name: profile.full_name || s.name,
          avatar: profile.avatar_url || s.avatar,
        };
      }
      return s;
    }));
    setLinkingStudentId(null);
  };

  const handleUnlinkProfile = (studentId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const { linkedProfileId, ...rest } = s;
        return rest;
      }
      return s;
    }));
  };

  const handleRemoveStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-3xl rounded-2xl p-6 shadow-2xl border transition-all max-h-[90vh] flex flex-col ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#18181c] border-white/10 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Users size={20} className="text-pink-500" /> Classroom Roster ({students.length} Students)
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {/* Left Column: Add Student Options */}
          <div className="space-y-4">
            {/* Toggle CSV Bulk vs Single Form */}
            <div className="flex gap-2 p-1 rounded-xl bg-black/20 border border-white/5">
              <button
                onClick={() => setShowBulkUpload(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !showBulkUpload ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Single Add
              </button>
              <button
                onClick={() => setShowBulkUpload(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  showBulkUpload ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Bulk / CSV
              </button>
            </div>

            {!showBulkUpload ? (
              <div className="p-4 rounded-xl border bg-black/20 border-white/5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                  <UserPlus size={14} /> Add Individual Student
                </h4>

                <form onSubmit={handleAddCustomStudent} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Johnson"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#222228] border-white/10'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Gender (for balancing)</label>
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
              </div>
            ) : (
              <div className="p-4 rounded-xl border bg-black/20 border-white/5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                  <Upload size={14} /> Bulk Add Names (CSV / Multiline)
                </h4>
                <p className="text-[11px] text-gray-400">
                  Enter student names one per line. Optionally append gender (e.g. <code className="text-pink-300">John Doe, male</code>).
                </p>

                <form onSubmit={handleBulkUpload} className="space-y-3">
                  <textarea
                    rows={6}
                    placeholder={"Alice Smith, female\nBob Jones, male\nCharlie Brown"}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#222228] border-white/10'
                    }`}
                  />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    <Upload size={14} /> Process Bulk List
                  </button>
                </form>
              </div>
            )}

            {/* Quick Pick Registered Accounts */}
            {registeredStudents.length > 0 && (
              <div className="p-4 rounded-xl border bg-black/20 border-white/5">
                <p className="text-[11px] font-bold text-gray-400 mb-2">Registered Accounts in System:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                  {registeredStudents.map(rs => {
                    const isAdded = students.some(s => s.linkedProfileId === rs.id || s.id === rs.id);
                    return (
                      <div
                        key={rs.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                          isAdded ? 'bg-white/5 text-gray-500' : 'bg-pink-500/10 text-pink-300 border border-pink-500/20'
                        }`}
                      >
                        <span className="truncate">{rs.full_name || rs.email}</span>
                        {isAdded ? (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Check size={12} /> Linked
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              const newStudent: StudentSeatingData = {
                                id: `linked_${rs.id}`,
                                name: rs.full_name || rs.email?.split('@')[0] || 'Student',
                                avatar: rs.avatar_url,
                                linkedProfileId: rs.id,
                                gender: 'other',
                                participationScore: 0,
                                assignmentsCompleted: 0,
                                totalAssignments: 10,
                                lastAssessmentScore: 0,
                              };
                              setStudents(prev => [...prev, newStudent]);
                            }}
                            className="px-2 py-0.5 rounded bg-pink-500 hover:bg-pink-600 text-white font-bold text-[10px]"
                          >
                            + Add to Seating
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Current Roster List */}
          <div className="flex flex-col h-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Current Class Roster ({students.length})
            </h4>

            <div className="flex-1 max-h-[380px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {students.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs italic border border-dashed rounded-xl">
                  No students in this class yet. Add individuals, upload bulk names, or link registered accounts.
                </div>
              ) : (
                students.map((st) => (
                  <div 
                    key={st.id} 
                    className={`p-3 rounded-xl border transition-all ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                          st.gender === 'female' ? 'bg-gradient-to-tr from-pink-500 to-rose-400' :
                          st.gender === 'male' ? 'bg-gradient-to-tr from-indigo-500 to-cyan-400' :
                          'bg-gradient-to-tr from-purple-500 to-slate-400'
                        }`}>
                          {st.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate max-w-[140px]">{st.name}</span>
                            {st.linkedProfileId && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                                Linked
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 capitalize">{st.gender}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Profile Link Action */}
                        {st.linkedProfileId ? (
                          <button
                            onClick={() => handleUnlinkProfile(st.id)}
                            title="Unlink from student account"
                            className="p-1.5 text-gray-400 hover:text-amber-400 rounded-lg hover:bg-white/5"
                          >
                            <Link2Off size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setLinkingStudentId(linkingStudentId === st.id ? null : st.id)}
                            title="Link to registered student account"
                            className="p-1.5 text-gray-400 hover:text-pink-400 rounded-lg hover:bg-white/5"
                          >
                            <Link size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => handleRemoveStudent(st.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Linking Dropdown Panel */}
                    {linkingStudentId === st.id && (
                      <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                        <p className="text-[10px] font-bold text-pink-400">Select registered account to link:</p>
                        {registeredStudents.length === 0 ? (
                          <p className="text-[10px] text-gray-500 italic">No registered accounts available.</p>
                        ) : (
                          registeredStudents.map(rs => (
                            <button
                              key={rs.id}
                              onClick={() => handleLinkProfile(st.id, rs)}
                              className="w-full text-left px-2 py-1 rounded bg-white/5 hover:bg-pink-500/20 text-[11px] font-medium truncate"
                            >
                              {rs.full_name || rs.email}
                            </button>
                          ))
                        )}
                      </div>
                    )}
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
