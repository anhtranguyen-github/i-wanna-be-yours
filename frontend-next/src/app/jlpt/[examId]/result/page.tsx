"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Trophy,
    Target,
    Clock,
    CheckCircle2,
    XCircle,
    HelpCircle,
    ArrowLeft,
    RotateCcw,
    Home,
    TrendingUp,
    Award,
    BarChart3,
} from "lucide-react";
import { mockExamConfigs, getQuestionsForExam } from "@/data/mockPractice";
import { SkillType, JLPTLevel } from "@/types/practice";

// ============================================================================
// RESULT PAGE - Now at /jlpt/[examId]/result
// ============================================================================

export default function ExamResultPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params?.examId as string;

    // Load exam config and questions
    const examConfig = useMemo(() => {
        return mockExamConfigs.find((e) => e.id === examId);
    }, [examId]);

    const questions = useMemo(() => {
        if (!examId) return [];
        return getQuestionsForExam(examId);
    }, [examId]);

    // Mock results
    const mockResults = useMemo(() => {
        if (!questions.length) return null;

        const totalQuestions = questions.length;
        const correctAnswers = Math.floor(totalQuestions * 0.7);
        const incorrectAnswers = Math.floor(totalQuestions * 0.2);
        const unanswered = totalQuestions - correctAnswers - incorrectAnswers;

        const skillBreakdown: { skill: SkillType; total: number; correct: number; percentage: number }[] = [];
        const skillCounts: Record<SkillType, { total: number; correct: number }> = {
            VOCABULARY: { total: 0, correct: 0 },
            GRAMMAR: { total: 0, correct: 0 },
            READING: { total: 0, correct: 0 },
            LISTENING: { total: 0, correct: 0 },
        };

        questions.forEach((q, idx) => {
            const skill = q.tags.skill;
            skillCounts[skill].total++;
            if (idx % 3 !== 0) {
                skillCounts[skill].correct++;
            }
        });

        Object.entries(skillCounts).forEach(([skill, counts]) => {
            if (counts.total > 0) {
                skillBreakdown.push({
                    skill: skill as SkillType,
                    total: counts.total,
                    correct: counts.correct,
                    percentage: Math.round((counts.correct / counts.total) * 100),
                });
            }
        });

        return {
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
            unanswered,
            scorePercentage: Math.round((correctAnswers / totalQuestions) * 100),
            timeTakenSeconds: 1847,
            skillBreakdown,
            passed: correctAnswers / totalQuestions >= 0.6,
        };
    }, [questions]);

    if (!examConfig || !mockResults) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <HelpCircle size={48} className="mx-auto mb-4 text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-700 mb-2">Results Not Found</h2>
                    <Link href="/jlpt" className="text-brand-green hover:underline">
                        Back to Practice
                    </Link>
                </div>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return "text-emerald-600";
        if (percentage >= 60) return "text-blue-600";
        if (percentage >= 40) return "text-amber-600";
        return "text-red-600";
    };

    const getScoreBgColor = (percentage: number) => {
        if (percentage >= 80) return "from-emerald-400 to-teal-500";
        if (percentage >= 60) return "from-blue-400 to-indigo-500";
        if (percentage >= 40) return "from-amber-400 to-orange-500";
        return "from-red-400 to-rose-500";
    };

    const skillLabels: Record<SkillType, string> = {
        VOCABULARY: "Vocabulary",
        GRAMMAR: "Grammar",
        READING: "Reading",
        LISTENING: "Listening",
    };

    const skillIcons: Record<SkillType, string> = {
        VOCABULARY: "📚",
        GRAMMAR: "📝",
        READING: "📖",
        LISTENING: "🎧",
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/jlpt"
                            className="flex items-center gap-2 text-slate-500 hover:text-brand-green transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back to Practice</span>
                        </Link>
                        <div className="text-right">
                            <h1 className="font-bold text-brand-dark">{examConfig.title}</h1>
                            <p className="text-xs text-slate-500">{examConfig.level} · Results</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-10">
                {/* ===== HERO SCORE CARD ===== */}
                <div
                    className={`
                        relative overflow-hidden rounded-3xl p-8 mb-8 text-white
                        bg-gradient-to-br ${getScoreBgColor(mockResults.scorePercentage)}
                    `}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Score Circle */}
                        <div className="text-center">
                            <div className="relative w-40 h-40 mx-auto">
                                <svg className="w-full h-full -rotate-90">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="12"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="12"
                                        strokeLinecap="round"
                                        strokeDasharray={`${mockResults.scorePercentage * 4.4} 440`}
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black">{mockResults.scorePercentage}%</span>
                                    <span className="text-sm opacity-80">Score</span>
                                </div>
                            </div>
                        </div>

                        {/* Status & Stats */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                {mockResults.passed ? (
                                    <>
                                        <Trophy size={32} />
                                        <div>
                                            <h2 className="text-3xl font-black">Passed!</h2>
                                            <p className="text-white/80">Great job on this exam</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Target size={32} />
                                        <div>
                                            <h2 className="text-3xl font-black">Keep Practicing</h2>
                                            <p className="text-white/80">You're getting closer!</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
                                    <CheckCircle2 size={20} className="mx-auto mb-1" />
                                    <p className="text-2xl font-bold">{mockResults.correctAnswers}</p>
                                    <p className="text-xs opacity-80">Correct</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
                                    <XCircle size={20} className="mx-auto mb-1" />
                                    <p className="text-2xl font-bold">{mockResults.incorrectAnswers}</p>
                                    <p className="text-xs opacity-80">Incorrect</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
                                    <Clock size={20} className="mx-auto mb-1" />
                                    <p className="text-2xl font-bold">{formatTime(mockResults.timeTakenSeconds).split("m")[0]}m</p>
                                    <p className="text-xs opacity-80">Time</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== SKILL BREAKDOWN ===== */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <BarChart3 size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-brand-dark">Skill Breakdown</h3>
                            <p className="text-xs text-slate-500">Performance by skill area</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {mockResults.skillBreakdown.map((skill) => (
                            <div key={skill.skill} className="flex items-center gap-4">
                                <div className="w-32 sm:w-40 flex items-center gap-2">
                                    <span className="text-xl">{skillIcons[skill.skill]}</span>
                                    <span className="text-sm font-medium text-slate-700">{skillLabels[skill.skill]}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${skill.percentage >= 70
                                                ? "from-emerald-400 to-teal-500"
                                                : skill.percentage >= 50
                                                    ? "from-amber-400 to-orange-500"
                                                    : "from-red-400 to-rose-500"
                                                }`}
                                            style={{ width: `${skill.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="w-20 text-right">
                                    <span className={`text-sm font-bold ${getScoreColor(skill.percentage)}`}>
                                        {skill.correct}/{skill.total}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-1">({skill.percentage}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ===== RECOMMENDATIONS ===== */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800">Recommendations</h3>
                            <p className="text-xs text-amber-600">Based on your performance</p>
                        </div>
                    </div>

                    <ul className="space-y-2 text-sm text-amber-800">
                        {mockResults.skillBreakdown
                            .filter((s) => s.percentage < 70)
                            .map((skill) => (
                                <li key={skill.skill} className="flex items-start gap-2">
                                    <span className="mt-1">•</span>
                                    <span>
                                        Focus more on <strong>{skillLabels[skill.skill]}</strong> practice. Your score was{" "}
                                        {skill.percentage}% in this area.
                                    </span>
                                </li>
                            ))}
                        {mockResults.skillBreakdown.every((s) => s.percentage >= 70) && (
                            <li className="flex items-center gap-2">
                                <Award size={16} />
                                <span>Excellent work! Try a higher difficulty level to challenge yourself.</span>
                            </li>
                        )}
                    </ul>
                </div>

                {/* ===== ACTION BUTTONS ===== */}
                <div className="flex flex-wrap gap-4 justify-center">
                    <button
                        onClick={() => router.push(`/jlpt/${examId}`)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-brand-green hover:text-brand-green transition-colors"
                    >
                        <RotateCcw size={20} />
                        Retake Exam
                    </button>
                    <button
                        onClick={() => router.push(`/jlpt/${examId}?review=true`)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <HelpCircle size={20} />
                        Review Answers
                    </button>
                    <Link
                        href="/jlpt"
                        className="flex items-center gap-2 px-6 py-3 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green/90 transition-colors"
                    >
                        <Home size={20} />
                        More Practice
                    </Link>
                </div>
            </main>
        </div>
    );
}
