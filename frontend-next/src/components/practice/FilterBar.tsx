"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { JLPTLevel, SkillType, PracticeMode } from "@/types/practice";

interface FilterBarProps {
    selectedLevel: JLPTLevel | "ALL";
    selectedSkill: SkillType | "ALL";
    selectedMode: PracticeMode;
    onLevelChange: (level: JLPTLevel | "ALL") => void;
    onSkillChange: (skill: SkillType | "ALL") => void;
}

const levels: (JLPTLevel | "ALL")[] = ["ALL", "N5", "N4", "N3", "N2", "N1"];
const skills: (SkillType | "ALL")[] = ["ALL", "VOCABULARY", "GRAMMAR", "READING", "LISTENING"];

export default function FilterBar({
    selectedLevel,
    selectedSkill,
    selectedMode,
    onLevelChange,
    onSkillChange,
}: FilterBarProps) {
    const isSkillDisabled = selectedMode === "FULL_EXAM";

    return (
        <div className="flex flex-wrap items-center gap-4">
            {/* Level Filter */}
            <div className="relative min-w-[160px]">
                <label className="block text-[10px] font-black text-neutral-ink uppercase tracking-widest mb-2 ml-1">Cognitive Level</label>
                <select
                    value={selectedLevel}
                    onChange={(e) => onLevelChange(e.target.value as JLPTLevel | "ALL")}
                    className="appearance-none w-full bg-neutral-white border border-neutral-gray/30 rounded-2xl px-5 py-3 pr-12 text-xs font-black text-neutral-ink cursor-pointer hover:border-primary-strong focus:outline-none focus:border-primary-strong transition-all font-display"
                >
                    <option value="ALL">All Levels</option>
                    {levels.filter((l) => l !== "ALL").map((level) => (
                        <option key={level} value={level}>JLPT {level}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-5 bottom-4 text-neutral-ink pointer-events-none" />
            </div>

            {/* Skill Filter */}
            <div className="relative min-w-[200px]">
                <label className="block text-[10px] font-black text-neutral-ink uppercase tracking-widest mb-2 ml-1">Domain Specification</label>
                <select
                    value={selectedSkill}
                    onChange={(e) => onSkillChange(e.target.value as SkillType | "ALL")}
                    disabled={isSkillDisabled}
                    className={`
                        appearance-none w-full bg-neutral-white border border-neutral-gray/30 rounded-2xl px-5 py-3 pr-12 text-xs font-black cursor-pointer focus:outline-none focus:border-primary-strong transition-all font-display
                        ${isSkillDisabled ? "opacity-30 cursor-not-allowed text-neutral-ink" : "text-neutral-ink hover:border-primary-strong"}
                    `}
                >
                    <option value="ALL">All Skills</option>
                    {skills.filter((s) => s !== "ALL").map((skill) => (
                        <option key={skill} value={skill}>{skill.charAt(0) + skill.slice(1).toLowerCase()}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-5 bottom-4 text-neutral-ink pointer-events-none" />
            </div>
        </div>
    );
}

