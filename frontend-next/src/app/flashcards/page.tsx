"use client";

import React, { useState } from "react";
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
    Inbox
} from "lucide-react";
import { getPublicDecks, getPersonalDecks, DeckDefinition } from "./decks-data";

export default function FlashcardsMenu() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'public' | 'personal'>('public');
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    // Fetch Data
    const publicDecks = getPublicDecks(user?.id ? String(user.id) : null);
    const personalDecks = getPersonalDecks();

    // Determine current list based on tab
    const currentList = activeTab === 'public' ? publicDecks : personalDecks;

    // Filter Logic
    const filteredDecks = currentList.filter(deck => {
        const matchesSearch = deck.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deck.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || deck.category === filterCategory;

        return matchesSearch && matchesCategory;
    });

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
                                onClick={() => setActiveTab('public')}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'public' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-500 hover:text-brand-dark'}`}
                            >
                                Public Library
                            </button>
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-500 hover:text-brand-dark'}`}
                            >
                                My Collection
                            </button>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="py-4 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search decks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                            />
                        </div>

                        {activeTab === 'public' && (
                            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'kanji', label: 'Kanji' },
                                    { id: 'vocabulary', label: 'Vocabulary' },
                                    { id: 'grammar', label: 'Grammar' }
                                ].map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFilterCategory(cat.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap border transition-all ${filterCategory === cat.id
                                            ? 'bg-brand-dark text-white border-brand-dark'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-brand-dark/30'}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {activeTab === 'personal' && !user && (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <UserIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h2 className="text-2xl font-bold text-brand-dark mb-2">Log in to view your collection</h2>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">Create your own decks, track your progress, and clone public decks to your personal library.</p>
                        <Link href="/login" className="inline-block px-8 py-3 bg-brand-green text-white font-bold rounded-xl shadow-clay-img hover:bg-brand-green/90 transition-all">
                            Log In
                        </Link>
                    </div>
                )}

                {(activeTab === 'public' || (activeTab === 'personal' && user)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDecks.length > 0 ? (
                            filteredDecks.map((deck) => (
                                <DeckCard key={deck.id} deck={deck} />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-slate-400">
                                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No decks found matching your filters.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function DeckCard({ deck }: { deck: DeckDefinition }) {
    // Determine icon based on category or specific ID
    let Icon = BookOpen;
    let colorClass = "text-slate-500 bg-slate-100";

    if (deck.category === 'kanji') {
        Icon = BookOpen; // Specific icon if available
        colorClass = "text-brand-salmon bg-red-50";
    } else if (deck.category === 'vocabulary') {
        Icon = BookOpen;
        colorClass = "text-brand-green bg-green-50";
    } else if (deck.category === 'grammar') {
        Icon = Layers; // Placeholder
        colorClass = "text-brand-blue bg-blue-50";
    } else if (deck.category === 'personal') {
        if (deck.id === 'personal-study') {
            Icon = Play;
            colorClass = "text-white bg-brand-green shadow-clay-img";
        } else if (deck.id === 'personal-inbox') {
            Icon = Inbox;
            colorClass = "text-brand-peach bg-orange-50";
        } else {
            Icon = Settings;
            colorClass = "text-slate-700 bg-slate-100";
        }
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-slate-100 transition-all duration-200 flex flex-col h-full group">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <Icon size={24} />
                </div>
                {deck.level && (
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wider">
                        {deck.level}
                    </span>
                )}
            </div>

            <h3 className="text-lg font-bold text-brand-dark mb-2 group-hover:text-brand-green transition-colors line-clamp-2">
                {deck.title}
            </h3>
            <p className="text-sm text-slate-500 mb-6 flex-grow line-clamp-3">
                {deck.description}
            </p>

            <div className="mt-auto">
                {deck.actionLink ? (
                    <Link
                        href={deck.actionLink}
                        className="block w-full text-center py-2.5 rounded-xl font-bold text-sm bg-slate-50 hover:bg-slate-100 text-brand-dark transition-colors"
                    >
                        Open Deck
                    </Link>
                ) : (
                    <div className="w-full">
                        {deck.component}
                    </div>
                )}
            </div>
        </div>
    );
}
