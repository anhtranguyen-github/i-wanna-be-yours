"use client";

import React from "react";
import { motion } from "framer-motion";

interface ScoreLanternProps {
    score: number;
    label?: string;
}

export function ScoreLantern({ score, label = "Mastery Score" }: ScoreLanternProps) {
    // Determine color based on score
    const getColorConfig = () => {
        if (score >= 90) return { color: "text-emerald-500", glow: "shadow-emerald-500/50", bg: "bg-emerald-500/10" };
        if (score >= 70) return { color: "text-primary-strong", glow: "shadow-primary/50", bg: "bg-primary-strong/10" };
        if (score >= 50) return { color: "text-amber-500", glow: "shadow-amber-500/50", bg: "bg-amber-500/10" };
        return { color: "text-rose-500", glow: "shadow-rose-500/50", bg: "bg-rose-500/10" };
    };
    const config = getColorConfig();

    const getGlowRgb = () => {
        if (score >= 90) return 'rgba(16, 185, 129, 0.3)'; // Emerald
        if (score >= 70) return 'rgba(255, 68, 102, 0.3)'; // Primary
        if (score >= 50) return 'rgba(245, 158, 11, 0.3)'; // Amber
        return 'rgba(244, 63, 94, 0.3)'; // Rose
    };

    return (
        <div className="relative flex flex-col items-center justify-center py-16">
            {/* Background Atmosphere */}
            <div className={`absolute inset-0 rounded-full blur-[100px] opacity-20 ${config.bg}`} />

            {/* Rotating Outer Glow */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-80 h-80 rounded-full border border-dashed border-neutral-gray/20 pointer-events-none"
            />

            <div className="relative z-10">
                {/* SVG Progress Circle */}
                <svg className="w-72 h-72 -rotate-90">
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" className="stop-primary" style={{ stopColor: 'var(--primary-strong)' }} />
                            <stop offset="100%" className="stop-secondary" style={{ stopColor: 'var(--secondary)' }} />
                        </linearGradient>
                    </defs>
                    <circle
                        cx="144"
                        cy="144"
                        r="130"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="transparent"
                        className="text-neutral-gray/10"
                    />
                    <circle
                        cx="144"
                        cy="144"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-neutral-gray/5"
                    />
                    <motion.circle
                        cx="144"
                        cy="144"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeDasharray={2 * Math.PI * 120}
                        initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                        animate={{ strokeDashoffset: (2 * Math.PI * 120) * (1 - score / 100) }}
                        transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                        strokeLinecap="round"
                        fill="transparent"
                        className={config.color}
                        style={{ filter: `drop-shadow(0 0 15px ${getGlowRgb()})` }}
                    />
                </svg>

                {/* Score Number */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 1, type: "spring" }}
                        className="text-center"
                    >
                        <div className="flex items-baseline justify-center">
                            <span className={`text-[100px] font-black font-display tracking-tighter leading-none ${config.color}`}>
                                {score}
                            </span>
                            <span className={`text-3xl font-black ml-1 ${config.color} opacity-60`}>%</span>
                        </div>

                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: 40 }}
                            transition={{ delay: 1, duration: 0.8 }}
                            className={`h-1.5 mx-auto rounded-full mt-2 ${config.bg.replace('/10', '')}`}
                        />
                    </motion.div>
                </div>
            </div>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="mt-8 text-[12px] font-black uppercase tracking-[0.5em] text-neutral-ink/70 flex items-center gap-4"
            >
                <span className="w-8 h-[1px] bg-neutral-gray/20" />
                {label}
                <span className="w-8 h-[1px] bg-neutral-gray/20" />
            </motion.p>
        </div>
    );
}
