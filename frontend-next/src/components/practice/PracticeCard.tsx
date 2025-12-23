"use client";

import React from "react";
import { Clock, FileText, Play, ChevronRight } from "lucide-react";
import { ExamConfig } from "@/types/practice";

interface PracticeCardProps {
    config: ExamConfig;
    onStart: (examId: string) => void;
}

const skillColors: Record<string, string> = {
    VOCABULARY: "bg-primary/10 text-primary",
    GRAMMAR: "bg-blue-50 text-blue-600",
    READING: "bg-secondary text-secondary-foreground",
    LISTENING: "bg-accent/10 text-accent",
};

export default function PracticeCard({ config, onStart }: PracticeCardProps) {
    const skillList = config.skills || [];

    return (
        <div
            className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-colors cursor-pointer flex flex-col h-full"
            onClick={() => onStart(config.id)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold mb-2">
                        {config.level}
                    </span>
                    <h3 className="text-lg font-bold text-foreground font-display group-hover:text-primary transition-colors">
                        {config.title}
                    </h3>
                </div>
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                    <FileText size={20} />
                </div>
            </div>

            {/* Description */}
            {config.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {config.description}
                </p>
            )}

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
                {skillList.slice(0, 3).map((skill) => (
                    <span
                        key={skill}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${skillColors[skill] || "bg-muted text-muted-foreground"}`}
                    >
                        {skill.toLowerCase()}
                    </span>
                ))}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6 mt-auto">
                <span className="flex items-center gap-1.5">
                    <FileText size={14} />
                    {config.questionCount} questions
                </span>
                {config.timeLimitMinutes && (
                    <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {config.timeLimitMinutes} min
                    </span>
                )}
            </div>

            {/* Start Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onStart(config.id); }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-foreground text-background rounded-xl font-bold text-sm hover:bg-foreground/90 transition-colors"
            >
                <Play size={16} className="fill-current" />
                Start Practice
                <ChevronRight size={16} className="ml-auto" />
            </button>
        </div>
    );
}
