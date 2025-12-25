"use client";

/**
 * Quoot - Fast-Paced Flashcard Game Hub
 * (Quizizz + Kahoot Hybrid)
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Gamepad2,
    Music,
    Layers,
    Trophy,
    Zap,
    Target,
    Flame,
    Clock,
    Heart,
    Sparkles,
    ChevronRight,
    Star
} from "lucide-react";
import { mockQuootDecks } from "@/data/mockQuoot";
import { QuootDeck, QuootMode, QUOOT_MODE_CONFIG } from "@/types/quoot";

// =============================================================================
// MODE CARDS
// =============================================================================

const gameModes: Array<{
    mode: QuootMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    stats: string;
}> = [
        {
            mode: 'CLASSIC',
            title: 'Classic',
            description: '3 lives to survive. Answer correctly or lose a life!',
            icon: <Heart className="w-6 h-6" />,
            color: 'bg-rose-500',
            stats: '3 ❤️ | 15s'
        },
        {
            mode: 'SPEED',
            title: 'Speed Mode',
            description: 'Race against time. Faster answers = more points!',
            icon: <Zap className="w-6 h-6" />,
            color: 'bg-amber-500',
            stats: '⚡ 10s each'
        },
        {
            mode: 'DAILY_CHALLENGE',
            title: 'Daily Challenge',
            description: 'New deck every day. Compete for the leaderboard!',
            icon: <Trophy className="w-6 h-6" />,
            color: 'bg-purple-500',
            stats: '🏆 10 cards'
        }
    ];

// =============================================================================
// COMPONENTS
// =============================================================================

function ModeCard({ mode, title, description, icon, color, stats, onClick }: {
    mode: QuootMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    stats: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="group bg-card rounded-2xl border border-border p-6 text-left hover:border-primary/40 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h3 className="text-lg font-black text-foreground font-display mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground font-bold mb-3">{description}</p>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 font-display">
                {stats}
            </span>
        </button>
    );
}

function DeckCard({ deck, onClick }: { deck: QuootDeck; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group bg-card rounded-2xl border border-border p-5 text-left hover:border-primary/40 transition-all hover:shadow-lg"
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 ${deck.coverColor || 'bg-primary'} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                    {deck.coverEmoji || '📚'}
                </div>
                {deck.level && (
                    <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-[10px] font-black uppercase tracking-widest">
                        {deck.level}
                    </span>
                )}
            </div>
            <h4 className="text-base font-black text-foreground font-display mb-1 group-hover:text-primary transition-colors">
                {deck.title}
            </h4>
            <p className="text-xs text-muted-foreground font-bold mb-3 line-clamp-2">
                {deck.description}
            </p>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>{deck.cardCount} cards</span>
                {deck.avgScore && (
                    <span className="flex items-center gap-1">
                        <Star size={12} className="text-amber-500" />
                        {deck.avgScore}%
                    </span>
                )}
            </div>
        </button>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function GamePage() {
    const router = useRouter();

    const handleModeSelect = (mode: QuootMode) => {
        // For now, go to deck selection with mode in URL
        router.push(`/game/quoot?mode=${mode}`);
    };

    const handleDeckSelect = (deckId: string) => {
        router.push(`/game/quoot/${deckId}`);
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-b border-border px-6 py-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
                            <Gamepad2 size={28} className="text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-foreground font-display tracking-tight">
                                Quoot
                            </h1>
                            <p className="text-muted-foreground font-bold">Fast-paced flashcard battles</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xl">
                        Master Japanese vocabulary through competitive gameplay. Answer quickly, build streaks, and climb the leaderboard!
                    </p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Game Modes */}
                <section className="mb-12">
                    <h2 className="text-xl font-black text-foreground font-display tracking-tight mb-6 flex items-center gap-3">
                        <Target size={20} className="text-primary" />
                        Select Mode
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {gameModes.map((mode) => (
                            <ModeCard
                                key={mode.mode}
                                {...mode}
                                onClick={() => handleModeSelect(mode.mode)}
                            />
                        ))}
                    </div>
                </section>

                {/* Deck Selection */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-foreground font-display tracking-tight flex items-center gap-3">
                            <Layers size={20} className="text-secondary" />
                            Quick Play - Choose a Deck
                        </h2>
                        <Link
                            href="/game/quoot"
                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                            View All <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {mockQuootDecks.slice(0, 6).map((deck) => (
                            <DeckCard
                                key={deck.id}
                                deck={deck}
                                onClick={() => handleDeckSelect(deck.id)}
                            />
                        ))}
                    </div>
                </section>

                {/* Other Games */}
                <section className="mb-12">
                    <h2 className="text-xl font-black text-foreground font-display tracking-tight mb-6 flex items-center gap-3">
                        <Sparkles size={20} className="text-accent" />
                        More Games
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link href="/flashcards">
                            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-all hover:shadow-lg flex items-center gap-5 group">
                                <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <Layers size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-foreground font-display group-hover:text-primary transition-colors">
                                        Flashcards
                                    </h3>
                                    <p className="text-sm text-muted-foreground font-bold">
                                        SRS study mode for deep learning
                                    </p>
                                </div>
                            </div>
                        </Link>
                        <Link href="/game/songify-vocabulary">
                            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-all hover:shadow-lg flex items-center gap-5 group">
                                <div className="w-14 h-14 bg-pink-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <Music size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-foreground font-display group-hover:text-primary transition-colors">
                                        Songify
                                    </h3>
                                    <p className="text-sm text-muted-foreground font-bold">
                                        Learn vocabulary through music
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* Daily Challenge Banner */}
                <section>
                    <div className="bg-gradient-to-r from-purple-500/10 via-primary/10 to-accent/10 rounded-[2rem] border border-border p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center text-white">
                                <Trophy size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-foreground font-display tracking-tight">
                                    Daily Challenge
                                </h2>
                                <p className="text-muted-foreground font-bold">
                                    Complete today&apos;s deck to earn bonus XP!
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleDeckSelect(mockQuootDecks[0]?.id || 'n5-vocab-essentials')}
                            className="px-8 py-4 bg-foreground text-background font-black font-display text-sm uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] relative z-10 flex items-center gap-2"
                        >
                            <Flame size={18} />
                            Play Now
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
