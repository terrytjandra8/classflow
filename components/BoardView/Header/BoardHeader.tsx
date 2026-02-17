
import React from 'react';
import { useBoard } from '../BoardContext';
import { HeaderTitle } from './HeaderTitle';
import { HeaderMeta } from './HeaderMeta';
import { HeaderBadges } from './HeaderBadges';
import { HeaderActions } from './HeaderActions';
import { IconPlus, IconClose } from '../../Icons';
import { Tooltip } from '../../Tooltip';

export const BoardHeader: React.FC = () => {
    const { board, canManageBoard, updateBoard } = useBoard();

    const handleGroupColumn = (sectionId: string) => {
        if (!canManageBoard) return;

        const newGroupId = `group-${Math.random().toString(36).substr(2, 9)}`;
        const newColumnGroups = [...(board.columnGroups || []), { id: newGroupId, title: 'New Group', columnIds: [sectionId] }];
        const newSections = board.sections.map(s => s.id === sectionId ? { ...s, groupId: newGroupId } : s);

        updateBoard({ sections: newSections, columnGroups: newColumnGroups });
    };

    const handleUngroupColumn = (sectionId: string) => {
        if (!canManageBoard) return;

        const section = board.sections.find(s => s.id === sectionId);
        if (!section || !section.groupId) return;

        const newSections = board.sections.map(s => s.id === sectionId ? { ...s, groupId: undefined } : s);
        const newColumnGroups = (board.columnGroups || [])
            .map(g => ({ ...g, columnIds: g.columnIds.filter(id => id !== sectionId) }))
            .filter(g => g.columnIds.length > 0);

        updateBoard({ sections: newSections, columnGroups: newColumnGroups });
    };
    
    return (
        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-lg shadow-md p-3 rounded-b-2xl border-b border-white/10 dark:border-black/10 z-20 relative">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4 min-w-0">
                    <HeaderTitle />
                    <HeaderMeta />
                </div>
                <div className="flex items-center gap-2">
                    <HeaderBadges />
                    <HeaderActions />
                </div>
            </div>

            {board.format === 'columns' && canManageBoard && (
                <div className="mt-2 flex gap-2 items-center">
                    {board.sections.map(section => (
                        <div key={section.id} className="flex items-center gap-1 p-1 rounded-md bg-black/5 dark:bg-white/5">
                           {section.groupId ? (
                                <Tooltip content="Ungroup Column">
                                    <button 
                                        onClick={() => handleUngroupColumn(section.id)} 
                                        className="p-1.5 rounded-lg transition-colors text-red-500 bg-red-500/10 hover:bg-red-500/20"
                                    >
                                        <IconClose size={14} />
                                    </button>
                                </Tooltip>
                            ) : (
                                <Tooltip content="Group Column">
                                    <button 
                                        onClick={() => handleGroupColumn(section.id)} 
                                        className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-white/10"
                                    >
                                        <IconPlus size={14} />
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
