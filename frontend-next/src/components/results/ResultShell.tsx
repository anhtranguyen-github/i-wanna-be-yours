"use client";

import React from "react";
import { motion } from "framer-motion";
import { UnifiedSessionResult } from "@/types/results";
import { ScoreLantern } from "./ScoreLantern";
import { StatCard } from "./StatCard";
import { AnalysisBlock } from "./AnalysisBlock";
import { Trophy, Share2, ArrowRight, RotateCcw, Home, Sparkles } from "lucide-react";
import Link from "next/link";

interface ResultShellProps {
    result: UnifiedSessionResult;
    onRetry?: () => void;
    customActions?: React.ReactNode;
    children?: React.ReactNode;
}

export function ResultShell({ result, onRetry, customActions, children }: ResultShellProps) {
    return (
        <div className="min-h-screen bg-neutral-beige/20 relative overflow-hidden pb-32">
            {/* Immersive Atmosphere Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Dynamic Gradients */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-primary/5 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-secondary/5 rounded-full blur-[100px]"
                />

                {/* Decorative Pattern / Grain */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 relative z-10">
                {/* Navigation & Actions Header */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20"
                >
                    <div className="space-y-2">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-neutral-white border border-neutral-gray/10 flex items-center justify-center group-hover:bg-primary-strong group-hover:text-neutral-beige transition-all">
                                <Home size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-ink/40 group-hover:text-neutral-ink transition-colors">Command Center</span>
                        </Link>
                        <h1 className="text-4xl font-black text-neutral-ink font-display tracking-tight flex items-center gap-3">
                            Protocol Complete
                            <Sparkles size={24} className="text-secondary animate-pulse" />
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="h-14 w-14 inline-flex items-center justify-center bg-neutral-white border border-neutral-gray/10 rounded-2xl text-neutral-ink hover:text-primary-strong transition-all shadow-sm hover:shadow-md">
                            <Share2 size={20} />
                        </button>
                        <button className="h-14 px-8 bg-neutral-ink text-neutral-beige rounded-2xl flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary-strong hover:scale-[1.02] active:scale-95 transition-all">
                            <Trophy size={18} className="text-secondary" />
                            Secure Record
                        </button>
                    </div>
                </motion.header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
                    {/* Left Panel: Score & Key Stats */}
                    <div className="lg:col-span-12 xl:col-span-4 space-y-12">
                        <div className="bg-neutral-white/40 backdrop-blur-xl border border-neutral-gray/10 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-50" />
                            <ScoreLantern score={result.score} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
                            {result.stats.map((stat, i) => (
                                <StatCard key={i} stat={stat} index={i} />
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Analysis & Achievements */}
                    <div className="lg:col-span-12 xl:col-span-8 space-y-12">
                        <AnalysisBlock feedback={result.feedback} />

                        {/* Achievements Section */}
                        {result.achievements.length > 0 && (
                            <section className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <h4 className="text-[11px] font-black text-neutral-ink/40 uppercase tracking-[0.5em] whitespace-nowrap">
                                        Commendations
                                    </h4>
                                    <div className="flex-1 h-[1px] bg-neutral-gray/10" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {result.achievements.map((achievement, i) => (
                                        <motion.div
                                            key={achievement.id}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 2 + (i * 0.1) }}
                                            className="p-8 bg-neutral-white/60 backdrop-blur-md border border-neutral-gray/10 rounded-[2.5rem] flex items-center gap-6 group hover:border-secondary/40 hover:bg-neutral-white transition-all duration-500"
                                        >
                                            <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${achievement.rarity === 'LEGENDARY'
                                                    ? 'bg-amber-100 text-amber-600 shadow-inner'
                                                    : 'bg-primary/10 text-primary-strong shadow-inner'
                                                }`}>
                                                <achievement.icon size={28} />
                                            </div>
                                            <div>
                                                <h5 className="text-lg font-black text-neutral-ink mb-1">{achievement.title}</h5>
                                                <p className="text-xs font-bold text-neutral-ink/60 leading-tight">{achievement.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Unified Action Hub */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.5 }}
                            className="flex flex-wrap items-center gap-6 pt-12 border-t border-neutral-gray/10"
                        >
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="h-16 px-10 bg-neutral-white border-2 border-neutral-gray/10 text-neutral-ink rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 hover:border-primary-strong/30 hover:bg-neutral-beige/10 transition-all active:scale-95 shadow-sm"
                                >
                                    <RotateCcw size={20} className="text-primary-strong" />
                                    Retry Sequence
                                </button>
                            )}

                            {customActions}

                            <Link
                                href="/activity"
                                className="h-16 flex-1 min-w-[200px] bg-primary-strong text-neutral-beige rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-98 transition-all shadow-xl shadow-primary/20"
                            >
                                Advance Objective
                                <ArrowRight size={20} />
                            </Link>
                        </motion.div>

                        {children}
                    </div>
                </div>
            </div>

            {/* Visual Balance Decoration */}
            <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-secondary/5 rounded-full blur-[150px] -mr-[20vw] -mt-[20vw] z-0" />
            <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-primary/5 rounded-full blur-[120px] -ml-[15vw] -mb-[15vw] z-0" />
        </div>
    );
}
