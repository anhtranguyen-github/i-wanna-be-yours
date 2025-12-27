"use client";

import React from "react";
import { Clock, FileText, Play, ChevronRight } from "lucide-react";
import { ExamConfig } from "@/types/practice";

interface PracticeCardProps {
    config: ExamConfig;
    onStart: (examId: string) => void;
}

const skillColors: Record<string, string> = {
    VOCABULARY: "bg-primary-leaf/10 text-primary-leaf",
    GRAMMAR: "bg-primary-sky/10 text-primary-sky",
    READING: "bg-primary/10 text-primary-strong",
    LISTENING: "bg-accent/10 text-accent",
};

export default function PracticeCard({ config, onStart }: PracticeCardProps) {
    const skillList = config.tags?.skills || (config as any).skills || [];

    return (
        <div
            className="group bg-neutral-white rounded-[2rem] border border-neutral-gray/20 p-8 hover:border-primary-strong transition-all duration-300 cursor-pointer flex flex-col h-full relative overflow-hidden"
            onClick={() => onStart(config.id)}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

            {/* Header */}
            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex-1">
                    <span className="inline-block px-3 py-1 bg-neutral-beige text-neutral-ink font-black rounded-lg text-[10px] uppercase tracking-widest mb-3 border border-neutral-gray/10">
                        {config.tags?.levels?.[0] || (config as any).levels?.[0]}
                    </span>
                    <h3 className="text-xl font-black text-neutral-ink font-display group-hover:text-primary-strong transition-colors tracking-tight leading-tight">
                        {config.title}
                    </h3>
                </div>
                <div className="w-12 h-12 bg-neutral-beige/50 rounded-2xl flex items-center justify-center text-neutral-ink group-hover:bg-neutral-white border border-neutral-gray/20 transition-all">
                    <FileText size={24} />
                </div>
            </div>

            {/* Description */}
            {config.description && (
                <p className="text-sm text-neutral-ink font-bold mb-6 line-clamp-2 relative z-10 leading-relaxed">
                    {config.description}
                </p>
            )}

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                {skillList.slice(0, 3).map((skill) => (
                    <span
                        key={skill}
                        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${skillColors[skill] || "bg-neutral-beige text-neutral-ink"}`}
                    >
                        {skill.toLowerCase()}
                    </span>
                ))}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-ink mb-8 mt-auto relative z-10">
                <span className="flex items-center gap-2">
                    <FileText size={14} className="text-primary-strong" />
                    {config.stats?.questionCount || (config as any).questionCount} Questions
                </span>
                {(config.stats?.timeLimitMinutes || (config as any).timeLimitMinutes) && (
                    <span className="flex items-center gap-2">
                        <Clock size={14} className="text-primary-sky" />
                        {config.stats?.timeLimitMinutes || (config as any).timeLimitMinutes} Minutes
                    </span>
                )}
            </div>

            {/* Start Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onStart(config.id); }}
                className="w-full flex items-center justify-center gap-3 py-4 bg-neutral-ink text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary-strong transition-all duration-300 font-display active:scale-[0.98]"
            >
                <Play size={16} className="fill-current" />
                Initiate Protocol
                <ChevronRight size={18} className="ml-auto" />
            </button>
        </div>
    );
}
