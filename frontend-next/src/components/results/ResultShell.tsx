"use client";

import React from "react";
import { motion } from "framer-motion";
import { UnifiedSessionResult } from "@/types/results";
import { ScoreLantern } from "./ScoreLantern";
import { StatCard } from "./StatCard";
import { AnalysisBlock } from "./AnalysisBlock";
import { Trophy, Share2, ArrowRight, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

interface ResultShellProps {
    result: UnifiedSessionResult;
    onRetry?: () => void;
    customActions?: React.ReactNode;
}

export function ResultShell({ result, onRetry, customActions }: ResultShellProps) {
    return (
        <div className="min-h-screen bg-secondary/30 pb-20">
            {/* Success Atmosphere */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary/10 to-transparent" />
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-secondary/5 rounded-full blur-[150px] -mr-[25vw] -mt-[25vw]" />
            </div>

            <div className="max-w-6xl mx-auto px-8 py-16 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-16">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink/40 hover:text-primary-strong transition-all group"
                    >
                        <Home size={16} />
                        Back to Command Center
                    </Link>
                    <div className="flex items-center gap-4">
                        <button className="p-4 bg-neutral-white border border-neutral-gray/10 rounded-2xl text-neutral-ink/60 hover:text-primary-strong transition-all shadow-sm">
                            <Share2 size={20} />
                        </button>
                        <button className="p-4 bg-primary-strong text-white rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                            <Trophy size={20} />
                            Save Protocol
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Score & Stats */}
                    <div className="lg:col-span-4 space-y-12">
                        <ScoreLantern score={result.score} />

                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                            {result.stats.map((stat, i) => (
                                <StatCard key={i} stat={stat} index={i} />
                            ))}
                        </div>
                    </div>

                    {/* Right: Analysis & Achievements */}
                    <div className="lg:col-span-8 space-y-12">
                        <AnalysisBlock feedback={result.feedback} />

                        {/* Achievements Row */}
                        {result.achievements.length > 0 && (
                            <section className="space-y-8">
                                <h4 className="text-[11px] font-black text-neutral-ink/30 uppercase tracking-[0.4em] flex items-center gap-4">
                                    Achievements Unlocked
                                    <div className="flex-1 h-[1px] bg-neutral-gray/10" />
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {result.achievements.map((achievement, i) => (
                                        <motion.div
                                            key={achievement.id}
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 2 + (i * 0.1) }}
                                            className="p-6 bg-neutral-white border border-neutral-gray/10 rounded-[2rem] flex items-center gap-6 shadow-sm group hover:border-secondary/40 transition-all"
                                        >
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${achievement.rarity === 'LEGENDARY' ? 'bg-amber-100 text-amber-500' : 'bg-primary/10 text-primary-strong'}`}>
                                                <achievement.icon size={32} />
                                            </div>
                                            <div>
                                                <h5 className="text-lg font-black text-neutral-ink">{achievement.title}</h5>
                                                <p className="text-xs font-bold text-neutral-ink/40">{achievement.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Global Actions */}
                        <div className="flex flex-wrap items-center gap-6 pt-8">
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="px-10 py-5 bg-neutral-white border-2 border-neutral-gray/10 text-neutral-ink rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:border-primary-strong/40 transition-all active:scale-95 shadow-lg shadow-neutral-ink/5"
                                >
                                    <RotateCcw size={20} />
                                    Retry Protocol
                                </button>
                            )}
                            {customActions}
                            <Link
                                href="/practice"
                                className="px-10 py-5 bg-primary-strong text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                            >
                                Next Objective
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
