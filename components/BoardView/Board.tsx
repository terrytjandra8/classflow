
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, MonitorPlay, Minimize2, Loader2, Eye } from 'lucide-react';
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
import { Note } from '../../types';

export const BoardLayout: React.FC<Partial<BoardProps> & { isPresentationMode?: boolean }> = (props) => {
    const parentContext = useBoard();
    const [isPresenting, setIsPresenting] = useState(false);
    
    const board = props.board || parentContext.board;
    
    const isStudent = props.isStudent !== undefined ? props.isStudent : parentContext.isStudent;
    const sectionIdFilter = props.sectionIdFilter || parentContext.sectionIdFilter;
    const embeddedMode = props.embeddedMode !== undefined ? props.embeddedMode : parentContext.embeddedMode;
    const backgroundStyle = props.backgroundStyle || parentContext.backgroundStyle;
    const fontClass = props.fontClass || parentContext.fontClass;
    const userAvatar = props.userAvatar || parentContext.userAvatar;
    
    const effectivePresentationMode = props.isPresentationMode || parentContext.isPresentationMode || isPresenting;
    
    const openEditNote = useCallback((note: Note) => {
        parentContext.openEditNote(note);
    }, [parentContext.openEditNote]);

    const contextValue = useMemo(() => ({
        ...parentContext,
        board,
        isStudent,
        sectionIdFilter,
        embeddedMode,
        backgroundStyle,
        fontClass,
        userAvatar,
        openAddNote: props.onOpenAddNote || parentContext.openAddNote,
        openEditNote,
        openSettings: props.onOpenSettings || parentContext.openSettings,
        openShare: props.onOpenShare || parentContext.openShare,
        goBack: props.onBack || parentContext.goBack,
        updateBoard: props.onUpdateBoard || parentContext.updateBoard,
        toggleSimulation: props.onToggleSimulation || parentContext.toggleSimulation,
        summarize: props.onSummarize || parentContext.summarize,
        isSimulating: props.isSimulating !== undefined ? props.isSimulating : parentContext.isSimulating,
        isAiLoading: false, 
        onlineUsers: props.onlineUsers || parentContext.onlineUsers,
        classList: props.classList || parentContext.classList,
        isPresentationMode: effectivePresentationMode
    }), [parentContext, board, isStudent, sectionIdFilter, embeddedMode, backgroundStyle, fontClass, userAvatar, props, effectivePresentationMode, openEditNote]);

    const canManageBoard = contextValue.canManageBoard;
    const isLoadingNotes = contextValue.isLoadingNotes;

    const isLocked = board.lockMode === 'readonly' || board.lockMode === 'comments_only';
    
    const showFab = (canManageBoard || (!isLocked && board.format !== 'columns' && board.format !== 'timeline')) && !isPresenting && !embeddedMode && !effectivePresentationMode;

    useEffect(() => {
        const handleFsChange = () => {
            if (!document.fullscreenElement) {
                setIsPresenting(false);
            }
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    useEffect(() => {
        const highlightedId = parentContext.highlightedUserId;
        if (!highlightedId) return;

        setTimeout(() => {
            const selector = `[data-author-id="${highlightedId}"]`;
            const elements = document.querySelectorAll(selector);
            if (elements.length === 0) return;

            elements.forEach((el) => {
                const card = el as HTMLElement;
                let parent = card.parentElement;
                while (parent) {
                    const style = window.getComputedStyle(parent);
                    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                        const parentRect = parent.getBoundingClientRect();
                        const cardRect = card.getBoundingClientRect();
                        const targetScroll = parent.scrollTop + (cardRect.top - parentRect.top) - (parent.clientHeight / 2) + (card.clientHeight / 2);
                        parent.scrollTo({ top: targetScroll, behavior: 'smooth' });
                        break;
                    }
                    parent = parent.parentElement;
                }
            });

            setTimeout(() => {
                const firstElement = elements[0] as HTMLElement;
                if (firstElement) {
                    firstElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }
            }, 300);
        }, 100);
        
    }, [parentContext.highlightedUserId]);

    const togglePresentation = () => {
        if (!isPresenting) {
            document.documentElement.requestFullscreen().catch(e => console.error("Fullscreen failed:", e));
            setIsPresenting(true);
        } else {
            if (document.fullscreenElement) document.exitFullscreen();
            setIsPresenting(false);
        }
    };

    const renderContent = () => {
        switch (board.format) {
            case 'stream': return <StreamLayout />;
            case 'timeline': return <TimelineLayout />;
            case 'map': return <MapLayout />;
            case 'canvas':
            case 'freeform': return <SandboxLayout />;
            case 'columns':
                if (sectionIdFilter) return <GridLayout gridClass="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6" isStudent={isStudent} />;
                return <ColumnsLayout isStudent={isStudent} />;
            case 'grid': 
            case 'wall': 
            default:
                return <GridLayout gridClass="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6" isStudent={isStudent} />;
        }
    };

    const content = (
        <div className={`h-full flex flex-col ${fontClass} relative`}>
            <div className={`absolute inset-0 z-0 ${embeddedMode ? '' : 'fixed'}`} style={backgroundStyle}></div>
            
            <div className="relative z-10 flex flex-col h-full">
                {!embeddedMode && <BoardHeader isPresenting={isPresenting} onTogglePresentation={togglePresentation} />}
                
                {effectivePresentationMode && (
                    <div className="absolute top-4 left-4 z-50 pointer-events-none">
                        <span className="bg-green-600/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur border border-white/20 uppercase tracking-widest animate-pulse">PROJECTOR VIEW</span>
                    </div>
                )}

                {parentContext.isSimulatingStudent && (
                    <div className="w-full flex-shrink-0 bg-indigo-600/90 text-white px-4 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md border-y border-indigo-400 flex items-center justify-center gap-2 z-40">
                        <Eye size={14} /> Viewing as Student
                    </div>
                )}
                
                {isPresenting && !embeddedMode && (
                    <div className="fixed top-6 right-6 z-[100] flex gap-2">
                        <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl border border-white/10 flex items-center gap-2">
                            <MonitorPlay size={16} className="text-green-400" /> Presentation Mode
                        </div>
                        <button onClick={togglePresentation} className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-colors shadow-xl">
                            <Minimize2 size={20} />
                        </button>
                    </div>
                )}

                <div className={`flex-1 overflow-y-auto custom-scrollbar relative ${isPresenting || effectivePresentationMode ? 'presentation-mode' : ''} ${embeddedMode ? '' : ''}`}>
                    <style>{`.presentation-mode { font-size: 1.25rem; } .presentation-mode .note-card-title { font-size: 1.5rem !important; } .presentation-mode .note-card-content { font-size: 1.1rem !important; }`}</style>
                    
                    {isLoadingNotes ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] z-20">
                            <div className="bg-white/80 dark:bg-black/50 p-4 rounded-full shadow-lg border border-white/10 backdrop-blur-md">
                                <Loader2 className="animate-spin text-pink-500" size={32} />
                            </div>
                        </div>
                    ) : (
                        renderContent()
                    )}
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
                 
                 {embeddedMode && (canManageBoard || !isLocked) && sectionIdFilter && (
                     <div className="absolute bottom-6 right-6 z-50">
                        <button
                            onClick={() => contextValue.openAddNote(sectionIdFilter)}
                            className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-pink-600 text-white`}
                        >
                            <Plus size={24} />
                        </button>
                     </div>
                 )}
            </div>
        </div>
    );

    return (
        <BoardProvider value={contextValue}>
            {content}
        </BoardProvider>
    );
};
