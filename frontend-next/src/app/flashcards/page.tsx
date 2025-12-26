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
    ArrowRightLeft,
    ShieldCheck
} from 'lucide-react';
import { SearchNexus } from '@/components/shared/SearchNexus';
import { SearchNexusState, FilterGroup } from '@/types/search';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { CreateButton, InformativeLoginCard, PageHeader, ViewModeToggle, CreateContentPanel, ListingCard } from '@/components/shared';
import type { ViewMode } from '@/components/shared';
import { fetchFlashcardSets, createFlashcardSet } from '@/services/flashcardService';

interface FlashcardSet {
    id: string;
    title: string;
    description: string;
    cardCount: number;
    level?: string;
    tags: string[];
    visibility?: 'global' | 'public' | 'private';
    creatorName?: string;
}

export default function FlashcardsMenu() {
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    const [sets, setSets] = useState<FlashcardSet[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    const loadSets = async () => {
        setIsLoading(true);
        try {
            const fetched = await fetchFlashcardSets();
            const mappedSets: FlashcardSet[] = fetched.map((s: any) => ({
                id: s.id,
                title: s.title,
                description: s.description || "",
                cardCount: s.cardCount || 0,
                level: s.level,
                tags: s.tags || [],
                visibility: s.visibility,
                creatorName: s.creatorName
            }));
            setSets(mappedSets);
        } catch (err) {
            console.error("Failed to load flashcard sets:", err);
            setSets([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (searchState.activeTab === 'PUBLIC' || user) {
            loadSets();
        } else {
            setSets([]);
        }
    }, [searchState.activeTab, user]);

    const filteredSets = useMemo(() => {
        let result = [...sets];

        // Filter by Access tab
        if (searchState.activeTab === 'PUBLIC') {
            result = result.filter(s => s.visibility !== 'private');
        } else {
            result = result.filter(s => s.visibility === 'private');
        }

        const selectedLevels = searchState.activeFilters.level || [];
        if (selectedLevels.length > 0) {
            result = result.filter(s => s.level && selectedLevels.includes(s.level));
        }

        if (searchState.query.trim()) {
            const query = searchState.query.toLowerCase();
            result = result.filter(s =>
                s.title.toLowerCase().includes(query) ||
                s.description.toLowerCase().includes(query) ||
                s.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return result;
    }, [sets, searchState.query, searchState.activeFilters, searchState.activeTab]);


    const filterGroups: FilterGroup[] = [
        {
            id: 'access',
            label: 'Access',
            type: 'SINGLE',
            options: [
                { id: 'PUBLIC', label: 'Public Sets', icon: <Globe size={12} /> },
                { id: 'PERSONAL', label: 'My Sets', icon: <UserIcon size={12} /> }
            ]
        },
        {
            id: 'level',
            label: 'JLPT Level',
            type: 'MULTI',
            options: [
                { id: 'N5', label: 'N5' },
                { id: 'N4', label: 'N4' },
                { id: 'N3', label: 'N3' },
                { id: 'N2', label: 'N2' },
                { id: 'N1', label: 'N1' }
            ]
        }
    ];

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
                description: 'Sign in to create your own personalized sets and master them using Hanapita SRS.'
            });
        } else {
            setIsCreatePanelOpen(true);
        }
    };

    const handleSaveContent = async (data: any) => {
        try {
            await createFlashcardSet({
                title: data.title || "New Set",
                description: data.description || "Created via Hanachan AI",
                visibility: data.visibility || 'private',
                level: (searchState.activeFilters.level?.[0] !== 'ALL' ? searchState.activeFilters.level?.[0] : 'N3') as any,
                cards: data.items?.map((item: any) => ({
                    front: item.front || item.term || item.kanji || "",
                    back: item.back || item.definition || item.meaning || "",
                    reading: item.reading || item.hiragana || "",
                    mnemonic: item.mnemonic || ""
                })),
                tags: ['personal']
            });
            await loadSets();
            setIsCreatePanelOpen(false);
        } catch (err) {
            console.error("Failed to save flashcard set:", err);
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
                backHref="/activity"
                backLabel="Back"
                backPosition="inline"
                rightContent={
                    <>
                        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                        <CreateButton label="Create Set" onClick={handleCreateClick} />
                    </>
                }
            >
                <SearchNexus
                    placeholder="Search flashcard sets..."
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
                {filteredSets.length > 0 ? (
                    <div className={viewMode === 'GRID'
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "flex flex-col gap-4"
                    }>
                        {filteredSets.map((set) => (
                            <ListingCard
                                key={set.id}
                                title={set.title}
                                description={set.description}
                                icon={<Layers size={24} />}
                                iconBgColor="bg-neutral-beige/50"
                                viewMode={viewMode}
                                metadata={[
                                    { label: 'Cards', value: set.cardCount || 0, icon: <Layers size={14} className="text-primary-strong" /> },
                                    ...(set.visibility === 'global' ? [{ label: 'Official', value: 'Verified', icon: <ShieldCheck size={14} className="text-primary-strong" /> }] : []),
                                    ...(set.creatorName && set.visibility !== 'global' ? [{ label: 'By', value: set.creatorName, icon: <UserIcon size={14} /> }] : [])
                                ]}
                                badge={set.level ? { label: set.level } : undefined}
                                onClick={() => {/* handle navigate */ }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-neutral-white border border-neutral-gray/20 rounded-[2rem]">
                        <p className="text-neutral-ink font-black uppercase tracking-widest">No sets found matching your parameters</p>
                    </div>
                )}

                {/* Personalization Gate */}
                {searchState.activeTab === 'PERSONAL' && !user && (
                    <div className="mt-12">
                        <InformativeLoginCard
                            title="Your Personal Vault"
                            description="Sign in to create custom sets, track your SRS progress, and bookmark community resources for personal study."
                            icon={Layers}
                            benefits={[
                                "Create Unlimited Custom Sets",
                                "Spaced Repetition Tracking (SRS)",
                                "Priority Search Results",
                                "Synchronization Across Devices"
                            ]}
                            flowType="FLASHCARDS"
                        />
                    </div>
                )}
            </main>

            <CreateContentPanel
                isOpen={isCreatePanelOpen}
                onClose={() => setIsCreatePanelOpen(false)}
                type="FLASHCARDS"
                onSave={handleSaveContent}
            />
        </div>
    );
}
