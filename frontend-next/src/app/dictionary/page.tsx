'use client';

import React, { useState, useEffect } from 'react';
import { Search, BookOpen, X, Sparkles, Book, ArrowRight, Volume2, Mic, PenTool, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { dictionaryService, DictionaryEntry, ExampleSentence } from '@/services/dictionaryService';
import { TabNavigator, DictionaryTab } from '@/components/dictionary/TabNavigator';
import { ItemSelector } from '@/components/dictionary/ItemSelector';
import { VocabCard, KanjiCard, GrammarCard, SentenceCard } from '@/components/dictionary/ResultCards';

export default function DictionaryPage() {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<DictionaryTab>('vocab');

    // Data State
    const [isLoading, setIsLoading] = useState(false);
    const [parseResult, setParseResult] = useState<any>(null);
    const [selectedVocabId, setSelectedVocabId] = useState<string | null>(null);
    const [selectedKanjiId, setSelectedKanjiId] = useState<string | null>(null);
    const [selectedGrammarId, setSelectedGrammarId] = useState<string | null>(null);

    // Resolved Details
    const [vocabDetails, setVocabDetails] = useState<DictionaryEntry | null>(null);
    const [kanjiDetails, setDictionaryKanjiDetails] = useState<DictionaryEntry | null>(null);
    const [grammarDetails, setGrammarDetails] = useState<DictionaryEntry | null>(null);
    const [associatedExamples, setAssociatedExamples] = useState<ExampleSentence[]>([]);

    useEffect(() => {
        if (!query.trim()) {
            setParseResult(null);
            return;
        }

        const debounce = setTimeout(async () => {
            setIsLoading(true);
            try {
                const result = await dictionaryService.search(query);
                setParseResult(result);

                // Auto-select first items
                if (result.tokens.length > 0) setSelectedVocabId(result.tokens[0].id);
                if (result.kanji.length > 0) setSelectedKanjiId(result.kanji[0].id);
                if (result.grammar.length > 0) setSelectedGrammarId(result.grammar[0].id);

                // Set sentences from unified search as initial example pool
                if (result.sentences) setAssociatedExamples(result.sentences);

            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }, 600);

        return () => clearTimeout(debounce);
    }, [query]);

    // Fetch details when selection changes
    useEffect(() => {
        const fetchVocab = async () => {
            if (!selectedVocabId || !parseResult) return;
            const token = parseResult.tokens.find((t: any) => t.id === selectedVocabId);
            if (token) {
                const details = await dictionaryService.getVocabDetails(token.head);
                setVocabDetails(details || token);

                // Only fetch specific examples if they weren't in the unified set or if we want refined ones
                // For now, if we have unified sentences, we use them, but we could fetch more
                const exs = await dictionaryService.getExamples(token.head);
                if (exs && exs.length > 0) {
                    setAssociatedExamples(exs);
                }
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

    useEffect(() => {
        const fetchGrammar = async () => {
            if (!selectedGrammarId || !parseResult) return;
            const g = parseResult.grammar.find((t: any) => t.id === selectedGrammarId);
            if (g) {
                const details = await dictionaryService.getGrammarDetails(g.head);
                setGrammarDetails(details || g);
            }
        };
        fetchGrammar();
    }, [selectedGrammarId, parseResult]);

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-3xl flex items-center justify-center mb-6">
                <Book size={40} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Japanese Dictionary & Tokenizer</h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Enter any Japanese word, character, or full sentence to instantly see its breakdown,
                readings, meanings, and grammatical structure.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
                {[
                    { title: 'Vocab Analysis', desc: 'Detailed readings and meanings for common words.', icon: Sparkles },
                    { title: 'Kanji Breakdown', desc: 'Identify every kanji character in your input.', icon: ArrowRight },
                ].map((item, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <item.icon size={20} className="text-brand-green mb-2" />
                        <h3 className="font-bold text-slate-800 mb-1">{item.title}</h3>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSearchResults = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mb-4"></div>
                    <p className="text-slate-400">Analyzing...</p>
                </div>
            );
        }

        // Two-column layout based on active tab
        return (
            <div className="flex gap-6 p-6 max-w-[1400px] mx-auto">
                {/* Left Sidebar: Navigation & Results List */}
                <div className="w-[300px] flex-shrink-0 space-y-6">
                    {/* Main Results Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                {activeTab === 'vocab' ? 'Search Results' :
                                    activeTab === 'kanji' ? 'Kanji List' :
                                        activeTab === 'grammar' ? 'Grammar Points' : 'Navigation'}
                            </h3>
                        </div>
                        <div className="p-2 space-y-1">
                            {activeTab === 'vocab' && parseResult?.tokens?.map((token: any) => (
                                <button
                                    key={token.id}
                                    onClick={() => setSelectedVocabId(token.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all ${selectedVocabId === token.id
                                        ? 'bg-brand-green/10 text-brand-dark font-bold border border-brand-green/20'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="text-lg">{token.head}</div>
                                    <div className="text-xs text-slate-400 font-normal">{token.reading}</div>
                                    <div className="text-xs text-slate-500 truncate">{token.meaning}</div>
                                </button>
                            ))}

                            {activeTab === 'kanji' && parseResult?.kanji?.map((k: any) => (
                                <button
                                    key={k.id}
                                    onClick={() => setSelectedKanjiId(k.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all ${selectedKanjiId === k.id
                                        ? 'bg-brand-blue/10 text-brand-dark font-bold border border-brand-blue/20'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl">{k.head}</span>
                                        <span className="text-xs text-slate-400">{k.reading}</span>
                                    </div>
                                    <div className="text-xs text-slate-500">{k.meaning}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Related Words Section (only for vocab) */}
                    {activeTab === 'vocab' && (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Related Words</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="text-slate-400 text-xs italic">Mock related words for {vocabDetails?.head}...</div>
                                <div className="space-y-2">
                                    <div className="p-2 hover:bg-slate-50 rounded text-sm text-slate-600 cursor-pointer">家族旅行 (Family trip)</div>
                                    <div className="p-2 hover:bg-slate-50 rounded text-sm text-slate-600 cursor-pointer">大家族 (Large family)</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Content Area: Detailed View */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
                    <div className="p-8">
                        {activeTab === 'vocab' && vocabDetails && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <h2 className="text-5xl font-bold text-slate-800">{vocabDetails.head}</h2>
                                            <button className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-brand-green/20 hover:text-brand-green transition-all">
                                                <Volume2 size={24} />
                                            </button>
                                        </div>
                                        <div className="text-xl text-slate-500 flex items-center gap-3">
                                            <span>{vocabDetails.reading}</span>
                                            {vocabDetails.tags && vocabDetails.tags.length > 0 && (
                                                <>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="text-brand-blue uppercase font-bold text-sm tracking-widest">{vocabDetails.tags[0]}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-slate-400 hover:text-slate-600"><Mic size={20} /></button>
                                        <button className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                                    </div>
                                </div>

                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-700 text-sm">
                                    <span className="font-bold mr-2">☆</span>
                                    {vocabDetails.grammarNote || "Common noun used in daily conversation."}
                                </div>

                                <section className="space-y-4">
                                    <h4 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-brand-blue rounded-full" />
                                        Definitions
                                    </h4>
                                    <div className="pl-4 border-l-2 border-slate-100 space-y-4">
                                        <div>
                                            <p className="text-lg text-slate-700 leading-relaxed font-bold">{vocabDetails.meaning}</p>
                                            <p className="text-slate-500 mt-1">Core general meaning of the word.</p>
                                        </div>
                                    </div>
                                </section>

                                {associatedExamples.length > 0 && (
                                    <section className="space-y-4">
                                        <h4 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-brand-blue rounded-full" />
                                            Example Sentences
                                        </h4>
                                        <div className="space-y-4">
                                            {associatedExamples.map((ex, i) => (
                                                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <p className="text-lg font-jp text-slate-800">{ex.ja}</p>
                                                        <Volume2 size={16} className="text-slate-400 cursor-pointer hover:text-brand-green" />
                                                    </div>
                                                    <p className="text-sm text-slate-500">{ex.en}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}

                        {activeTab === 'kanji' && kanjiDetails && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Kanji Details</h2>

                                        <div className="grid grid-cols-[1fr,250px] gap-12">
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                                                    <span className="text-slate-400 font-medium">Hán tự</span>
                                                    <span className="text-slate-700 font-bold">{kanjiDetails.head} - {kanjiDetails.meaning}</span>
                                                </div>
                                                <div className="grid grid-cols-[120px,1fr] items-start gap-4">
                                                    <span className="text-slate-400 font-medium font-bold">Kunyomi</span>
                                                    <span className="text-brand-blue font-bold">{kanjiDetails.kunyomi || "い, や, うち"}</span>
                                                </div>
                                                <div className="grid grid-cols-[120px,1fr] items-start gap-4">
                                                    <span className="text-slate-400 font-medium font-bold">Onyomi</span>
                                                    <span className="text-red-500 font-bold">{kanjiDetails.onyomi || "カ, ケ"}</span>
                                                </div>
                                                <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                                                    <span className="text-slate-400 font-medium">Stroke Count</span>
                                                    <span className="text-slate-700">{kanjiDetails.strokes || 10}</span>
                                                </div>
                                                <div className="grid grid-cols-[120px,1fr] items-center gap-4">
                                                    <span className="text-slate-400 font-medium">JLPT Level</span>
                                                    <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">N4</span>
                                                </div>
                                            </div>

                                            {/* Kanji Drawing Area Mockup */}
                                            <div className="space-y-4">
                                                <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
                                                    <span className="text-9xl text-slate-200 font-jp select-none">{kanjiDetails.head}</span>
                                                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-xs font-bold text-slate-500 bg-white px-3 py-2 rounded-lg shadow-sm">Interactive Stroke Area</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-center gap-4">
                                                    <button className="p-2 text-slate-400 hover:text-brand-green"><ImageIcon size={18} /></button>
                                                    <button className="p-2 text-slate-400 hover:text-brand-green"><Volume2 size={18} /></button>
                                                </div>
                                            </div>
                                        </div>

                                        <section className="mt-12 space-y-4">
                                            <h4 className="text-lg font-bold text-slate-800">Meanings</h4>
                                            <p className="text-slate-600 leading-relaxed text-lg">
                                                This character represents the concept of "{kanjiDetails.meaning}".
                                                It is used in various contexts ranging from literal family structures to metaphorical collections of related items.
                                            </p>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'sentences' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-slate-800">Example Sentences for {query}</h3>
                                <div className="space-y-4">
                                    {associatedExamples.map((ex, i) => (
                                        <div key={i} className="p-6 border-b border-slate-100 hover:bg-slate-50/50 transition-all rounded-2xl group">
                                            <div className="flex items-center gap-4 mb-3">
                                                <p className="text-2xl font-jp text-slate-800 leading-relaxed group-hover:text-brand-green transition-colors">
                                                    {ex.ja}
                                                </p>
                                                <button className="p-2 text-slate-300 hover:text-brand-green">
                                                    <Volume2 size={20} />
                                                </button>
                                            </div>
                                            <p className="text-slate-500 font-medium">{ex.en}</p>
                                        </div>
                                    ))}
                                    <button className="w-full py-4 text-brand-blue font-bold hover:underline">See more sentences</button>
                                </div>
                            </div>
                        )}

                        {!vocabDetails && !kanjiDetails && activeTab !== 'sentences' && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-32">
                                <Search size={64} className="mb-4 opacity-20" />
                                <p className="text-xl">Select an item from the sidebar to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100">
            {/* Page Header (Matches Image Layout) */}
            <div className="flex-shrink-0 bg-white border-b border-slate-200 px-8 py-6 z-30 space-y-6 shadow-sm">
                <div className="max-w-[1400px] mx-auto flex items-center gap-4">
                    {/* Language Selector */}
                    <button className="bg-brand-blue text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 hover:bg-brand-blue/90 transition-all shadow-md">
                        Japan - Viet
                        <ChevronDown size={18} />
                    </button>

                    {/* Main Search Bar */}
                    <div className="flex-1 relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search size={22} />
                        </div>
                        <input
                            type="text"
                            placeholder="Type a word or sentence..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-14 pr-32 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/5 transition-all text-xl font-jp shadow-inner"
                        />

                        {/* Search Bar Actions */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 p-1 bg-white rounded-xl shadow-sm border border-slate-100">
                            {query && (
                                <button onClick={() => setQuery('')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={20} />
                                </button>
                            )}
                            <button className="p-2 text-brand-blue hover:bg-slate-50 rounded-lg transition-all" title="Handwriting">
                                <PenTool size={20} />
                            </button>
                            <button className="p-2 text-brand-blue hover:bg-slate-50 rounded-lg transition-all" title="Voice Search">
                                <Mic size={20} />
                            </button>
                            <button className="p-2 text-brand-blue hover:bg-slate-50 rounded-lg transition-all" title="OCR/Image">
                                <ImageIcon size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation Area */}
                <div className="max-w-[1400px] mx-auto overflow-x-auto">
                    <TabNavigator activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="min-h-full">
                    {!parseResult && !isLoading ? renderEmptyState() : renderSearchResults()}
                </div>
            </main>
        </div>
    );
}
