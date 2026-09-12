import React, { useState, useEffect } from 'react';
import { Armchair, Shuffle, Sliders, Edit3, Plus, Layout, RotateCcw, Users, Check } from 'lucide-react';
import { Seat, SeatingLayout, StudentSeatingData, SeatingConstraint } from '../../types/seating';
import { seatingService } from '../../services/seatingService';
import { profileService } from '../../services/profileService';
import { SeatingCanvas } from './SeatingCanvas';
import { StudentDetailPopover } from './StudentDetailPopover';
import { SeatingConfigModal } from './SeatingConfigModal';
import { SeatingConstraintsModal } from './SeatingConstraintsModal';

interface SeatingModuleProps {
  theme: 'light' | 'dark';
  className?: string;
}

export const SeatingModule: React.FC<SeatingModuleProps> = ({ theme }) => {
  // State
  const [students, setStudents] = useState<StudentSeatingData[]>(seatingService.getDefaultStudents());
  const [layout, setLayout] = useState<SeatingLayout>(() => 
    seatingService.createLayout('Classroom Layout A', 'Grade 10-A', 'rows_cols', 4, 4, true)
  );
  const [constraints, setConstraints] = useState<SeatingConstraint[]>([]);
  const [assignment, setAssignment] = useState<Record<string, string>>({});

  // Fetch real students from Supabase profiles table
  useEffect(() => {
    const loadRealStudents = async () => {
      try {
        const realProfiles = await profileService.getRelevantStudents();
        if (realProfiles && realProfiles.length > 0) {
          const mappedStudents: StudentSeatingData[] = realProfiles.map((p, idx) => ({
            id: p.id,
            name: p.full_name || p.username || `Student ${idx + 1}`,
            avatar: p.avatar_url,
            gender: 'other',
            participationScore: Math.floor(Math.random() * 6) + 3,
            assignmentsCompleted: Math.floor(Math.random() * 4) + 7,
            totalAssignments: 10,
            lastAssessmentScore: Math.floor(Math.random() * 25) + 75,
          }));
          setStudents(mappedStudents);
          setAssignment(seatingService.randomizeAssignments(layout.seats, mappedStudents, constraints));
        } else {
          setAssignment(seatingService.randomizeAssignments(layout.seats, students, constraints));
        }
      } catch (err) {
        console.error("Error loading real student profiles for seating:", err);
        setAssignment(seatingService.randomizeAssignments(layout.seats, students, constraints));
      }
    };

    loadRealStudents();
  }, []);

  // Modals & Panels
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isConstraintsOpen, setIsConstraintsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<{ seat: Seat; student?: StudentSeatingData } | null>(null);

  // Handlers
  const handleRandomize = () => {
    const newAssignment = seatingService.randomizeAssignments(layout.seats, students, constraints);
    setAssignment(newAssignment);
  };

  const handleSwapStudents = (seatId1: string, seatId2: string) => {
    setAssignment(prev => {
      const copy = { ...prev };
      const student1 = copy[seatId1];
      const student2 = copy[seatId2];
      
      if (student2) copy[seatId1] = student2;
      else delete copy[seatId1];

      if (student1) copy[seatId2] = student1;
      else delete copy[seatId2];

      return copy;
    });
  };

  const handleIncrementParticipation = (studentId: string) => {
    setStudents(prev => 
      prev.map(s => s.id === studentId ? { ...s, participationScore: s.participationScore + 1 } : s)
    );
    if (selectedSeat && selectedSeat.student) {
      setSelectedSeat({
        ...selectedSeat,
        student: { ...selectedSeat.student, participationScore: selectedSeat.student.participationScore + 1 }
      });
    }
  };

  const handleCreateLayout = (name: string, preset: any, rows: number, cols: number, hasAisle: boolean) => {
    const newLayout = seatingService.createLayout(name, 'Grade 10-A', preset, rows, cols, hasAisle);
    setLayout(newLayout);
    setAssignment(seatingService.randomizeAssignments(newLayout.seats, students, constraints));
    setIsConfigOpen(false);
  };

  const handleAddSeat = () => {
    const newSeatId = `seat_${Date.now()}`;
    const newSeat: Seat = {
      id: newSeatId,
      label: `S${layout.seats.length + 1}`,
      x: (layout.seats.length % 4),
      y: Math.floor(layout.seats.length / 4),
    };
    setLayout(prev => ({ ...prev, seats: [...prev.seats, newSeat] }));
  };

  const handleRemoveSeat = (seatId: string) => {
    setLayout(prev => ({ ...prev, seats: prev.seats.filter(s => s.id !== seatId) }));
    setAssignment(prev => {
      const copy = { ...prev };
      delete copy[seatId];
      return copy;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Module Top Bar */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#141418] border-white/10 text-white'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20">
            <Armchair size={22} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl leading-tight">Seating</h1>
            <p className="text-xs text-gray-400 font-medium">My Classroom · {layout.name}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
              theme === 'light' 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
          >
            <Layout size={15} /> Layout
          </button>

          <button
            onClick={() => setIsConstraintsOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
              constraints.length > 0 
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                : (theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10')
            }`}
          >
            <Sliders size={15} /> Rules ({constraints.length})
          </button>

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
              isEditMode 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : (theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10')
            }`}
          >
            <Edit3 size={15} /> {isEditMode ? 'Done Editing' : 'Edit Layout'}
          </button>

          <button
            onClick={handleRandomize}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-pink-500/25 active:scale-95 transition-all"
          >
            <Shuffle size={15} /> Regenerate
          </button>
        </div>
      </div>

      {/* Main Seating Canvas */}
      <SeatingCanvas
        theme={theme}
        seats={layout.seats}
        students={students}
        assignment={assignment}
        isEditMode={isEditMode}
        onSeatClick={(seat, student) => setSelectedSeat({ seat, student })}
        onSwapStudents={handleSwapStudents}
        onAddSeat={handleAddSeat}
        onRemoveSeat={handleRemoveSeat}
      />

      {/* Modals & Popovers */}
      {selectedSeat && selectedSeat.student && (
        <StudentDetailPopover
          theme={theme}
          seat={selectedSeat.seat}
          student={selectedSeat.student}
          onClose={() => setSelectedSeat(null)}
          onIncrementParticipation={handleIncrementParticipation}
        />
      )}

      {isConfigOpen && (
        <SeatingConfigModal
          theme={theme}
          onClose={() => setIsConfigOpen(false)}
          onCreate={handleCreateLayout}
        />
      )}

      {isConstraintsOpen && (
        <SeatingConstraintsModal
          theme={theme}
          students={students}
          constraints={constraints}
          onClose={() => setIsConstraintsOpen(false)}
          onSaveConstraints={(newConstraints) => setConstraints(newConstraints)}
        />
      )}
    </div>
  );
};
