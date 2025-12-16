"use client";

import React from "react";
import { PracticeMode } from "@/types/practice";
import { ListChecks, Zap, FileText, BookOpen } from "lucide-react";

interface ModeSelectorProps {
    selectedMode: PracticeMode;
    onModeChange: (mode: PracticeMode) => void;
}

const modes: { value: PracticeMode; label: string; icon: React.ReactNode }[] = [
    { value: "ALL", label: "All", icon: <ListChecks size={18} /> },
    { value: "QUIZ", label: "Quiz", icon: <Zap size={18} /> },
    { value: "SINGLE_EXAM", label: "Single Exam", icon: <FileText size={18} /> },
    { value: "FULL_EXAM", label: "Full Exam", icon: <BookOpen size={18} /> },
];

export default function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
    return (
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl">
            {modes.map((mode) => (
                <button
                    key={mode.value}
                    onClick={() => onModeChange(mode.value)}
                    className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
            ${selectedMode === mode.value
                            ? "bg-white text-brand-dark shadow-md"
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        }
          `}
                >
                    <span className={selectedMode === mode.value ? "text-brand-green" : "text-slate-400"}>
                        {mode.icon}
                    </span>
                    {mode.label}
                </button>
            ))}
        </div>
    );
}
