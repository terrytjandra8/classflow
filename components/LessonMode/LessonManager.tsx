
import React, { useState, useEffect, useRef } from 'react';
import { Board, LessonStep, Note } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { ArrowLeft, Settings, Maximize2, ChevronLeft, ChevronRight, Minimize2, PanelLeft, Share2 } from 'lucide-react';
import { LessonSidebar } from './Sidebar';
import { SlideViewer } from './SlideViewer';
import { StudentView } from './StudentView';

interface LessonManagerProps {
    board: Board;
    isStudent: boolean;
    onUpdateBoard: (updates: Partial<Board>) => void;
    onBack: () => void;
    notes: Note[];
    userId?: string;
    onAddComment: (noteId: string, text: string, attachment?: any) => void;
    onDeleteNote: (id: string) => void;
    onLikeNote: (id: string) => void;
    onUpdateNote: (id: string, updates: Partial<Note>) => void;
    onDuplicateNote: (note: Note) => void;
    onOpenAddNote: (sectionId?: string) => void;
    onOpenSettings?: () => void;
    onOpenShare?: () => void;
}

export const LessonManager: React.FC<LessonManagerProps> = ({
    board, isStudent, onUpdateBoard, onBack,
    notes, userId, onAddComment, onDeleteNote, onLikeNote, onUpdateNote, onDuplicateNote, onOpenAddNote, onOpenSettings, onOpenShare
}) => {
    const [steps, setSteps] = useState<LessonStep[]>(board.steps || []);
    const [currentIndex, setCurrentIndex] = useState(board.currentStepIndex || 0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isStudent);
    const [isPresenting, setIsPresenting] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    
    // Ref to track last local interaction time to prevent "flash back" from stale server state
    const lastInteractionRef = useRef(0);

    // Sync local state when board prop updates
    useEffect(() => {
        const timeSinceInteraction = Date.now() - lastInteractionRef.current;
        
        // Only sync from props if we haven't interacted recently (2s buffer)
        // This prevents the UI from jumping back to old state while the DB update is pending
        if (timeSinceInteraction > 2000) {
            if (board.steps) setSteps(board.steps);
            if (board.currentStepIndex !== undefined) setCurrentIndex(board.currentStepIndex);
        }
    }, [board.steps, board.currentStepIndex]);

    const handleStepChange = async (index: number) => {
        if (index < 0 || (steps.length > 0 && index >= steps.length)) return;
        
        lastInteractionRef.current = Date.now();
        
        // Optimistic update for teacher
        setCurrentIndex(index);
        onUpdateBoard({ currentStepIndex: index });
        
        // Persist to DB for students
        await supabase.from('boards').update({ current_step_index: index }).eq('id', board.id);
    };

    const handleUpdateSteps = async (newSteps: LessonStep[]) => {
        lastInteractionRef.current = Date.now();
        setSteps(newSteps);
        onUpdateBoard({ steps: newSteps });
        await supabase.from('boards').update({ steps: newSteps }).eq('id', board.id);
    };

    // Atomic add step to ensure we switch to the new slide immediately
    const handleAddStep = async (newStep: LessonStep) => {
        lastInteractionRef.current = Date.now();
        const newSteps = [...steps, newStep];
        const newIndex = newSteps.length - 1;
        
        // Update local state immediately so UI reflects the new slide
        setSteps(newSteps);
        setCurrentIndex(newIndex);
        
        // Update parent state
        onUpdateBoard({ steps: newSteps, currentStepIndex: newIndex });
        
        // Persist to DB
        await supabase.from('boards').update({ 
            steps: newSteps,
            current_step_index: newIndex
        }).eq('id', board.id);
    };

    const togglePresentation = () => {
        if (!isPresenting) {
            document.documentElement.requestFullscreen().catch(e => console.error(e));
            setIsPresenting(true);
        } else {
            if (document.fullscreenElement) document.exitFullscreen();
            setIsPresenting(false);
        }
    };

    useEffect(() => {
        const handleFsChange = () => {
            setIsPresenting(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const currentStep = steps[currentIndex];

    // Explicitly construct props to ensure re-renders
    const viewerProps = {
        step: currentStep,
        board: board,
        notes: notes,
        userId: userId,
        isStudent: isStudent,
        onAddComment: onAddComment,
        onDeleteNote: onDeleteNote,
        onLikeNote: onLikeNote,
        onUpdateNote: onUpdateNote,
        onDuplicateNote: onDuplicateNote,
        onOpenAddNote: onOpenAddNote
    };

    // --- Student View ---
    if (isStudent) {
        return (
            <StudentView step={currentStep} totalSteps={steps.length} currentIndex={currentIndex}>
                <SlideViewer {...viewerProps} />
            </StudentView>
        );
    }

    // --- Teacher View ---
    return (
        <div className={`h-full flex flex-col bg-[#111] text-white overflow-hidden ${isPresenting ? 'fixed inset-0 z-[100]' : ''}`}>
            {/* Top Bar */}
            {!isPresenting && (
                <div className="h-14 bg-[#1a1a1a] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
                        <h1 className="font-bold text-sm truncate flex items-center gap-2">
                            <span className="bg-green-900/30 text-green-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border border-green-500/20">Lesson</span>
                            {board.title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                            className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                            title="Toggle Slides"
                        >
                            <PanelLeft size={18} />
                        </button>
                        
                        {onOpenShare && (
                            <button 
                                onClick={onOpenShare} 
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Share Lesson"
                            >
                                <Share2 size={18} />
                            </button>
                        )}

                        {onOpenSettings && (
                            <button 
                                onClick={onOpenSettings} 
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Lesson Settings"
                            >
                                <Settings size={18} />
                            </button>
                        )}

                        <div className="h-6 w-px bg-white/10 mx-2"></div>
                        
                        <button onClick={togglePresentation} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-transform active:scale-95">
                            <Maximize2 size={14} /> Present
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                {isSidebarOpen && !isPresenting && (
                    <div className="shrink-0 z-20" style={{ width: sidebarWidth }}>
                        <LessonSidebar 
                            steps={steps} 
                            currentIndex={currentIndex}
                            onSelectStep={handleStepChange}
                            onUpdateSteps={handleUpdateSteps}
                            onAddStep={handleAddStep}
                            width={sidebarWidth}
                            onResize={setSidebarWidth}
                        />
                    </div>
                )}

                <div className="flex-1 flex flex-col relative bg-black min-w-0">
                    <div className="flex-1 relative overflow-hidden flex flex-col">
                        <SlideViewer {...viewerProps} />
                        
                        {isPresenting && (
                            <div className="absolute top-4 right-4 z-50">
                                <button onClick={togglePresentation} className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur border border-white/10">
                                    <Minimize2 size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-16 bg-[#1a1a1a] border-t border-white/10 flex items-center justify-between px-6 shrink-0 z-20">
                        <button onClick={() => handleStepChange(currentIndex - 1)} disabled={currentIndex === 0} className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm">
                            <ChevronLeft size={20} /> Previous
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-white font-bold text-base">Slide {currentIndex + 1} <span className="text-gray-500 font-normal">/ {steps.length}</span></span>
                            {currentStep && <span className="text-[10px] text-gray-500 uppercase tracking-wider bg-white/5 px-2 rounded-full mt-1">{currentStep.type}</span>}
                        </div>
                        <button onClick={() => handleStepChange(currentIndex + 1)} disabled={currentIndex === steps.length - 1} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-transform active:scale-95 text-sm">
                            Next <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
