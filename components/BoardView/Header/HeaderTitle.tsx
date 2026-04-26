
import React from 'react';
import { EditableInput } from '../../ui/EditableInput';
import { useHeaderLogic } from './useHeaderLogic';

export const HeaderTitle: React.FC = () => {
    const { board, canManageBoard, updateBoard } = useHeaderLogic();

    return (
        <div className="flex items-start gap-4 relative max-w-full">
            {board.icon && (
                <span className="text-3xl md:text-4xl drop-shadow-2xl font-emoji shrink-0 pt-1 filter hover:scale-110 transition-transform cursor-default">
                    {board.icon}
                </span>
            )}
            
            <div className="relative flex-1 min-w-0">
                <EditableInput
                    value={board.title}
                    onSave={(val) => {
                        if (val.trim() && val.trim() !== board.title) updateBoard({ title: val.trim() });
                    }}
                    disabled={!canManageBoard}
                    className={`text-2xl md:text-4xl font-black text-white drop-shadow-lg bg-transparent border border-transparent rounded-lg outline-none w-full transition-all resize-none block break-words whitespace-pre-wrap tracking-tight ${
                        !canManageBoard 
                        ? 'cursor-default' 
                        : 'hover:border-white/10 hover:bg-white/5 cursor-text'
                    }`}
                    style={{ lineHeight: '1.4', padding: '4px 12px 12px 12px' }}
                    placeholder="Untitled Board"
                />
            </div>
        </div>
    );
};
