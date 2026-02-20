"use client";

import Image from "next/image";

interface SVGVisualizerProps {
    mode: "idle" | "running" | "paused" | "completed";
    progress: number; // 0 to 1
}

export default function SVGVisualizer({ mode, progress }: SVGVisualizerProps) {
    // SVG Animation parameters based on mode
    const getAnimationProps = () => {
        switch (mode) {
            case "running":
                return {
                    stroke: "#818cf8", // indigo-400
                    pulseDuration: "4s",
                    rotateDuration: "20s",
                };
            case "paused":
                return {
                    stroke: "#a1a1aa", // zinc-400
                    pulseDuration: "0s", // static
                    rotateDuration: "0s",
                };
            case "completed":
                return {
                    stroke: "#34d399", // emerald-400
                    pulseDuration: "2s",
                    rotateDuration: "10s",
                };
            case "idle":
            default:
                return {
                    stroke: "#52525b", // zinc-600
                    pulseDuration: "0s",
                    rotateDuration: "0s",
                };
        }
    };

    const animProps = getAnimationProps();
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <div className="relative flex items-center justify-center w-80 h-80">
            {/* Dynamic Gemini SVG Ring */}
            <svg
                className="absolute inset-0 w-full h-full drop-shadow-lg"
                viewBox="0 0 300 300"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background Track */}
                <circle
                    cx="150"
                    cy="150"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="6"
                    fill="none"
                />

                {/* Animated Progress Ring */}
                <circle
                    cx="150"
                    cy="150"
                    r={radius}
                    stroke={animProps.stroke}
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    filter="url(#glow)"
                    className="origin-center rotate-[-90deg] transition-[stroke-dashoffset] duration-1000 ease-linear"
                />

                {/* Outer Orbiting Particles (only run when active) */}
                {mode === "running" && (
                    <g
                        className="origin-center animate-[spin_var(--rotate-dur)_linear_infinite]"
                        style={{ "--rotate-dur": animProps.rotateDuration } as React.CSSProperties}
                    >
                        <circle cx="150" cy="15" r="3" fill="#818cf8" filter="url(#glow)" />
                        <circle cx="285" cy="150" r="2" fill="#818cf8" opacity="0.6" />
                        <circle cx="15" cy="150" r="4" fill="#818cf8" opacity="0.8" />
                    </g>
                )}

                {/* Inner breathing shape */}
                <path
                    d="M150,50 Q200,50 200,100 T150,150 T100,100 T150,50"
                    fill="none"
                    stroke={animProps.stroke}
                    strokeWidth="1"
                    opacity="0.2"
                    className={`origin-center ${mode !== 'idle' && mode !== 'paused' ? 'animate-[breathe_var(--pulse-dur)_ease-in-out_infinite]' : ''}`}
                    style={{ "--pulse-dur": animProps.pulseDuration } as React.CSSProperties}
                />

                <style>
                    {`
            .rotate-[-90deg] { transform: rotate(-90deg); }
            @keyframes spin {
              100% { transform: rotate(360deg); }
            }
            @keyframes breathe {
              0%, 100% { transform: scale(1); opacity: 0.1; }
              50% { transform: scale(1.15) rotate(15deg); opacity: 0.3; }
            }
          `}
                </style>
            </svg>

            {/* Nano Banana Pro 4K Center Image */}
            <div className="absolute inset-0 flex items-center justify-center p-8 z-10 pointer-events-none">
                <div className="relative w-full h-full opacity-90 transition-opacity duration-700">
                    <Image
                        src="/images/bonsai_crystal.png"
                        alt="Serene Bonsai Crystal"
                        fill
                        className="object-contain drop-shadow-[0_0_20px_rgba(129,140,248,0.3)]"
                        priority
                    />
                </div>
            </div>
        </div>
    );
}
