"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Lightbulb, Brain } from "lucide-react";

interface AnalysisBlockProps {
    feedback: {
        title: string;
        message: string;
        suggestions: string[];
    };
}

export function AnalysisBlock({ feedback }: AnalysisBlockProps) {
    if (!feedback) return null;
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="bg-[#0D0D0D] p-10 md:p-14 rounded-[3.5rem] relative overflow-hidden group border border-white/5"
        >
            {/* Animated Background Atmosphere */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
                    <div className="w-16 h-16 bg-neutral-beige/5 rounded-[1.5rem] flex items-center justify-center border border-white/5 shadow-2xl">
                        <Sparkles size={32} className="text-secondary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Brain size={14} className="text-primary-strong" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-beige/30">AI Learning Synthesis</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black text-neutral-beige font-display tracking-tight leading-none">
                            {feedback.title}
                        </h3>
                    </div>
                </div>

                <div className="relative mb-14">
                    <span className="absolute -left-6 top-0 text-6xl font-serif text-white/5 pointer-events-none">&ldquo;</span>
                    <p className="text-xl md:text-2xl font-bold text-neutral-beige/80 leading-relaxed italic pr-4">
                        {feedback.message}
                    </p>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-neutral-beige/20 whitespace-nowrap">Strategic Recommendations</span>
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {feedback.suggestions.map((suggestion, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 2 + (i * 0.1) }}
                                className="flex items-start gap-5 p-6 bg-white/[0.03] rounded-[2rem] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all duration-300 group/item"
                            >
                                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 group-hover/item:rotate-6 transition-all duration-500">
                                    <Lightbulb size={18} className="text-secondary" />
                                </div>
                                <span className="text-sm font-bold text-neutral-beige/60 leading-relaxed group-hover/item:text-neutral-beige/80 transition-colors">
                                    {suggestion}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
