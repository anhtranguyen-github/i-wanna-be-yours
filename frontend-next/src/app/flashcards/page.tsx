"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import {
    Layers,
    Search,
    BookOpen,
    User as UserIcon,
    Filter,
    Play,
    Settings,
    Inbox,
    X,
    Tag as TagIcon
} from "lucide-react";
import {
    getPersonalDecks,
    DeckDefinition,
    Tag,
    ALL_TAGS,
    getTagsByType,
    getTagById,
    searchDecks
} from "./decks-data";
import { LoginPromptCard } from "@/components/auth";
import { fetchAllDecks } from "@/services/deckService";
import { Deck } from "@/types/decks";

// Tag color mapping for visual distinction
const TAG_COLORS: Record<string, { bg: string; text: string; activeBg: string }> = {
    // Categories
    kanji: { bg: 'bg-rose-50', text: 'text-rose-600', activeBg: 'bg-rose-500' },
    vocabulary: { bg: 'bg-emerald-50', text: 'text-emerald-600', activeBg: 'bg-emerald-500' },
    grammar: { bg: 'bg-sky-50', text: 'text-sky-600', activeBg: 'bg-sky-500' },
    personal: { bg: 'bg-violet-50', text: 'text-violet-600', activeBg: 'bg-violet-500' },
    // Levels
    n5: { bg: 'bg-green-50', text: 'text-green-600', activeBg: 'bg-green-500' },
    n4: { bg: 'bg-lime-50', text: 'text-lime-600', activeBg: 'bg-lime-500' },
    n3: { bg: 'bg-yellow-50', text: 'text-yellow-600', activeBg: 'bg-yellow-500' },
    n2: { bg: 'bg-orange-50', text: 'text-orange-600', activeBg: 'bg-orange-500' },
    n1: { bg: 'bg-red-50', text: 'text-red-600', activeBg: 'bg-red-500' },
    // Skills
    beginner: { bg: 'bg-teal-50', text: 'text-teal-600', activeBg: 'bg-teal-500' },
    intermediate: { bg: 'bg-amber-50', text: 'text-amber-600', activeBg: 'bg-amber-500' },
    advanced: { bg: 'bg-red-50', text: 'text-red-600', activeBg: 'bg-red-500' },
    // Sources
    essential: { bg: 'bg-indigo-50', text: 'text-indigo-600', activeBg: 'bg-indigo-500' },
    'suru-verbs': { bg: 'bg-purple-50', text: 'text-purple-600', activeBg: 'bg-purple-500' },
    'sentence-mining': { bg: 'bg-pink-50', text: 'text-pink-600', activeBg: 'bg-pink-500' },
    verbs: { bg: 'bg-cyan-50', text: 'text-cyan-600', activeBg: 'bg-cyan-500' },
};

const getTagColor = (tagId: string, isActive: boolean) => {
    const colors = TAG_COLORS[tagId] || { bg: 'bg-slate-50', text: 'text-slate-600', activeBg: 'bg-slate-500' };
    return isActive
        ? `${colors.activeBg} text-white`
        : `${colors.bg} ${colors.text} hover:${colors.activeBg}/20`;
};

export default function FlashcardsMenu() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'public' | 'personal'>('public');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showAllFilters, setShowAllFilters] = useState(false);

    // Fetch Data
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
                actionLink: `/flashcards/details?id=${d._id}` // Link to detail page
            }));
            setPublicDecks(mappedDecks);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load decks", err);
            setLoading(false);
        });
    }, []);

    const personalDecks = useMemo(() => getPersonalDecks(), []);

    // Determine current list based on tab
    const currentList = activeTab === 'public' ? publicDecks : personalDecks;

    // Get category tags for quick filters
    const categoryTags = useMemo(() => getTagsByType('category').filter(t => t.id !== 'personal'), []);
    const levelTags = useMemo(() => getTagsByType('level'), []);
    const skillTags = useMemo(() => getTagsByType('skill'), []);
    const sourceTags = useMemo(() => getTagsByType('source'), []);

    // Filter Logic
    const filteredDecks = useMemo(() => {
        let result = currentList;

        // Filter by selected tags (match ANY)
        if (selectedTags.length > 0) {
            result = result.filter(deck =>
                selectedTags.some(tagId => deck.tags.includes(tagId))
            );
        }

        // Filter by search
        if (searchTerm.trim()) {
            result = searchDecks(result, searchTerm);
        }

        return result;
    }, [currentList, selectedTags, searchTerm]);

    // Toggle tag selection
    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedTags([]);
        setSearchTerm("");
    };

    return (
        <div className="min-h-screen bg-brand-cream text-brand-dark pb-20">
            {/* Header / Nav */}
            <div className="bg-white shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-white shadow-md">
                                <BookOpen size={24} />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-brand-dark">Flashcards</h1>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto">
                            <button
                                onClick={() => { setActiveTab('public'); clearFilters(); }}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'public' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-500 hover:text-brand-dark'}`}
                            >
                                Public Library
                            </button>
                            <button
                                onClick={() => { setActiveTab('personal'); clearFilters(); }}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-500 hover:text-brand-dark'}`}
                            >
                                My Collection
                            </button>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="py-4 border-t border-slate-100 space-y-4">
                        {/* Search Bar */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name, description, or tag..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setShowAllFilters(!showAllFilters)}
                                className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 ${showAllFilters || selectedTags.length > 0
                                    ? 'bg-brand-dark text-white border-brand-dark'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-dark/30'
                                    }`}
                            >
                                <Filter size={18} />
                                <span className="hidden sm:inline font-bold text-sm">Filters</span>
                                {selectedTags.length > 0 && (
                                    <span className="bg-white/20 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                        {selectedTags.length}
                                    </span>
                                )}
                            </button>
                        </div>



                        {/* Expanded Filters Panel */}
                        {showAllFilters && activeTab === 'public' && (
                            <div className="bg-slate-50 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Active Tags */}
                                {selectedTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-200">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider self-center mr-2">
                                            Active:
                                        </span>
                                        {selectedTags.map(tagId => {
                                            const tag = getTagById(tagId);
                                            return tag ? (
                                                <button
                                                    key={tagId}
                                                    onClick={() => toggleTag(tagId)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${getTagColor(tagId, true)}`}
                                                >
                                                    {tag.label}
                                                    <X size={12} />
                                                </button>
                                            ) : null;
                                        })}
                                        <button
                                            onClick={clearFilters}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                )}

                                {/* Category Tags (Moved from Quick Filters) */}
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                        Category
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {categoryTags.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => toggleTag(tag.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTags.includes(tag.id)
                                                    ? getTagColor(tag.id, true)
                                                    : getTagColor(tag.id, false)
                                                    }`}
                                            >
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Level Tags */}
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                        JLPT Level
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {levelTags.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => toggleTag(tag.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTags.includes(tag.id)
                                                    ? getTagColor(tag.id, true)
                                                    : getTagColor(tag.id, false)
                                                    }`}
                                            >
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Skill Tags */}
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                        Skill Level
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {skillTags.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => toggleTag(tag.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTags.includes(tag.id)
                                                    ? getTagColor(tag.id, true)
                                                    : getTagColor(tag.id, false)
                                                    }`}
                                            >
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Source Tags */}
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                        Content Type
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {sourceTags.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => toggleTag(tag.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTags.includes(tag.id)
                                                    ? getTagColor(tag.id, true)
                                                    : getTagColor(tag.id, false)
                                                    }`}
                                            >
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {activeTab === 'personal' && !user && (
                    <div className="py-8">
                        <LoginPromptCard
                            title="Personal Collection"
                            message="Log in to view your collection, create custom decks, and track your progress."
                            icon={<UserIcon size={36} className="text-brand-salmon" />}
                        />
                    </div>
                )}

                {loading && (
                    <div className="py-12 text-center text-slate-400">
                        Loading decks...
                    </div>
                )}

                {!loading && (activeTab === 'public' || (activeTab === 'personal' && user)) && (
                    <>
                        {/* Results count */}
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Showing <span className="font-bold text-brand-dark">{filteredDecks.length}</span> decks
                                {selectedTags.length > 0 && (
                                    <span> matching your filters</span>
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredDecks.length > 0 ? (
                                filteredDecks.map((deck) => (
                                    <DeckCard key={deck.id} deck={deck} onTagClick={toggleTag} selectedTags={selectedTags} />
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-slate-400">
                                    <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="mb-4">No decks found matching your filters.</p>
                                    <button
                                        onClick={clearFilters}
                                        className="text-brand-green font-bold hover:underline"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

interface DeckCardProps {
    deck: DeckDefinition;
    onTagClick: (tagId: string) => void;
    selectedTags: string[];
}

function DeckCard({ deck, onTagClick, selectedTags }: DeckCardProps) {
    // Determine icon and colors based on type
    let Icon = BookOpen;
    // Default to 'brand-green' theme equivalent
    let iconBg = "bg-emerald-100 text-emerald-600";
    let buttonClass = "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200";

    if (deck.tags.includes('kanji')) {
        iconBg = "bg-rose-100 text-rose-600";
        buttonClass = "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200";
    } else if (deck.tags.includes('grammar')) {
        Icon = Layers;
        iconBg = "bg-sky-100 text-sky-600";
        buttonClass = "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-200";
    } else if (deck.tags.includes('personal')) {
        Icon = UserIcon;
        if (deck.id === 'personal-study') Icon = Play;
        if (deck.id === 'personal-inbox') Icon = Inbox;

        iconBg = "bg-violet-100 text-violet-600";
        buttonClass = "bg-violet-500 hover:bg-violet-600 text-white shadow-md shadow-violet-200";
    }

    // Filter tags for the footer row (exclude structural tags)
    const displayTags = deck.tags
        .filter(t => !['kanji', 'vocabulary', 'grammar', 'personal'].includes(t))
        .slice(0, 4);

    return (
        <div className="bg-white rounded-2xl p-0 shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col h-full group overflow-hidden relative">

            {/* 1. Header Section */}
            <div className="p-6 pb-2">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} mb-2`}>
                        <Icon size={24} />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">
                    {deck.title}
                </h3>
            </div>

            {/* 2. Body Section */}
            <div className="px-6 flex-grow flex flex-col">
                <p className="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-3">
                    {deck.description}
                </p>

                {/* Metadata / Tags */}
                <div className="mt-auto pt-4 border-t border-slate-50 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {/* Always show category tag first if present */}
                        {deck.tags.includes('vocabulary') && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Vocabulary</span>}
                        {deck.tags.includes('kanji') && <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">Kanji</span>}

                        {displayTags.map(tagId => {
                            const tag = getTagById(tagId);
                            if (!tag) return null;
                            return (
                                <span key={tagId} className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                    {tag.label}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Action Section */}
            <div className="p-4 bg-slate-50/50 mt-auto">
                {deck.actionLink ? (
                    <div className="space-y-3">
                        <Link
                            href={deck.actionLink}
                            className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all transform active:scale-95 ${buttonClass}`}
                        >
                            OPEN FLASHCARD
                        </Link>
                        <div className="flex justify-center gap-4 text-xs font-medium text-slate-400">
                            <button className="hover:text-slate-600 transition-colors">View Details</button>
                            <span>·</span>
                            <button className="hover:text-slate-600 transition-colors">Edit Settings</button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        {deck.component}
                    </div>
                )}
            </div>
        </div>
    );
}
