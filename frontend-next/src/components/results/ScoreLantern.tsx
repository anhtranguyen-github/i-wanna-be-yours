"use client";

import React from "react";
import { motion } from "framer-motion";

interface ScoreLanternProps {
    score: number;
    label?: string;
}

export function ScoreLantern({ score, label = "Mastery Score" }: ScoreLanternProps) {
    // Determine color based on score
    const getColor = () => {
        if (score >= 90) return "text-emerald-400 shadow-emerald-500/50";
        if (score >= 70) return "text-primary shadow-primary/50";
        if (score >= 50) return "text-amber-400 shadow-amber-500/50";
        return "text-rose-400 shadow-rose-500/50";
    };

    const colorClass = getColor();

    return (
        <div className="relative flex flex-col items-center justify-center py-10">
            {/* Background Atmosphere */}
            <div className={`absolute inset-0 bg-gradient-radial from-current to-transparent opacity-5 blur-[100px] ${colorClass.split(' ')[1]}`} />

            <div className="relative">
                {/* SVG Progress Circle */}
                <svg className="w-64 h-64 -rotate-90">
                    <circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-neutral-gray/10"
                    />
                    <motion.circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeDasharray={2 * Math.PI * 110}
                        initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
                        animate={{ strokeDashoffset: (2 * Math.PI * 110) * (1 - score / 100) }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        strokeLinecap="round"
                        fill="transparent"
                        className={colorClass.split(' ')[0]}
                    />
                </svg>

                {/* Score Number */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                        className="text-center"
                    >
                        <span className={`text-8xl font-black font-display tracking-tight leading-none ${colorClass.split(' ')[0]}`}>
                            {score}
                        </span>
                        <span className={`block text-2xl font-black opacity-50 ${colorClass.split(' ')[0]}`}>%</span>
                    </motion.div>
                </div>
            </div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-[11px] font-black uppercase tracking-[0.4em] text-neutral-ink"
            >
                {label}
            </motion.p>
        </div>
    );
}
