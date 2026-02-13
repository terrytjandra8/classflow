
import { useEffect, useRef, useState } from 'react';
import { QuizState, Note, QuizQuestion } from '../types';

export const MUSIC_TRACKS = [
    { 
        id: 'lofi', 
        label: '☕ Lo-Fi Beat', 
        // "Lofi Study" - Pure instrumental chill hop
        url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3' 
    },
    { 
        id: 'minecraft', 
        label: '⛏️ Cubic Calm', 
        // "Abstract World" - Atmospheric Piano (C418 Style)
        url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_9829391781.mp3' 
    },
    { 
        id: 'synthwave', 
        label: '⚡ The Grid', 
        // "Cyberpunk City" - Dark Electronic (Tron Style)
        url: 'https://cdn.pixabay.com/audio/2021/11/01/audio_026778f56e.mp3' 
    },
    { 
        id: 'upbeat', 
        label: '🍄 Super 8-Bit', 
        // "Arcade" - Retro Platformer (Mario Style)
        url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_a4631e239b.mp3' 
    }
];

export const SOUNDS = {
    lobby: 'https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/intromusic.ogg', 
    correct: 'https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a',
    wrong: 'https://commondatastorage.googleapis.com/codeskulptor-assets/sounddogs/missile.mp3',
    reveal: 'https://commondatastorage.googleapis.com/codeskulptor-assets/sounddogs/soundtrack.mp3',
    tick: 'https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/eatedible.ogg'
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

    // Initialize Audio Objects
    useEffect(() => {
        bgmRef.current = new Audio();
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.3; // Increased slightly for better ambience

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
                sfxRef.current = null;
            }
        };
    }, []);

    // Sync Mute
    useEffect(() => {
        if (bgmRef.current) bgmRef.current.muted = isMuted;
        if (sfxRef.current) sfxRef.current.muted = isMuted;
    }, [isMuted]);

    // BGM Logic
    useEffect(() => {
        const bgm = bgmRef.current;
        if (!bgm) return;

        const stopBgm = () => {
            if (!bgm.paused) {
                bgm.pause();
            }
        };

        const playBgm = (url: string) => {
            if (!url) return;
            // If the source is different, change it and play
            if (bgm.src !== url) {
                bgm.src = url;
                bgm.play().catch(e => console.warn("Auto-play prevented:", e));
            } 
            // If source is same but paused, play it
            else if (bgm.paused) {
                bgm.play().catch(e => console.warn("Auto-play prevented:", e));
            }
        };

        const selectedTrack = MUSIC_TRACKS.find(t => t.id === selectedMusicId) || MUSIC_TRACKS[0];

        // LOGIC: When to play music?
        if (state === 'lobby') {
            playBgm(selectedTrack.url);
        } else if (state === 'question') {
            if (!isStudent || isPresentationMode) {
                // Teacher/Projector gets music
                playBgm(selectedTrack.url);
            } else {
                // Student gets silence to focus
                stopBgm(); 
            }
        } else if (state === 'reveal' || state === 'leaderboard') {
            // Keep the vibe going during results
            playBgm(selectedTrack.url);
        } else {
            // Setup mode or finished -> Silence
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
        if (state === 'question' && timeLeft <= 5 && timeLeft > 0 && !isMuted) {
            const tick = new Audio(SOUNDS.tick);
            tick.volume = 0.3;
            tick.play().catch(() => {});
        }
    }, [timeLeft, state, isMuted]);

    return { isMuted, setIsMuted };
};
