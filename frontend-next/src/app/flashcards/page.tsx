"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    ShieldCheck,
    Link2
} from 'lucide-react';
import { RetrievalModal, ShareModal } from '@/components/shared';
import { SearchNexus } from '@/components/shared/SearchNexus';
import { SearchNexusState, FilterGroup } from '@/types/search';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { CreateButton, InformativeLoginCard, PageHeader, ViewModeToggle, CreateContentPanel, ListingCard, HistoryModal } from '@/components/shared';
import type { ViewMode } from '@/components/shared';
import { fetchFlashcardSets, createFlashcardSet, updateFlashcardSet, fetchFlashcardSetById } from '@/services/flashcardService';

interface FlashcardSet {
    id: string;
    title: string;
    description: string;
    cardCount: number;
    level?: string;
    tags: string[];
    visibility?: 'global' | 'public' | 'private';
    creatorName?: string;
    userId?: string;
}

export default function FlashcardsMenu() {
    const router = useRouter();
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    const [sets, setSets] = useState<FlashcardSet[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchState, setSearchState] = useState<SearchNexusState>({
        query: "",
        activeFilters: {
            level: ['ALL'],
            access: ['ALL']
        },
        activeTab: 'ALL'
    });
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('GRID');
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    const [isRetrievalOpen, setIsRetrievalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Share & Edit State
    const [shareTarget, setShareTarget] = useState<{ id: string, title: string } | null>(null);
    const [editingSet, setEditingSet] = useState<any | null>(null);

    const loadSets = async () => {
        setIsLoading(true);
        try {
            const apiFilters = {
                level: searchState.activeFilters.level?.[0],
                access: searchState.activeFilters.access?.[0]
            };
            const fetched = await fetchFlashcardSets(apiFilters);
            const mappedSets: FlashcardSet[] = fetched.map((s: any) => ({
                id: s.id,
                title: s.title,
                description: s.description || "",
                cardCount: s.cardCount || 0,
                level: s.level,
                tags: s.tags || [],
                visibility: s.visibility,
                creatorName: s.creatorName,
                userId: s.userId
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
        loadSets();
    }, [searchState.activeFilters, user]);

    const filteredSets = useMemo(() => {
        let result = [...sets];

        // Client-side search only
        if (searchState.query.trim()) {
            const query = searchState.query.toLowerCase();
            result = result.filter(s =>
                s.title.toLowerCase().includes(query) ||
                s.description.toLowerCase().includes(query) ||
                s.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return result;
    }, [sets, searchState.query]);


    const filterGroups: FilterGroup[] = [
        {
            id: 'access',
            label: 'Scope',
            type: 'SINGLE',
            options: [
                { id: 'ALL', label: 'All', icon: <Layers size={14} /> },
                { id: 'GLOBAL', label: 'Official', icon: <ShieldCheck size={14} className="text-primary-strong" /> },
                { id: 'PUBLIC', label: 'Public', icon: <Globe size={14} /> },
                { id: 'PRIVATE', label: 'Personal', icon: <UserIcon size={14} /> }
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

        if (accessFilter === 'PRIVATE' && !user) {
            setShowLoginPrompt(true);
            return;
        }

        setSearchState(newState);
        if (accessFilter !== 'PRIVATE') setShowLoginPrompt(false);
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

    const handleEditSet = async (setId: string) => {
        try {
            const fullSet = await fetchFlashcardSetById(setId);
            setEditingSet(fullSet);
            setIsCreatePanelOpen(true);
        } catch (err) {
            console.error("Failed to fetch full set for editing:", err);
        }
    };

    const handleShareSet = (set: FlashcardSet) => {
        setShareTarget({ id: set.id, title: set.title });
    };

    const handleSaveContent = async (data: any) => {
        try {
            if (editingSet) {
                // Update
                await updateFlashcardSet(editingSet.id, {
                    title: data.title,
                    description: data.description,
                    visibility: data.visibility,
                    cards: data.items?.map((item: any) => ({
                        front: item.front || item.term || item.kanji || "",
                        back: item.back || item.definition || item.meaning || "",
                        reading: item.reading || item.hiragana || "",
                        mnemonic: item.mnemonic || ""
                    }))
                });
            } else {
                // Create
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
            }
            await loadSets();
            setIsCreatePanelOpen(false);
            setEditingSet(null);
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
                        <button
                            onClick={() => setIsRetrievalOpen(true)}
                            className="w-10 h-10 rounded-xl bg-neutral-white border border-neutral-gray/20 flex items-center justify-center text-neutral-ink hover:text-primary-strong hover:border-primary-strong transition-all"
                            title="Add by ID"
                        >
                            <Link2 size={20} />
                        </button>
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="w-10 h-10 rounded-xl bg-neutral-white border border-neutral-gray/20 flex items-center justify-center text-neutral-ink hover:text-primary-strong hover:border-primary-strong transition-all"
                            title="View History"
                        >
                            <History size={20} />
                        </button>
                        <CreateButton label="Create Set" onClick={() => { setEditingSet(null); handleCreateClick(); }} />
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
                                onClick={() => router.push(`/flashcards/study?deckId=${set.id}`)}
                                onEdit={user && user.id.toString() === set.userId ? () => handleEditSet(set.id) : undefined}
                                onShare={user && user.id.toString() === set.userId ? () => handleShareSet(set) : undefined}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-neutral-white border border-neutral-gray/20 rounded-[2rem]">
                        <p className="text-neutral-ink font-black uppercase tracking-widest">No sets found matching your parameters</p>
                    </div>
                )}

                {/* Personalization Gate */}
                {searchState.activeFilters.access?.[0] === 'PRIVATE' && !user && (
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
                onClose={() => { setIsCreatePanelOpen(false); setEditingSet(null); }}
                type="FLASHCARDS"
                onSave={handleSaveContent}
                initialData={editingSet}
            />

            <RetrievalModal
                isOpen={isRetrievalOpen}
                onClose={() => setIsRetrievalOpen(false)}
                type="FLASHCARD"
            />

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
            />

            <ShareModal
                isOpen={!!shareTarget}
                onClose={() => setShareTarget(null)}
                contentId={shareTarget?.id || ''}
                contentType="flashcard-deck"
                title={shareTarget?.title || ''}
            />
        </div>
    );
}
