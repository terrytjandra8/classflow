
import { useEffect, useRef, useState } from 'react';
import { QuizState, Note, QuizQuestion } from '../types';

export const MUSIC_TRACKS = [
    { 
        id: 'lofi', 
        label: '☕ Lo-Fi Beat', 
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' 
    },
    { 
        id: 'minecraft', 
        label: '⛏️ Cubic Calm', 
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' 
    },
    { 
        id: 'synthwave', 
        label: '⚡ The Grid', 
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' 
    },
    { 
        id: 'upbeat', 
        label: '🍄 Super 8-Bit', 
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' 
    }
];

export const SOUNDS = {
    lobby: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    correct: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    wrong: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    reveal: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
    tick: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3'
};

export const useQuizAudio = (
    state: QuizState | 'setup',
    isStudent: boolean | undefined,
    isPresentationMode: boolean | undefined,
    timeLeft: number,
    myAnswerNote: Note | undefined,
    currentQ: QuizQuestion | undefined,
    selectedMusicId: string = 'lofi'
) => {
    const [isMuted, setIsMuted] = useState(false);
    const bgmRef = useRef<HTMLAudioElement | null>(null);
    const sfxRef = useRef<HTMLAudioElement | null>(null);
    const tickRef = useRef<HTMLAudioElement | null>(null);

    // Initialize Audio Objects
    useEffect(() => {
        bgmRef.current = new Audio();
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.3;

        sfxRef.current = new Audio();
        sfxRef.current.volume = 0.6;

        // Cleanup on unmount
        return () => {
            if (bgmRef.current) {
                bgmRef.current.pause();
                bgmRef.current.src = '';
                bgmRef.current = null;
            }
            if (sfxRef.current) {
                sfxRef.current.pause();
                sfxRef.current.src = '';
                sfxRef.current = null;
            }
            if (tickRef.current) {
                tickRef.current.pause();
                tickRef.current.src = '';
                tickRef.current = null;
            }
        };
    }, []);

    // Sync Mute
    useEffect(() => {
        if (bgmRef.current) bgmRef.current.muted = isMuted;
        if (sfxRef.current) sfxRef.current.muted = isMuted;
        if (tickRef.current) tickRef.current.muted = isMuted;
    }, [isMuted]);

    // BGM Logic
    useEffect(() => {
        const bgm = bgmRef.current;
        if (!bgm) return;

        const stopBgm = () => {
            bgm.pause();
            bgm.currentTime = 0;
            // Only clear src if we are really stopping for good (like setup mode)
            if (state === 'setup') bgm.src = ''; 
        };

        const playBgm = (url: string) => {
            if (!url) return;
            if (bgm.src !== url) {
                bgm.src = url;
                bgm.play().catch(e => console.warn("Auto-play prevented:", e));
            } else if (bgm.paused) {
                bgm.play().catch(e => console.warn("Auto-play prevented:", e));
            }
        };

        const selectedTrack = MUSIC_TRACKS.find(t => t.id === selectedMusicId) || MUSIC_TRACKS[0];

        if (state === 'lobby') {
            playBgm(selectedTrack.url);
        } else if (state === 'question') {
            if (!isStudent || isPresentationMode) {
                playBgm(selectedTrack.url);
            } else {
                stopBgm(); 
            }
        } else if (state === 'reveal' || state === 'leaderboard') {
            playBgm(selectedTrack.url);
        } else {
            stopBgm();
        }
    }, [state, isStudent, isPresentationMode, isMuted, selectedMusicId]);

    // Student SFX (Win/Loss)
    useEffect(() => {
        const sfx = sfxRef.current;
        if (!sfx || !isStudent) return;

        if (state === 'reveal') {
            const isCorrect = myAnswerNote?.content === currentQ?.correctIndex.toString();
            sfx.src = isCorrect ? SOUNDS.correct : SOUNDS.wrong;
            sfx.play().catch(e => console.warn("SFX blocked:", e));
        }
    }, [state, isStudent, myAnswerNote, currentQ]);

    // Ticking Clock SFX
    useEffect(() => {
        // If state changes away from question, stop the tick
        if (state !== 'question') {
            if (tickRef.current) {
                tickRef.current.pause();
                tickRef.current.currentTime = 0;
            }
            return;
        }

        if (timeLeft <= 5 && timeLeft > 0 && !isMuted) {
            if (!tickRef.current) {
                tickRef.current = new Audio(SOUNDS.tick);
                tickRef.current.volume = 0.3;
            }
            tickRef.current.play().catch(() => {});
        } else if (timeLeft === 0 || isMuted) {
            if (tickRef.current) {
                tickRef.current.pause();
                tickRef.current.currentTime = 0;
            }
        }
    }, [timeLeft, state, isMuted]);

    return { isMuted, setIsMuted };
};
