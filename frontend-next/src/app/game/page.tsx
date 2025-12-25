"use client";

/**
 * Games Hub - Central page for all Hanabira games
 * Links to: Quoot, Flashcards, Songify, etc.
 */

import Link from "next/link";
import {
    Gamepad2,
    Music,
    Layers,
    Zap,
    Heart,
    Puzzle,
    ArrowLeft,
    ChevronRight,
    Sparkles
} from "lucide-react";

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
    },
    {
        id: 'songify',
        title: 'Songify',
        description: 'Learn Japanese vocabulary through music and lyrics. Coming soon!',
        href: '/game/songify-vocabulary',
        icon: <Music className="w-7 h-7" />,
        color: 'bg-gradient-to-br from-pink-500 to-rose-600',
        stats: '🎵 Music-based learning',
        isActive: true,
        isNew: false
    },
    {
        id: 'word-puzzle',
        title: 'Word Puzzle',
        description: 'Unscramble words and solve puzzles to test your vocabulary.',
        href: '#',
        icon: <Puzzle className="w-7 h-7" />,
        color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        stats: 'Coming Soon',
        isActive: false,
        isNew: false
    }
];

// =============================================================================
// COMPONENTS
// =============================================================================

function GameCard({ game }: { game: typeof games[0] }) {
    const CardContent = (
        <div className={`group relative bg-card rounded-[2rem] border border-border p-8 h-full transition-all duration-300 ${game.isActive ? 'hover:border-primary/40 hover:shadow-xl hover:scale-[1.02] cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${game.color} opacity-10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity`} />

            {/* New Badge */}
            {game.isNew && (
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-accent text-accent-foreground text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    New
                </div>
            )}

            {/* Icon */}
            <div className={`w-16 h-16 ${game.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                {game.icon}
            </div>

            {/* Content */}
            <h3 className="text-2xl font-black text-foreground font-display tracking-tight mb-2 group-hover:text-primary transition-colors">
                {game.title}
            </h3>
            <p className="text-muted-foreground font-bold mb-4 leading-relaxed">
                {game.description}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                    {game.stats}
                </span>
                {game.isActive && (
                    <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-b border-border px-6 py-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground mb-8 transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center gap-5 mb-4">
                        <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center">
                            <Gamepad2 size={32} className="text-background" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-foreground font-display tracking-tight">
                                Games
                            </h1>
                            <p className="text-muted-foreground font-bold text-lg">Fun ways to practice Japanese</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-2xl leading-relaxed">
                        Master Japanese through engaging gameplay. Choose a game below to start practicing vocabulary, kanji, and grammar in a fun and competitive way.
                    </p>
                </div>
            </header>

            {/* Games Grid */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-center gap-3 mb-8">
                    <Sparkles size={20} className="text-primary" />
                    <h2 className="text-xl font-black text-foreground font-display tracking-tight">
                        Available Games
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {games.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>

                {/* Daily Challenge Banner */}
                <div className="mt-12 bg-gradient-to-r from-purple-500/10 via-primary/10 to-accent/10 rounded-[2rem] border border-border p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <Heart size={28} className="fill-current" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-foreground font-display tracking-tight">
                                    Quoot Daily Challenge
                                </h2>
                                <p className="text-muted-foreground font-bold">
                                    Complete today&apos;s deck to earn bonus XP!
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/quoot"
                            className="px-8 py-4 bg-foreground text-background font-black font-display text-sm uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center gap-2"
                        >
                            <Zap size={18} />
                            Play Now
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
