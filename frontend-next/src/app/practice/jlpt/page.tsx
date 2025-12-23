"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Target, BookOpen } from "lucide-react";
import ModeSelector from "@/components/practice/ModeSelector";
import FilterBar from "@/components/practice/FilterBar";
import PracticeCard from "@/components/practice/PracticeCard";
import { mockExamConfigs } from "@/data/mockPractice";
import { PracticeMode, JLPTLevel, SkillType } from "@/types/practice";

export default function JLPTPracticePage() {
    const router = useRouter();
    const [filters, setFilters] = useState({
        mode: "FULL_EXAM" as PracticeMode,
        level: "ALL" as JLPTLevel | "ALL",
        skill: "ALL" as SkillType | "ALL",
    });

    const filteredExams = useMemo(() => {
        return mockExamConfigs.filter((exam) => {
            if (filters.level !== "ALL" && exam.level !== filters.level) return false;
            if (filters.mode === "FULL_EXAM" && exam.mode !== "FULL_EXAM") return false;
            if (filters.mode !== "FULL_EXAM" && filters.skill !== "ALL") {
                if (!exam.skills.includes(filters.skill)) return false;
            }
            return true;
        });
    }, [filters]);

    const handleModeChange = (mode: PracticeMode) => {
        setFilters((prev) => ({ ...prev, mode, skill: mode === "FULL_EXAM" ? "ALL" : prev.skill }));
    };

    const handleLevelChange = (level: JLPTLevel | "ALL") => {
        setFilters((prev) => ({ ...prev, level }));
    };

    const handleSkillChange = (skill: SkillType | "ALL") => {
        setFilters((prev) => ({ ...prev, skill }));
    };

    const handleStartExam = (examId: string) => {
        router.push(`/practice/jlpt/session/${examId}`);
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-6 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Target size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground font-display">JLPT Practice</h1>
                            <p className="text-sm text-muted-foreground">Prepare for your Japanese proficiency test</p>
                        </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="mb-6">
                        <ModeSelector selectedMode={filters.mode} onModeChange={handleModeChange} />
                    </div>

                    {/* Filters */}
                    <FilterBar
                        selectedLevel={filters.level}
                        selectedSkill={filters.skill}
                        selectedMode={filters.mode}
                        onLevelChange={handleLevelChange}
                        onSkillChange={handleSkillChange}
                    />
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {filteredExams.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={32} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">No exams found</h3>
                        <p className="text-muted-foreground">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExams.map((exam) => (
                            <PracticeCard key={exam.id} config={exam} onStart={handleStartExam} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
