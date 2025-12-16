"use client";

import React from "react";
import { ExamConfig, PracticeMode } from "@/types/practice";
import { Zap, FileText, BookOpen, Clock, HelpCircle, Play, ChevronRight } from "lucide-react";

interface PracticeCardProps {
    config: ExamConfig;
    onStart: (examId: string) => void;
}

const modeIcons: Record<Exclude<PracticeMode, "ALL">, React.ReactNode> = {
    QUIZ: <Zap size={24} />,
    SINGLE_EXAM: <FileText size={24} />,
    FULL_EXAM: <BookOpen size={24} />,
};

const modeColors: Record<Exclude<PracticeMode, "ALL">, { bg: string; text: string; border: string }> = {
    QUIZ: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
    SINGLE_EXAM: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    FULL_EXAM: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
};

const modeLabels: Record<Exclude<PracticeMode, "ALL">, string> = {
    QUIZ: "Quiz",
    SINGLE_EXAM: "Single Exam",
    FULL_EXAM: "Full Exam",
};

const skillColors: Record<string, string> = {
    VOCABULARY: "bg-amber-100 text-amber-700",
    GRAMMAR: "bg-rose-100 text-rose-700",
    READING: "bg-sky-100 text-sky-700",
    LISTENING: "bg-violet-100 text-violet-700",
};

export default function PracticeCard({ config, onStart }: PracticeCardProps) {
    const colors = modeColors[config.mode];

    const formatTime = (minutes?: number) => {
        if (!minutes) return "Unlimited";
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${minutes}m`;
    };

    return (
        <div
            className={`
        group relative bg-white rounded-2xl border-2 ${colors.border} p-6 
        shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300
        overflow-hidden
      `}
        >
            {/* Background Gradient Accent */}
            <div
                className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 group-hover:opacity-80 transition-opacity`}
            />

            {/* Header */}
            <div className="relative flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${colors.bg} ${colors.text} rounded-xl flex items-center justify-center`}>
                    {modeIcons[config.mode]}
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                    {modeLabels[config.mode]}
                </span>
            </div>

            {/* Title & Description */}
            <h3 className="text-xl font-bold text-brand-dark mb-2 group-hover:text-brand-green transition-colors">
                {config.title}
            </h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{config.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {config.level}
                </span>
                {config.skills.map((skill) => (
                    <span
                        key={skill}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${skillColors[skill]}`}
                    >
                        {skill.charAt(0) + skill.slice(1).toLowerCase()}
                    </span>
                ))}
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                <div className="flex items-center gap-1.5">
                    <HelpCircle size={16} className="text-slate-400" />
                    <span>{config.questionCount} questions</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock size={16} className="text-slate-400" />
                    <span>{formatTime(config.timeLimitMinutes)}</span>
                </div>
            </div>

            {/* Sections (for Full Exam) */}
            {config.sections && config.sections.length > 0 && (
                <div className="mb-6 p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Sections:</p>
                    <div className="flex flex-wrap gap-2">
                        {config.sections.map((section) => (
                            <span
                                key={section.id}
                                className="text-xs px-2 py-1 bg-white rounded-md border border-slate-200 text-slate-600"
                            >
                                {section.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Start Button */}
            <button
                onClick={() => onStart(config.id)}
                className={`
          w-full flex items-center justify-center gap-2 px-6 py-3.5 
          ${colors.bg} ${colors.text} rounded-xl font-bold text-sm
          hover:opacity-90 active:scale-[0.98] transition-all duration-200
          group/btn
        `}
            >
                <Play size={18} className="group-hover/btn:scale-110 transition-transform" />
                Start
                <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
