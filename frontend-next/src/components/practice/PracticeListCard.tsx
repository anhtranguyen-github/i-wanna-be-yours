"use client";

import React from "react";
import {
    Clock,
    FileText,
    Play,
    ChevronRight,
    Zap,
    Trophy,
    FlaskConical,
    CheckCircle2,
    Lock
} from "lucide-react";
import { PracticeNode } from "@/types/practice";

interface PracticeListCardProps {
    node: PracticeNode;
    onStart: (id: string) => void;
}

const levelColors: Record<string, string> = {
    N1: "bg-primary-strong text-white border-primary-strong",
    N2: "bg-primary text-white border-primary",
    N3: "bg-primary-sky text-white border-primary-sky",
    N4: "bg-primary-leaf text-white border-primary-leaf",
    N5: "bg-accent text-white border-accent",
    ALL: "bg-neutral-beige text-neutral-ink border-neutral-gray/20",
};

const modeIcons: Record<string, React.ReactNode> = {
    QUIZ: <Zap size={18} className="text-secondary" />,
    FULL_EXAM: <Trophy size={18} className="text-primary-strong" />,
    SINGLE_EXAM: <FileText size={18} className="text-primary-sky" />,
};

export default function PracticeListCard({ node, onStart }: PracticeListCardProps) {
    const { tags, stats, personalData, isPremium } = node;
    const isCompleted = personalData?.hasCompleted;
    const isPassed = personalData?.status === 'PASSED';

    return (
        <div
            className="group relative bg-neutral-white border border-neutral-gray/20 rounded-[1.5rem] p-5 hover:border-primary-strong transition-all duration-300 cursor-pointer flex items-center gap-6"
            onClick={() => !isPremium && onStart(node.id)}
        >
            {/* Left: Identity Badge */}
            <div className={`
                flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2
                ${levelColors[tags.levels?.[0] || 'ALL'] || levelColors.ALL}
            `}>
                <span className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">JLPT</span>
                <span className="text-xl font-black font-display leading-none">{tags.levels?.[0] || 'ALL'}</span>
            </div>

            {/* Middle: Content Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 bg-neutral-beige/50 rounded-md">
                        {modeIcons[node.mode] || <FlaskConical size={18} />}
                    </div>
                    <h3 className="text-lg font-black text-neutral-ink font-display truncate group-hover:text-primary-strong transition-colors">
                        {node.title}
                    </h3>
                    {isCompleted && (
                        <CheckCircle2 size={16} className={isPassed ? "text-primary-leaf" : "text-neutral-ink"} />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-widest text-neutral-ink">
                    <span className="flex items-center gap-1.5">
                        <FileText size={12} className="text-primary-strong" />
                        {stats.questionCount} Units
                    </span>
                    {(stats.timeLimitMinutes || stats.timeLimitSeconds) && (
                        <span className="flex items-center gap-1.5">
                            <Clock size={12} className="text-primary-sky" />
                            {stats.timeLimitMinutes || Math.floor((stats.timeLimitSeconds || 0) / 60)} Min
                        </span>
                    )}
                    <span className="px-2 py-0.5 bg-neutral-beige rounded text-neutral-ink border border-neutral-gray/10">
                        {(tags.skills?.[0] || node.mode).toLowerCase()}
                    </span>
                    {tags.isStrict && (
                        <span className="text-secondary font-black">Strict Mode</span>
                    )}
                </div>
            </div>

            {/* Right: Personalization & Action */}
            <div className="flex flex-col items-end gap-2 pr-2">
                {personalData && personalData.attemptCount > 0 && (
                    <div className="text-right">
                        <p className="text-[9px] font-black text-neutral-ink uppercase tracking-widest">Best Result</p>
                        <p className={`text-xl font-black font-display ${isPassed ? "text-primary-leaf" : "text-neutral-ink"}`}>
                            {personalData.bestScore}%
                        </p>
                    </div>
                )}

                <div className="flex items-center">
                    {isPremium ? (
                        <div className="flex items-center gap-2 text-neutral-ink">
                            <Lock size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Locked</span>
                        </div>
                    ) : (
                        <button
                            className="p-3 bg-neutral-beige text-neutral-ink rounded-xl group-hover:bg-primary-strong group-hover:text-white transition-all active:scale-95"
                            onClick={(e) => { e.stopPropagation(); onStart(node.id); }}
                        >
                            <Play size={18} className="fill-current" />
                        </button>
                    )}
                </div>
            </div>

            {/* Active Highlight Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-strong rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
