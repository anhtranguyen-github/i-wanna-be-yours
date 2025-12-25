"use client";

import React, { useState, useMemo } from "react";
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
    Star,
    Search
} from "lucide-react";
import { mockQuootDecks } from "@/data/mockQuoot";
import { QuootDeck, QuootMode, QUOOT_MODE_CONFIG } from "@/types/quoot";
import { SearchNexus } from "@/components/shared/SearchNexus";
import { SearchNexusState, FilterGroup } from "@/types/search";
import { InformativeLoginCard } from "@/components/shared/InformativeLoginCard";
import { useUser } from "@/context/UserContext";

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
            className="group bg-neutral-white p-8 rounded-[2rem] border border-neutral-gray/10 text-left hover:border-primary-strong/40 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-sm relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-${color.replace('bg-', '')}/20 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h3 className="text-xl font-black text-neutral-ink font-display mb-2">{title}</h3>
            <p className="text-sm text-neutral-ink/60 font-bold mb-6 leading-relaxed">{description}</p>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-strong bg-primary/10 px-3 py-1.5 rounded-lg">
                    {stats}
                </span>
                <ChevronRight className="text-neutral-ink/20 group-hover:text-primary-strong group-hover:translate-x-1 transition-all" size={20} />
            </div>
        </button>
    );
}

function DeckCard({ deck, onClick }: { deck: QuootDeck; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group bg-neutral-white rounded-[2rem] border border-neutral-gray/10 p-6 text-left hover:border-primary-strong/40 transition-all hover:shadow-xl shadow-sm relative overflow-hidden"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${deck.coverColor || 'bg-primary/20'} rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner`}>
                    {deck.coverEmoji || '📚'}
                </div>
                {deck.level && (
                    <span className="px-3 py-1.5 bg-neutral-beige/50 text-neutral-ink/60 border border-neutral-gray/10 rounded-xl text-[9px] font-black uppercase tracking-widest">
                        {deck.level}
                    </span>
                )}
            </div>
            <h4 className="text-lg font-black text-neutral-ink font-display mb-2 group-hover:text-primary-strong transition-colors line-clamp-1">
                {deck.title}
            </h4>
            <p className="text-xs text-neutral-ink/50 font-bold mb-6 line-clamp-2 leading-relaxed">
                {deck.description}
            </p>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-neutral-ink/30 border-t border-neutral-gray/10 pt-4">
                <span className="flex items-center gap-1.5">
                    <Layers size={14} className="text-neutral-ink/20" />
                    {deck.cardCount} Cards
                </span>
                {deck.avgScore && (
                    <span className="flex items-center gap-1.5 text-secondary">
                        <Star size={14} fill="currentColor" />
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
    const { user } = useUser();

    const [searchState, setSearchState] = useState<SearchNexusState>({
        query: "",
        activeFilters: {},
        activeTab: 'PUBLIC'
    });
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const filterGroups: FilterGroup[] = [
        {
            id: 'category',
            label: 'Genre',
            type: 'MULTI',
            options: [
                { id: 'ANIME', label: 'Anime & Manga' },
                { id: 'GENERAL', label: 'Everyday' },
                { id: 'JLPT', label: 'JLPT Prep' },
                { id: 'MEDIA', label: 'J-Pop & News' }
            ]
        },
        {
            id: 'level',
            label: 'Level',
            type: 'SINGLE',
            options: [
                { id: 'N5', label: 'N5' },
                { id: 'N4', label: 'N4' },
                { id: 'N3', label: 'N3' },
                { id: 'N2', label: 'N2' },
                { id: 'N1', label: 'N1' }
            ]
        }
    ];

    const filteredDecks = useMemo(() => {
        let result = mockQuootDecks;

        // Filter by tags/level
        const selectedLevels = searchState.activeFilters.level || [];
        if (selectedLevels.length > 0) {
            result = result.filter(d => d.level && selectedLevels.includes(d.level));
        }

        // Search
        if (searchState.query) {
            const q = searchState.query.toLowerCase();
            result = result.filter(d =>
                d.title.toLowerCase().includes(q) ||
                d.description.toLowerCase().includes(q)
            );
        }

        return result;
    }, [searchState]);

    const handleSearchChange = (newState: SearchNexusState) => {
        setSearchState(newState);
        if (newState.activeTab === 'PUBLIC') setShowLoginPrompt(false);
    };

    const handleModeSelect = (mode: QuootMode) => {
        router.push(`/quoot?mode=${mode}`);
    };

    const handleDeckSelect = (deckId: string) => {
        router.push(`/quoot/${deckId}`);
    };

    return (
        <div className="min-h-screen bg-secondary/30 pb-24">
            {/* Header */}
            <header className="bg-neutral-white border-b border-neutral-gray/10 px-8 py-16 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/sakura.png')] opacity-[0.03] pointer-events-none" />
                <div className="max-w-4xl mx-auto space-y-6 relative z-10">
                    <div className="w-24 h-24 bg-primary-strong rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 animate-bounce-slow relative">
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20" />
                        <Gamepad2 size={48} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-7xl font-black text-neutral-ink font-display tracking-tight mb-4">
                            Hanachan Quoot
                        </h1>
                        <p className="text-2xl text-neutral-ink/50 font-bold max-w-2xl mx-auto leading-relaxed">
                            Competitive flashcard battles. Master Japanese through fast-paced gameplay and climb the global ranks.
                        </p>
                    </div>
                </div>
            </header>

            {/* Nexus Controller */}
            <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-50">
                <SearchNexus
                    placeholder="Search for anime decks, JLPT drills, or song lyrics..."
                    groups={filterGroups}
                    state={searchState}
                    onChange={handleSearchChange}
                    onPersonalTabAttempt={() => setShowLoginPrompt(true)}
                    isLoggedIn={!!user}
                />
            </div>

            <main className="max-w-7xl mx-auto px-8 py-16">
                {showLoginPrompt ? (
                    <div className="py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <InformativeLoginCard
                            title="Your Personal Arcade"
                            description="Save your favorite decks, track your high scores, and host custom challenge rooms for your friends."
                            icon={Flame}
                            benefits={[
                                "Personal high-score leaderboard",
                                "Custom deck creation suite",
                                "Match history & performance analysis",
                                "Exclusive seasonal game emojis"
                            ]}
                            flowType="FLASHCARDS"
                        />
                    </div>
                ) : (
                    <>
                        {/* Game Modes */}
                        <section className="mb-24">
                            <div className="flex items-center gap-4 mb-12 border-b border-neutral-gray/10 pb-8">
                                <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Target size={24} className="text-secondary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-neutral-ink font-display">Execution Modes</h2>
                                    <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-ink/20">Select your strategic protocol</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
                        <section>
                            <div className="flex items-center justify-between mb-12 border-b border-neutral-gray/10 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                                        <Layers size={24} className="text-primary-strong" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-neutral-ink font-display">Curated Deck Library</h2>
                                        <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-ink/20">Initialize cognitive transmission</p>
                                    </div>
                                </div>
                                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-ink/20 bg-neutral-beige/50 px-4 py-2 rounded-full border border-neutral-gray/10">
                                    {filteredDecks.length} NODES AVAILABLE
                                </div>
                            </div>

                            {filteredDecks.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {filteredDecks.map((deck) => (
                                        <DeckCard
                                            key={deck.id}
                                            deck={deck}
                                            onClick={() => handleDeckSelect(deck.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-40 text-center bg-neutral-white/40 rounded-[3.5rem] border-2 border-dashed border-neutral-gray/20">
                                    <div className="w-24 h-24 bg-neutral-beige/50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-neutral-ink/10 shadow-inner">
                                        <Search size={40} />
                                    </div>
                                    <h3 className="text-3xl font-black text-neutral-ink mb-3">No Decks Detected</h3>
                                    <p className="text-neutral-ink/40 font-bold mb-10 text-lg">Try adjusting your cognitive parameters.</p>
                                    <button
                                        onClick={() => setSearchState({ ...searchState, query: "", activeFilters: {} })}
                                        className="px-8 py-4 bg-neutral-ink text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-strong transition-all shadow-xl shadow-neutral-ink/10 active:scale-95"
                                    >
                                        Reset Parameters
                                    </button>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
