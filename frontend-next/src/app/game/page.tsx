"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    Gamepad2,
    Layers,
    Zap,
    ChevronRight,
    Sparkles
} from "lucide-react";
import { PageHeader } from "@/components/shared";

// =============================================================================
// GAME CARDS DATA
// =============================================================================

const games = [
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
    }
];

// =============================================================================
// COMPONENTS
// =============================================================================

function GameCard({ game }: { game: typeof games[0] }) {
    const CardContent = (
        <div className={`group relative bg-neutral-white rounded-[2rem] border border-neutral-gray/20 p-8 h-full transition-all duration-300 ${game.isActive ? 'hover:border-primary-strong cursor-pointer scale-100 active:scale-[0.98]' : 'opacity-60 cursor-not-allowed'}`}>
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${game.color} opacity-10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity`} />

            {/* New Badge */}
            {game.isNew && (
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-accent text-accent-foreground text-[9px] font-black uppercase tracking-widest rounded-full ">
                    New
                </div>
            )}

            {/* Icon */}
            <div className={`w-16 h-16 ${game.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform `}>
                {game.icon}
            </div>

            {/* Content */}
            <h3 className="text-2xl font-black text-neutral-ink font-display tracking-tight mb-2 group-hover:text-primary-strong transition-colors">
                {game.title}
            </h3>
            <p className="text-neutral-ink font-bold mb-4 leading-relaxed">
                {game.description}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-ink">
                    {game.stats}
                </span>
                {game.isActive && (
                    <ChevronRight size={20} className="text-neutral-ink group-hover:text-primary-strong group-hover:translate-x-1 transition-all" />
                )}
            </div>
        </div>
    );

    if (!game.isActive) {
        return CardContent;
    }

    return (
        <Link href={game.href}>
            {CardContent}
        </Link>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function GamesHubPage() {
    return (
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            {/* Header */}
            <PageHeader
                title="Games"
                subtitle="Fun ways to practice Japanese"
                icon={<Gamepad2 size={24} className="text-primary-strong" />}
                iconBgColor="bg-neutral-ink"
            />

            {/* Games Grid */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            </main>
        </div>
    );
}
