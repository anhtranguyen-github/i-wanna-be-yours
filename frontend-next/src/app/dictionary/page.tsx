'use client';

import React, { useState, useEffect } from 'react';
import { Search, BookOpen, X, Sparkles, Book, ArrowRight, Volume2, Mic, PenTool, Image as ImageIcon, ChevronDown, Loader2 } from 'lucide-react';
import { dictionaryService, DictionaryEntry, ExampleSentence } from '@/services/dictionaryService';
import { TabNavigator, DictionaryTab } from '@/components/dictionary/TabNavigator';

export default function DictionaryPage() {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<DictionaryTab>('vocab');
    const [isLoading, setIsLoading] = useState(false);
    const [parseResult, setParseResult] = useState<any>(null);
    const [selectedVocabId, setSelectedVocabId] = useState<string | null>(null);
    const [selectedKanjiId, setSelectedKanjiId] = useState<string | null>(null);
    const [vocabDetails, setVocabDetails] = useState<DictionaryEntry | null>(null);
    const [kanjiDetails, setDictionaryKanjiDetails] = useState<DictionaryEntry | null>(null);
    const [associatedExamples, setAssociatedExamples] = useState<ExampleSentence[]>([]);

    useEffect(() => {
        if (!query.trim()) { setParseResult(null); return; }
        const debounce = setTimeout(async () => {
            setIsLoading(true);
            try {
                const result = await dictionaryService.search(query);
                setParseResult(result);
                if (result.tokens.length > 0) setSelectedVocabId(result.tokens[0].id);
                if (result.kanji.length > 0) setSelectedKanjiId(result.kanji[0].id);
                if (result.sentences) setAssociatedExamples(result.sentences);
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        }, 600);
        return () => clearTimeout(debounce);
    }, [query]);

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

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                <Book size={40} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Japanese Dictionary</h2>
            <p className="text-muted-foreground mb-8">Enter any Japanese word or sentence to see its breakdown, readings, and meanings.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
                {[
                    { title: 'Vocab Analysis', desc: 'Detailed readings and meanings for common words.', icon: Sparkles },
                    { title: 'Kanji Breakdown', desc: 'Identify every kanji character in your input.', icon: ArrowRight },
                ].map((item, i) => (
                    <div key={i} className="bg-card p-5 rounded-2xl border border-border">
                        <item.icon size={20} className="text-primary mb-2" />
                        <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSearchResults = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Analyzing...</p>
                </div>
            );
        }

        return (
            <div className="flex gap-6 p-6 max-w-[1400px] mx-auto">
                {/* Sidebar */}
                <div className="w-[280px] flex-shrink-0 space-y-4">
                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                {activeTab === 'vocab' ? 'Search Results' : activeTab === 'kanji' ? 'Kanji List' : 'Navigation'}
                            </h3>
                        </div>
                        <div className="p-2">
                            {activeTab === 'vocab' && parseResult?.tokens?.map((token: any) => (
                                <button key={token.id} onClick={() => setSelectedVocabId(token.id)} className={`w-full text-left p-3 rounded-xl transition-colors ${selectedVocabId === token.id ? 'bg-primary/10 text-foreground border border-primary/20' : 'text-muted-foreground hover:bg-muted'}`}>
                                    <div className="font-bold text-lg">{token.head}</div>
                                    <div className="text-xs text-muted-foreground">{token.reading}</div>
                                    <div className="text-xs text-muted-foreground truncate">{token.meaning}</div>
                                </button>
                            ))}
                            {activeTab === 'kanji' && parseResult?.kanji?.map((k: any) => (
                                <button key={k.id} onClick={() => setSelectedKanjiId(k.id)} className={`w-full text-left p-3 rounded-xl transition-colors ${selectedKanjiId === k.id ? 'bg-primary/10 text-foreground border border-primary/20' : 'text-muted-foreground hover:bg-muted'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl">{k.head}</span>
                                        <span className="text-xs text-muted-foreground">{k.reading}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{k.meaning}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden min-h-[500px]">
                    <div className="p-8">
                        {activeTab === 'vocab' && vocabDetails && (
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <h2 className="text-4xl font-bold text-foreground">{vocabDetails.head}</h2>
                                            <button className="p-2 bg-muted text-muted-foreground rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                                                <Volume2 size={20} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <span>{vocabDetails.reading}</span>
                                            {vocabDetails.tags && vocabDetails.tags.length > 0 && (
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">{vocabDetails.tags[0]}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {vocabDetails.grammarNote && (
                                    <div className="p-4 bg-accent/10 rounded-xl text-accent text-sm font-bold">
                                        <span className="mr-2">☆</span>{vocabDetails.grammarNote}
                                    </div>
                                )}

                                <section>
                                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Definition</h4>
                                    <p className="text-lg text-foreground font-bold">{vocabDetails.meaning}</p>
                                </section>

                                {associatedExamples.length > 0 && (
                                    <section>
                                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Examples</h4>
                                        <div className="space-y-3">
                                            {associatedExamples.slice(0, 5).map((ex, i) => (
                                                <div key={i} className="p-4 bg-muted rounded-xl">
                                                    <p className="font-jp text-foreground mb-1">{ex.ja}</p>
                                                    <p className="text-sm text-muted-foreground">{ex.en}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}

                        {activeTab === 'kanji' && kanjiDetails && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-8">
                                    <div className="w-32 h-32 bg-muted rounded-2xl flex items-center justify-center">
                                        <span className="text-7xl font-jp">{kanjiDetails.head}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-foreground mb-2">{kanjiDetails.meaning}</h2>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div><span className="text-muted-foreground">Kunyomi:</span> <span className="font-bold text-blue-600">{kanjiDetails.kunyomi || 'N/A'}</span></div>
                                            <div><span className="text-muted-foreground">Onyomi:</span> <span className="font-bold text-red-500">{kanjiDetails.onyomi || 'N/A'}</span></div>
                                            <div><span className="text-muted-foreground">Strokes:</span> <span className="font-bold">{kanjiDetails.strokes || 'N/A'}</span></div>
                                            <div><span className="text-muted-foreground">JLPT:</span> <span className="px-2 py-0.5 bg-muted rounded text-xs font-bold">N4</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'sentences' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-foreground">Example Sentences</h3>
                                {associatedExamples.map((ex, i) => (
                                    <div key={i} className="p-4 border-b border-border">
                                        <p className="font-jp text-lg text-foreground mb-1">{ex.ja}</p>
                                        <p className="text-muted-foreground">{ex.en}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!vocabDetails && !kanjiDetails && activeTab !== 'sentences' && (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                                <Search size={48} className="mb-4 opacity-20" />
                                <p>Select an item to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
            {/* Header */}
            <div className="flex-shrink-0 bg-card border-b border-border px-6 py-4 space-y-4">
                <div className="max-w-[1400px] mx-auto flex items-center gap-4">
                    <button className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors">
                        JP → EN <ChevronDown size={16} />
                    </button>

                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            placeholder="Search for a word or sentence..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-12 pr-24 py-3 bg-muted rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg font-jp"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {query && <button onClick={() => setQuery('')} className="p-2 text-muted-foreground hover:text-foreground"><X size={18} /></button>}
                            <button className="p-2 text-muted-foreground hover:text-primary"><PenTool size={18} /></button>
                            <button className="p-2 text-muted-foreground hover:text-primary"><Mic size={18} /></button>
                            <button className="p-2 text-muted-foreground hover:text-primary"><ImageIcon size={18} /></button>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1400px] mx-auto">
                    <TabNavigator activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 overflow-y-auto">
                {!parseResult && !isLoading ? renderEmptyState() : renderSearchResults()}
            </main>
        </div>
    );
}
