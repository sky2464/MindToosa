"use client";

import { motion } from "framer-motion";

export default function AmbientBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
            {/* Aurora Gradients */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [-20, 20, -20],
                    y: [-20, 20, -20],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/30 blur-[100px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3],
                    x: [20, -20, 20],
                    y: [20, -20, 20],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                }}
                className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/30 blur-[100px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
                className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-blue-600/20 blur-[100px]"
            />

            {/* Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>
    );
}
