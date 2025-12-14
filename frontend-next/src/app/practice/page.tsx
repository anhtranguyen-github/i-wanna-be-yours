"use client";

import React from "react";
import Link from "next/link";
import {
    GraduationCap,
    Brain,
    BookCheck,
    ListChecks,
    Timer,
    Target,
    Zap,
    ArrowRight,
    Lock
} from "lucide-react";
import { useUser } from "@/context/UserContext";

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
        id: "flashcards",
        title: "Flashcards",
        description: "Review vocabulary, kanji, and grammar with spaced repetition.",
        icon: <Brain size={28} />,
        href: "/flashcards",
        color: "text-brand-green",
        bgColor: "bg-green-50",
    },
    {
        id: "quiz-grammar",
        title: "Grammar Quiz",
        description: "Test your understanding of JLPT grammar patterns.",
        icon: <BookCheck size={28} />,
        href: "/practice/quiz/grammar",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        comingSoon: true,
    },
    {
        id: "quiz-vocab",
        title: "Vocabulary Quiz",
        description: "Multiple choice questions on word meanings and readings.",
        icon: <ListChecks size={28} />,
        href: "/practice/quiz/vocabulary",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        comingSoon: true,
    },
    {
        id: "quiz-kanji",
        title: "Kanji Quiz",
        description: "Practice kanji readings and meanings.",
        icon: <Target size={28} />,
        href: "/practice/quiz/kanji",
        color: "text-brand-salmon",
        bgColor: "bg-red-50",
        comingSoon: true,
    },
    {
        id: "speed-drill",
        title: "Speed Drill",
        description: "Timed exercises to improve recall speed.",
        icon: <Timer size={28} />,
        href: "/practice/speed-drill",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        comingSoon: true,
    },
    {
        id: "daily-challenge",
        title: "Daily Challenge",
        description: "Complete today's challenge to maintain your streak.",
        icon: <Zap size={28} />,
        href: "/practice/daily",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        comingSoon: true,
    },
];

export default function PracticePage() {
    const { user } = useUser();

    return (
        <div className="min-h-screen bg-brand-cream text-brand-dark pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-brand-salmon to-brand-peach rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <GraduationCap size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-brand-dark">Practice</h1>
                            <p className="text-slate-500 text-sm mt-1">Quizzes, exercises, and drills to reinforce your learning.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Quick Stats (if user is logged in) */}
                {user && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <StatCard label="Daily Streak" value="0" icon="🔥" />
                        <StatCard label="Cards Reviewed" value="0" icon="📚" />
                        <StatCard label="Accuracy" value="--%" icon="🎯" />
                        <StatCard label="Time Spent" value="0m" icon="⏱️" />
                    </div>
                )}

                {/* Practice Categories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {practiceCategories.map((category) => (
                        <PracticeCard key={category.id} category={category} />
                    ))}
                </div>

                {/* Guest Prompt */}
                {!user && (
                    <div className="mt-12 text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <Lock className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-brand-dark mb-2">Track Your Progress</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Log in to save your quiz scores, track your daily streak, and see personalized recommendations.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block px-8 py-3 bg-brand-green text-white font-bold rounded-xl shadow-clay-img hover:bg-brand-green/90 transition-all"
                        >
                            Log In
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="text-3xl">{icon}</div>
            <div>
                <div className="text-2xl font-black text-brand-dark">{value}</div>
                <div className="text-xs text-slate-500 font-medium">{label}</div>
            </div>
        </div>
    );
}

function PracticeCard({ category }: { category: PracticeCategory }) {
    const content = (
        <div className={`
            bg-white rounded-2xl p-6 shadow-sm border border-slate-100 
            transition-all duration-200 flex flex-col h-full group
            ${category.comingSoon ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-1'}
        `}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${category.bgColor} ${category.color}`}>
                    {category.icon}
                </div>
                {category.comingSoon && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                        Coming Soon
                    </span>
                )}
            </div>

            <h3 className={`text-lg font-bold text-brand-dark mb-2 transition-colors ${!category.comingSoon && 'group-hover:text-brand-green'}`}>
                {category.title}
            </h3>
            <p className="text-sm text-slate-500 mb-6 flex-grow">
                {category.description}
            </p>

            <div className={`
                mt-auto flex items-center justify-between text-sm font-bold 
                ${category.comingSoon ? 'text-slate-400' : `${category.color} group-hover:gap-2 transition-all`}
            `}>
                <span>{category.comingSoon ? 'In Development' : 'Start Practice'}</span>
                {!category.comingSoon && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
            </div>
        </div>
    );

    if (category.comingSoon) {
        return <div className="cursor-not-allowed">{content}</div>;
    }

    return (
        <Link href={category.href}>
            {content}
        </Link>
    );
}
