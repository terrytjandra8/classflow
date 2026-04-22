
import React, { useState, useMemo } from 'react';
import { Board, Note } from '../../types';
import { Volume2, VolumeX, ArrowLeft, MonitorPlay } from 'lucide-react';
import { useQuizGame } from '../../hooks/useQuizGame';
import { useQuizAudio } from '../../hooks/useQuizAudio';
import { ConfirmModal } from '../ConfirmModal';
import { resolveBackgroundStyle } from '../../utils/theme';
import { StudentGame } from './Quiz/StudentGame';
import { TeacherGame } from './Quiz/TeacherGame';
import { QuizSetup } from './Quiz/QuizSetup';

interface QuizViewProps {
    board: Board;
    notes: Note[]; 
    userId?: string;
    isStudent?: boolean;
    onlineUsers?: any[];
    onUpdateBoard: (updates: Partial<Board>) => void;
    classList?: string[];
    onActivity?: () => void;
    onBack?: () => void;
    onOpenSettings?: () => void;
    onOpenShare?: () => void;
    isPresentationMode?: boolean;
    username?: string;
}

export const QuizView: React.FC<QuizViewProps> = (props) => {
    const { board, onUpdateBoard, isStudent, userId, username, onlineUsers, onBack, onOpenSettings, onOpenShare, isPresentationMode } = props;
    const [isPresenting, setIsPresenting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Game Logic Hook
    const { 
        questions, state, currentQIndex, currentQ, timeLeft, 
        hasAnswered, myAnswerNote, scores, myStreak,
        submitAnswer, enterLobby, startGame, nextStep, resetGame
    } = useQuizGame(board, props.notes, userId, username, isStudent, onUpdateBoard, props.onActivity);

    // Audio Logic Hook - Use setting or default to 'lofi'
    const selectedMusicId = (board.settings?.quizMusic as string) || 'lofi';
    const { isMuted, setIsMuted } = useQuizAudio(state, isStudent, isPresentationMode, timeLeft, myAnswerNote, currentQ, selectedMusicId);

    const backgroundStyle = useMemo(() => resolveBackgroundStyle(board.wallpaper), [board.wallpaper]);

    const togglePresentation = (forceState?: boolean) => {
        const shouldBePresenting = forceState !== undefined ? forceState : !isPresenting;
        if (shouldBePresenting) {
            document.documentElement.requestFullscreen().catch(e => console.error(e));
            setIsPresenting(true);
        } else {
            if (document.fullscreenElement) document.exitFullscreen();
            setIsPresenting(false);
        }
    };

    const openProjectorMode = () => {
        const url = `${window.location.origin}/?board=${board.id}&present=true`;
        window.open(url, 'ClassBoardProjector', 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no');
    };

    const SoundControl: React.FC = () => (
        <button 
            onClick={() => setIsMuted(!isMuted)} 
            className={`p-2 rounded-full backdrop-blur-md transition-all z-50 border border-white/10 ${isMuted ? 'bg-red-500/20 text-red-200' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
    );

    // --- STUDENT VIEW ---
    if (isStudent) {
        return (
            <StudentGame 
                state={state}
                board={board}
                currentQ={currentQ}
                timeLeft={timeLeft}
                hasAnswered={hasAnswered}
                myStreak={myStreak}
                myAnswerNote={myAnswerNote}
                scores={scores}
                userId={userId}
                submitAnswer={submitAnswer}
                SoundControl={SoundControl}
                backgroundStyle={backgroundStyle}
            />
        );
    }

    // --- TEACHER VIEW (SETUP) ---
    if (state === 'setup' || !state) {
        return (
            <QuizSetup 
                board={board}
                questions={questions}
                onUpdateBoard={onUpdateBoard}
                onBack={onBack}
                onOpenSettings={onOpenSettings}
                onOpenShare={onOpenShare}
                enterLobby={enterLobby}
                backgroundStyle={backgroundStyle}
                isPresentationMode={isPresentationMode}
            />
        );
    }

    // --- TEACHER VIEW (LIVE) ---
    return (
        <>
            <div className={`h-full flex flex-col bg-[#111] text-white font-sans ${isPresenting ? 'fixed inset-0 z-[100]' : ''}`}>
                
                {/* Header for Live Mode when not presenting */}
                <div className={`bg-[#161616] border-b border-white/10 px-6 py-3 flex items-center justify-between shrink-0 ${isPresenting || isPresentationMode ? 'hidden' : 'flex'}`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowResetConfirm(true)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-400" title="End Game">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-lg text-purple-400">Live Quiz</h2>
                            {board.isPublished && (
                                <span className="bg-green-500/20 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded border border-green-500/30 animate-pulse flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> LIVE
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <SoundControl />
                        <button onClick={openProjectorMode} className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg font-bold text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-2">
                            <MonitorPlay size={14} /> Projector
                        </button>
                    </div>
                </div>

                <TeacherGame 
                    state={state}
                    board={board}
                    currentQ={currentQ}
                    currentQIndex={currentQIndex}
                    questions={questions}
                    timeLeft={timeLeft}
                    scores={scores}
                    onlineUsers={onlineUsers}
                    notes={props.notes}
                    startGame={startGame}
                    nextStep={nextStep}
                    openProjectorMode={openProjectorMode}
                    SoundControl={SoundControl}
                    backgroundStyle={backgroundStyle}
                    isPresenting={isPresenting}
                    togglePresentation={togglePresentation}
                    onUpdateBoard={onUpdateBoard}
                    resetGame={resetGame}
                />
            </div>

            <ConfirmModal 
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={resetGame}
                title="End Game?"
                message="This will end the current session, clear all scores, and return to setup mode."
                confirmText="End Game"
                isDangerous={true}
            />
        </>
    );
};
