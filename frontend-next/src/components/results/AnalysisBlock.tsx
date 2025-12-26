"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";

interface AnalysisBlockProps {
    feedback: {
        title: string;
        message: string;
        suggestions: string[];
    };
}

export function AnalysisBlock({ feedback }: AnalysisBlockProps) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="bg-neutral-ink text-white p-10 rounded-[3rem]  relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />

            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Sparkles size={24} className="text-secondary" />
                </div>
                <div>
                    <h3 className="text-2xl font-black font-display tracking-tight">{feedback.title}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">AI Learning Synthesis</p>
                </div>
            </div>

            <p className="text-xl font-medium text-white/70 leading-relaxed mb-10 italic">
                &quot;{feedback.message}&quot;
            </p>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-6 flex items-center gap-3">
                    <div className="w-8 h-[2px] bg-white/10" />
                    Strategic Recommendations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedback.suggestions.map((suggestion, i) => (
                        <div key={i} className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group/item">
                            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                                <Lightbulb size={16} className="text-secondary" />
                            </div>
                            <span className="text-sm font-bold text-white/60 leading-snug">{suggestion}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
