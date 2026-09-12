import React, { useState } from 'react';
import { X, Grid, Users, Layout, ShieldAlert, Square, Columns, Rows, Monitor, DoorOpen, Projector } from 'lucide-react';
import { LayoutPreset, TableConnectionMode, ClassroomObject, ClassroomObjectType } from '../../types/seating';

interface SeatingConfigModalProps {
  theme: 'light' | 'dark';
  classes: string[];
  selectedClass: string;
  onClose: () => void;
  onCreate: (
    name: string, 
    preset: LayoutPreset, 
    rows: number, 
    cols: number, 
    hasAisle: boolean, 
    tableMode: TableConnectionMode,
    aislePositions: number[],
    classroomObjects: ClassroomObject[]
  ) => void;
}

const PRESET_OPTIONS: { key: LayoutPreset; label: string; desc: string; icon: React.ReactNode; color: string; tableMode: TableConnectionMode }[] = [
  { key: 'rows_cols', label: 'Standard Grid', desc: 'Paired desks in rows', icon: <Grid size={20} />, color: 'pink', tableMode: 'pairs' },
  { key: 'exam_mode', label: 'Exam Mode', desc: 'Separated individual desks', icon: <ShieldAlert size={20} />, color: 'amber', tableMode: 'individual' },
  { key: 'islands', label: 'Island Groups', desc: '2×2 group clusters', icon: <Users size={20} />, color: 'purple', tableMode: 'islands' },
];

const TABLE_OPTIONS: { key: TableConnectionMode; label: string; icon: React.ReactNode }[] = [
  { key: 'individual', label: 'Individual', icon: <Square size={14} /> },
  { key: 'pairs', label: 'Paired (2s)', icon: <Columns size={14} /> },
  { key: 'connected_rows', label: 'Connected Row', icon: <Rows size={14} /> },
  { key: 'islands', label: 'Islands (4s)', icon: <Users size={14} /> },
];

const FURNITURE_OPTIONS: { type: ClassroomObjectType; label: string; emoji: string }[] = [
  { type: 'teacher_desk', label: "Teacher's Desk", emoji: '🖥️' },
  { type: 'exit_door', label: 'Exit Door', emoji: '🚪' },
  { type: 'window', label: 'Window', emoji: '🪟' },
  { type: 'projector', label: 'Projector', emoji: '📽️' },
  { type: 'cabinet', label: 'Cabinet', emoji: '🗄️' },
];

export const SeatingConfigModal: React.FC<SeatingConfigModalProps> = ({
  theme,
  classes,
  selectedClass,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState(`${selectedClass || 'Classroom'} Layout`);
  const [preset, setPreset] = useState<LayoutPreset>('rows_cols');
  const [tableMode, setTableMode] = useState<TableConnectionMode>('pairs');
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(6);
  const [hasAisle, setHasAisle] = useState(true);
  const [aisleAfterEvery, setAisleAfterEvery] = useState(2);
  const [selectedFurniture, setSelectedFurniture] = useState<ClassroomObjectType[]>(['teacher_desk', 'exit_door']);

  const isDark = theme === 'dark';
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 ${
    isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
  }`;
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5';

  const computeAislePositions = (): number[] => {
    if (!hasAisle || tableMode === 'individual' || tableMode === 'islands') return [];
    const positions: number[] = [];
    for (let c = aisleAfterEvery - 1; c < cols - 1; c += aisleAfterEvery) {
      positions.push(c);
    }
    return positions;
  };

  const buildClassroomObjects = (): ClassroomObject[] => {
    const objects: ClassroomObject[] = [];
    let objIndex = 0;

    for (const type of selectedFurniture) {
      objIndex++;
      const furniture = FURNITURE_OPTIONS.find(f => f.type === type);
      if (!furniture) continue;

      if (type === 'teacher_desk') {
        objects.push({
          id: `obj_${type}_${objIndex}`,
          type,
          label: furniture.label,
          x: Math.floor(cols / 2) - 1,
          y: -2,
          width: 3,
          height: 1,
          position: 'top',
        });
      } else if (type === 'exit_door') {
        objects.push({
          id: `obj_${type}_${objIndex}`,
          type,
          label: furniture.label,
          x: -2,
          y: Math.floor(rows / 2),
          width: 1,
          height: 1,
          position: 'left',
        });
      } else if (type === 'window') {
        objects.push({
          id: `obj_${type}_${objIndex}`,
          type,
          label: furniture.label,
          x: cols + 1,
          y: 0,
          width: 1,
          height: Math.min(rows, 3),
          position: 'right',
        });
      } else if (type === 'projector') {
        objects.push({
          id: `obj_${type}_${objIndex}`,
          type,
          label: furniture.label,
          x: Math.floor(cols / 2),
          y: -3,
          width: 2,
          height: 1,
          position: 'top',
        });
      } else if (type === 'cabinet') {
        objects.push({
          id: `obj_${type}_${objIndex}`,
          type,
          label: furniture.label,
          x: -2,
          y: 0,
          width: 1,
          height: 2,
          position: 'left',
        });
      }
    }
    return objects;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(name, preset, rows, cols, hasAisle, tableMode, computeAislePositions(), buildClassroomObjects());
  };

  const toggleFurniture = (type: ClassroomObjectType) => {
    setSelectedFurniture(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Mini preview
  const previewCols = Math.min(cols, 8);
  const previewRows = Math.min(rows, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border transition-all custom-scrollbar ${
          isDark ? 'bg-[#18181c] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2 font-bold text-lg">
            <Layout size={20} className="text-pink-500" /> Create Layout
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Layout Name */}
          <div>
            <label className={labelClass}>Layout Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
          </div>

          {/* Preset Format */}
          <div>
            <label className={labelClass}>Preset Format</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { setPreset(opt.key); setTableMode(opt.tableMode); }}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                    preset === opt.key
                      ? `border-${opt.color}-500 bg-${opt.color}-500/10 text-${opt.color}-400 font-bold ring-1 ring-${opt.color}-500/30`
                      : (isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')
                  }`}
                >
                  {opt.icon}
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[10px] text-gray-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Table Arrangement */}
          <div>
            <label className={labelClass}>Desk & Table Arrangement</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TABLE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTableMode(opt.key)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all ${
                    tableMode === opt.key 
                      ? 'border-pink-500 bg-pink-500/10 text-pink-300 ring-1 ring-pink-500/30' 
                      : (isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200')
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rows & Columns */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rows (max 12)</label>
              <input
                type="number" min={1} max={12} value={rows}
                onChange={(e) => setRows(Math.min(12, Math.max(1, Number(e.target.value))))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Columns (max 12)</label>
              <input
                type="number" min={1} max={12} value={cols}
                onChange={(e) => setCols(Math.min(12, Math.max(1, Number(e.target.value))))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Aisle Configuration */}
          {tableMode !== 'individual' && tableMode !== 'islands' && (
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox" id="aisle" checked={hasAisle}
                  onChange={(e) => setHasAisle(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-500 accent-pink-500"
                />
                <label htmlFor="aisle" className="text-sm font-medium cursor-pointer">Include Aisle Spacing</label>
              </div>
              {hasAisle && (
                <div>
                  <label className={labelClass}>Aisle After Every N Desks</label>
                  <input
                    type="number" min={1} max={cols} value={aisleAfterEvery}
                    onChange={(e) => setAisleAfterEvery(Math.min(cols, Math.max(1, Number(e.target.value))))}
                    className={inputClass}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Creates {computeAislePositions().length} aisle(s) for {cols} columns
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Classroom Furniture */}
          <div>
            <label className={labelClass}>Classroom Furniture</label>
            <div className="flex flex-wrap gap-2">
              {FURNITURE_OPTIONS.map(f => (
                <button
                  key={f.type}
                  type="button"
                  onClick={() => toggleFurniture(f.type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    selectedFurniture.includes(f.type)
                      ? 'border-pink-500 bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/30'
                      : (isDark ? 'bg-white/5 border-white/5 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-500')
                  }`}
                >
                  <span>{f.emoji}</span> {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mini Preview */}
          <div>
            <label className={labelClass}>Preview ({rows}×{cols})</label>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
              <div className="flex flex-col items-center gap-1">
                {/* Whiteboard indicator */}
                <div className={`w-full max-w-[200px] h-3 rounded-full mb-2 ${isDark ? 'bg-blue-500/30' : 'bg-blue-200'}`} />
                
                {/* Seat grid preview */}
                <div className="flex flex-col gap-1">
                  {Array.from({ length: previewRows }).map((_, r) => (
                    <div key={r} className="flex gap-0.5 items-center">
                      {Array.from({ length: previewCols }).map((_, c) => {
                        const isAisle = hasAisle && computeAislePositions().includes(c) && tableMode !== 'individual' && tableMode !== 'islands';
                        return (
                          <React.Fragment key={c}>
                            <div className={`w-4 h-4 rounded-sm ${
                              isDark ? 'bg-pink-500/30 border border-pink-500/20' : 'bg-pink-200 border border-pink-300'
                            }`} />
                            {isAisle && <div className="w-2" />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {cols > previewCols && <p className="text-[9px] text-gray-500 mt-1">...and {cols - previewCols} more columns</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 font-bold text-sm text-white shadow-lg shadow-pink-500/25 active:scale-[0.98] transition-all"
            >
              Generate Layout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
