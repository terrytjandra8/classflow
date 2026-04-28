
import React from 'react';
import { EditableInput } from '../../../ui/EditableInput';
import { Tooltip } from '../../../Tooltip';
import { Section } from '../../../../types';
import {
    IconLock, IconUnlock, IconVisible, IconHidden, IconBlur,
    IconAnonymous, IconComment, IconNoComment, IconReply,
    IconMove, IconDrag, IconClose,
    IconCopyOff, IconWatermark
} from '../../../Icons';
import { CheckCircle, Circle, UserPlus } from 'lucide-react';

interface ColumnHeaderProps {
    section: Section;
    isMergeMode: boolean;
    isSelected: boolean;
    canManageBoard: boolean;
    canDragColumns: boolean;
    groupTextColor?: string;
    // Computed values for this section
    commentsOn: boolean;
    repliesOn: boolean;
    isContentBlurred: boolean;
    sectionCanDrag: boolean;
    showControls: boolean;
    // Callbacks
    onDragStart: (e: React.DragEvent, id: string, type: 'COLUMN') => void;
    renameSection: (id: string, title: string) => void;
    toggleSelectForMerge: (id: string) => void;
    toggleSectionLock: (sectionId: string) => void;
    toggleSectionComments: (sectionId: string) => void;
    toggleSectionReplies: (sectionId: string) => void;
    toggleSectionRearrange: (sectionId: string) => void;
    toggleSectionContentBlur: (sectionId: string) => void;
    toggleSectionVisibility: (sectionId: string) => void;
    toggleSectionAnonymous: (sectionId: string) => void;
    toggleSectionCopy: (sectionId: string) => void;
    toggleSectionWatermark: (sectionId: string) => void;
    deleteSection: (id: string) => void;
    setAssigningSection: (id: string) => void;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
    section,
    isMergeMode,
    isSelected,
    canManageBoard,
    canDragColumns,
    groupTextColor,
    commentsOn,
    repliesOn,
    isContentBlurred,
    sectionCanDrag,
    showControls,
    onDragStart,
    renameSection,
    toggleSelectForMerge,
    toggleSectionLock,
    toggleSectionComments,
    toggleSectionReplies,
    toggleSectionRearrange,
    toggleSectionContentBlur,
    toggleSectionVisibility,
    toggleSectionAnonymous,
    toggleSectionCopy,
    toggleSectionWatermark,
    deleteSection,
    setAssigningSection,
}) => {
    return (
        <div
            className={`flex flex-col gap-3 p-3 rounded-xl border transition-all relative cursor-pointer group ${isMergeMode && isSelected
                    ? 'border-blue-400 bg-blue-500/20 ring-2 ring-blue-400/50'
                    : isMergeMode
                        ? 'border-blue-500/40 hover:border-blue-400 hover:bg-blue-500/10 bg-black/5 dark:bg-white/5'
                        : section.isHidden
                            ? 'border-dashed border-red-500/20 bg-red-500/5 cursor-default'
                            : 'border-transparent hover:border-white/10 bg-black/5 dark:bg-white/5 cursor-default'
                }`}
            onClick={isMergeMode ? () => toggleSelectForMerge(section.id) : undefined}
        >
            {/* Row 1: Handle + Title + Status Badges */}
            <div className="flex items-center gap-2 w-full min-w-0">
                {isMergeMode && canManageBoard ? (
                    <div className={`shrink-0 transition-colors ${isSelected ? 'text-blue-400' : 'text-white/30'}`}>
                        {isSelected ? <CheckCircle size={18} /> : <Circle size={18} />}
                    </div>
                ) : (
                    canDragColumns && (
                        <div className="text-gray-400 p-1 cursor-grab active:cursor-grabbing hover:text-white transition-colors shrink-0"
                            draggable={true} onDragStart={(e) => onDragStart(e, section.id, 'COLUMN')} title="Drag to reorder">
                            <IconDrag size={16} />
                        </div>
                    )
                )}

                <div className="flex items-center gap-1 shrink-0">
                    {section.locked && <div className="bg-red-500 text-white p-1 rounded shadow-sm"><IconLock size={10} strokeWidth={3} /></div>}
                    {section.isHidden && <div className="bg-orange-500 text-white p-1 rounded shadow-sm"><IconHidden size={10} strokeWidth={3} /></div>}
                    {section.disableCopy && <div className="bg-slate-700 text-white p-1 rounded shadow-sm"><IconCopyOff size={10} strokeWidth={3} /></div>}
                    {section.isWatermarked && <div className="bg-red-600 text-white p-1 rounded shadow-sm"><IconWatermark size={10} strokeWidth={3} /></div>}
                </div>

                <EditableInput
                    disabled={!canManageBoard || isMergeMode}
                    className={`font-bold text-base bg-transparent border border-transparent hover:border-white/20 rounded px-1.5 py-1 w-full focus:bg-white/10 outline-none transition-all ${isMergeMode ? 'pointer-events-none' : ''} ${section.isHidden ? 'opacity-70' : 'opacity-100'} text-slate-800 dark:text-white`}
                    value={section.title}
                    onSave={(val) => renameSection(section.id, val)}
                    style={{ color: groupTextColor }}
                />
            </div>

            {/* Row 2: Teacher Controls (only when manage and not merge) */}
            {canManageBoard && !isMergeMode && (
                <div className={`grid grid-cols-5 sm:flex sm:flex-wrap items-center gap-1 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <Tooltip content={section.locked ? "Unlock" : "Lock"}>
                        <button onClick={() => toggleSectionLock(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.locked ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            {section.locked ? <IconLock size={14} /> : <IconUnlock size={14} />}
                        </button>
                    </Tooltip>
                    <Tooltip content={commentsOn ? "Disable Comments" : "Enable Comments"}>
                        <button onClick={() => toggleSectionComments(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${!commentsOn ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            {commentsOn ? <IconComment size={14} /> : <IconNoComment size={14} />}
                        </button>
                    </Tooltip>
                    <Tooltip content={repliesOn ? "Disable Replies" : "Enable Replies"}>
                        <button onClick={() => toggleSectionReplies(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${!repliesOn ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            <IconReply size={14} />
                        </button>
                    </Tooltip>
                    <Tooltip content={sectionCanDrag ? "Disable Dragging" : "Enable Dragging"}>
                        <button onClick={() => toggleSectionRearrange(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${sectionCanDrag ? 'text-green-500 bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            <IconMove size={14} />
                        </button>
                    </Tooltip>
                    <Tooltip content={isContentBlurred ? "Reveal Content" : "Blur Content"}>
                        <button onClick={() => toggleSectionContentBlur(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${isContentBlurred ? 'text-orange-500 bg-orange-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            {isContentBlurred ? <IconHidden size={14} /> : <IconBlur size={14} />}
                        </button>
                    </Tooltip>
                    <Tooltip content={section.isHidden ? "Show" : "Hide"}>
                        <button onClick={() => toggleSectionVisibility(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.isHidden ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            {section.isHidden ? <IconHidden size={14} /> : <IconVisible size={14} />}
                        </button>
                    </Tooltip>
                    <Tooltip content={section.isAnonymous ? "Disable Anonymous" : "Enable Anonymous"}>
                        <button onClick={() => toggleSectionAnonymous(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.isAnonymous ? 'text-purple-500 bg-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            <IconAnonymous size={14} />
                        </button>
                    </Tooltip>
                    <Tooltip content={section.disableCopy ? "Enable Copying" : "Disable Copying"}>
                        <button onClick={() => toggleSectionCopy(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.disableCopy ? 'text-orange-500 bg-orange-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            <IconCopyOff size={14} />
                        </button>
                    </Tooltip>
                    <Tooltip content={section.isWatermarked ? "Disable Focus Guard" : "Enable Stay Focused Guard (Tab-switch tracking)"}>
                        <button onClick={() => toggleSectionWatermark(section.id)} className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.isWatermarked ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            <IconWatermark size={14} />
                        </button>
                    </Tooltip>
                    <Tooltip content="Delete Column">
                        <button onClick={() => deleteSection(section.id)} className="p-1.5 hover:text-red-500 text-slate-400 transition-colors hover:bg-red-500/10 rounded-lg flex justify-center">
                            <IconClose size={14} />
                        </button>
                    </Tooltip>

                    {/* Assign Students Button */}
                    <Tooltip content="Assign Students to this column">
                        <button
                            onClick={() => setAssigningSection(section.id)}
                            className={`p-1.5 rounded-lg transition-colors flex justify-center ${section.assignedStudentIds?.length ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        >
                            <UserPlus size={14} />
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};
