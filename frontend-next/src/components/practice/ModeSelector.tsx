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
        <div className="flex bg-neutral-beige p-2 rounded-[2rem] border border-neutral-gray/20 w-full max-w-2xl">
            {modes.map((mode) => (
                <button
                    key={mode.value}
                    onClick={() => onModeChange(mode.value)}
                    className={`
                        flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 font-display font-black text-[10px] uppercase tracking-widest
                        ${selectedMode === mode.value
                            ? "bg-neutral-white text-primary-strong shadow-md border border-neutral-gray/10 ring-1 ring-primary-strong/5"
                            : "text-neutral-ink hover:text-neutral-ink"
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
