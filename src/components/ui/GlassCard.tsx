"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export default function GlassCard({ children, className, hoverEffect = true, ...props }: GlassCardProps) {
    return (
        <motion.div
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl",
                hoverEffect && "hover:bg-white/10 hover:border-white/20 hover:shadow-2xl transition-all duration-300",
                className
            )}
            whileHover={hoverEffect ? { y: -2 } : {}}
            {...props}
        >
            {/* Shine effect on hover - implemented via CSS or simpler framer usage if needed */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            {children}
        </motion.div>
    );
}
