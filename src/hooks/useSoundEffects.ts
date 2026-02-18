"use client";

import { useCallback } from "react";

export default function useSoundEffects() {
  const playSound = useCallback((soundName: "click" | "start" | "pause" | "complete") => {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = 0.5;
    audio.play().catch((err) => console.error("Failed to play sound:", err));
  }, []);

  return { playSound };
}
