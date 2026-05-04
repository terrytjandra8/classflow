
import React from 'react';
import { Board, Note, ColumnAnalyticsData } from '../../types';
import { BoardSettingsDrawer } from '../BoardSettingsDrawer';
import { ShareModal } from '../ShareModal';
import { CreateNoteModal } from '../CreateNoteModal';
import { MousePointer2, Settings, Share2, UploadCloud } from 'lucide-react';

interface BoardOverlaysProps {
    board: Board;
    isStudent: boolean;
    username?: string;
    
    // UI States
    isSettingsOpen: boolean;
    setIsSettingsOpen: (v: boolean) => void;
    isShareModalOpen: boolean;
    setIsShareModalOpen: (v: boolean) => void;
    isModalOpen: boolean;
    setIsModalOpen: (v: boolean) => void;
    isRecipeSidebarOpen: boolean;
    setIsRecipeSidebarOpen: (v: boolean) => void;
    isGuideOpen: boolean;
    setIsGuideOpen: (v: boolean) => void;
    isDragOver: boolean;
    
    // Data Handlers
    onUpdateBoard: (updates: Partial<Board>) => void;
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    onAddNote: (noteData: any) => void; // Handles both add and edit submits via wrapper in index
    
    // Specific Props
    pendingPasteImage: File | null;
    editingNote: Note | null;
    activeSectionId?: string;

    // Board Analysis Props (No longer used, kept optional for interface compat if needed but ignored)
    isBoardAnalysisOpen?: boolean;
    setIsBoardAnalysisOpen?: (v: boolean) => void;
    boardAnalysisData?: ColumnAnalyticsData | null;
    isAnalyzingBoard?: boolean;
    onRegenerateBoardAnalysis?: () => void;
}

export const BoardOverlays: React.FC<BoardOverlaysProps> = ({
    board, isStudent, username,
    isSettingsOpen, setIsSettingsOpen,
    isShareModalOpen, setIsShareModalOpen,
    isModalOpen, setIsModalOpen,
    isRecipeSidebarOpen, setIsRecipeSidebarOpen,
    isGuideOpen, setIsGuideOpen,
    isDragOver,
    onUpdateBoard, setNotes, onAddNote,
    pendingPasteImage,
    editingNote,
    activeSectionId,
}) => {
    
    const showGuide = isGuideOpen && !!board.guide;
    const isAnyModalOpen = isSettingsOpen || isShareModalOpen || isModalOpen;

    return (
        <>
            {isAnyModalOpen && (
                <div className={`fixed inset-0 z-40 transition-all duration-300 animate-in fade-in ${
                    board.settings?.disableModalBlur 
                        ? 'pointer-events-none bg-black/20' 
                        : 'bg-black/60 backdrop-blur-sm pointer-events-auto'
                }`} />
            )}

            {/* Guide Sidebar */}
            {showGuide && (
                 <div className="w-[350px] bg-[#eef2f5] dark:bg-[#1a1a1a] border-l border-white/10 flex flex-col shadow-xl z-30 shrink-0">
                     <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                         <div className="flex items-center gap-3 mb-6">
                             <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
                                <MousePointer2 size={20} className="text-gray-600 dark:text-gray-300"/>
                             </div>
                             <h2 className="font-bold text-lg text-gray-800 dark:text-white">{board.guide?.title}</h2>
                         </div>
                         <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">{board.guide?.description}</p>
                         <div className="space-y-3 mt-4">
                             {board.guide?.steps.map((step, idx) => (
                                 <div key={idx} className="bg-white dark:bg-[#222] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                                     <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{step.text}</p>
                                     {step.actionLabel && (
                                         <button 
                                            onClick={() => {
                                                if (step.actionLabel?.includes('settings')) setIsSettingsOpen(true);
                                                if (step.actionLabel?.includes('share')) setIsShareModalOpen(true);
                                            }}
                                            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                                         >
                                             {step.actionLabel === 'settings' ? <Settings size={14}/> : <Share2 size={14}/>} {step.actionLabel}
                                         </button>
                                     )}
                                 </div>
                             ))}
                         </div>
                     </div>
                     <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] flex items-center justify-between">
                         <button onClick={() => { setIsGuideOpen(false); onUpdateBoard({ guideDismissed: true }); }} className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-white font-medium">Don't show again</button>
                         <button onClick={() => setIsGuideOpen(false)} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors">Done</button>
                     </div>
                 </div>
            )}

            {/* Settings Drawer */}
            <BoardSettingsDrawer 
                board={board}
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onUpdate={onUpdateBoard}
                isStudent={isStudent}
            />

            {/* Share Modal */}
            <ShareModal 
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                board={board}
                onUpdateBoard={onUpdateBoard}
            />

            {/* Create/Edit Note Modal */}
            <CreateNoteModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={onAddNote}
                initialImage={pendingPasteImage}
                defaultAuthor={username}
                disablePaste={board.disablePaste}
                allowLinks={board.allowLinks}
                isStudent={isStudent}
                noteToEdit={editingNote}
                activeSectionId={activeSectionId}
            />

            {/* Drag Over Overlay */}
            {isDragOver && (
                <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-in fade-in">
                    <div className="text-white text-center">
                        <UploadCloud size={64} className="mx-auto mb-4 animate-bounce" />
                        <h2 className="text-2xl font-bold">Drop to Upload</h2>
                        <p className="text-white/60">Release to add image to board</p>
                    </div>
                </div>
            )}
        </>
    );
};
