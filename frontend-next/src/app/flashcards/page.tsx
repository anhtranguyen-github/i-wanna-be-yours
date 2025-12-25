"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Layers, Search, BookOpen, User as UserIcon, Brain, Compass, Loader2 } from "lucide-react";
import { getPersonalDecks, DeckDefinition, getTagsByType, getTagById, searchDecks } from "./decks-data";
import { fetchAllDecks } from "@/services/deckService";
import { SearchNexus } from "@/components/shared/SearchNexus";
import { SearchNexusState } from "@/types/search";
import { InformativeLoginCard } from "@/components/shared/InformativeLoginCard";

export default function FlashcardsMenu() {
    const { user } = useUser();
    const [publicDecks, setPublicDecks] = useState<DeckDefinition[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchState, setSearchState] = useState<SearchNexusState>({
        query: "",
        activeFilters: {},
        activeTab: 'PUBLIC'
    });
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchAllDecks().then(decks => {
            const mappedDecks: DeckDefinition[] = decks.map(d => ({
                id: d._id,
                title: d.title,
                description: d.description || "",
                tags: d.tags,
                actionLink: `/flashcards/details?id=${d._id}`
            }));
            setPublicDecks(mappedDecks);
            setLoading(false);
        }).catch(err => { console.error("Failed to load decks", err); setLoading(false); });
    }, []);

    const personalDecks = useMemo(() => getPersonalDecks(), []);
    const currentList = searchState.activeTab === 'PUBLIC' ? publicDecks : personalDecks;

    const filteredDecks = useMemo(() => {
        let result = currentList;

        // Filter by specific types
        const selectedTagIds = Object.values(searchState.activeFilters).flat();
        if (selectedTagIds.length > 0) {
            result = result.filter(deck =>
                selectedTagIds.some(tagId => deck.tags.includes(tagId))
            );
        }

        // Search by query
        if (searchState.query.trim()) {
            result = searchDecks(result, searchState.query);
        }

        return result;
    }, [currentList, searchState]);

    const filterGroups = useMemo(() => [
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
        setSearchState(newState);
        if (newState.activeTab === 'PUBLIC') setShowLoginPrompt(false);
    };

    return (
        <div className="min-h-screen bg-secondary pb-24">
            {/* Header */}
            <header className="bg-neutral-white/80 backdrop-blur-md border-b border-neutral-gray/20 px-6 py-12 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                            <Brain size={32} className="text-primary-strong" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-neutral-ink font-display tracking-tight">Flashcards</h1>
                            <p className="text-neutral-ink/50 font-bold uppercase tracking-widest text-[10px] mt-1">Spaced Repetition Mastery</p>
                        </div>
                    </div>

                    <SearchNexus
                        placeholder="Search for kanji, grammar, or vocabulary decks..."
                        groups={filterGroups}
                        state={searchState}
                        onChange={handleSearchChange}
                        onPersonalTabAttempt={() => setShowLoginPrompt(true)}
                        isLoggedIn={!!user}
                    />
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                {showLoginPrompt ? (
                    <div className="py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <InformativeLoginCard
                            title="Your Personal Study Vault"
                            description="Unlock a sanctuary for your Japanese journey. Save decks, track your SRS mastery, and sync status across all your devices."
                            icon={Layers}
                            benefits={[
                                "Spaced Repetition tracking (SRS)",
                                "Custom card creation & editing",
                                "Mastery heatmaps & statistics",
                                "Cross-device synchronization"
                            ]}
                            flowType="FLASHCARDS"
                        />
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 animate-spin text-primary-strong opacity-20" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Brain size={24} className="text-primary-strong animate-pulse" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink/30 mt-8">Synthesizing Decks...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredDecks.length > 0 ? (
                            filteredDecks.map((deck) => <DeckCard key={deck.id} deck={deck} />)
                        ) : (
                            <div className="col-span-full py-40 text-center bg-neutral-white/50 rounded-[3rem] border border-dashed border-neutral-gray/20">
                                <div className="w-20 h-20 bg-neutral-beige/50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                    <Search size={32} className="text-neutral-ink/20" />
                                </div>
                                <h3 className="text-xl font-black text-neutral-ink mb-2">No matching decks found</h3>
                                <p className="text-neutral-ink/40 font-bold mb-8">Try adjusting your cognitive parameters.</p>
                                <button
                                    onClick={() => setSearchState({ ...searchState, query: "", activeFilters: {} })}
                                    className="text-xs font-black text-primary-strong uppercase tracking-widest hover:underline"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function DeckCard({ deck }: { deck: DeckDefinition }) {
    let Icon = BookOpen;
    let colorClass = "bg-primary/10 text-primary";

    if (deck.tags.includes('kanji')) { colorClass = "bg-red-50 text-red-600"; }
    else if (deck.tags.includes('grammar')) { Icon = Layers; colorClass = "bg-secondary text-secondary-foreground"; }
    else if (deck.tags.includes('personal')) { Icon = UserIcon; colorClass = "bg-muted text-foreground"; }

    const levelTag = deck.tags.find(t => ['n1', 'n2', 'n3', 'n4', 'n5'].includes(t));
    const tagInfo = levelTag ? getTagById(levelTag) : null;

    return (
        <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-colors flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <Icon size={22} />
                </div>
                {tagInfo && <span className="text-xs font-bold text-muted-foreground">{tagInfo.label}</span>}
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2">{deck.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-grow line-clamp-2">{deck.description}</p>

            {deck.actionLink ? (
                <Link href={deck.actionLink} className="block w-full text-center py-4 bg-primary-strong text-white rounded-2xl font-black text-[10px] uppercase tracking-widest font-display hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95">
                    Open Deck
                </Link>
            ) : deck.component ? (
                <div className="w-full">{deck.component}</div>
            ) : null}
        </div>
    );
}
