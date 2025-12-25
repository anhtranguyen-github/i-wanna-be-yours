"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, BookCheck, ArrowRight, Lock, Flame, LayoutGrid, Target as TargetIcon, History } from "lucide-react";
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
        id: "quizzes",
        title: "Quick Quizzes",
        description: "Rapid practice across grammar, vocabulary, and kanji.",
        icon: <BookCheck size={24} />,
        href: "/practice/quiz",
        color: "text-foreground",
        bgColor: "bg-muted",
    },
];

export default function PracticePage() {
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    return (
        <div className="min-h-screen bg-secondary pb-24">
            {/* Header */}
            <header className="bg-neutral-white border-b border-neutral-gray/30 px-6 py-8 sticky top-0 z-50 shadow-sm">
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
                        <StatCard label="Streak" value="0" icon={<Flame className="text-accent" size={20} />} />
                        <StatCard label="Cards" value="0" icon={<LayoutGrid className="text-primary-strong" size={20} />} />
                        <StatCard label="Accuracy" value="--%" icon={<TargetIcon className="text-neutral-ink" size={20} />} />
                        <StatCard label="Time" value="0m" icon={<History className="text-neutral-gray" size={20} />} />
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
                    <div className="bg-neutral-white rounded-2xl border border-neutral-gray/20 p-12 text-center shadow-lg">
                        <div className="w-20 h-20 bg-neutral-beige rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-10 h-10 text-neutral-gray" />
                        </div>
                        <h3 className="text-2xl font-black text-neutral-ink mb-3 font-display">Sign in to track progress</h3>
                        <p className="text-neutral-ink/70 mb-8 max-w-md mx-auto font-bold">
                            Create an account to save your practice history, track streaks, and unlock achievements.
                        </p>
                        <button
                            onClick={() => openAuth('REGISTER', { flowType: 'PRACTICE', title: 'Join Hanachan', description: 'Sign up to save your progress.' })}
                            className="px-10 py-4 bg-primary-strong text-white font-black rounded-2xl hover:opacity-90 transition-all font-display uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                        >
                            Sign Up Now
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-neutral-white rounded-2xl border border-neutral-gray/20 p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-neutral-beige rounded-xl flex items-center justify-center">{icon}</div>
            <div>
                <div className="text-2xl font-black text-neutral-ink font-display">{value}</div>
                <div className="text-[10px] text-neutral-gray font-black uppercase tracking-widest font-display">{label}</div>
            </div>
        </div>
    );
}

function PracticeCard({ category }: { category: PracticeCategory }) {
    const isComingSoon = category.comingSoon;

    const content = (
        <div className={`bg-neutral-white rounded-2xl border border-neutral-gray/30 p-8 transition-all duration-300 flex flex-col h-full shadow-sm ${isComingSoon ? 'opacity-50' : 'hover:shadow-xl hover:border-primary/40 cursor-pointer'}`}>
            <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${category.bgColor} ${category.color}`}>
                    {category.icon}
                </div>
                {isComingSoon && (
                    <span className="px-3 py-1 bg-neutral-beige rounded-lg text-[10px] font-black uppercase tracking-widest text-neutral-gray font-display">Soon</span>
                )}
            </div>
            <h3 className="text-xl font-black text-neutral-ink mb-3 font-display">{category.title}</h3>
            <p className="text-sm text-neutral-ink/70 mb-6 flex-1 font-bold leading-relaxed">{category.description}</p>
            {!isComingSoon && (
                <div className="flex items-center gap-3 text-xs font-black text-primary-strong uppercase tracking-[0.2em] font-display">
                    <span>Explore</span>
                    <ArrowRight size={18} />
                </div>
            )}
        </div>
    );

    if (isComingSoon) return <div>{content}</div>;
    return <Link href={category.href}>{content}</Link>;
}
