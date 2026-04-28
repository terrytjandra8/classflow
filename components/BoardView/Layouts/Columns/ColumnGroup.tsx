
import React from 'react';
import { EditableInput } from '../../../ui/EditableInput';
import { Tooltip } from '../../../Tooltip';
import { Section } from '../../../../types';
import { Palette, Ungroup } from 'lucide-react';
import { GROUP_COLORS, getColorConfig } from './constants';

interface ColumnGroupProps {
    groupId: string;
    groupTitle: string;
    groupColor: string;
    canManageBoard: boolean;
    openColorPicker: string | null;
    setOpenColorPicker: (id: string | null) => void;
    renameGroup: (groupId: string, newTitle: string) => void;
    disbandGroup: (groupId: string) => void;
    updateGroupColor: (groupId: string, color: string) => void;
    children: React.ReactNode;
}

export const ColumnGroup: React.FC<ColumnGroupProps> = ({
    groupId,
    groupTitle,
    groupColor,
    canManageBoard,
    openColorPicker,
    setOpenColorPicker,
    renameGroup,
    disbandGroup,
    updateGroupColor,
    children,
}) => {
    const cc = getColorConfig(groupColor);

    return (
        <div className="shrink-0 flex flex-col rounded-xl overflow-hidden shadow-lg"
            style={{ border: `2px solid ${cc.border}`, background: cc.bg }}
            onClick={e => e.stopPropagation()}>

            {/* Shared group header */}
            <div className="flex items-center gap-2 px-3 py-2 relative"
                style={{ backgroundColor: cc.accent + '28', borderBottom: `1px solid ${cc.border}` }}>

                {/* Editable group name */}
                <EditableInput
                    disabled={!canManageBoard}
                    className="font-bold text-base bg-transparent outline-none px-1 py-0.5 rounded border border-transparent focus:border-white/30 focus:bg-white/10 flex-1 min-w-0 transition-all"
                    style={{ color: '#ffffff' }}
                    value={groupTitle}
                    onSave={(val) => renameGroup(groupId, val)}
                />

                {canManageBoard && (
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Color picker toggle */}
                        <Tooltip content="Change group color">
                            <button
                                onClick={(e) => { e.stopPropagation(); setOpenColorPicker(openColorPicker === groupId ? null : groupId); }}
                                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                style={{ color: cc.accent }}>
                                <Palette size={13} />
                            </button>
                        </Tooltip>
                        <Tooltip content="Disband group">
                            <button onClick={() => disbandGroup(groupId)}
                                className="p-1.5 rounded-lg transition-colors text-white/40 hover:text-orange-400 hover:bg-white/10">
                                <Ungroup size={13} />
                            </button>
                        </Tooltip>
                    </div>
                )}

                {/* Color palette dropdown */}
                {openColorPicker === groupId && (
                    <div className="absolute top-full right-0 mt-1 p-2 rounded-xl bg-slate-800 border border-white/20 shadow-2xl flex gap-2 z-30"
                        onClick={e => e.stopPropagation()}>
                        {GROUP_COLORS.map(c => (
                            <button key={c.accent} onClick={() => updateGroupColor(groupId, c.accent)}
                                title={c.label}
                                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${groupColor === c.accent ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c.accent }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Sub-columns side by side */}
            <div className="flex gap-2 p-2">
                {children}
            </div>
        </div>
    );
};
