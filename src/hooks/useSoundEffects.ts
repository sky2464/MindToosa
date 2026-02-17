"use client";

import { useCallback, useRef, useEffect } from 'react';

// Placeholder sound URLs
const SOUNDS = {
    start: '/sounds/start.mp3',
    pause: '/sounds/pause.mp3',
    complete: '/sounds/complete.mp3',
    click: '/sounds/click.mp3',
};

const useAudio = (url: string, { volume = 1 } = {}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio(url);
        audioRef.current.volume = volume;
    }, [url, volume]);

    const play = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.error("Error playing sound:", err));
        }
    }, []);

    return [play];
};

export const useSoundEffects = () => {
    const [playStart] = useAudio(SOUNDS.start, { volume: 0.5 });
    const [playPause] = useAudio(SOUNDS.pause, { volume: 0.5 });
    const [playComplete] = useAudio(SOUNDS.complete, { volume: 0.7 });
    const [playClick] = useAudio(SOUNDS.click, { volume: 0.2 });

    return {
        playStart,
        playPause,
        playComplete,
        playClick,
    };
};
