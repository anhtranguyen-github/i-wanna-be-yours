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
    Zap,
} from "lucide-react";
import { mockExamConfigs, getQuestionsForExam } from "@/data/mockPractice";
import { SkillType, JLPTLevel, ExamAttempt } from "@/types/practice";
import { formatTimeDisplay } from "@/hooks/useExamTimer";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { Sparkles as SparklesIcon } from "lucide-react";

// ============================================================================
// RESULT PAGE - Now at /jlpt/[examId]/result
// ============================================================================

export default function ExamResultPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();
    const examId = params?.examId as string;

    // Load exam config and questions
    const examConfig = useMemo(() => {
        return mockExamConfigs.find((e) => e.id === examId);
    }, [examId]);

    const questions = useMemo(() => {
        if (!examId) return [];
        return getQuestionsForExam(examId);
    }, [examId]);

    // Load saved attempt if it exists
    const savedAttempt = useMemo(() => {
        try {
            const saved = sessionStorage.getItem('last_exam_attempt');
            if (saved) {
                const attempt = JSON.parse(saved) as ExamAttempt;
                if (attempt.examId === examId) return attempt;
            }
        } catch (e) {
            console.error('Error loading saved attempt:', e);
        }
        return null;
    }, [examId]);

    // Format data for display
    const resultData = useMemo(() => {
        if (savedAttempt) {
            return {
                totalQuestions: savedAttempt.totalQuestions,
                correctAnswers: savedAttempt.correctAnswers,
                incorrectAnswers: savedAttempt.incorrectAnswers,
                unanswered: savedAttempt.unansweredQuestions,
                scorePercentage: savedAttempt.scorePercentage,
                timeTakenSeconds: savedAttempt.timeTakenSeconds,
                skillBreakdown: savedAttempt.skillBreakdown.map(s => ({
                    skill: s.skill,
                    total: s.totalQuestions,
                    correct: s.correctAnswers,
                    percentage: s.percentage
                })),
                passed: savedAttempt.passed
            };
        }

        if (!questions.length) return null;

        // Fallback to mock results for demo purposes if no real result
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
    }, [questions, savedAttempt]);

    if (!examConfig || !resultData) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-muted/50 rounded-2xl flex items-center justify-center mb-8 ">
                    <HelpCircle size={44} className="text-neutral-ink" />
                </div>
                <h2 className="text-2xl font-black text-foreground mb-4 font-display">Results Not Found</h2>
                <Link
                    href="/jlpt"
                    className="flex items-center gap-3 px-8 py-4 bg-foreground text-background font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all  font-display uppercase tracking-widest text-xs"
                >
                    <ArrowLeft size={18} />
                    Back to Practice
                </Link>
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
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border sticky top-0 z-40  animate-in fade-in duration-500">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/jlpt"
                            className="flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-all font-display uppercase tracking-widest text-[10px] font-black group"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Library
                        </Link>
                        <div className="text-right space-y-0.5">
                            <h1 className="text-xl font-black text-foreground font-display tracking-tight leading-none">{examConfig.title}</h1>
                            <p className="text-[10px] font-black text-neutral-ink uppercase tracking-widest font-display">
                                {examConfig.level} <span className="mx-1">•</span> Summary
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
                {/* ===== HERO SCORE CARD ===== */}
                <div
                    className={`
                        relative overflow-hidden rounded-2xl p-12 text-white  animate-in zoom-in-95 duration-700
                        ${resultData.passed ? "bg-primary" : "bg-foreground"}
                    `}
                >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        {/* Score Circle */}
                        <div className="text-center">
                            <div className="relative w-48 h-48 mx-auto group">
                                <svg className="w-full h-full -rotate-90">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="84"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.15)"
                                        strokeWidth="16"
                                    />
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="84"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="16"
                                        strokeLinecap="round"
                                        strokeDasharray={`${resultData.scorePercentage * 5.27} 527`}
                                        className="transition-all duration-[1500ms] ease-out shadow-inner"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-6xl font-black font-display tracking-tighter leading-none">{resultData.scorePercentage}%</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 font-display mt-2">Overall Score</span>
                                </div>
                            </div>
                        </div>

                        {/* Status & Stats */}
                        <div className="flex-1 text-center md:text-left space-y-10">
                            <div className="flex items-center justify-center md:justify-start gap-6">
                                <div className="p-4 bg-white/20 rounded-2xl ">
                                    {resultData.passed ? <Trophy size={44} /> : <Target size={44} />}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-4xl font-black font-display tracking-tight leading-none">
                                        {resultData.passed ? "Test Passed!" : "Keep Pushing"}
                                    </h2>
                                    <p className="text-white/60 font-bold">
                                        {resultData.passed ? "Exceptional performance across all skills." : "You're building the foundation. Try again!"}
                                    </p>
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-white/10  rounded-2xl p-6 border border-white/10 space-y-2">
                                    <div className="flex items-center justify-center md:justify-start gap-2 opacity-60">
                                        <CheckCircle2 size={16} />
                                        <p className="text-[9px] font-black uppercase tracking-widest font-display">Correct</p>
                                    </div>
                                    <p className="text-3xl font-black font-display">{resultData.correctAnswers}</p>
                                </div>
                                <div className="bg-white/10  rounded-2xl p-6 border border-white/10 space-y-2">
                                    <div className="flex items-center justify-center md:justify-start gap-2 opacity-60">
                                        <XCircle size={16} />
                                        <p className="text-[9px] font-black uppercase tracking-widest font-display">Mistakes</p>
                                    </div>
                                    <p className="text-3xl font-black font-display">{resultData.incorrectAnswers}</p>
                                </div>
                                <div className="bg-white/10  rounded-2xl p-6 border border-white/10 space-y-2">
                                    <div className="flex items-center justify-center md:justify-start gap-2 opacity-60">
                                        <Clock size={16} />
                                        <p className="text-[9px] font-black uppercase tracking-widest font-display">Time</p>
                                    </div>
                                    <p className="text-3xl font-black font-display">{formatTime(resultData.timeTakenSeconds).split(" ")[0]}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== SKILL BREAKDOWN ===== */}
                <div className="bg-card rounded-2xl p-10 border border-border  animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-border/50">
                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center ">
                            <BarChart3 size={28} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-foreground font-display leading-none">Diagnostic Analysis</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink font-display">Performance by skill category</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        {resultData.skillBreakdown.map((skill) => (
                            <div key={skill.skill} className="space-y-4 group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-500 scale-110">{skillIcons[skill.skill]}</span>
                                        <span className="text-xs font-black uppercase tracking-widest text-foreground font-display">{skillLabels[skill.skill]}</span>
                                    </div>
                                    <p className="text-xs font-black font-display text-neutral-ink">
                                        <span className={getScoreColor(skill.percentage)}>{skill.correct} / {skill.total}</span>
                                        <span className="ml-2 italic opacity-50">({skill.percentage}%)</span>
                                    </p>
                                </div>
                                <div className="h-4 bg-muted rounded-full overflow-hidden border border-border/50 ">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-inner ${skill.percentage >= 70 ? "bg-primary" :
                                            skill.percentage >= 50 ? "bg-secondary" : "bg-destructive"
                                            }`}
                                        style={{ width: `${skill.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ===== RECOMMENDATIONS ===== */}
                <div className="bg-secondary/5 rounded-2xl border border-secondary/20 p-10 space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center ">
                            <TrendingUp size={28} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-secondary font-display leading-none">Smart Recommendations</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary/50 font-display">Pathways to mastery</p>
                        </div>
                    </div>

                    <ul className="space-y-6 text-foreground/80 font-bold leading-relaxed">
                        {resultData.skillBreakdown
                            .filter((s) => s.percentage < 70)
                            .map((skill) => (
                                <li key={skill.skill} className="flex items-start gap-4 p-6 bg-white/50 rounded-2xl border border-secondary/10 hover: transition-all">
                                    <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0 text-sm font-black font-display">
                                        !
                                    </div>
                                    <p className="text-sm">
                                        Deepen your exposure to <span className="text-secondary font-black underline decoration-secondary/30 decoration-4 underline-offset-4">{skillLabels[skill.skill]}</span>. Your diagnostic score of {skill.percentage}% indicates a need for reinforced learning in this domain.
                                    </p>
                                </li>
                            ))}
                        {resultData.skillBreakdown.every((s) => s.percentage >= 70) && (
                            <li className="flex items-center gap-4 p-8 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                <Award className="text-emerald-600 shrink-0" size={32} />
                                <p className="text-emerald-700 font-black font-display uppercase tracking-widest text-xs">
                                    Peak performance achieved. Hanna recommends advancing the difficulty level to sustain intellectual growth.
                                </p>
                            </li>
                        )}
                    </ul>
                </div>

                {/* ===== DEEP AI INSIGHTS (GUEST HOOK) ===== */}
                <div className="relative overflow-hidden bg-card rounded-2xl border border-border p-12  group">
                    <div className="absolute -top-20 -right-20 opacity-5 group-hover:opacity-10 transition-all duration-700 pointer-events-none rotate-12">
                        <SparklesIcon size={240} className="text-primary" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
                        <div className="w-24 h-24 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 ">
                            <SparklesIcon size={48} className="animate-pulse-slow" />
                        </div>
                        <div className="flex-1 text-center lg:text-left space-y-4">
                            <h3 className="text-3xl font-black text-foreground font-display tracking-tight leading-none">Cognitive Pattern Analysis</h3>
                            <p className="text-muted-foreground font-bold leading-relaxed max-w-xl text-lg opacity-80">
                                Hanachan uses deep learning to scrutinize your decision paths and pinpoint conceptual gaps that standard tests miss.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                if (!user) {
                                    openAuth('REGISTER', {
                                        flowType: 'PRACTICE',
                                        title: "Unlock Deep Insights",
                                        description: "Let Hanachan analyze your mistakes and build a personalized review plan just for you."
                                    });
                                } else {
                                    alert("AI Analysis is calculating your profile...");
                                }
                            }}
                            className="w-full lg:w-auto bg-foreground text-background px-10 py-6 rounded-2xl font-black font-display uppercase tracking-widest text-xs hover:opacity-90 transition-all  active:scale-95 flex items-center justify-center gap-4"
                        >
                            Analyze Patterns
                            <Zap size={20} className="text-primary fill-primary" />
                        </button>
                    </div>

                    {!user && (
                        <div className="mt-10 pt-8 border-t border-border/50 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink font-display">
                            <CheckCircle2 size={16} className="text-primary" />
                            Guest Session: Secure your lifelong Hanachan profile to store diagnostic data.
                        </div>
                    )}
                </div>

                {/* ===== ACTION BUTTONS ===== */}
                <div className="flex flex-wrap gap-6 justify-center pt-10">
                    <button
                        onClick={() => router.push(`/jlpt/${examId}`)}
                        className="flex items-center gap-3 px-10 py-5 bg-card border border-border text-foreground font-black rounded-2xl hover:border-primary/30 transition-all  font-display uppercase tracking-widest text-xs active:scale-95 group"
                    >
                        <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                        Retake
                    </button>
                    <button
                        onClick={() => router.push(`/jlpt/${examId}?review=true`)}
                        className="flex items-center gap-3 px-10 py-5 bg-card border border-border text-foreground font-black rounded-2xl hover:border-primary/30 transition-all  font-display uppercase tracking-widest text-xs active:scale-95 group"
                    >
                        <HelpCircle size={20} className="group- transition-transform" />
                        Review
                    </button>
                    <Link
                        href="/jlpt"
                        className="flex items-center gap-3 px-10 py-5 bg-primary text-white font-black rounded-2xl hover:opacity-90 transition-all  font-display uppercase tracking-widest text-xs active:scale-95"
                    >
                        <Home size={20} />
                        Library
                    </Link>
                </div>
            </main>
        </div>
    );
}
