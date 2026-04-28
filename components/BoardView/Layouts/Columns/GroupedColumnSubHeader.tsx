
import React from 'react';
import { EditableInput } from '../../../ui/EditableInput';
import { Tooltip } from '../../../Tooltip';
import { Section } from '../../../../types';
import { IconLock, IconHidden } from '../../../Icons';
import { Ungroup } from 'lucide-react';

interface GroupedColumnSubHeaderProps {
    section: Section;
    canManageBoard: boolean;
    renameSection: (id: string, title: string) => void;
    unmergeSection: (id: string) => void;
    groupTextColor?: string;
}

export const GroupedColumnSubHeader: React.FC<GroupedColumnSubHeaderProps> = ({
    section,
    canManageBoard,
    renameSection,
    unmergeSection,
    groupTextColor,
}) => {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/10">
            {section.locked && <IconLock size={10} className="text-red-400 shrink-0" />}
            {section.isHidden && <IconHidden size={10} className="text-red-400 shrink-0" />}
            <EditableInput
                disabled={!canManageBoard}
                className="text-xs font-semibold text-gray-300 bg-transparent outline-none w-full border border-transparent hover:border-white/20 rounded px-1 py-0.5 focus:bg-white/10 transition-all"
                value={section.title}
                onSave={(val) => renameSection(section.id, val)}
                style={{ color: groupTextColor }}
            />
            {canManageBoard && (
                <Tooltip content="Remove from group">
                    <button onClick={() => unmergeSection(section.id)} className="p-0.5 text-white/30 hover:text-orange-400 transition-colors shrink-0">
                        <Ungroup size={11} />
                    </button>
                </Tooltip>
            )}
        </div>
    );
};
