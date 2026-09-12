import React, { useState } from 'react';
import { Seat, StudentSeatingData } from '../../types/seating';
import { User, Move, Plus, Trash2 } from 'lucide-react';

interface SeatingCanvasProps {
  theme: 'light' | 'dark';
  seats: Seat[];
  students: StudentSeatingData[];
  assignment: Record<string, string>; // seatId -> studentId
  isEditMode: boolean;
  onSeatClick: (seat: Seat, student?: StudentSeatingData) => void;
  onSwapStudents: (seatId1: string, seatId2: string) => void;
  onAddSeat?: () => void;
  onRemoveSeat?: (seatId: string) => void;
}

export const SeatingCanvas: React.FC<SeatingCanvasProps> = ({
  theme,
  seats,
  students,
  assignment,
  isEditMode,
  onSeatClick,
  onSwapStudents,
  onAddSeat,
  onRemoveSeat,
}) => {
  const [draggedSeatId, setDraggedSeatId] = useState<string | null>(null);

  const getStudent = (studentId?: string) => {
    return students.find(s => s.id === studentId);
  };

  const handleDragStart = (e: React.DragEvent, seatId: string) => {
    setDraggedSeatId(seatId);
    e.dataTransfer.setData('text/plain', seatId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSeatId: string) => {
    e.preventDefault();
    const sourceSeatId = e.dataTransfer.getData('text/plain') || draggedSeatId;
    if (sourceSeatId && sourceSeatId !== targetSeatId) {
      onSwapStudents(sourceSeatId, targetSeatId);
    }
    setDraggedSeatId(null);
  };

  // Group seats by row or render canvas grid
  const maxRow = Math.max(...seats.map(s => s.y), 3);
  const maxCol = Math.max(...seats.map(s => s.x), 3);

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-6 overflow-auto">
      {/* Whiteboard / Teacher Desk Indicator */}
      <div className="w-full max-w-4xl mb-8 flex flex-col items-center">
        <div className="w-3/4 py-2 bg-gradient-to-r from-pink-500/20 via-purple-500/30 to-pink-500/20 border-2 border-pink-500/40 rounded-xl text-center shadow-lg shadow-pink-500/10">
          <span className="text-xs font-black uppercase tracking-widest text-pink-400">
            📺 FRONT OF CLASSROOM / WHITEBOARD
          </span>
        </div>
      </div>

      {/* Grid Canvas */}
      <div 
        className="grid gap-4 max-w-5xl p-6 rounded-3xl border border-white/5 bg-black/20 backdrop-blur-md"
        style={{
          gridTemplateColumns: `repeat(${maxCol + 1}, minmax(120px, 1fr))`,
        }}
      >
        {seats.map((seat) => {
          const studentId = assignment[seat.id];
          const student = getStudent(studentId);

          return (
            <div
              key={seat.id}
              draggable
              onDragStart={(e) => handleDragStart(e, seat.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, seat.id)}
              onClick={() => onSeatClick(seat, student)}
              style={{
                gridRowStart: seat.y + 1,
                gridColumnStart: seat.x + 1,
              }}
              className={`
                group relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer select-none
                ${student ? 'bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 border-pink-500/30 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/20' : 'bg-white/5 border-dashed border-white/10 hover:border-white/30'}
                ${draggedSeatId === seat.id ? 'opacity-40 scale-95' : 'hover:scale-[1.03]'}
              `}
            >
              {/* Seat Tag */}
              <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-gray-400">
                <span className="px-1.5 py-0.5 rounded bg-black/30 text-pink-300 font-mono">
                  {seat.label}
                </span>
                {isEditMode && onRemoveSeat && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRemoveSeat(seat.id); }}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {/* Student Info */}
              <div className="my-3 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-1.5 shadow-md ${
                  student 
                    ? 'bg-gradient-to-tr from-pink-500 to-purple-600 text-white' 
                    : 'bg-white/5 text-gray-600 border border-white/5'
                }`}>
                  {student ? student.name.charAt(0) : <User size={16} />}
                </div>

                <p className={`text-xs font-bold truncate max-w-[100px] ${student ? (theme === 'light' ? 'text-slate-800' : 'text-white') : 'text-gray-500 italic'}`}>
                  {student ? student.name : 'Empty Seat'}
                </p>
              </div>

              {/* Participation Score Badge */}
              {student && (
                <div className="mt-1 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-[9px] font-bold text-pink-300">
                  Part: {student.participationScore} ★
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toolbar for Edit Mode */}
      {isEditMode && onAddSeat && (
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onAddSeat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-300 font-bold text-xs hover:bg-pink-500/30 transition-colors"
          >
            <Plus size={14} /> Add Extra Seat
          </button>
        </div>
      )}
    </div>
  );
};
