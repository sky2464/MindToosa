"use client";

import { useState, useEffect, useRef } from "react";
import { CloudRain, Waves, Wind, Volume2, VolumeX } from "lucide-react";

type SoundType = "rain" | "white" | "pink" | "none";

export default function AmbientControls() {
  const [activeSound, setActiveSound] = useState<SoundType>("none");
  const [volume, setVolume] = useState(0.5);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const whiteNoiseNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const stopSound = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (whiteNoiseNodeRef.current) {
      whiteNoiseNodeRef.current.stop();
      whiteNoiseNodeRef.current.disconnect();
      whiteNoiseNodeRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    // Resume if suspended (browser requirements)
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playWhiteNoise = (ctx: AudioContext, bufferSize: number) => {
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.05 * volume; // Lower base volume for noise
    gainNodeRef.current = gain;

    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    whiteNoiseNodeRef.current = noise;
  };

  const playPinkNoise = (ctx: AudioContext, bufferSize: number) => {
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // (roughly) compensate for gain
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.1 * volume;
    gainNodeRef.current = gain;

    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    whiteNoiseNodeRef.current = noise;
  };

  const toggleSound = (type: SoundType) => {
    stopSound();
    if (activeSound === type) {
      setActiveSound("none");
      return;
    }

    setActiveSound(type);
    const ctx = initAudioContext();
    const bufferSize = 2 * ctx.sampleRate; // 2 seconds buffer

    if (type === "white") {
      playWhiteNoise(ctx, bufferSize);
    } else if (type === "pink") {
      // Simulating Rain roughly with Pink noise
      playPinkNoise(ctx, bufferSize);
    } else if (type === "rain") {
      // Deeper pink noise for rain
      playPinkNoise(ctx, bufferSize);
    }
  };

  const updateVolume = (val: number) => {
    setVolume(val);
    if (gainNodeRef.current) {
      // Adjust based on type roughly
      const base = activeSound === "white" ? 0.05 : 0.1;
      gainNodeRef.current.gain.value = base * val;
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/50 p-2 shadow-lg backdrop-blur-md">
      <button
        onClick={() => toggleSound("white")}
        className={`rounded-full p-2 transition-colors ${activeSound === "white" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
        title="White Noise (Focus)"
        aria-label="Toggle White Noise"
      >
        <Wind size={18} />
      </button>
      <button
        onClick={() => toggleSound("pink")}
        className={`rounded-full p-2 transition-colors ${activeSound === "pink" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
        title="Pink Noise (Relax)"
        aria-label="Toggle Pink Noise"
      >
        <Waves size={18} />
      </button>
      <button
        onClick={() => toggleSound("rain")}
        className={`rounded-full p-2 transition-colors ${activeSound === "rain" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
        title="Rain (Calm)"
        aria-label="Toggle Rain Sound"
      >
        <CloudRain size={18} />
      </button>

      <div className="mx-1 h-6 w-px bg-zinc-700"></div>

      <div className="flex items-center gap-2 px-2">
        {volume === 0 ? (
          <VolumeX size={14} className="text-zinc-500" />
        ) : (
          <Volume2 size={14} className="text-zinc-400" />
        )}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => updateVolume(parseFloat(e.target.value))}
          className="h-1 w-16 cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-indigo-500"
          aria-label="Volume control"
          title="Volume control"
        />
      </div>
    </div>
  );
}
