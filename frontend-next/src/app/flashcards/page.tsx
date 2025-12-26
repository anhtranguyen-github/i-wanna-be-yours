"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus,
    Layers,
    History,
    Star,
    ArrowRight,
    MoreVertical,
    Globe,
    User as UserIcon,
    ArrowRightLeft
} from 'lucide-react';
import { SearchNexus } from '@/components/shared/SearchNexus';
import { SearchNexusState, FilterGroup } from '@/types/search';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { CreateButton, InformativeLoginCard, PageHeader, ViewModeToggle, CreateContentPanel, ListingCard } from '@/components/shared';
import type { ViewMode } from '@/components/shared';
import {
    getPublicDecks,
    getPersonalDecks,
    searchDecks,
    getTagsByType
} from './decks-data';
import { createDeck, fetchDecks } from '@/services/deckService';

interface FlashcardDeckCardProps {
    deck: any;
    viewMode: ViewMode;
}

// FlashcardDeckCard replaced by ListingCard

export default function FlashcardsMenu() {
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    // We'll load decks dynamically
    const [decks, setDecks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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

    const loadDecks = async () => {
        setIsLoading(true);
        try {
            const fetched = await fetchDecks(searchState.activeTab);
            // Mix with static data for now to keep the demo rich
            const staticList = searchState.activeTab === 'PUBLIC'
                ? getPublicDecks(user?.id ? String(user.id) : null)
                : getPersonalDecks();

            const mappedStatic = staticList.map(d => ({ ...d, isPersonal: searchState.activeTab === 'PERSONAL' }));
            const mappedFetched = fetched.map(d => ({
                id: d._id,
                title: d.title,
                description: d.description || "",
                cardCount: d.cards?.length || 0,
                level: d.level,
                tags: d.tags || [],
                isPersonal: searchState.activeTab === 'PERSONAL'
            }));

            // Deduplicate by ID
            const existingIds = new Set(mappedFetched.map(d => d.id));
            setDecks([...mappedFetched, ...mappedStatic.filter(d => !existingIds.has(d.id))]);
        } catch (err) {
            console.error("Failed to load flashcard decks:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDecks();
    }, [searchState.activeTab, user]);

    const filteredDecks = useMemo(() => {
        let result = [...decks];

        const selectedTagIds = [
            ...(searchState.activeFilters.level || []),
            ...(searchState.activeFilters.skill || []),
            ...(searchState.activeFilters.category || [])
        ].filter(id => id !== 'ALL');

        if (selectedTagIds.length > 0) {
            result = result.filter(deck =>
                selectedTagIds.some(tagId => deck.tags.includes(tagId))
            );
        }

        if (searchState.query.trim()) {
            result = searchDecks(result, searchState.query);
        }

        // Prioritize personal content
        result.sort((a, b) => {
            if (a.isPersonal === b.isPersonal) return 0;
            return a.isPersonal ? -1 : 1;
        });

        return result;
    }, [decks, searchState.query, searchState.activeFilters]);


    const filterGroups = useMemo((): FilterGroup[] => [
        {
            id: 'access',
            label: 'Access',
            type: 'SINGLE' as const,
            options: [
                { id: 'PUBLIC', label: 'Public Decks', icon: <Globe size={12} /> },
                { id: 'PERSONAL', label: 'My Decks', icon: <UserIcon size={12} /> }
            ]
        },
        {
            id: 'category',
            label: 'Categories',
            type: 'MULTI' as const,
            options: getTagsByType('category').filter(t => t.id !== 'personal').map(t => ({ id: t.id, label: t.label }))
        },
        {
            id: 'level',
            label: 'JLPT Level',
            type: 'MULTI' as const,
            options: getTagsByType('level').map(t => ({ id: t.id, label: t.label }))
        },
        {
            id: 'skill',
            label: 'Skill',
            type: 'MULTI' as const,
            options: getTagsByType('skill').map(t => ({ id: t.id, label: t.label }))
        }
    ], []);

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

    const handleCreateClick = () => {
        if (!user) {
            openAuth('LOGIN', {
                flowType: 'FLASHCARDS',
                title: 'Master Spaced Repetition',
                description: 'Sign in to create your own personalized decks and master them using Hanapita SRS.'
            });
        } else {
            setIsCreatePanelOpen(true);
        }
    };

    const handleSaveContent = async (data: any) => {
        try {
            await createDeck({
                title: data.title || "New Flashcard Deck",
                description: data.description || "Created via Hanachan AI",
                cards: data.items?.map((item: any) => ({
                    front: item.term || item.kanji,
                    back: item.definition || item.meaning || "",
                    sub_detail: item.reading || item.hiragana || "",
                    type: 'vocabulary'
                })),
                tags: ['personal', 'flashcards', 'ai-generated']
            });
            await loadDecks();
            setIsCreatePanelOpen(false);
        } catch (err) {
            console.error("Failed to save flashcard deck:", err);
            throw err;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            {/* Header */}
            <PageHeader
                title="Flashcards"
                subtitle="Master vocabulary through spaced repetition"
                icon={<Layers size={24} className="text-white" />}
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
                    placeholder="Search decks, categories, or keywords..."
                    groups={filterGroups}
                    state={searchState}
                    onChange={handleSearchChange}
                    onPersonalTabAttempt={() => setShowLoginPrompt(true)}
                    isLoggedIn={!!user}
                    variant="minimal"
                    showSwitches={false}
                />
            </PageHeader>


            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Content Removed */}

                {filteredDecks.length > 0 ? (
                    <div className={viewMode === 'GRID'
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "flex flex-col gap-4"
                    }>
                        {filteredDecks.map((deck) => (
                            <ListingCard
                                key={deck.id}
                                title={deck.title}
                                description={deck.description}
                                icon={<Layers size={24} />}
                                iconBgColor="bg-neutral-beige/50"
                                viewMode={viewMode}
                                metadata={[{ label: 'Cards', value: deck.cardCount || 0, icon: <Layers size={14} className="text-primary-strong" /> }]}
                                badge={deck.isPersonal ? { label: 'My Deck', color: 'bg-accent/20' } : undefined}
                                onClick={() => {/* handle navigate */ }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-neutral-white border border-neutral-gray/20 rounded-[2rem]">
                        <p className="text-neutral-ink font-black uppercase tracking-widest">No decks found matching your parameters</p>
                    </div>
                )}

                {/* Personalization Gate */}
                {searchState.activeTab === 'PERSONAL' && !user && (
                    <div className="mt-12">
                        <InformativeLoginCard
                            title="Your Personal Flashcard Vault"
                            description="Sign in to create custom decks, track your SRS progress, and bookmark community resources for personal study."
                            icon={Layers}
                            benefits={[
                                "Create Unlimited Custom Decks",
                                "Spaced Repetition Tracking (SRS)",
                                "Priority Search Results",
                                "Synchronization Across All Devices"
                            ]}
                            flowType="FLASHCARDS"
                        />
                    </div>
                )}
            </main>

            {/* Create Content Panel */}
            <CreateContentPanel
                isOpen={isCreatePanelOpen}
                onClose={() => setIsCreatePanelOpen(false)}
                type="FLASHCARDS"
                onSave={handleSaveContent}
            />
        </div>
    );
}
