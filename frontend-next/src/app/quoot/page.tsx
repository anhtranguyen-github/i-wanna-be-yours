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
    User as UserIcon,
    Sparkles
} from "lucide-react";
import { SearchNexus } from "@/components/shared/SearchNexus";
import { SearchNexusState, FilterGroup } from "@/types/search";
import { InformativeLoginCard, CreateButton, PageHeader, ViewModeToggle, ModeTabs, CreateContentPanel } from "@/components/shared";
import type { ViewMode } from "@/components/shared";
import { useUser } from "@/context/UserContext";
import { fetchDecks, createDeck } from "@/services/deckService";

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
    isPersonal?: boolean;
}

type QuootMode = 'CLASSIC' | 'SURVIVAL' | 'RANKED';

// =============================================================================
// COMPONENTS
// =============================================================================

interface DeckCardProps {
    deck: QuootDeck;
    onClick: () => void;
    viewMode: ViewMode;
}

function DeckCard({ deck, onClick, viewMode }: DeckCardProps) {
    if (viewMode === 'LIST') {
        return (
            <button
                onClick={onClick}
                className="group bg-neutral-white rounded-2xl border border-neutral-gray/20 p-4 flex items-center justify-between text-left hover:border-primary-strong transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${deck.coverColor || 'bg-primary/20'} rounded-xl flex items-center justify-center text-2xl`}>
                        {deck.coverEmoji || '📚'}
                    </div>
                    <div>
                        <h4 className="font-black text-neutral-ink font-display group-hover:text-primary-strong transition-colors">
                            {deck.title}
                        </h4>
                        <p className="text-[10px] text-neutral-ink font-bold opacity-60 line-clamp-1">
                            {deck.description}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40 flex items-center gap-2">
                        <Layers size={12} />
                        {deck.cardCount} Cards
                    </div>
                    {deck.level && (
                        <span className="px-2 py-1 bg-neutral-beige/30 text-[9px] font-black uppercase tracking-widest rounded-lg">
                            {deck.level}
                        </span>
                    )}
                </div>
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className="group bg-neutral-white rounded-[2rem] border border-neutral-gray/20 p-6 text-left hover:border-primary-strong transition-all relative overflow-hidden h-full flex flex-col"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${deck.coverColor || 'bg-primary/20'} rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform md:w-16 md:h-16 md:text-4xl`}>
                    {deck.coverEmoji || '📚'}
                </div>
                {deck.level && (
                    <span className="px-3 py-1.5 bg-neutral-white border border-neutral-gray/20 text-neutral-ink rounded-xl text-[9px] font-black uppercase tracking-widest">
                        {deck.level}
                    </span>
                )}
            </div>
            <h4 className="text-xl font-black text-neutral-ink font-display mb-2 group-hover:text-primary-strong transition-colors line-clamp-1">
                {deck.title}
            </h4>
            <p className="text-xs text-neutral-ink font-bold mb-6 line-clamp-2 leading-relaxed flex-grow">
                {deck.description}
            </p>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-neutral-ink/60 border-t border-neutral-gray/10 pt-4">
                <span className="flex items-center gap-1.5">
                    <Layers size={14} />
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
    const [activeMode, setActiveMode] = useState<QuootMode>('CLASSIC');
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);

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

    const modes = [
        { id: 'CLASSIC', label: 'Classic Battle', icon: <Gamepad2 size={16} /> },
        { id: 'SURVIVAL', label: 'Survival Protocol', icon: <Clock size={16} /> },
        { id: 'RANKED', label: 'Global Ranked', icon: <Trophy size={16} /> }
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
                    coverEmoji: d.icon || '📚',
                    isPersonal: searchState.activeTab === 'PERSONAL'
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
        let result = [...decks];

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

        // Prioritize personal content
        result.sort((a, b) => {
            if (a.isPersonal === b.isPersonal) return 0;
            return a.isPersonal ? -1 : 1;
        });

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

    const handleDeckSelect = (deckId: string) => {
        router.push(`/quoot/${deckId}?mode=${activeMode}`);
    };

    const handleCreateClick = () => {
        if (!user) {
            setShowLoginPrompt(true);
        } else {
            setIsCreatePanelOpen(true);
        }
    };

    const handleSaveContent = async (data: any) => {
        try {
            await createDeck({
                title: data.title,
                description: data.description || "",
                cards: data.items.map((item: any) => ({
                    front: item.term || item.question,
                    back: item.definition || item.answer,
                    type: 'vocabulary'
                })),
                tags: ['personal', 'quoot']
            });
            // Refresh decks
            const fetchedDecks = await fetchDecks(searchState.activeTab);
            const mappedDecks: QuootDeck[] = fetchedDecks.map(d => ({
                id: d._id,
                title: d.title,
                description: d.description || "",
                cardCount: d.cards?.length || 0,
                level: d.level,
                coverColor: 'bg-primary/20',
                coverEmoji: d.icon || '📚',
                isPersonal: searchState.activeTab === 'PERSONAL'
            }));
            setDecks(mappedDecks);
        } catch (err) {
            console.error("Failed to save deck:", err);
            throw err;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            {/* Header */}
            <PageHeader
                title="Quoot"
                subtitle="High-stakes vocabulary battles"
                icon={<Zap size={24} className="text-white" />}
                iconBgColor="bg-primary-strong"
                backHref="/game"
                backLabel="Back"
                backPosition="inline"
                rightContent={
                    <>
                        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                        <CreateButton label="Create Deck" onClick={handleCreateClick} />
                    </>
                }
            >
                <SearchNexus
                    placeholder="Search decks (Anime, JLPT, News...)"
                    groups={filterGroups}
                    state={searchState}
                    onChange={handleSearchChange}
                    onPersonalTabAttempt={() => setShowLoginPrompt(true)}
                    isLoggedIn={!!user}
                    variant="minimal"
                    showSwitches={false}
                />
            </PageHeader>

            {/* Mode Tabs Navigation */}
            <div className="bg-neutral-white border-b border-neutral-gray/20 py-4 px-6 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <ModeTabs
                        modes={modes}
                        activeMode={activeMode}
                        onChange={(m) => setActiveMode(m as QuootMode)}
                    />
                    <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">
                        <Sparkles size={14} className="text-secondary" />
                        Selected Mode: {modes.find(m => m.id === activeMode)?.label}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Deck Discovery */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Layers size={18} className="text-primary-strong" />
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/60">
                            Cognitive Vaults ({filteredDecks.length})
                        </h2>
                    </div>

                    <div className={viewMode === 'GRID'
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "flex flex-col gap-4"
                    }>
                        {filteredDecks.map((deck) => (
                            <DeckCard
                                key={deck.id}
                                deck={deck}
                                onClick={() => handleDeckSelect(deck.id)}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>

                    {filteredDecks.length === 0 && !isLoading && (
                        <div className="bg-neutral-white border border-dashed border-neutral-gray/30 rounded-[2rem] p-20 text-center">
                            <Layers size={48} className="mx-auto text-neutral-gray/30 mb-6" />
                            <h3 className="text-xl font-black text-neutral-ink font-display mb-2">No decks found</h3>
                            <p className="text-neutral-ink/60 font-bold max-w-md mx-auto">
                                Try adjusting your search or filters to discover new battle arenas.
                            </p>
                        </div>
                    )}
                </section>

                {/* Personalization Gate */}
                {searchState.activeTab === 'PERSONAL' && !user && (
                    <div className="mt-20">
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
                    </div>
                )}
            </main>

            {/* Create Content Panel */}
            <CreateContentPanel
                isOpen={isCreatePanelOpen}
                onClose={() => setIsCreatePanelOpen(false)}
                type="QUOOT"
                onSave={handleSaveContent}
            />
        </div>
    );
}
