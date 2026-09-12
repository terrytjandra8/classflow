import React, { useState } from 'react';
import { X, Layers, Grid, Users, Layout } from 'lucide-react';
import { LayoutPreset } from '../../types/seating';

interface SeatingConfigModalProps {
  theme: 'light' | 'dark';
  onClose: () => void;
  onCreate: (name: string, preset: LayoutPreset, rows: number, cols: number, hasAisle: boolean) => void;
}

export const SeatingConfigModal: React.FC<SeatingConfigModalProps> = ({
  theme,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('Room 101 Layout');
  const [preset, setPreset] = useState<LayoutPreset>('rows_cols');
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [hasAisle, setHasAisle] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(name, preset, rows, cols, hasAisle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#18181c] border-white/10 text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Layout size={20} className="text-pink-500" /> Create Classroom Layout
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
              Layout Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Seating Format / Preset
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPreset('rows_cols')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  preset === 'rows_cols'
                    ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                    : (theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5')
                }`}
              >
                <Grid size={20} className="mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Rows & Columns</p>
                  <p className="text-xs text-gray-400">Classic grid layout</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPreset('islands')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  preset === 'islands'
                    ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                    : (theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5')
                }`}
              >
                <Users size={20} className="mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Islands / Groups</p>
                  <p className="text-xs text-gray-400">Collaborative clusters</p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Rows</label>
              <input
                type="number"
                min={2}
                max={10}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Columns</label>
              <input
                type="number"
                min={2}
                max={10}
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="aisle"
              checked={hasAisle}
              onChange={(e) => setHasAisle(e.target.checked)}
              className="w-4 h-4 rounded text-pink-500 accent-pink-500"
            />
            <label htmlFor="aisle" className="text-sm font-medium cursor-pointer">
              Include Center Aisle Space
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 font-bold text-sm text-white shadow-lg shadow-pink-500/25"
            >
              Generate Layout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
