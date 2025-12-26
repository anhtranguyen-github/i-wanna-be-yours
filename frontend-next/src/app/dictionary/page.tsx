'use client';

import React, { useState, useEffect } from 'react';
import { Search, BookOpen, X, Sparkles, Book, ArrowRight, Volume2, ChevronDown, Loader2 } from 'lucide-react';
import { dictionaryService, DictionaryEntry, ExampleSentence } from '@/services/dictionaryService';
import { TabNavigator, DictionaryTab } from '@/components/dictionary/TabNavigator';

import { SearchNexus } from "@/components/shared/SearchNexus";
import { SearchNexusState, FilterGroup } from "@/types/search";
import { InformativeLoginCard } from "@/components/shared/InformativeLoginCard";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";

export default function DictionaryPage() {
    const { user } = useUser();
    const [searchState, setSearchState] = useState<SearchNexusState>({
        query: "",
        activeFilters: {
            mode: ['JP-EN']
        },
        activeTab: 'PUBLIC'
    });
    const [activeTab, setActiveTab] = useState<DictionaryTab>('vocab');
    const [isLoading, setIsLoading] = useState(false);
    const [parseResult, setParseResult] = useState<any>(null);
    const [selectedVocabId, setSelectedVocabId] = useState<string | null>(null);
    const [selectedKanjiId, setSelectedKanjiId] = useState<string | null>(null);
    const [vocabDetails, setVocabDetails] = useState<DictionaryEntry | null>(null);
    const [kanjiDetails, setDictionaryKanjiDetails] = useState<DictionaryEntry | null>(null);
    const [associatedExamples, setAssociatedExamples] = useState<ExampleSentence[]>([]);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    useEffect(() => {
        if (!searchState.query.trim()) { setParseResult(null); return; }
        const debounce = setTimeout(async () => {
            setIsLoading(true);
            try {
                const result = await dictionaryService.search(searchState.query);
                setParseResult(result);
                if (result.tokens.length > 0) setSelectedVocabId(result.tokens[0].id);
                if (result.kanji.length > 0) setSelectedKanjiId(result.kanji[0].id);
                if (result.sentences) setAssociatedExamples(result.sentences);
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        }, 600);
        return () => clearTimeout(debounce);
    }, [searchState.query, searchState.activeFilters.mode]);

    useEffect(() => {
        const fetchVocab = async () => {
            if (!selectedVocabId || !parseResult) return;
            const token = parseResult.tokens.find((t: any) => t.id === selectedVocabId);
            if (token) {
                const details = await dictionaryService.getVocabDetails(token.head);
                setVocabDetails(details || token);
                const exs = await dictionaryService.getExamples(token.head);
                if (exs && exs.length > 0) setAssociatedExamples(exs);
            }
        };
        fetchVocab();
    }, [selectedVocabId, parseResult]);

    useEffect(() => {
        const fetchKanji = async () => {
            if (!selectedKanjiId || !parseResult) return;
            const k = parseResult.kanji.find((t: any) => t.id === selectedKanjiId);
            if (k) {
                const details = await dictionaryService.getKanjiDetails(k.head);
                setDictionaryKanjiDetails(details || k);
            }
        };
        fetchKanji();
    }, [selectedKanjiId, parseResult]);

    const filterGroups: FilterGroup[] = [
        {
            id: 'mode',
            label: 'Search Vector',
            type: 'SINGLE',
            options: [
                { id: 'JP-EN', label: 'Japanese → English' },
                { id: 'EN-JP', label: 'English → Japanese' }
            ]
        }
    ];

    const handleSearchChange = (newState: SearchNexusState) => {
        setSearchState(newState);
        if (newState.activeTab === 'PUBLIC') setShowLoginPrompt(false);
    };

    const renderDiscoveryHub = () => (
        <div className="max-w-6xl mx-auto py-12 px-8 space-y-12">
            {/* Visual Intro with Centered Search */}
            <header className="text-center space-y-8 py-10">
                <div className="space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6"
                    >
                        <BookOpen size={40} className="text-primary-strong" />
                    </motion.div>
                    <h2 className="text-6xl font-black text-neutral-ink font-display tracking-tight">The Discovery Hub</h2>
                    <p className="text-neutral-ink font-bold max-w-xl mx-auto leading-relaxed">
                        Uncover the hidden patterns of Japanese. Explore trending phrases, master the kanji of the day, and build your cognitive vault.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto pt-4">
                    <SearchNexus
                        placeholder="Search for words, kanji, or phrases..."
                        groups={[]}
                        state={searchState}
                        onChange={handleSearchChange}
                        onPersonalTabAttempt={() => setShowLoginPrompt(true)}
                        isLoggedIn={!!user}
                        variant="minimal"
                        showFilters={false}
                        showSwitches={false}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Module 1: Daily Kanji */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-1 bg-neutral-white border border-neutral-gray/20 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink mb-8">Kanji Reconnaissance</span>
                    <div className="text-9xl font-jp text-neutral-ink mb-8 group-hover:scale-110 transition-transform cursor-default">
                        花
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-neutral-ink mb-1">Flower</h4>
                        <p className="text-sm font-black text-neutral-ink">Onyomi: カ (ka)</p>
                        <p className="text-sm font-black text-neutral-ink">Kunyomi: はな (hana)</p>
                    </div>
                </motion.div>

                {/* Module 2: Trending & Phrases */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 space-y-8"
                >
                    <div className="bg-neutral-white p-10 rounded-[2rem] border border-neutral-gray/20 space-y-8">
                        <div className="flex items-center justify-between border-b border-neutral-gray/10 pb-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink">Trending Synapses</h4>
                            <Sparkles size={16} className="text-secondary" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { ja: 'よろしくお願いします', en: 'Pleased to meet you', tag: 'Social' },
                                { ja: 'お疲れ様でした', en: 'Good work today', tag: 'Work' },
                                { ja: '失礼します', en: 'Excuse me', tag: 'Etiquette' },
                                { ja: 'いただきます', en: 'Let\'s eat', tag: 'CULTURE' }
                            ].map((phrase, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSearchState({ ...searchState, query: phrase.ja })}
                                    className="p-6 bg-neutral-beige/30 rounded-2xl border border-neutral-gray/10 text-left hover:bg-white hover: hover:border-primary-strong/30 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xl font-bold text-neutral-ink group-hover:text-primary-strong transition-colors">{phrase.ja}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-ink">{phrase.tag}</span>
                                    </div>
                                    <p className="text-sm text-neutral-ink font-black">{phrase.en}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary-strong to-primary p-10 rounded-[2.5rem] text-white  shadow-primary/20 flex items-center justify-between">
                        <div className="space-y-2">
                            <h4 className="text-2xl font-black font-display tracking-tight">Active Learning Stats</h4>
                            <p className="text-white/70 font-bold text-sm">Join 12,540 researchers exploring the nexus today.</p>
                        </div>
                        <div className="hidden md:block">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-full border-4 border-primary bg-neutral-beige " />
                                ))}
                                <div className="w-12 h-12 rounded-full border-4 border-primary bg-white text-primary flex items-center justify-center text-xs font-black">+</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );

    const renderSearchResults = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-40">
                    <Loader2 className="w-20 h-20 animate-spin text-primary-strong opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink mt-8">Synthesizing Search Data...</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col lg:flex-row gap-8 p-8 max-w-[1600px] mx-auto overflow-hidden h-[calc(100vh-250px)]">
                {/* Sidebar */}
                <div className="lg:w-[400px] flex-shrink-0 flex flex-col h-full bg-neutral-white rounded-[2rem] border border-neutral-gray/10 overflow-hidden">
                    <div className="p-8 border-b border-neutral-gray/10 bg-neutral-beige/20 flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-neutral-ink uppercase tracking-[0.3em]">
                            Foundational Matches
                        </h3>
                        <span className="px-3 py-1 bg-white border border-neutral-gray/10 rounded-full text-[9px] font-black text-neutral-ink">
                            {activeTab === 'vocab' ? parseResult?.tokens?.length || 0 : parseResult?.kanji?.length || 0} ITEMS
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {activeTab === 'vocab' && parseResult?.tokens?.map((token: any) => (
                            <button key={token.id} onClick={() => setSelectedVocabId(token.id)} className={`w-full text-left p-6 rounded-[2rem] transition-all duration-300 group overflow-hidden relative ${selectedVocabId === token.id ? 'bg-neutral-ink text-white   ' : 'bg-neutral-white text-neutral-ink border border-neutral-gray/10 hover:border-primary-strong/40'}`}>
                                <div className="font-jp text-2xl font-black mb-1">{token.head}</div>
                                <div className={`text-xs font-bold uppercase tracking-widest ${selectedVocabId === token.id ? 'text-white' : 'text-primary-strong'}`}>{token.reading}</div>
                                <div className={`text-sm mt-4 font-bold ${selectedVocabId === token.id ? 'text-white' : 'text-neutral-ink'} line-clamp-1`}>{token.meaning}</div>
                            </button>
                        ))}
                        {activeTab === 'kanji' && parseResult?.kanji?.map((k: any) => (
                            <button key={k.id} onClick={() => setSelectedKanjiId(k.id)} className={`w-full text-left p-6 rounded-[2rem] transition-all group overflow-hidden relative ${selectedKanjiId === k.id ? 'bg-neutral-ink text-white   ' : 'bg-neutral-white text-neutral-ink border border-neutral-gray/10 hover:border-primary-strong/40'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-4xl font-jp">{k.head}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedKanjiId === k.id ? 'text-white' : 'text-primary-strong'}`}>{k.reading}</span>
                                </div>
                                <div className={`text-sm font-bold ${selectedKanjiId === k.id ? 'text-white' : 'text-neutral-ink'}`}>{k.meaning}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-neutral-white rounded-[2rem] border border-neutral-gray/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                    <div className="h-full overflow-y-auto p-12 custom-scrollbar">
                        {activeTab === 'vocab' && vocabDetails && (
                            <div className="max-w-4xl mx-auto space-y-12">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-6">
                                            <h2 className="text-7xl font-black text-neutral-ink font-display tracking-tight leading-none">{vocabDetails.head}</h2>
                                            <button className="w-14 h-14 bg-neutral-beige/50 text-neutral-ink rounded-2xl flex items-center justify-center hover:bg-primary-strong hover:text-white transition-all ">
                                                <Volume2 size={24} />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="bg-primary/10 text-primary-strong px-5 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] ">
                                                {vocabDetails.reading}
                                            </div>
                                            {vocabDetails.tags && vocabDetails.tags.map((tag: string) => (
                                                <div key={tag} className="bg-neutral-beige/50 text-neutral-ink px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-neutral-gray/10">
                                                    {tag}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-secondary/10 border border-secondary/20 rounded-2xl px-6 py-4 flex items-center gap-3">
                                        <Sparkles size={18} className="text-secondary" />
                                        <span className="text-xs font-black uppercase tracking-widest text-secondary">Advanced Nexus Entry</span>
                                    </div>
                                </div>

                                <section className="space-y-6">
                                    <h4 className="text-[10px] font-black text-neutral-ink uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="w-8 h-[2px] bg-neutral-gray/20" />
                                        Primary Cognitive Meaning
                                    </h4>
                                    <p className="text-4xl font-black text-neutral-ink leading-tight">{vocabDetails.meaning}</p>
                                </section>

                                {associatedExamples.length > 0 && (
                                    <section className="space-y-8">
                                        <h4 className="text-[10px] font-black text-neutral-ink uppercase tracking-[0.3em] flex items-center gap-3">
                                            <div className="w-8 h-[2px] bg-neutral-gray/20" />
                                            Contextual Transmissions
                                        </h4>
                                        <div className="grid grid-cols-1 gap-6">
                                            {associatedExamples.slice(0, 5).map((ex, i) => (
                                                <div key={i} className="p-8 bg-neutral-beige/20 rounded-[2rem] border border-neutral-gray/10 space-y-2 hover:bg-white hover: transition-all border-l-4 border-l-primary-strong">
                                                    <p className="font-jp text-2xl font-black text-neutral-ink">{ex.ja}</p>
                                                    <p className="text-lg text-neutral-ink font-medium">{ex.en}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}

                        {activeTab === 'kanji' && kanjiDetails && (
                            <div className="max-w-4xl mx-auto space-y-12">
                                <div className="flex flex-col md:flex-row items-center gap-16">
                                    <div className="w-56 h-56 bg-neutral-ink text-white rounded-[2rem] flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                        <span className="text-9xl font-jp relative z-10">{kanjiDetails.head}</span>
                                    </div>
                                    <div className="flex-1 space-y-6 text-center md:text-left">
                                        <h4 className="text-[11px] font-black text-primary-strong uppercase tracking-[0.3em]">Kanji Core Insight</h4>
                                        <h2 className="text-6xl font-black text-neutral-ink font-display tracking-tight">{kanjiDetails.meaning}</h2>
                                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                            <div className="px-6 py-4 bg-neutral-beige/50 rounded-2xl border border-neutral-gray/10">
                                                <span className="block text-[8px] font-black uppercase text-neutral-ink mb-1">Strokes</span>
                                                <span className="text-xl font-black text-neutral-ink">{kanjiDetails.strokes || '12'}</span>
                                            </div>
                                            <div className="px-6 py-4 bg-neutral-beige/50 rounded-2xl border border-neutral-gray/10">
                                                <span className="block text-[8px] font-black uppercase text-neutral-ink mb-1">Grade</span>
                                                <span className="text-xl font-black text-neutral-ink">N3</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                                    <div className="p-8 bg-neutral-beige/30 rounded-[2rem] border border-neutral-gray/10 space-y-4">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary-strong">Onyomi (Chinese)</h5>
                                        <p className="text-3xl font-black text-primary-strong">{kanjiDetails.onyomi || 'N/A'}</p>
                                    </div>
                                    <div className="p-8 bg-neutral-beige/30 rounded-[2rem] border border-neutral-gray/10 space-y-4">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-secondary">Kunyomi (Native)</h5>
                                        <p className="text-3xl font-black text-secondary">{kanjiDetails.kunyomi || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!vocabDetails && !kanjiDetails && activeTab !== 'sentences' && (
                            <div className="h-full flex flex-col items-center justify-center py-20 bg-neutral-beige/10 rounded-[2rem] border-4 border-dashed border-neutral-gray/10">
                                <Search size={80} className="mb-8 text-neutral-ink" />
                                <h3 className="text-xl font-black text-neutral-ink uppercase tracking-widest">Select a Node to Decipher</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-neutral-beige/20">
            {/* Header Section (Conditional Visibility) */}
            <AnimatePresence>
                {(parseResult || isLoading || showLoginPrompt) && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="flex-shrink-0 bg-neutral-white border-b border-neutral-gray/20 px-6 py-8 space-y-10 relative z-[60]"
                    >
                        <div className="max-w-6xl mx-auto space-y-8">
                            <SearchNexus
                                placeholder="Search for words, kanji, or phrases..."
                                groups={filterGroups}
                                state={searchState}
                                onChange={handleSearchChange}
                                onPersonalTabAttempt={() => setShowLoginPrompt(true)}
                                isLoggedIn={!!user}
                                variant="minimal"
                                showSwitches={false}
                                showFilters={false}
                            />

                            <div className="flex items-center justify-center">
                                <TabNavigator activeTab={activeTab} onTabChange={setActiveTab} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto">
                {showLoginPrompt ? (
                    <div className="py-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <InformativeLoginCard
                            title="Your Personal Vocabulary Cloud"
                            description="Build a sanctuary for the words you discover. Save custom entries, track your learning journey, and sync your notebook across all dimensions."
                            icon={Book}
                            benefits={[
                                "Infinite vocabulary bookmarks",
                                "Personalized example sentence tracking",
                                "Custom study list generation",
                                "Spaced repetition (SRS) integration"
                            ]}
                            flowType="DICTIONARY"
                        />
                    </div>
                ) : !parseResult && !isLoading ? renderDiscoveryHub() : renderSearchResults()}
            </main>
        </div>
    );
}
