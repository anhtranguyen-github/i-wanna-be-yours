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
    ArrowRight,
} from "lucide-react";
import { mockExamConfigs, getQuestionsForExam } from "@/data/mockPractice";
import { SkillType, JLPTLevel } from "@/types/practice";

// ============================================================================
// RESULT PAGE (SAKURA ZEN REFIT)
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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center animate-in fade-in zoom-in-95 duration-700 p-12 bg-card rounded-[3rem] border border-border/50 ">
                    <HelpCircle size={64} className="mx-auto mb-6 text-neutral-ink animate-pulse" />
                    <h2 className="text-3xl font-black text-foreground font-display tracking-tight mb-4 leading-none">Protocol Not Found</h2>
                    <p className="text-muted-foreground font-bold mb-8 italic">Synchronize your path and try again.</p>
                    <Link
                        href="/practice/jlpt"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-black font-display text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:opacity-90 active:scale-95 transition-all "
                    >
                        <ArrowLeft size={18} />
                        Return to Hub
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

    const skillLabels: Record<SkillType, string> = {
        VOCABULARY: "Vocabulary",
        GRAMMAR: "Grammar",
        READING: "Reading",
        LISTENING: "Listening",
    };

    const skillIcons: Record<SkillType, React.ReactNode> = {
        VOCABULARY: <Target size={18} />,
        GRAMMAR: <BarChart3 size={18} />,
        READING: <Award size={18} />,
        LISTENING: <Clock size={18} />,
    };

    return (
        <div className="min-h-screen bg-background selection:bg-primary/20">
            {/* Header */}
            <header className="bg-card  border-b border-border/50 px-8 py-5 sticky top-0 z-50  transition-all duration-500 hover:">
                <div className="flex items-center justify-between max-w-[1920px] mx-auto">
                    <Link
                        href="/practice/jlpt"
                        className="group flex items-center gap-3 px-5 py-2.5 bg-muted/50 hover:bg-card border border-border/30 rounded-2xl transition-all  active:scale-95"
                    >
                        <ArrowLeft size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground font-display">Neural Hub</span>
                    </Link>

                    <div className="text-right">
                        <h1 className="text-lg font-black text-foreground font-display tracking-tight leading-none mb-1">{examConfig.title}</h1>
                        <div className="flex items-center justify-end gap-3 opacity-60">
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest font-display">{examConfig.level}</span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest font-display whitespace-nowrap">Synthesis Outcome</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-8 py-12">
                {/* ===== HERO SCORE CARD ===== */}
                <div className="relative overflow-hidden rounded-[3.5rem] p-12 mb-12 bg-card border border-border/50  transition-all hover: group animate-in slide-in-from-bottom-8 duration-1000">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-1000" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 group-hover:bg-secondary/10 transition-colors duration-1000" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        {/* Score Circle */}
                        <div className="relative w-52 h-52 shrink-0">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="104"
                                    cy="104"
                                    r="94"
                                    fill="none"
                                    stroke="var(--muted)"
                                    strokeWidth="16"
                                    className="opacity-20"
                                />
                                <circle
                                    cx="104"
                                    cy="104"
                                    r="94"
                                    fill="none"
                                    stroke="var(--primary)"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                    strokeDasharray={`${mockResults.scorePercentage * 5.9} 590`}
                                    className="transition-all duration-1500 ease-spring shadow-lg"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-6xl font-black text-foreground font-display tracking-tighter leading-none">{mockResults.scorePercentage}<span className="text-2xl text-neutral-ink ml-1">%</span></span>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink mt-2 font-display">Sync Accuracy</span>
                            </div>
                        </div>

                        {/* Status & Stats */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="mb-8">
                                {mockResults.passed ? (
                                    <div className="inline-flex items-center gap-4 group/status translate-x-1">
                                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center  border border-primary/20 rotate-6 group-hover/status:rotate-0 transition-transform duration-500">
                                            <Trophy size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black text-foreground font-display tracking-tighter italic">Synthesis <span className="text-primary">Valid!</span></h2>
                                            <p className="text-muted-foreground font-bold tracking-tight">Your neural patterns align with {examConfig.level} protocols.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-4 group/status">
                                        <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-[1.5rem] flex items-center justify-center  border border-secondary/20 rotate-6 group-hover/status:rotate-0 transition-transform duration-500">
                                            <Target size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black text-foreground font-display tracking-tighter italic">Phase <span className="text-secondary">Incomplete</span></h2>
                                            <p className="text-muted-foreground font-bold tracking-tight">Further iteration required for pattern stability.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-3 gap-5">
                                <div className="bg-muted/30 rounded-3xl p-5 border border-border/20  group/stat hover:bg-muted/50 transition-all">
                                    <CheckCircle2 size={20} className="text-primary mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-2xl font-black text-foreground font-display leading-none mb-1">{mockResults.correctAnswers.toString().padStart(2, '0')}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-ink font-display">Correct</p>
                                </div>
                                <div className="bg-muted/30 rounded-3xl p-5 border border-border/20  group/stat hover:bg-muted/50 transition-all">
                                    <XCircle size={20} className="text-destructive mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-2xl font-black text-foreground font-display leading-none mb-1">{mockResults.incorrectAnswers.toString().padStart(2, '0')}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-ink font-display">Failed</p>
                                </div>
                                <div className="bg-muted/30 rounded-3xl p-5 border border-border/20  group/stat hover:bg-muted/50 transition-all">
                                    <Clock size={20} className="text-secondary mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-2xl font-black text-foreground font-display leading-none mb-1">{formatTime(mockResults.timeTakenSeconds).split(" ")[0]}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-ink font-display">Duration</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== GRID SECTION: SKILLS & RECO ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Skill Breakdown */}
                    <div className="lg:col-span-2 bg-card rounded-[3rem] border border-border/50 p-10  group hover: transition-all duration-500 animate-in slide-in-from-left-8 duration-1000">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center  border border-primary/20">
                                <BarChart3 size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground font-display tracking-tight leading-none mb-1">Neural Breakdown</h3>
                                <p className="text-xs font-bold text-neutral-ink">Performance by cryptographic skill area</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {mockResults.skillBreakdown.map((skill) => (
                                <div key={skill.skill} className="group/skill">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div className="flex items-center gap-3">
                                            <span className="p-2 bg-muted rounded-xl text-neutral-ink  group-hover/skill:text-primary transition-colors">
                                                {skillIcons[skill.skill]}
                                            </span>
                                            <span className="text-sm font-black uppercase tracking-widest text-foreground font-display">{skillLabels[skill.skill]}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black font-display text-neutral-ink uppercase tracking-widest mr-2">Status</span>
                                            <span className={`text-sm font-black font-display ${skill.percentage >= 70 ? 'text-primary' : 'text-secondary'}`}>
                                                {skill.correct} / {skill.total}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-4 bg-muted rounded-full overflow-hidden  border border-border/10">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1500 ease-spring ${skill.percentage >= 70 ? "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" : "bg-secondary shadow-[0_0_15px_rgba(var(--secondary),0.3)]"
                                                }`}
                                            style={{ width: `${skill.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-secondary/5 rounded-[3rem] border border-secondary/20 p-10  animate-in slide-in-from-right-8 duration-1000 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                            <TrendingUp size={120} />
                        </div>

                        <div className="flex items-center gap-5 mb-10 relative z-10">
                            <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center  border border-secondary/20 rotate-3">
                                <TrendingUp size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground font-display tracking-tight leading-none mb-1">Optimization</h3>
                                <p className="text-xs font-bold text-neutral-ink">Systemic improvement paths</p>
                            </div>
                        </div>

                        <ul className="space-y-6 relative z-10">
                            {mockResults.skillBreakdown
                                .filter((s) => s.percentage < 70)
                                .map((skill) => (
                                    <li key={skill.skill} className="flex items-start gap-4 p-4 bg-background/50 rounded-2xl border border-secondary/10  hover:translate-x-1 transition-transform">
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 shrink-0 animate-pulse" />
                                        <p className="text-xs font-bold text-foreground/80 leading-relaxed italic">
                                            Upgrade neural focus on <span className="text-secondary font-black">{skillLabels[skill.skill]}</span>.
                                            Current stability at {skill.percentage}%.
                                        </p>
                                    </li>
                                ))}
                            {mockResults.skillBreakdown.every((s) => s.percentage >= 70) && (
                                <li className="text-center p-8">
                                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6  border border-primary/20">
                                        <Award size={32} />
                                    </div>
                                    <p className="text-sm font-black text-foreground font-display italic">Neural Architecture Optimal.</p>
                                    <p className="text-[10px] font-black uppercase text-neutral-ink tracking-widest mt-2">Proceed to next tier protocols.</p>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* ===== ACTION BUTTONS ===== */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center animate-in fade-in duration-1000">
                    <button
                        onClick={() => router.push(`/practice/jlpt/session/${examId}`)}
                        className="group flex items-center justify-center gap-4 px-10 py-5 bg-card border border-border/50 text-foreground font-black font-display text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:text-primary hover:border-primary/30 transition-all  active:scale-95"
                    >
                        <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                        Restart Session
                    </button>
                    <button
                        onClick={() => router.push(`/practice/jlpt/session/${examId}?review=true`)}
                        className="group flex items-center justify-center gap-4 px-10 py-5 bg-foreground text-background font-black font-display text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:opacity-95 transition-all  active:scale-95"
                    >
                        <HelpCircle size={20} className="group-hover:scale-125 transition-transform" />
                        Review Decoder
                    </button>
                    <Link
                        href="/practice/jlpt"
                        className="group flex items-center justify-center gap-4 px-10 py-5 bg-primary text-primary-foreground font-black font-display text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:opacity-95 transition-all  active:scale-95"
                    >
                        <Home size={20} />
                        Neural Hub
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </main>
        </div>
    );
}
