import React, { useState, useEffect } from 'react';
import { Armchair, Shuffle, Sliders, Edit3, Layout, Users, RefreshCw, ArrowLeft } from 'lucide-react';
import { Seat, SeatingLayout, StudentSeatingData, SeatingConstraint, ClassroomObject } from '../../types/seating';
import { seatingService } from '../../services/seatingService';
import { seatingStudentService } from '../../services/seatingStudentService';
import { profileService } from '../../services/profileService';
import { SeatingCanvas } from './SeatingCanvas';
import { StudentDetailPopover } from './StudentDetailPopover';
import { SeatingConfigModal } from './SeatingConfigModal';
import { SeatingConstraintsModal } from './SeatingConstraintsModal';
import { StudentRosterModal } from './StudentRosterModal';

import { ClassGroup } from '../../types';

interface SeatingModuleProps {
  theme: 'light' | 'dark';
  classes?: ClassGroup[];
  selectedClass?: string;
  onSelectClass?: (className: string) => void;
  isFullScreen?: boolean;
  onExitFullScreen?: () => void;
}

export const SeatingModule: React.FC<SeatingModuleProps> = ({ 
  theme, 
  classes = [], 
  selectedClass = 'Grade 10-A',
  onSelectClass,
  isFullScreen,
  onExitFullScreen
}) => {
  const [seatingClassList, setSeatingClassList] = useState<string[]>(['Grade 9 Economics']);
  const [activeClass, setActiveClass] = useState<string>('Grade 9 Economics');

  // Load distinct seating classes owned by user
  useEffect(() => {
    const loadSeatingClasses = async () => {
      const savedClasses = await seatingStudentService.getSeatingClassNames();
      if (savedClasses && savedClasses.length > 0) {
        setSeatingClassList(savedClasses);
        setActiveClass(prev => savedClasses.includes(prev) ? prev : savedClasses[0]);
      }
    };
    loadSeatingClasses();
  }, []);

  // State
  const [students, setStudents] = useState<StudentSeatingData[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [layout, setLayout] = useState<SeatingLayout>(() => 
    seatingService.createLayout(`${activeClass} Layout`, activeClass, 'rows_cols', 4, 6, true, 'pairs')
  );
  const [constraints, setConstraints] = useState<SeatingConstraint[]>([]);
  const [assignment, setAssignment] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Panels
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isConstraintsOpen, setIsConstraintsOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<{ seat: Seat; student?: StudentSeatingData } | null>(null);

  // Load class students & saved layout from database / localStorage
  useEffect(() => {
    const loadClassData = async () => {
      setLoading(true);
      try {
        // Fetch registered profiles for linking pickers
        const realProfiles = await profileService.getRelevantStudents();
        setRegisteredStudents(realProfiles || []);

        // Load seating students specifically for active class
        const dbStudents = await seatingStudentService.getStudentsByClass(activeClass);
        let currentStudents: StudentSeatingData[];

        if (dbStudents && dbStudents.length > 0) {
          currentStudents = dbStudents.map(seatingStudentService.toStudentSeatingData);
        } else {
          currentStudents = seatingService.getDefaultStudents();
        }
        setStudents(currentStudents);

        // Load saved layout & assignment from DB / localStorage
        const savedData = await seatingStudentService.getClassLayout(activeClass);
        if (savedData && savedData.layout) {
          setLayout(savedData.layout);
          setAssignment(savedData.assignment || seatingService.randomizeAssignments(savedData.layout.seats, currentStudents, constraints));
        } else {
          const newLayout = seatingService.createLayout(`${activeClass} Layout`, activeClass, 'rows_cols', 4, 6, true, 'pairs');
          setLayout(newLayout);
          setAssignment(seatingService.randomizeAssignments(newLayout.seats, currentStudents, constraints));
        }
      } catch (err) {
        console.error("Error loading seating module data:", err);
        const fallback = seatingService.getDefaultStudents();
        setStudents(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadClassData();
  }, [activeClass]);

  // Auto-persist layout and student assignments on changes
  useEffect(() => {
    if (loading || !activeClass) return;
    seatingStudentService.saveClassLayout(activeClass, { layout, assignment });
  }, [layout, assignment, activeClass, loading]);

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

  const handleCreateLayout = (
    name: string, 
    preset: any, 
    rows: number, 
    cols: number, 
    hasAisle: boolean, 
    tableMode: any,
    aislePositions: number[] = [],
    classroomObjects: ClassroomObject[] = []
  ) => {
    const newLayout = seatingService.createLayout(name, activeClass, preset, rows, cols, hasAisle, tableMode, aislePositions, classroomObjects);
    setLayout(newLayout);
    setAssignment(seatingService.randomizeAssignments(newLayout.seats, students, constraints));
    setIsConfigOpen(false);
  };

  const handleClassChange = (newClassName: string) => {
    setSeatingClassList(prev => Array.from(new Set([...prev, newClassName])));
    setActiveClass(newClassName);
    if (onSelectClass) onSelectClass(newClassName);
    const newLayout = seatingService.createLayout(`${newClassName} Layout`, newClassName, layout.preset, layout.rows, layout.cols, layout.hasAisle, layout.tableMode);
    setLayout(newLayout);
  };

  const handleAddSeat = () => {
    const newSeatId = `seat_${Date.now()}`;
    const newSeat: Seat = {
      id: newSeatId,
      label: `S${layout.seats.length + 1}`,
      x: (layout.seats.length % 6),
      y: Math.floor(layout.seats.length / 6),
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

  const handleRemoveObject = (objectId: string) => {
    setLayout(prev => ({
      ...prev,
      classroomObjects: (prev.classroomObjects || []).filter(o => o.id !== objectId),
    }));
  };

  const handleMoveSeat = (seatId: string, targetX: number, targetY: number) => {
    setLayout(prev => ({
      ...prev,
      seats: prev.seats.map(s => s.id === seatId ? { ...s, x: targetX, y: targetY } : s),
    }));
  };

  const handleMoveObject = (objectId: string, targetX: number, targetY: number) => {
    setLayout(prev => ({
      ...prev,
      classroomObjects: (prev.classroomObjects || []).map(o => o.id === objectId ? { ...o, x: targetX, y: targetY } : o),
    }));
  };

  const handleAddObject = (type: 'teacher_desk' | 'exit_door' | 'window' | 'cabinet' | 'projector') => {
    const labels: Record<string, string> = {
      teacher_desk: "Teacher's Desk",
      exit_door: "Exit Door",
      window: "Window",
      cabinet: "Cabinet",
      projector: "Projector Screen",
    };
    const isVertical = type === 'exit_door' || type === 'window';
    const newObj: ClassroomObject = {
      id: `obj_${Date.now()}`,
      type,
      label: labels[type] || 'Object',
      x: Math.floor(layout.cols / 2),
      y: 0,
      width: type === 'teacher_desk' || type === 'projector' ? 3 : 1,
      height: isVertical ? 2 : 1,
      orientation: isVertical ? 'vertical' : 'horizontal',
    };
    setLayout(prev => ({
      ...prev,
      classroomObjects: [...(prev.classroomObjects || []), newObj],
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Module Top Bar */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#141418] border-white/10 text-white'
      }`}>
        <div className="flex items-center gap-3">
          {onExitFullScreen && (
            <button
              onClick={onExitFullScreen}
              title="Back to Boards"
              className={`p-2 rounded-xl border transition-all ${
                theme === 'light' 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
              }`}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20">
            <Armchair size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl leading-tight">Classroom Seating:</h1>
              {/* Class Selector Dropdown with "+ New Custom Class" option */}
              <div className="flex items-center gap-1.5">
                <select
                  value={activeClass}
                  onChange={(e) => {
                    if (e.target.value === '__ADD_NEW_CLASS__') {
                      const newName = prompt('Enter new class name (e.g. Grade 9 Economics):');
                      if (newName && newName.trim()) {
                        handleClassChange(newName.trim());
                      }
                    } else {
                      handleClassChange(e.target.value);
                    }
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${
                    theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-white/10 border-white/10 text-pink-300'
                  }`}
                >
                  <optgroup label="Seating Classes">
                    {Array.from(new Set([...seatingClassList, activeClass])).map(c => (
                      <option key={c} value={c} className="bg-[#18181c] text-white">{c}</option>
                    ))}
                  </optgroup>
                  <option value="__ADD_NEW_CLASS__" className="bg-[#18181c] text-pink-400 font-bold">
                    ➕ + Create New Class Seating...
                  </option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              {layout.name} · {layout.cols} Cols × {layout.rows} Rows · {layout.tableMode.toUpperCase()} Mode
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRosterOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
              theme === 'light' 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
          >
            <Users size={15} /> Roster ({students.length})
          </button>

          <button
            onClick={() => setIsConfigOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
              theme === 'light' 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
          >
            <Layout size={15} /> Layout & Furniture
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
            <Shuffle size={15} /> Auto-Arrange
          </button>
        </div>
      </div>

      {/* Main Seating Canvas */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
          <RefreshCw className="animate-spin mr-2" size={16} /> Loading classroom layout & students...
        </div>
      ) : (
        <SeatingCanvas
          theme={theme}
          seats={layout.seats}
          students={students}
          assignment={assignment}
          classroomObjects={layout.classroomObjects}
          tableMode={layout.tableMode}
          isEditMode={isEditMode}
          onSeatClick={(seat, student) => setSelectedSeat({ seat, student })}
          onSwapStudents={handleSwapStudents}
          onAddSeat={handleAddSeat}
          onRemoveSeat={handleRemoveSeat}
          onRemoveObject={handleRemoveObject}
          onMoveSeat={handleMoveSeat}
          onMoveObject={handleMoveObject}
          onAddObject={handleAddObject}
        />
      )}

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

      {isRosterOpen && (
        <StudentRosterModal
          theme={theme}
          students={students}
          registeredStudents={registeredStudents}
          onClose={() => setIsRosterOpen(false)}
          onUpdateRoster={(updatedStudents) => {
            setStudents(updatedStudents);
            setAssignment(seatingService.randomizeAssignments(layout.seats, updatedStudents, constraints));
          }}
        />
      )}

      {isConfigOpen && (
        <SeatingConfigModal
          theme={theme}
          classes={seatingClassList}
          selectedClass={activeClass}
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
