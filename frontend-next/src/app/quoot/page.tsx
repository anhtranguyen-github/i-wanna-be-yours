"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Gamepad2,
    Layers,
    Star,
    Trophy,
    Play,
    Clock,
    Search,
    Filter,
    Globe,
    Zap,
    User as UserIcon
} from "lucide-react";
import { SearchNexus } from "@/components/shared/SearchNexus";
import { SearchNexusState, FilterGroup } from "@/types/search";
import { InformativeLoginCard, CreateButton, PageHeader, ViewModeToggle } from "@/components/shared";
import type { ViewMode } from "@/components/shared";
import { useUser } from "@/context/UserContext";
import { fetchDecks } from "@/services/deckService";

// =============================================================================
// TYPES
// =============================================================================

interface QuootDeck {
    id: string;
    title: string;
    description: string;
    cardCount: number;
    avgScore?: number;
    level?: string;
    coverColor?: string;
    coverEmoji?: string;
}

type QuootMode = 'CLASSIC' | 'SURVIVAL' | 'RANKED';

// =============================================================================
// COMPONENTS
// =============================================================================

function ModeCard({ mode, icon: Icon, title, description, color }: any) {
    return (
        <div className="bg-neutral-white border border-neutral-gray/20 rounded-[2rem] p-10 flex flex-col gap-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-48 h-48 ${color} rounded-full blur-[80px] -mr-24 -mt-24 opacity-60 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10 w-16 h-16 bg-neutral-white rounded-2xl flex items-center justify-center border border-neutral-gray/20">
                <Icon size={32} className="text-neutral-ink" />
            </div>
            <div className="relative z-10">
                <h3 className="text-3xl font-black text-neutral-ink font-display mb-2">{title}</h3>
                <p className="text-neutral-ink font-bold leading-relaxed">{description}</p>
            </div>
            <button className="relative z-10 mt-4 w-full py-4 bg-neutral-ink text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary-strong transition-all active:scale-[0.98]">
                Initiate Battle
            </button>
        </div>
    );
}

function DeckCard({ deck, onClick }: { deck: QuootDeck; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group bg-neutral-white rounded-[2rem] border border-neutral-gray/20 p-6 text-left hover:border-primary-strong transition-all relative overflow-hidden"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${deck.coverColor || 'bg-primary/20'} rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                    {deck.coverEmoji || '📚'}
                </div>
                {deck.level && (
                    <span className="px-3 py-1.5 bg-neutral-white border border-neutral-gray/20 text-neutral-ink rounded-xl text-[9px] font-black uppercase tracking-widest">
                        {deck.level}
                    </span>
                )}
            </div>
            <h4 className="text-lg font-black text-neutral-ink font-display mb-2 group-hover:text-primary-strong transition-colors line-clamp-1">
                {deck.title}
            </h4>
            <p className="text-xs text-neutral-ink font-bold mb-6 line-clamp-2 leading-relaxed">
                {deck.description}
            </p>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-neutral-ink border-t border-neutral-gray/10 pt-4">
                <span className="flex items-center gap-1.5">
                    <Layers size={14} className="text-neutral-ink" />
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
        activeFilters: {
            access: ['PUBLIC']
        },
        activeTab: 'PUBLIC'
    });
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('GRID');

    const filterGroups: FilterGroup[] = [
        {
            id: 'access',
            label: 'Access',
            type: 'SINGLE',
            options: [
                { id: 'PUBLIC', label: 'Public Content', icon: <Globe size={12} /> },
                { id: 'PERSONAL', label: 'My Decks', icon: <UserIcon size={12} /> }
            ]
        },
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

    const [decks, setDecks] = useState<QuootDeck[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadDecks = async () => {
            setIsLoading(true);
            try {
                const fetchedDecks = await fetchDecks(searchState.activeTab);
                const mappedDecks: QuootDeck[] = fetchedDecks.map(d => ({
                    id: d._id,
                    title: d.title,
                    description: d.description || "",
                    cardCount: d.cards?.length || 0,
                    level: d.level,
                    coverColor: 'bg-primary/20',
                    coverEmoji: d.icon || '📚'
                }));
                setDecks(mappedDecks);
            } catch (err) {
                console.error("Failed to load quoot decks:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (searchState.activeTab === 'PUBLIC' || user) {
            loadDecks();
        } else {
            setDecks([]);
        }
    }, [searchState.activeTab, user]);

    const filteredDecks = useMemo(() => {
        let result = decks;

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
    }, [decks, searchState.query, searchState.activeFilters.level]);

    const handleSearchChange = (newState: SearchNexusState) => {
        const accessFilter = newState.activeFilters.access?.[0];

        if (accessFilter && accessFilter !== searchState.activeTab) {
            if (accessFilter === 'PERSONAL' && !user) {
                setShowLoginPrompt(true);
                return;
            }
            newState.activeTab = accessFilter as 'PUBLIC' | 'PERSONAL';
        } else if (newState.activeTab !== searchState.activeTab) {
            newState.activeFilters = {
                ...newState.activeFilters,
                access: [newState.activeTab]
            };
        }

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
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            {/* Header */}
            <PageHeader
                title="Quoot"
                subtitle="Competitive flashcard battles"
                icon={<Zap size={24} className="text-white" />}
                iconBgColor="bg-primary-strong"
                backHref="/game"
                backLabel="Back to Games"
                rightContent={
                    <>
                        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                        <CreateButton href="/quoot/create" label="Create Deck" />
                    </>
                }
            >
                <SearchNexus
                    placeholder="Search for anime decks, JLPT drills, or song lyrics..."
                    groups={filterGroups}
                    state={searchState}
                    onChange={handleSearchChange}
                    onPersonalTabAttempt={() => setShowLoginPrompt(true)}
                    isLoggedIn={!!user}
                    variant="minimal"
                    showSwitches={false}
                />
            </PageHeader>

            {/* Content Area */}
            <main className="max-w-7xl mx-auto px-8 py-20 space-y-24">
                {/* Game Modes */}
                <section>
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 bg-neutral-ink text-white rounded-xl flex items-center justify-center">
                            <Play size={20} />
                        </div>
                        <h2 className="text-4xl font-black text-neutral-ink font-display">Operational Modes</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ModeCard
                            title="Classic Battle"
                            description="Standard speed run through a selected deck. Accuracy and time generate your score."
                            icon={Gamepad2}
                            color="bg-primary-leaf/20"
                        />
                        <ModeCard
                            title="Survival Protocol"
                            description="Endless stream of cards. Three strikes and the session terminates."
                            icon={Clock}
                            color="bg-primary-sky/20"
                        />
                        <ModeCard
                            title="Global Ranked"
                            description="Compete against other learners for positions on the leaderboards."
                            icon={Trophy}
                            color="bg-accent/20"
                        />
                    </div>
                </section>

                {/* Deck Discovery */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-neutral-ink text-white rounded-xl flex items-center justify-center">
                                <Layers size={20} />
                            </div>
                            <h2 className="text-4xl font-black text-neutral-ink font-display">Cognitive Vaults</h2>
                        </div>
                    </div>

                    <div className={viewMode === 'GRID'
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                        : "flex flex-col gap-4"
                    }>
                        {filteredDecks.map((deck) => (
                            <DeckCard key={deck.id} deck={deck} onClick={() => handleDeckSelect(deck.id)} />
                        ))}
                    </div>
                </section>

                {/* Personalization Gate */}
                {searchState.activeTab === 'PERSONAL' && !user && (
                    <InformativeLoginCard
                        title="Your Personal Armory"
                        description="Sign in to save your battle history, track your progress on specific decks, and create your own custom drills."
                        benefits={[
                            "Track personal high scores",
                            "Earn unique battle badges",
                            "Create private training decks",
                            "Review difficult cards"
                        ]}
                        icon={Gamepad2}
                        flowType="CHAT"
                    />
                )}
            </main>
        </div>
    );
}

