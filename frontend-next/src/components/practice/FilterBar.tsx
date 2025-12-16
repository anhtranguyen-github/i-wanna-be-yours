"use client";

import React from "react";
import { JLPTLevel, SkillType, PracticeMode } from "@/types/practice";
import { Filter, ChevronDown } from "lucide-react";

interface FilterBarProps {
    selectedLevel: JLPTLevel | "ALL";
    selectedSkill: SkillType | "ALL";
    selectedMode: PracticeMode;
    onLevelChange: (level: JLPTLevel | "ALL") => void;
    onSkillChange: (skill: SkillType | "ALL") => void;
}

const levels: (JLPTLevel | "ALL")[] = ["ALL", "N5", "N4", "N3", "N2", "N1"];
const skills: (SkillType | "ALL")[] = ["ALL", "VOCABULARY", "GRAMMAR", "READING", "LISTENING"];

const skillLabels: Record<SkillType | "ALL", string> = {
    ALL: "All Skills",
    VOCABULARY: "Vocabulary",
    GRAMMAR: "Grammar",
    READING: "Reading",
    LISTENING: "Listening",
};

export default function FilterBar({
    selectedLevel,
    selectedSkill,
    selectedMode,
    onLevelChange,
    onSkillChange,
}: FilterBarProps) {
    const isSkillDisabled = selectedMode === "FULL_EXAM";

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Filter Icon */}
            <div className="flex items-center gap-2 text-slate-500">
                <Filter size={18} />
                <span className="text-sm font-medium hidden sm:inline">Filter</span>
            </div>

            {/* Level Dropdown */}
            <div className="relative">
                <select
                    value={selectedLevel}
                    onChange={(e) => onLevelChange(e.target.value as JLPTLevel | "ALL")}
                    className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 cursor-pointer hover:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                >
                    <option value="ALL">All Levels</option>
                    {levels.filter((l) => l !== "ALL").map((level) => (
                        <option key={level} value={level}>
                            {level}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
            </div>

            {/* Skill Dropdown */}
            <div className="relative">
                <select
                    value={selectedSkill}
                    onChange={(e) => onSkillChange(e.target.value as SkillType | "ALL")}
                    disabled={isSkillDisabled}
                    className={`
            appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium cursor-pointer transition-all
            ${isSkillDisabled
                            ? "opacity-50 cursor-not-allowed text-slate-400"
                            : "text-slate-700 hover:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                        }
          `}
                >
                    {skills.map((skill) => (
                        <option key={skill} value={skill}>
                            {skillLabels[skill]}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
            </div>

            {isSkillDisabled && (
                <span className="text-xs text-slate-400 italic">
                    Skill filter disabled for Full Exam
                </span>
            )}
        </div>
    );
}
