
import React from 'react';
import { GitMerge, X } from 'lucide-react';
import { GROUP_COLORS, getColorConfig } from './constants';

interface ExistingGroup {
    groupId: string;
    groupTitle: string;
    groupColor: string;
}

interface MergeToolbarProps {
    pendingGroupTitle: string;
    setPendingGroupTitle: (title: string) => void;
    pendingGroupColor: string;
    setPendingGroupColor: (color: string) => void;
    selectedForMerge: Set<string>;
    mergeSelected: () => void;
    existingGroups: ExistingGroup[];
    addToGroup: (groupId: string, groupTitle: string, groupColor?: string) => void;
    cancelMergeMode: () => void;
}

export const MergeToolbar: React.FC<MergeToolbarProps> = ({
    pendingGroupTitle, setPendingGroupTitle,
    pendingGroupColor, setPendingGroupColor,
    selectedForMerge, mergeSelected,
    existingGroups, addToGroup, cancelMergeMode,
}) => {
    return (
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/80 border-b border-white/10 backdrop-blur-md shrink-0 z-20 shadow-lg">
            <GitMerge size={16} className="text-blue-400 shrink-0" />

            {/* Group name input */}
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Group Name</span>
                <input
                    type="text"
                    value={pendingGroupTitle}
                    onChange={e => setPendingGroupTitle(e.target.value)}
                    placeholder="e.g. Feedback Round"
                    className="bg-white/10 border border-white/20 text-white text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 w-44 placeholder-white/30 transition-colors"
                />
            </div>

            {/* Color picker */}
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Color</span>
                <div className="flex gap-1.5">
                    {GROUP_COLORS.map(c => (
                        <button key={c.accent} onClick={(e) => { e.stopPropagation(); setPendingGroupColor(c.accent); }}
                            title={c.label}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${pendingGroupColor === c.accent ? 'border-white scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c.accent }} />
                    ))}
                </div>
            </div>

            <div className="h-8 w-px bg-white/10 mx-1" />

            <span className="text-sm text-white/60">
                {selectedForMerge.size === 0
                    ? 'Click columns to select'
                    : `${selectedForMerge.size} column${selectedForMerge.size > 1 ? 's' : ''} selected`}
            </span>

            {selectedForMerge.size >= 2 && (
                <button onClick={mergeSelected}
                    className="px-4 py-1.5 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110 shadow-md"
                    style={{ backgroundColor: pendingGroupColor }}>
                    Merge {selectedForMerge.size} Columns
                </button>
            )}

            {/* Add to existing group */}
            {existingGroups.length > 0 && selectedForMerge.size >= 1 && (
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/40">Add to:</span>
                    {existingGroups.map(g => {
                        const cc = getColorConfig(g.groupColor);
                        return (
                            <button key={g.groupId}
                                onClick={() => addToGroup(g.groupId, g.groupTitle, g.groupColor)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors"
                                style={{ color: cc.accent, borderColor: cc.border, backgroundColor: cc.bg }}>
                                "{g.groupTitle}"
                            </button>
                        );
                    })}
                </div>
            )}

            <button onClick={cancelMergeMode} className="ml-auto p-1.5 text-white/40 hover:text-white transition-colors">
                <X size={16} />
            </button>
        </div>
    );
};
