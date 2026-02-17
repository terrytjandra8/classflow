import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { BoardProps } from './boardTypes';
import { BoardHeader } from './Header/BoardHeader';
import { Tooltip } from '../Tooltip';
import { GridLayout } from './Layouts/GridLayout';
import { ColumnsLayout } from './Layouts/ColumnsLayout';
import { StreamLayout } from './Layouts/StreamLayout';
import { TimelineLayout } from './Layouts/TimelineLayout';
import { MapLayout } from './Layouts/MapLayout';
import { SandboxLayout } from './Sandbox';
import { useBoard, BoardProvider } from './BoardContext';

// FIX: Explicitly add extra props that might not be in BoardProps
type ExtendedBoardProps = Partial<BoardProps> & {
    isPresentationMode?: boolean;
};

export const BoardLayout: React.FC<ExtendedBoardProps> = (props) => {
    const parentContext = useBoard();
    
    // 1. Detect Presentation Mode from URL
    const [isPresentationPopup, setIsPresentationPopup] = useState(false);
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('present') === 'true') {
            setIsPresentationPopup(true);
        }
    }, []);

    // 2. Determine Modes
    const embeddedMode = props.embeddedMode || isPresentationPopup;
    // Fix: Allow props.isPresentationMode to override
    const effectiveIsStudent = props.isStudent || parentContext.isStudent || isPresentationPopup || props.isPresentationMode;
    
    const board = props.board || parentContext.board;
    const sectionIdFilter = props.sectionIdFilter || parentContext.sectionIdFilter;
    const backgroundStyle = props.backgroundStyle || parentContext.backgroundStyle;
    const fontClass = props.fontClass || parentContext.fontClass;
    
    const contextValue = useMemo(() => ({
        ...parentContext,
        board,
        isStudent: effectiveIsStudent,
        sectionIdFilter,
        embeddedMode,
        backgroundStyle,
        fontClass,
        openAddNote: props.onOpenAddNote || parentContext.openAddNote,
        openSettings: props.onOpenSettings || parentContext.openSettings,
        openShare: props.onOpenShare || parentContext.openShare,
        goBack: props.onBack || parentContext.goBack,
        updateBoard: props.onUpdateBoard || parentContext.updateBoard,
        isSimulating: props.isSimulating !== undefined ? props.isSimulating : parentContext.isSimulating,
        isPresentationMode: isPresentationPopup || props.isPresentationMode
    }), [parentContext, board, effectiveIsStudent, sectionIdFilter, embeddedMode, backgroundStyle, fontClass, props, isPresentationPopup]);

    const canManageBoard = contextValue.canManageBoard && !isPresentationPopup;
    const isLoadingNotes = contextValue.isLoadingNotes;
    const isLocked = board.lockMode === 'readonly' || board.lockMode === 'comments_only';
    
    const showFab = (canManageBoard || (!isLocked && board.format !== 'columns' && board.format !== 'timeline')) && !embeddedMode;

    const renderContent = () => {
        switch (board.format) {
            case 'stream': return <StreamLayout />;
            case 'timeline': return <TimelineLayout />;
            case 'map': return <MapLayout />;
            case 'canvas': return <SandboxLayout />;
            case 'columns':
                if (sectionIdFilter) return <GridLayout gridClass="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6" isStudent={effectiveIsStudent} />;
                return <ColumnsLayout isStudent={effectiveIsStudent} />;
            case 'grid': 
            default: return <GridLayout gridClass="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6" isStudent={effectiveIsStudent} />;
        }
    };

    return (
        <BoardProvider value={contextValue}>
            <div className={`h-full flex flex-col ${fontClass} relative`}>
                <div className={`absolute inset-0 z-0 ${embeddedMode ? '' : 'fixed'}`} style={backgroundStyle}></div>
                
                <div className="relative z-10 flex flex-col h-full">
                    {!embeddedMode && <BoardHeader />}
                    
                    {isPresentationPopup && (
                        <div className="absolute top-4 right-4 z-50 pointer-events-none opacity-50">
                            <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur">
                                Presentation View
                            </span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4 md:p-6">
                        {isLoadingNotes ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] z-20">
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                            </div>
                        ) : renderContent()}
                    </div>
                    
                    {showFab && (
                        <Tooltip content="Quick Add Note" position="left">
                            <button
                                onClick={() => contextValue.openAddNote(sectionIdFilter)}
                                className={`fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-[51] ${board.colorScheme === 'light' ? 'bg-slate-900 text-white' : 'bg-pink-600 text-white'}`}
                            >
                                <Plus size={32} />
                            </button>
                        </Tooltip>
                    )}
                </div>
            </div>
        </BoardProvider>
    );
};