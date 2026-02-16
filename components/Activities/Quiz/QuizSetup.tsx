
import React, { useState, useRef, useEffect } from 'react';
import { Board, QuizQuestion } from '../../../types';
import { ArrowLeft, Share2, Settings, Play, Plus, Edit2, Trash2, Music, Pause, Volume2 } from 'lucide-react';
import { QuizEditor } from '../QuizEditor';
import { MUSIC_TRACKS } from '../../../hooks/useQuizAudio';

interface QuizSetupProps {
    board: Board;
    questions: QuizQuestion[];
    onUpdateBoard: (updates: Partial<Board>) => void;
    onBack?: () => void;
    onOpenSettings?: () => void;
    onOpenShare?: () => void;
    enterLobby: () => void;
    backgroundStyle: any;
    isPresentationMode?: boolean;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({ 
    board, questions, onUpdateBoard, onBack, onOpenSettings, onOpenShare, enterLobby, backgroundStyle, isPresentationMode 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isMusicMenuOpen, setIsMusicMenuOpen] = useState(false);
    const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const currentMusicId = (board.settings?.quizMusic as string) || 'lofi';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMusicMenuOpen(false);
                stopPreview();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => stopPreview();
    }, []);

    const stopPreview = () => {
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
        }
        setPreviewTrackId(null);
    };

    const handlePreview = (trackId: string, url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (previewTrackId === trackId) {
            stopPreview();
        } else {
            stopPreview();
            const audio = new Audio(url);
            audio.volume = 0.5;
            audio.play().catch(e => console.error("Preview failed", e));
            previewAudioRef.current = audio;
            setPreviewTrackId(trackId);
            audio.onended = () => setPreviewTrackId(null);
        }
    };

    const handleSelectMusic = (trackId: string) => {
        onUpdateBoard({
            settings: {
                ...board.settings,
                quizMusic: trackId
            }
        });
    };

    return (
        <div className="h-full flex flex-col bg-[#111] text-white relative">
            <div className="absolute inset-0 z-0" style={backgroundStyle}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            </div>

            {!isPresentationMode && (
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#161616]/80 backdrop-blur-md relative z-50">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h1 className="font-bold text-xl drop-shadow-md">{board.title}</h1>
                        <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-yellow-500/30">Setup Mode</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative" ref={menuRef}>
                            <button 
                                onClick={() => setIsMusicMenuOpen(!isMusicMenuOpen)}
                                className={`p-2 rounded-full transition-colors flex items-center gap-2 ${isMusicMenuOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                title="Select Music"
                            >
                                <Music size={20} className={currentMusicId !== 'lofi' ? 'text-pink-400' : ''} />
                            </button>

                            {isMusicMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 z-[60]">
                                    <div className="p-2 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#222]">
                                        Background Music
                                    </div>
                                    <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
                                        {MUSIC_TRACKS.map((track) => (
                                            <div 
                                                key={track.id} 
                                                onClick={() => handleSelectMusic(track.id)}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group ${currentMusicId === track.id ? 'bg-purple-900/20 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {currentMusicId === track.id && <Volume2 size={12} className="text-purple-400 shrink-0" />}
                                                    <span className={`text-xs font-bold truncate ${currentMusicId === track.id ? 'text-purple-200' : 'text-gray-300'}`}>
                                                        {track.label}
                                                    </span>
                                                </div>
                                                
                                                <button
                                                    onClick={(e) => handlePreview(track.id, track.url, e)}
                                                    className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${previewTrackId === track.id ? 'text-green-400' : 'text-gray-500 group-hover:text-white'}`}
                                                    title={previewTrackId === track.id ? "Stop Preview" : "Preview Track"}
                                                >
                                                    {previewTrackId === track.id ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {onOpenShare && (
                            <button onClick={onOpenShare} className="p-2 rounded-full transition-colors text-gray-400 hover:text-white hover:bg-white/10">
                                <Share2 size={20} />
                            </button>
                        )}
                        <button onClick={onOpenSettings} className="p-2 rounded-full transition-colors text-gray-400 hover:text-white hover:bg-white/10">
                            <Settings size={20} />
                        </button>
                        <button 
                            onClick={enterLobby}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-purple-500/20 flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                            <Play size={16} fill="currentColor" /> Host Live Game
                        </button>
                    </div>
                </header>
            )}

            <div className="flex-1 flex overflow-hidden relative z-10">
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-bold drop-shadow-md">Questions ({questions.length})</h2>
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="text-blue-400 hover:text-white text-sm font-bold flex items-center gap-1 drop-shadow-sm"
                            >
                                <Plus size={16} /> Add Question
                            </button>
                        </div>

                        {questions.length === 0 ? (
                            <div className="text-center py-20 bg-[#1a1a1a]/80 backdrop-blur rounded-2xl border border-dashed border-white/10">
                                <p className="text-gray-500 mb-4">No questions yet.</p>
                                <button onClick={() => setIsEditing(true)} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm">Create First Question</button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="bg-[#1a1a1a]/90 backdrop-blur border border-white/10 p-4 rounded-xl flex items-center gap-4 group hover:border-white/20 transition-colors">
                                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center font-bold text-gray-500">{idx + 1}</div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-gray-200">{q.question}</h4>
                                            <p className="text-xs text-gray-500">{q.options.length} Options • {q.time_limit}s</p>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/10 rounded text-blue-400"><Edit2 size={16}/></button>
                                            <button 
                                                onClick={() => onUpdateBoard({ quizQuestions: questions.filter(item => item.id !== q.id) })} 
                                                className="p-2 hover:bg-white/10 rounded text-red-400"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <QuizEditor 
                        questions={questions} 
                        onUpdateBoard={onUpdateBoard} 
                        onClose={() => setIsEditing(false)}
                    />
                )}
            </div>
        </div>
    );
};
