"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Sparkles, Plus, Search, Loader2, AlertCircle, Filter, Zap } from "lucide-react";
import { ModeSelector, FilterBar, PracticeCard } from "@/components/practice";
import { getQuizzes, QuizListItem } from "@/services/quizService";
import { useUser } from "@/context/UserContext";
import { PracticeMode, JLPTLevel, SkillType, FilterState } from "@/types/practice";
import { cn } from "@/lib/utils";

export default function QuizListPage() {
    const router = useRouter();
    const { user } = useUser();

    // State
    const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter State
    const [filters, setFilters] = useState<FilterState>({
        mode: "QUIZ",
        level: "ALL",
        skill: "ALL",
    });

    useEffect(() => {
        fetchQuizzes();
    }, [filters.level, filters.skill]);

    const fetchQuizzes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getQuizzes({
                level: filters.level === "ALL" ? undefined : filters.level,
                category: filters.skill === "ALL" ? undefined : filters.skill.toLowerCase(),
                limit: 50,
            });
            setQuizzes(response.quizzes);
        } catch (err) {
            setError("Protocol failure: Unable to synchronize quiz nodes.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Derived State
    const filteredQuizzes = useMemo(() => {
        return quizzes.filter(quiz => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                quiz.title.toLowerCase().includes(term) ||
                quiz.description.toLowerCase().includes(term)
            );
        });
    }, [quizzes, searchTerm]);

    // Handlers
    const handleModeChange = (mode: PracticeMode) => {
        if (mode === 'FULL_EXAM') {
            router.push('/jlpt');
            return;
        }
        setFilters((prev) => ({
            ...prev,
            mode,
            skill: mode === "FULL_EXAM" ? "ALL" : prev.skill,
        }));
    };

    const handleLevelChange = (level: JLPTLevel | "ALL") => {
        setFilters((prev) => ({ ...prev, level }));
    };

    const handleSkillChange = (skill: SkillType | "ALL") => {
        setFilters((prev) => ({ ...prev, skill }));
    };

    const handleStartQuiz = (id: string) => {
        router.push(`/quiz/${id}`);
    };

    return (
        <div className="min-h-screen bg-secondary p-6 md:p-12 selection:bg-primary/20">
            <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                    {/* Back & Title */}
                    <div className="flex items-center gap-8">
                        <Link
                            href="/practice"
                            className="p-4 bg-neutral-white hover:bg-neutral-beige text-neutral-ink hover:text-primary-strong transition-all rounded-2xl border border-neutral-gray/20 shadow-sm active:scale-95 group"
                        >
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>

                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-primary/10 text-primary-strong rounded-[2rem] flex items-center justify-center border border-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-lg">
                                <Zap size={40} className="fill-current" />
                            </div>
                            <div>
                                <h1 className="text-5xl font-black tracking-tighter text-neutral-ink font-display leading-[0.9]">
                                    Quiz <span className="text-primary-strong">Nexus</span>
                                </h1>
                                <p className="text-[10px] font-black text-neutral-ink/40 uppercase tracking-[0.3em] font-display mt-2">
                                    RAPID COGNITIVE EVALUATION
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-4 px-8 py-4 bg-neutral-white border border-neutral-gray/20 rounded-2xl shadow-sm">
                            <div className="relative">
                                <Sparkles size={20} className="text-primary-strong animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink font-display">
                                {quizzes.length} Protocols Active
                            </span>
                        </div>

                        <Link
                            href="/quiz/create"
                            className="flex items-center gap-4 px-8 py-5 bg-neutral-ink text-white rounded-2xl hover:bg-primary-strong active:scale-95 transition-all shadow-xl font-display uppercase tracking-[0.2em] text-[10px] font-black group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                            Synthesize Quiz
                        </Link>
                    </div>
                </div>

                {/* Sub-Header / Search & Filters */}
                <div className="space-y-12 bg-neutral-white/50 p-8 md:p-12 rounded-[3.5rem] border border-neutral-gray/20 shadow-inner">
                    <div className="flex flex-col lg:flex-row gap-8 items-end justify-between">
                        <div className="w-full lg:w-auto space-y-8">
                            <ModeSelector selectedMode={filters.mode} onModeChange={handleModeChange} />
                            <FilterBar
                                selectedLevel={filters.level}
                                selectedSkill={filters.skill}
                                selectedMode={filters.mode}
                                onLevelChange={handleLevelChange}
                                onSkillChange={handleSkillChange}
                            />
                        </div>

                        {/* Integrated Search */}
                        <div className="w-full lg:max-w-md relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-ink/20 group-focus-within:text-primary-strong transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search cognitive nodes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-neutral-white border border-neutral-gray/20 rounded-2xl focus:outline-none focus:border-primary-strong focus:ring-4 focus:ring-primary/10 transition-all font-black text-xs uppercase tracking-widest shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="pt-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-6">
                            <Loader2 className="w-12 h-12 animate-spin text-primary-strong" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink/40 animate-pulse">Synchronizing Neural Paths...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center bg-neutral-white rounded-[3rem] border border-neutral-gray/20 shadow-xl">
                            <AlertCircle className="w-16 h-16 text-accent mb-6" />
                            <p className="text-xl font-black text-neutral-ink font-display mb-4">{error}</p>
                            <button
                                onClick={fetchQuizzes}
                                className="px-8 py-4 bg-neutral-ink text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-strong transition-all shadow-lg active:scale-95"
                            >
                                Re-initiate Protocol
                            </button>
                        </div>
                    ) : filteredQuizzes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center bg-neutral-white/30 rounded-[3rem] border-2 border-dashed border-neutral-gray/20">
                            <Filter className="w-16 h-16 text-neutral-ink/10 mb-6" />
                            <h3 className="text-2xl font-black text-neutral-ink font-display tracking-tight mb-2">Zero Matches Identified</h3>
                            <p className="text-sm font-bold text-neutral-ink/40 max-w-xs mx-auto">
                                Adjust your domain specifications or cognitive level to find available paths.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {filteredQuizzes.map((quiz) => (
                                <PracticeCard
                                    key={quiz.id}
                                    config={{
                                        id: quiz.id,
                                        title: quiz.title,
                                        description: quiz.description,
                                        level: quiz.jlpt_level as JLPTLevel,
                                        skills: [quiz.category.toUpperCase() as SkillType],
                                        questionCount: quiz.question_count,
                                        timeLimitMinutes: quiz.time_limit_seconds ? Math.floor(quiz.time_limit_seconds / 60) : undefined
                                    }}
                                    onStart={handleStartQuiz}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
