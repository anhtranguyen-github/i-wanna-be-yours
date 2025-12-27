"use client";

import React from "react";
import Link from "next/link";
import {
    Zap,
    Activity,
    Layers,
    BrainCircuit,
    ChevronRight,
    ArrowRight
} from "lucide-react";
import { PageHeader } from "@/components/shared";

// =============================================================================
// ACTIVITY ROUTES DATA
// =============================================================================

const activities = [
    {
        id: 'quoot',
        title: 'Quoot',
        description: 'Fast-paced vocabulary battles. Race against time, build streaks, and compete for high scores!',
        href: '/quoot',
        icon: <Zap className="w-7 h-7" />,
        color: 'bg-gradient-to-br from-amber-500 to-orange-600',
        stats: 'Answer quickly • 3 lives • Streak bonuses',
        isActive: true,
        isNew: true
    },
    {
        id: 'flashcards',
        title: 'Flashcards',
        description: 'SRS-based study mode for deep learning. Review cards at optimal intervals.',
        href: '/flashcards',
        icon: <Layers className="w-7 h-7" />,
        color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        stats: 'Spaced repetition • Custom decks',
        isActive: true,
        isNew: false
    },
    {
        id: 'practice',
        title: 'Training Protocols',
        description: 'Deep dive into grammar, reading, and vocabulary through structured drills and JLPT prep.',
        href: '/practice',
        icon: <BrainCircuit className="w-7 h-7" />,
        color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        stats: 'JLPT Prep • Cognitive Drills',
        isActive: true,
        isNew: false
    }
];

// =============================================================================
// COMPONENTS
// =============================================================================

function ActivityCard({ activity }: { activity: typeof activities[0] }) {
    const CardContent = (
        <div className={`group relative bg-neutral-white rounded-[2rem] border border-neutral-gray/20 p-8 h-full transition-all duration-300 ${activity.isActive ? 'hover:border-primary-strong cursor-pointer scale-100 active:scale-[0.98]' : 'opacity-60 cursor-not-allowed'}`}>
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${activity.color} opacity-10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity`} />

            {/* New Badge */}
            {activity.isNew && (
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-accent text-accent-foreground text-[9px] font-black uppercase tracking-widest rounded-full ">
                    New
                </div>
            )}

            {/* Icon */}
            <div className={`w-16 h-16 ${activity.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform `}>
                {activity.icon}
            </div>

            {/* Content */}
            <h3 className="text-2xl font-black text-neutral-ink font-display tracking-tight mb-2 group-hover:text-primary-strong transition-colors">
                {activity.title}
            </h3>
            <p className="text-neutral-ink font-bold mb-4 leading-relaxed opacity-70">
                {activity.description}
            </p>

            {/* Stats / Metadata */}
            <div className="flex items-center justify-between mt-auto pt-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">
                    {activity.stats}
                </span>
                {activity.isActive && (
                    <div className="flex items-center gap-2 text-primary-strong font-black uppercase tracking-[0.2em] text-[10px] opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        Enter
                        <ArrowRight size={16} />
                    </div>
                )}
            </div>
        </div>
    );

    if (!activity.isActive) {
        return CardContent;
    }

    return (
        <Link href={activity.href} className="flex flex-col h-full">
            {CardContent}
        </Link>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function ActivityHubPage() {
    return (
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            {/* Standardized Header */}
            <PageHeader
                title="Activity Hub"
                subtitle="Interactive training and linguistic challenges"
                icon={<Activity size={24} className="text-white" />}
                iconBgColor="bg-primary-strong"
            />

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {activities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} />
                    ))}
                </div>

            </main>
        </div>
    );
}
