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
            <div className="relative">
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 ml-1">Level</label>
                <select
                    value={selectedLevel}
                    onChange={(e) => onLevelChange(e.target.value as JLPTLevel | "ALL")}
                    className="appearance-none bg-card border border-border rounded-xl px-4 py-2.5 pr-10 text-sm font-bold text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary transition-colors"
                >
                    <option value="ALL">All Levels</option>
                    {levels.filter((l) => l !== "ALL").map((level) => (
                        <option key={level} value={level}>JLPT {level}</option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 bottom-3 text-muted-foreground pointer-events-none" />
            </div>

            {/* Skill Filter */}
            <div className="relative">
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 ml-1">Skill</label>
                <select
                    value={selectedSkill}
                    onChange={(e) => onSkillChange(e.target.value as SkillType | "ALL")}
                    disabled={isSkillDisabled}
                    className={`
                        appearance-none bg-card border border-border rounded-xl px-4 py-2.5 pr-10 text-sm font-bold cursor-pointer focus:outline-none transition-colors
                        ${isSkillDisabled ? "opacity-50 cursor-not-allowed text-muted-foreground" : "text-foreground hover:border-primary/50 focus:border-primary"}
                    `}
                >
                    <option value="ALL">All Skills</option>
                    {skills.filter((s) => s !== "ALL").map((skill) => (
                        <option key={skill} value={skill}>{skill.charAt(0) + skill.slice(1).toLowerCase()}</option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 bottom-3 text-muted-foreground pointer-events-none" />
            </div>
        </div>
    );
}
