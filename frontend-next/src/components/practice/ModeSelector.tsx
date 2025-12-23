"use client";

import React from "react";
import { BookCheck, FileText, Zap } from "lucide-react";
import { PracticeMode } from "@/types/practice";

interface ModeSelectorProps {
    selectedMode: PracticeMode;
    onModeChange: (mode: PracticeMode) => void;
}

const modes: { value: PracticeMode; label: string; icon: React.ReactNode }[] = [
    { value: "FULL_EXAM", label: "Full Exam", icon: <BookCheck size={20} /> },
    { value: "QUIZ", label: "Quick Quiz", icon: <Zap size={20} /> },
    { value: "SINGLE_EXAM", label: "Single Topic", icon: <FileText size={20} /> },
];

export default function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
    return (
        <div className="flex flex-wrap gap-3 p-1.5 bg-muted rounded-2xl w-fit">
            {modes.map((mode) => (
                <button
                    key={mode.value}
                    onClick={() => onModeChange(mode.value)}
                    className={`
                        flex items-center gap-3 px-5 py-3 rounded-xl transition-colors font-display font-bold text-sm
                        ${selectedMode === mode.value
                            ? "bg-card text-foreground border border-border"
                            : "text-muted-foreground hover:text-foreground"
                        }
                    `}
                >
                    {mode.icon}
                    <span>{mode.label}</span>
                </button>
            ))}
        </div>
    );
}
