"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Layers, Search, BookOpen, User as UserIcon, Filter, Brain, Compass, Loader2 } from "lucide-react";
import { getPersonalDecks, DeckDefinition, getTagsByType, getTagById, searchDecks } from "./decks-data";
import { LoginPromptCard } from "@/components/auth";
import { fetchAllDecks } from "@/services/deckService";

export default function FlashcardsMenu() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'public' | 'personal'>('public');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showAllFilters, setShowAllFilters] = useState(false);
    const [publicDecks, setPublicDecks] = useState<DeckDefinition[]>([]);
    const [loading, setLoading] = useState(false);

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
    const currentList = activeTab === 'public' ? publicDecks : personalDecks;

    const filteredDecks = useMemo(() => {
        let result = currentList;
        if (selectedTags.length > 0) result = result.filter(deck => selectedTags.some(tagId => deck.tags.includes(tagId)));
        if (searchTerm.trim()) result = searchDecks(result, searchTerm);
        return result;
    }, [currentList, selectedTags, searchTerm]);

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
    };

    const clearFilters = () => { setSelectedTags([]); setSearchTerm(""); };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-8 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                                <Brain size={24} className="text-secondary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground font-display">Flashcards</h1>
                                <p className="text-sm text-muted-foreground">Spaced repetition for mastery</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-muted rounded-xl">
                            <button onClick={() => { setActiveTab('public'); clearFilters(); }} className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'public' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                Public Library
                            </button>
                            <button onClick={() => { setActiveTab('personal'); clearFilters(); }} className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'personal' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                My Collection
                            </button>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder="Search decks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-muted rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <button
                            onClick={() => setShowAllFilters(!showAllFilters)}
                            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${showAllFilters || selectedTags.length > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                        >
                            <Filter size={16} />
                            Filter
                            {selectedTags.length > 0 && <span className="w-5 h-5 bg-background/20 rounded-full flex items-center justify-center text-xs">{selectedTags.length}</span>}
                        </button>
                    </div>

                    {/* Filter Panel */}
                    {showAllFilters && activeTab === 'public' && (
                        <div className="mt-6 bg-muted rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FilterSection label="Categories" tags={getTagsByType('category').filter(t => t.id !== 'personal')} selected={selectedTags} toggle={toggleTag} />
                            <FilterSection label="JLPT Level" tags={getTagsByType('level')} selected={selectedTags} toggle={toggleTag} />
                            <FilterSection label="Skill" tags={getTagsByType('skill')} selected={selectedTags} toggle={toggleTag} />
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {activeTab === 'personal' && !user && (
                    <div className="py-12">
                        <LoginPromptCard title="Sign in for Personal Decks" message="Create an account to build and manage your own flashcard decks." icon={<UserIcon size={40} className="text-muted-foreground" />} />
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading decks...</p>
                    </div>
                ) : (activeTab === 'public' || (activeTab === 'personal' && user)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDecks.length > 0 ? (
                            filteredDecks.map((deck) => <DeckCard key={deck.id} deck={deck} />)
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Compass size={32} className="text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2">No decks found</h3>
                                <button onClick={clearFilters} className="text-sm text-primary hover:underline font-bold">Clear filters</button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function FilterSection({ label, tags, selected, toggle }: any) {
    return (
        <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">{label}</h4>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag: any) => (
                    <button key={tag.id} onClick={() => toggle(tag.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selected.includes(tag.id) ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border hover:text-foreground'}`}>
                        {tag.label}
                    </button>
                ))}
            </div>
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
                <Link href={deck.actionLink} className="block w-full text-center py-3 bg-foreground text-background rounded-xl font-bold text-sm hover:bg-foreground/90 transition-colors">
                    Open Deck
                </Link>
            ) : deck.component ? (
                <div className="w-full">{deck.component}</div>
            ) : null}
        </div>
    );
}
