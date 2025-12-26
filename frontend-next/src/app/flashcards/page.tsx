"use client";

import React, { useState, useMemo } from 'react';
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
import { CreateButton, InformativeLoginCard, PageHeader, ViewModeToggle, CreateContentPanel } from '@/components/shared';
import type { ViewMode } from '@/components/shared';
import {
    getPublicDecks,
    getPersonalDecks,
    searchDecks,
    getTagsByType
} from './decks-data';
import { createDeck } from '@/services/deckService';

interface FlashcardDeckCardProps {
    deck: any;
    viewMode: ViewMode;
}

function FlashcardDeckCard({ deck, viewMode }: FlashcardDeckCardProps) {
    if (viewMode === 'LIST') {
        return (
            <div className="bg-neutral-white border border-neutral-gray/20 rounded-2xl p-4 flex items-center justify-between group hover:border-primary-strong transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-neutral-beige/50 rounded-xl flex items-center justify-center text-neutral-ink group-hover:bg-primary-strong group-hover:text-white transition-all">
                        <Layers size={24} />
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
                <div className="flex items-center gap-8">
                    <div className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40 flex items-center gap-2">
                        <Layers size={14} className="text-primary-strong" />
                        {deck.cardCount || 0} Cards
                    </div>
                    <ArrowRight size={20} className="text-neutral-ink/40 group-hover:text-primary-strong group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        );
    }

    return (
        <div key={deck.id} className="bg-neutral-white border border-neutral-gray/20 rounded-[2rem] p-8 hover:border-primary-strong transition-all group relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

            <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-neutral-beige/50 rounded-2xl flex items-center justify-center text-neutral-ink group-hover:bg-primary-strong group-hover:text-white transition-all">
                    <Layers size={28} />
                </div>
                <button className="p-2 text-neutral-ink/40 hover:text-neutral-ink transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>

            <h3 className="text-2xl font-black text-neutral-ink font-display mb-3 group-hover:text-primary-strong transition-colors">{deck.title}</h3>
            <p className="text-sm font-bold text-neutral-ink mb-8 line-clamp-2 opacity-80 flex-grow leading-relaxed">{deck.description}</p>

            <div className="flex items-center justify-between mt-auto pt-6 border-t border-neutral-gray/10">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-neutral-ink/60">
                    <span className="flex items-center gap-2">
                        <Layers size={14} className="text-primary-strong" />
                        {deck.cardCount || 0} Cards
                    </span>
                </div>
                <ArrowRight size={20} className="text-neutral-ink group-hover:translate-x-2 transition-transform" />
            </div>
        </div>
    );
}

export default function FlashcardsMenu() {
    const { user } = useUser();

    // We use useMemo to avoid regenerating the lists on every render
    const publicList = useMemo(() => getPublicDecks(user?.id ? String(user.id) : null), [user]);
    const personalList = useMemo(() => getPersonalDecks(), []);

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

    const [decks, setDecks] = useState<any[]>([]);

    useEffect(() => {
        const list = searchState.activeTab === 'PUBLIC' ? publicList : personalList;
        const mapped = list.map(d => ({ ...d, isPersonal: searchState.activeTab === 'PERSONAL' }));
        setDecks(mapped);
    }, [searchState.activeTab, publicList, personalList]);

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
                tags: ['personal', 'flashcards']
            });
            // In a real app we'd refresh the list here, 
            // but since we are using local dummy data mostly, 
            // we'll just log success.
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
                <div className="flex items-center gap-3 mb-8">
                    <Layers size={18} className="text-primary-strong" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/60">
                        Cognitive Vaults ({filteredDecks.length})
                    </h2>
                </div>

                {filteredDecks.length > 0 ? (
                    <div className={viewMode === 'GRID'
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "flex flex-col gap-4"
                    }>
                        {filteredDecks.map((deck) => (
                            <FlashcardDeckCard key={deck.id} deck={deck} viewMode={viewMode} />
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
