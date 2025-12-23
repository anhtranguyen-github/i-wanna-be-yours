"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, Brain, BookCheck, Timer, Zap, ArrowRight, Lock, Flame, LayoutGrid, Target as TargetIcon, History } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";

interface PracticeCategory {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
    bgColor: string;
    comingSoon?: boolean;
}

const practiceCategories: PracticeCategory[] = [
    {
        id: "jlpt-practice",
        title: "JLPT Simulator",
        description: "Adaptive simulations and skill-specific drills for all levels.",
        icon: <GraduationCap size={24} />,
        href: "/practice/jlpt",
        color: "text-primary",
        bgColor: "bg-primary/10",
    },
    {
        id: "flashcards",
        title: "Flashcards",
        description: "Master vocabulary and kanji through spaced repetition.",
        icon: <Brain size={24} />,
        href: "/flashcards",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
    },
    {
        id: "quizzes",
        title: "Quick Quizzes",
        description: "Rapid practice across grammar, vocabulary, and kanji.",
        icon: <BookCheck size={24} />,
        href: "/practice/quiz",
        color: "text-foreground",
        bgColor: "bg-muted",
    },
    {
        id: "speed-drill",
        title: "Speed Drills",
        description: "Timed exercises to improve recall speed.",
        icon: <Timer size={24} />,
        href: "/practice/speed-drill",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        comingSoon: true,
    },
    {
        id: "daily-challenge",
        title: "Daily Challenge",
        description: "Complete daily challenges to maintain your streak.",
        icon: <Zap size={24} />,
        href: "/practice/daily",
        color: "text-accent",
        bgColor: "bg-accent/10",
        comingSoon: true,
    },
];

export default function PracticePage() {
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-8 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <GraduationCap size={24} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground font-display">Practice</h1>
                        <p className="text-sm text-muted-foreground">Reinforce your Japanese skills</p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats */}
                {user && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <StatCard label="Streak" value="0" icon={<Flame className="text-secondary" size={20} />} />
                        <StatCard label="Cards" value="0" icon={<LayoutGrid className="text-primary" size={20} />} />
                        <StatCard label="Accuracy" value="--%" icon={<TargetIcon className="text-foreground" size={20} />} />
                        <StatCard label="Time" value="0m" icon={<History className="text-muted-foreground" size={20} />} />
                    </div>
                )}

                {/* Section Title */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Categories</h2>
                </div>

                {/* Practice Categories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {practiceCategories.map((category) => (
                        <PracticeCard key={category.id} category={category} />
                    ))}
                </div>

                {/* Guest Prompt */}
                {!user && (
                    <div className="bg-card rounded-2xl border border-border p-8 text-center">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Sign in to track progress</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Create an account to save your practice history, track streaks, and unlock achievements.
                        </p>
                        <button
                            onClick={() => openAuth('REGISTER', { flowType: 'PRACTICE', title: 'Join Hanabira', description: 'Sign up to save your progress.' })}
                            className="px-8 py-3 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors"
                        >
                            Sign Up
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">{icon}</div>
            <div>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground font-bold">{label}</div>
            </div>
        </div>
    );
}

function PracticeCard({ category }: { category: PracticeCategory }) {
    const isComingSoon = category.comingSoon;

    const content = (
        <div className={`bg-card rounded-2xl border border-border p-6 transition-colors flex flex-col h-full ${isComingSoon ? 'opacity-50' : 'hover:border-primary/40 cursor-pointer'}`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category.bgColor} ${category.color}`}>
                    {category.icon}
                </div>
                {isComingSoon && (
                    <span className="px-2 py-1 bg-muted rounded-lg text-xs font-bold text-muted-foreground">Soon</span>
                )}
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{category.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 flex-1">{category.description}</p>
            {!isComingSoon && (
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                    <span>Start</span>
                    <ArrowRight size={16} />
                </div>
            )}
        </div>
    );

    if (isComingSoon) return <div>{content}</div>;
    return <Link href={category.href}>{content}</Link>;
}
