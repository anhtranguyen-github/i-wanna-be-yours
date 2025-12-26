"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Gamepad2,
    Layers,
    Star,
    Globe,
    Zap,
    User as UserIcon
} from "lucide-react";
import { SearchNexus } from "@/components/shared/SearchNexus";
import { SearchNexusState, FilterGroup } from "@/types/search";
import { InformativeLoginCard, CreateButton, PageHeader, ViewModeToggle, CreateContentPanel, ListingCard } from "@/components/shared";
import type { ViewMode } from "@/components/shared";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { fetchQuootDecks, createQuootDeck } from "@/services/quootService";

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


// =============================================================================
// COMPONENTS
// =============================================================================

interface DeckCardProps {
    deck: QuootDeck;
    onClick: () => void;
    viewMode: ViewMode;
}

// DeckCard replaced by ListingCard

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function GamePage() {
    const router = useRouter();
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    const [searchState, setSearchState] = useState<SearchNexusState>({
        query: "",
        activeFilters: {
            access: ['PUBLIC']
        },
        activeTab: 'PUBLIC'
    });
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('GRID');
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


    const [decks, setDecks] = useState<QuootDeck[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadDecks = async () => {
            setIsLoading(true);
            try {
                const fetchedDecks = await fetchQuootDecks();
                const mappedDecks: QuootDeck[] = fetchedDecks.map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    description: d.description || "",
                    cardCount: d.cardCount || 0,
                    level: d.level,
                    coverColor: 'bg-primary/20',
                    coverEmoji: d.icon || '⚔️',
                    isPersonal: false // Access control handled by backend query
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
        router.push(`/quoot/${deckId}`);
    };

    const handleCreateClick = () => {
        if (!user) {
            openAuth('LOGIN', {
                flowType: 'CHAT',
                title: 'Forge Your Deck',
                description: 'Join the ranks to create custom battle arenas and track your mastery.'
            });
        } else {
            setIsCreatePanelOpen(true);
        }
    };

    const handleSaveContent = async (data: any) => {
        try {
            await createQuootDeck({
                title: data.title || "New Quoot Deck",
                description: data.description || "Created via Hanachan AI",
                level: (searchState.activeFilters.level?.[0] !== 'ALL' ? searchState.activeFilters.level?.[0] : 'N3') as any,
                cards: data.items?.map((item: any) => ({
                    front: item.term || item.kanji,
                    back: item.definition || item.meaning || "",
                    reading: item.reading || item.hiragana || "",
                    type: 'vocabulary'
                }))
            });
            // Refresh decks
            const fetchedDecks = await fetchQuootDecks();
            const mappedDecks: QuootDeck[] = fetchedDecks.map((d: any) => ({
                id: d.id,
                title: d.title,
                description: d.description || "",
                cardCount: d.cardCount || 0,
                level: d.level,
                coverColor: 'bg-primary/20',
                coverEmoji: d.icon || '⚔️',
                isPersonal: false
            }));
            setDecks(mappedDecks);
            setIsCreatePanelOpen(false);
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
                backHref="/activity"
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


            {/* Content Area */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Deck Discovery */}
                <section>
                    {/* Content Removed */}

                    <div className={viewMode === 'GRID'
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "flex flex-col gap-4"
                    }>
                        {filteredDecks.map((deck) => (
                            <ListingCard
                                key={deck.id}
                                title={deck.title}
                                description={deck.description}
                                icon={<span className="text-2xl">{deck.coverEmoji || '📚'}</span>}
                                iconBgColor={deck.coverColor || 'bg-primary/10'}
                                viewMode={viewMode}
                                onClick={() => handleDeckSelect(deck.id)}
                                badge={deck.level ? { label: deck.level } : undefined}
                                metadata={[
                                    { label: 'Cards', value: deck.cardCount, icon: <Layers size={14} /> },
                                    ...(deck.avgScore ? [{ label: '% Score', value: deck.avgScore, icon: <Star size={14} className="text-secondary" /> }] : [])
                                ]}
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
