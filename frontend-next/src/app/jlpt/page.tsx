"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Sparkles } from "lucide-react";
import { ModeSelector, FilterBar, PracticeCard } from "@/components/practice";
import { mockExamConfigs, filterExams } from "@/data/mockPractice";
import { PracticeMode, JLPTLevel, SkillType, FilterState } from "@/types/practice";

export default function JLPTPracticePage() {
    const router = useRouter();

    // Filter State
    const [filters, setFilters] = useState<FilterState>({
        mode: "ALL",
        level: "ALL",
        skill: "ALL",
    });

    // Filtered exams
    const filteredExams = useMemo(() => {
        return filterExams(filters.mode, filters.level, filters.skill);
    }, [filters]);

    // Handlers
    const handleModeChange = (mode: PracticeMode) => {
        setFilters((prev) => ({
            ...prev,
            mode,
            // Reset skill filter when switching to Full Exam
            skill: mode === "FULL_EXAM" ? "ALL" : prev.skill,
        }));
    };

    const handleLevelChange = (level: JLPTLevel | "ALL") => {
        setFilters((prev) => ({ ...prev, level }));
    };

    const handleSkillChange = (skill: SkillType | "ALL") => {
        setFilters((prev) => ({ ...prev, skill }));
    };

    const handleStartExam = (examId: string) => {
        // Navigate to the new cleaner URL
        router.push(`/jlpt/${examId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        {/* Back & Title */}
                        <div className="flex items-center gap-4">
                            <Link
                                href="/practice"
                                className="flex items-center gap-2 text-slate-500 hover:text-brand-green transition-colors"
                            >
                                <ArrowLeft size={20} />
                                <span className="text-sm font-medium hidden sm:inline">Back</span>
                            </Link>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                    <GraduationCap size={26} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-brand-dark">
                                        JLPT Practice
                                    </h1>
                                    <p className="text-xs text-slate-500">
                                        Quizzes, exams & full simulations
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Badge (Placeholder) */}
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                            <Sparkles size={18} className="text-amber-500" />
                            <span className="text-sm font-semibold text-amber-700">
                                {mockExamConfigs.length} Tests Available
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mode Selector */}
                <div className="mb-6">
                    <ModeSelector selectedMode={filters.mode} onModeChange={handleModeChange} />
                </div>

                {/* Filter Bar */}
                <div className="mb-8">
                    <FilterBar
                        selectedLevel={filters.level}
                        selectedSkill={filters.skill}
                        selectedMode={filters.mode}
                        onLevelChange={handleLevelChange}
                        onSkillChange={handleSkillChange}
                    />
                </div>

                {/* Results Count */}
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-bold text-brand-dark">{filteredExams.length}</span> results
                    </p>
                </div>

                {/* Exam Cards Grid */}
                {filteredExams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExams.map((exam) => (
                            <PracticeCard key={exam.id} config={exam} onStart={handleStartExam} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                            <GraduationCap size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 mb-2">No Tests Found</h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">
                            Try adjusting your filters to find more practice tests.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
