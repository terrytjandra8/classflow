import React, { useState } from 'react';
import { Seat, StudentSeatingData, ClassroomObject, TableConnectionMode } from '../../types/seating';
import { User, Plus, Trash2, Link, Monitor, DoorOpen, Square as WindowIcon, Projector, Archive } from 'lucide-react';

interface SeatingCanvasProps {
  theme: 'light' | 'dark';
  seats: Seat[];
  students: StudentSeatingData[];
  assignment: Record<string, string>; // seatId -> studentId
  isEditMode: boolean;
  tableMode?: TableConnectionMode;
  classroomObjects?: ClassroomObject[];
  onSeatClick: (seat: Seat, student?: StudentSeatingData) => void;
  onSwapStudents: (seatId1: string, seatId2: string) => void;
  onAddSeat?: () => void;
  onRemoveSeat?: (seatId: string) => void;
  onRemoveObject?: (objectId: string) => void;
  onMoveSeat?: (seatId: string, targetX: number, targetY: number) => void;
  onMoveObject?: (objectId: string, targetX: number, targetY: number) => void;
  onAddObject?: (type: 'teacher_desk' | 'exit_door' | 'window' | 'cabinet' | 'projector') => void;
}

const SquareIcon = ({ size }: { size: number }) => (
  <div style={{ width: size, height: size }} className="border border-current rounded" />
);

// Map classroom object types to icons and styling
const OBJECT_CONFIG: Record<string, { icon: React.ReactNode; bg: string; border: string; emoji: string }> = {
  teacher_desk: { icon: <Monitor size={18} />, bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/40', emoji: '🖥️' },
  exit_door: { icon: <DoorOpen size={18} />, bg: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/40', emoji: '🚪' },
  window: { icon: <WindowIcon size={18} />, bg: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/40', emoji: '🪟' },
  cabinet: { icon: <Archive size={18} />, bg: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/40', emoji: '🗄️' },
  projector: { icon: <Projector size={18} />, bg: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/40', emoji: '📽️' },
  custom: { icon: <SquareIcon size={18} />, bg: 'from-gray-500/20 to-slate-500/20', border: 'border-gray-500/40', emoji: '📦' },
};

export const SeatingCanvas: React.FC<SeatingCanvasProps> = ({
  theme,
  seats,
  students,
  assignment,
  isEditMode,
  tableMode = 'pairs',
  classroomObjects = [],
  onSeatClick,
  onSwapStudents,
  onAddSeat,
  onRemoveSeat,
  onRemoveObject,
  onMoveSeat,
  onMoveObject,
  onAddObject,
}) => {
  const [draggedNode, setDraggedNode] = useState<{ type: 'seat' | 'object' | 'student'; id: string } | null>(null);

  const getStudent = (studentId?: string) => students.find(s => s.id === studentId);

  const handleDragStartNode = (e: React.DragEvent, type: 'seat' | 'object' | 'student', id: string) => {
    setDraggedNode({ type, id });
    e.dataTransfer.setData('application/json', JSON.stringify({ type, id }));
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleCellDrop = (e: React.DragEvent, gridX: number, gridY: number, targetSeatId?: string) => {
    e.preventDefault();
    let data: { type: 'seat' | 'object' | 'student'; id: string } | null = draggedNode;
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) data = JSON.parse(raw);
    } catch {}

    if (!data) return;

    if (data.type === 'student' || (!isEditMode && data.type === 'seat')) {
      if (targetSeatId && data.id !== targetSeatId) {
        onSwapStudents(data.id, targetSeatId);
      }
    } else if (isEditMode) {
      if (data.type === 'object' && onMoveObject) {
        onMoveObject(data.id, gridX, gridY);
      } else if (data.type === 'seat' && onMoveSeat) {
        onMoveSeat(data.id, gridX, gridY);
      }
    }
    setDraggedNode(null);
  };

  // Compute grid dimensions from seats + objects
  const allX = [...seats.map(s => s.x), ...classroomObjects.map(o => o.x + (o.width || 1) - 1)];
  const allY = [...seats.map(s => s.y), ...classroomObjects.map(o => o.y + (o.height || 1) - 1)];
  const minX = Math.min(...allX, 0);
  const minY = Math.min(...allY, -4);
  const maxX = Math.max(...allX, 3);
  const maxY = Math.max(...allY, 3);
  
  // Offset to make all positions positive (grid is 1-indexed)
  const offsetX = Math.abs(Math.min(minX, 0));
  const offsetY = Math.abs(Math.min(minY, 0));
  const gridCols = maxX + offsetX + 2;
  const gridRows = maxY + offsetY + 2;

  // Determine if two adjacent seats should be visually connected
  const getSeatConnections = (seat: Seat) => {
    if (tableMode === 'individual') return { left: false, right: false, top: false, bottom: false };
    
    const hasNeighbor = (dx: number, dy: number) => 
      seats.some(s => s.x === seat.x + dx && s.y === seat.y + dy);

    if (tableMode === 'pairs') {
      // Connect pairs: seats at even/odd col positions that are adjacent
      const colInGroup = seat.col !== undefined ? seat.col % 2 : 0;
      return {
        left: colInGroup === 1 && hasNeighbor(-1, 0),
        right: colInGroup === 0 && hasNeighbor(1, 0),
        top: false,
        bottom: false,
      };
    }

    if (tableMode === 'connected_rows') {
      return {
        left: hasNeighbor(-1, 0),
        right: hasNeighbor(1, 0),
        top: false,
        bottom: false,
      };
    }

    if (tableMode === 'islands') {
      return {
        left: hasNeighbor(-1, 0) && seats.find(s => s.x === seat.x - 1 && s.y === seat.y)?.groupId === seat.groupId,
        right: hasNeighbor(1, 0) && seats.find(s => s.x === seat.x + 1 && s.y === seat.y)?.groupId === seat.groupId,
        top: hasNeighbor(0, -1) && seats.find(s => s.x === seat.x && s.y === seat.y - 1)?.groupId === seat.groupId,
        bottom: hasNeighbor(0, 1) && seats.find(s => s.x === seat.x && s.y === seat.y + 1)?.groupId === seat.groupId,
      };
    }

    return { left: false, right: false, top: false, bottom: false };
  };

  const [viewStyle, setViewStyle] = useState<'excel' | 'modern'>('excel');

  const isDark = theme === 'dark';

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 md:p-6 overflow-auto">
      {/* Top Style Selector: Excel Dropdown Pills vs Modern Cards */}
      <div className="mb-4 flex items-center justify-between w-full max-w-5xl px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">View Mode:</span>
          <button
            onClick={() => setViewStyle('excel')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
              viewStyle === 'excel'
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                : (isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600')
            }`}
          >
            📊 Simple Mode
          </button>
          <button
            onClick={() => setViewStyle('modern')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
              viewStyle === 'modern'
                ? 'bg-pink-500 text-white border-pink-400 shadow-md'
                : (isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600')
            }`}
          >
            🎨 Card View
          </button>
        </div>

        {/* Unseated / Checklist count indicator */}
        <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {Object.keys(assignment).length} / {students.length} Seated
          </span>
        </div>
      </div>

      {/* Canvas Grid Container */}
      <div 
        className={`relative p-4 md:p-8 rounded-3xl border backdrop-blur-md mx-auto transition-all ${
          isDark ? 'bg-[#18181c] border-white/10' : 'bg-white border-slate-200 shadow-xl'
        }`}
        style={{ minWidth: 'fit-content' }}
      >
        <div 
          className="grid gap-2 relative"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(110px, 1fr))`,
            gridTemplateRows: `repeat(${gridRows}, auto)`,
          }}
        >
          {/* Empty Cell Drop Targets (Edit Mode) */}
          {isEditMode && Array.from({ length: gridRows }).map((_, rIdx) => {
            const rawY = rIdx - offsetY;
            return Array.from({ length: gridCols }).map((_, cIdx) => {
              const rawX = cIdx - offsetX;
              const isOccupiedBySeat = seats.some(s => s.x === rawX && s.y === rawY);
              const isOccupiedByObj = classroomObjects.some(o => 
                rawX >= o.x && rawX < o.x + (o.width || 1) &&
                rawY >= o.y && rawY < o.y + (o.height || 1)
              );

              if (isOccupiedBySeat || isOccupiedByObj) return null;

              return (
                <div
                  key={`drop_slot_${rawX}_${rawY}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleCellDrop(e, rawX, rawY)}
                  style={{
                    gridRowStart: rIdx + 1,
                    gridColumnStart: cIdx + 1,
                  }}
                  className={`min-h-[100px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                    isDark ? 'border-pink-500/20 bg-pink-500/[0.02] hover:bg-pink-500/10 hover:border-pink-400' : 'border-pink-300/40 bg-pink-50/20 hover:bg-pink-50 hover:border-pink-400'
                  }`}
                >
                  <span className="text-[10px] font-bold text-pink-400/50">Move Here</span>
                </div>
              );
            });
          })}
          {/* Classroom Objects */}
          {classroomObjects.map((obj) => {
            const config = OBJECT_CONFIG[obj.type] || OBJECT_CONFIG.custom;
            const isVertical = obj.orientation === 'vertical' || (obj.height || 1) > (obj.width || 1);

            return (
              <div
                key={obj.id}
                draggable={isEditMode}
                onDragStart={(e) => handleDragStartNode(e, 'object', obj.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleCellDrop(e, obj.x, obj.y)}
                style={{
                  gridColumnStart: obj.x + offsetX + 1,
                  gridColumnEnd: obj.x + offsetX + 1 + (obj.width || 1),
                  gridRowStart: obj.y + offsetY + 1,
                  gridRowEnd: obj.y + offsetY + 1 + (obj.height || 1),
                }}
                className={`relative flex ${isVertical ? 'flex-col justify-around py-3' : 'flex-row justify-center'} items-center gap-1.5 px-3 py-2 rounded-2xl border-2 border-dashed bg-gradient-to-br ${config.bg} ${config.border} transition-all shadow-sm ${
                  isEditMode ? 'cursor-grab active:cursor-grabbing hover:border-pink-400 hover:scale-105 shadow-md' : ''
                } ${draggedNode?.id === obj.id ? 'opacity-40 scale-95' : ''}`}
              >
                <span className="text-xl">{config.emoji}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${isVertical ? 'rotate-90 md:rotate-0 text-center' : ''} ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                  {obj.label}
                </span>
                {isEditMode && onRemoveObject && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRemoveObject(obj.id); }}
                    title={`Remove ${obj.label}`}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 shadow-lg z-20 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* Seat Cards (Supports both Excel Dropdown Pill style and Modern Card View) */}
          {seats.map((seat) => {
            const studentId = assignment[seat.id];
            const student = getStudent(studentId);
            const connections = getSeatConnections(seat);

            if (viewStyle === 'excel') {
              // EXCEL DROPDOWN PILL STYLE (as seen in Google Sheets)
              return (
                <div
                  key={seat.id}
                  draggable={isEditMode || !!student}
                  onDragStart={(e) => handleDragStartNode(e, isEditMode ? 'seat' : 'student', seat.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleCellDrop(e, seat.x, seat.y, seat.id)}
                  onClick={() => onSeatClick(seat, student)}
                  style={{
                    gridRowStart: seat.y + offsetY + 1,
                    gridColumnStart: seat.x + offsetX + 1,
                  }}
                  className={`
                    group relative flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all select-none min-w-[130px] min-h-[48px] shadow-xs
                    ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                    ${student 
                      ? (isDark 
                          ? 'bg-[#22222a] border-slate-700 text-white hover:border-pink-500 hover:shadow-md' 
                          : 'bg-slate-100 border-slate-300 text-slate-900 hover:border-pink-400 hover:bg-slate-50') 
                      : (isDark 
                          ? 'bg-white/[0.02] border-white/10 text-gray-500 border-dashed hover:border-pink-400' 
                          : 'bg-white border-slate-200 text-slate-400 border-dashed hover:border-pink-300')
                    }
                    ${draggedNode?.id === seat.id ? 'opacity-40 scale-95' : 'hover:scale-[1.02]'}
                  `}
                >
                  {/* Student Name or Empty Dropdown Label */}
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {student ? (
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        student.gender === 'female' ? 'bg-pink-400' : student.gender === 'male' ? 'bg-blue-400' : 'bg-purple-400'
                      }`} />
                    ) : (
                      <span className="text-[10px] font-mono text-gray-500">{seat.label}</span>
                    )}
                    <span className={`text-xs font-semibold truncate ${student ? (isDark ? 'text-gray-100' : 'text-slate-800') : 'text-gray-400 italic'}`}>
                      {student ? student.name : 'Select student...'}
                    </span>
                  </div>

                  {/* Dropdown Arrow & Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                    {student?.linkedProfileId && (
                      <span className="text-emerald-400" title="Linked profile">
                        <Link size={10} />
                      </span>
                    )}
                    {isEditMode && onRemoveSeat ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRemoveSeat(seat.id); }}
                        className="text-gray-400 hover:text-red-400 p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : (
                      <div className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] ${
                        isDark ? 'border-t-gray-400' : 'border-t-slate-500'
                      }`} />
                    )}
                  </div>
                </div>
              );
            }

            // MODERN CARD VIEW STYLE
            return (
              <div
                key={seat.id}
                draggable={isEditMode || !!student}
                onDragStart={(e) => handleDragStartNode(e, isEditMode ? 'seat' : 'student', seat.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleCellDrop(e, seat.x, seat.y, seat.id)}
                onClick={() => onSeatClick(seat, student)}
                style={{
                  gridRowStart: seat.y + offsetY + 1,
                  gridColumnStart: seat.x + offsetX + 1,
                }}
                className={`
                  group relative flex flex-col items-center justify-between p-2.5 transition-all select-none min-h-[100px]
                  ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                  ${student 
                    ? `bg-gradient-to-br ${isDark ? 'from-pink-500/10 via-purple-500/10 to-indigo-500/10' : 'from-pink-50 via-purple-50 to-indigo-50'} hover:shadow-lg hover:shadow-pink-500/20` 
                    : `${isDark ? 'bg-white/[0.03]' : 'bg-white'} border-dashed hover:border-pink-300`
                  }
                  ${draggedNode?.id === seat.id ? 'opacity-40 scale-95' : 'hover:scale-[1.02]'}
                  ${connections.left ? 'rounded-l-none border-l-0 -ml-0.5' : 'rounded-l-2xl'}
                  ${connections.right ? 'rounded-r-none border-r-0 -mr-0.5' : 'rounded-r-2xl'}
                  ${connections.top ? 'rounded-t-none border-t-0 -mt-0.5' : 'rounded-t-2xl'}
                  ${connections.bottom ? 'rounded-b-none border-b-0 -mb-0.5' : 'rounded-b-2xl'}
                  border-2 ${student 
                    ? (isDark ? 'border-pink-500/30' : 'border-pink-200') 
                    : (isDark ? 'border-white/10' : 'border-slate-200')
                  }
                `}
              >
                {/* Seat Label */}
                <div className="w-full flex items-center justify-between text-[10px] font-extrabold">
                  <span className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-black/30 text-pink-300' : 'bg-pink-100 text-pink-600'}`}>
                    {seat.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {student?.linkedProfileId && (
                      <span className="text-emerald-400" title="Linked to registered account">
                        <Link size={10} />
                      </span>
                    )}
                    {isEditMode && onRemoveSeat && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRemoveSeat(seat.id); }}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Student Info */}
                <div className="my-2 flex flex-col items-center text-center flex-1 justify-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mb-1 shadow-sm ${
                    student 
                      ? `bg-gradient-to-tr ${student.gender === 'female' ? 'from-pink-400 to-rose-500' : student.gender === 'male' ? 'from-blue-400 to-indigo-500' : 'from-pink-500 to-purple-600'} text-white` 
                      : `${isDark ? 'bg-white/5 text-gray-600 border border-white/5' : 'bg-slate-100 text-slate-400 border border-slate-200'}`
                  }`}>
                    {student ? student.name.charAt(0).toUpperCase() : <User size={14} />}
                  </div>
                  <p className={`text-[11px] font-bold truncate max-w-[95px] leading-tight ${
                    student 
                      ? (isDark ? 'text-white' : 'text-slate-800') 
                      : (isDark ? 'text-gray-500 italic' : 'text-slate-400 italic')
                  }`}>
                    {student ? student.name : 'Empty'}
                  </p>
                </div>

                {/* Participation Badge */}
                {student && (
                  <div className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    isDark 
                      ? 'bg-pink-500/20 border border-pink-500/30 text-pink-300' 
                      : 'bg-pink-100 border border-pink-200 text-pink-600'
                  }`}>
                    ⭐ {student.participationScore}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Mode Toolbar */}
      {isEditMode && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 p-3 rounded-2xl border bg-black/20 border-white/10 shadow-xl backdrop-blur-md">
          <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5 mr-2">
            ✨ Smart Canvas Edit Mode: <span className="text-gray-300 font-normal">Drag any seat or furniture node to reposition!</span>
          </span>

          {onAddSeat && (
            <button
              onClick={onAddSeat}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors ${
                isDark 
                  ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 hover:bg-pink-500/30' 
                  : 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100'
              }`}
            >
              <Plus size={14} /> Seat
            </button>
          )}

          {onAddObject && (
            <>
              <button
                onClick={() => onAddObject('teacher_desk')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 font-bold text-xs transition-colors"
              >
                🖥️ + Desk
              </button>
              <button
                onClick={() => onAddObject('exit_door')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 font-bold text-xs transition-colors"
              >
                🚪 + Door
              </button>
              <button
                onClick={() => onAddObject('window')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 font-bold text-xs transition-colors"
              >
                🪟 + Window
              </button>
              <button
                onClick={() => onAddObject('cabinet')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-bold text-xs transition-colors"
              >
                🗄️ + Cabinet
              </button>
              <button
                onClick={() => onAddObject('projector')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 font-bold text-xs transition-colors"
              >
                📽️ + Screen
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
