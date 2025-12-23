'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, BookOpen, Volume2 } from 'lucide-react';
import { getKanji, Kanji } from '@/services/kanjiService';

const LEVELS = ['N5', 'N4', 'N3']; // Only N3, N4, N5 seeded based on script

export default function KanjiListPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedLevel, setSelectedLevel] = useState<string>(searchParams.get('level') || 'N5');
    const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredKanji, setFilteredKanji] = useState<Kanji[]>([]);

    useEffect(() => {
        const fetchKanji = async () => {
            setLoading(true);
            try {
                // Fetch kanji for the selected JLPT level
                const fetchedKanji = await getKanji({ p_tag: `JLPT_${selectedLevel}` });
                setKanjiList(fetchedKanji);
                setFilteredKanji(fetchedKanji);
            } catch (error) {
                console.error("Failed to fetch kanji", error);
            } finally {
                setLoading(false);
            }
        };

        fetchKanji();
    }, [selectedLevel]);

    useEffect(() => {
        // Filter internally based on search term
        if (!searchTerm) {
            setFilteredKanji(kanjiList);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = kanjiList.filter(k =>
                k.kanji.includes(searchTerm) ||
                (k.translation && k.translation.toLowerCase().includes(lowerTerm)) ||
                (k.exampleWord && k.exampleWord.includes(searchTerm)) ||
                (k.exampleReading && k.exampleReading.includes(searchTerm))
            );
            setFilteredKanji(filtered);
        }
    }, [searchTerm, kanjiList]);

    const handleLevelChange = (level: string) => {
        setSelectedLevel(level);
        router.push(`/library/kanji?level=${level}`);
    };

    const playAudio = (audioPath: string) => {
        if (!audioPath) return;
        const audio = new Audio(audioPath);
        audio.play().catch(e => console.error("Audio play error", e));
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 pb-24 md:pb-12">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/library"
                            className="p-3 hover:bg-muted rounded-full transition-all active:scale-95 group"
                        >
                            <ArrowLeft className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black text-foreground font-display tracking-tight">
                                JLPT <span className="text-kanji">Kanji</span>
                            </h1>
                            <p className="text-muted-foreground font-bold text-sm">Master kanji characters and their readings</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-6 items-center bg-card p-6 rounded-2xl border border-border ">
                    {/* Level Selector */}
                    <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        {LEVELS.map((level) => (
                            <button
                                key={level}
                                onClick={() => handleLevelChange(level)}
                                className={`
                                    px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap font-display
                                    ${selectedLevel === level
                                        ? 'bg-kanji text-white '
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }
                                `}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-kanji transition-colors" />
                        <input
                            type="text"
                            placeholder="Search kanji, meaning, or reading..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-muted/30 border border-border rounded-xl pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-4 focus:ring-kanji/10 focus:border-kanji/50 transition-all font-bold text-sm"
                        />
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32">
                        <div className="w-16 h-16 border-4 border-kanji border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest font-display">Loading Kanji...</p>
                    </div>
                ) : filteredKanji.length === 0 ? (
                    <div className="text-center py-32 bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center">
                        <div className="w-24 h-24 bg-muted/50 rounded-2xl flex items-center justify-center mb-8 ">
                            <BookOpen className="w-12 h-12 text-muted-foreground/20" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-3 font-display">No Kanji Found</h3>
                        <p className="text-muted-foreground font-bold">Try adjusting your search or level.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredKanji.map((item) => (
                            <div
                                key={item._id}
                                className="group relative bg-card hover:bg-card border border-border hover:border-kanji/30 rounded-2xl p-8 transition-all duration-500 hover: "
                            >
                                <div className="flex items-start justify-between gap-6 mb-8">
                                    {/* Main Kanji */}
                                    <div className="text-7xl font-bold font-jp text-foreground group-hover:text-kanji transition-colors duration-500">
                                        {item.kanji}
                                    </div>

                                    {/* Audio Button */}
                                    {(item.k_audio || item.audio) && (
                                        <button
                                            onClick={() => playAudio(item.k_audio || item.audio || '')}
                                            className="p-3 bg-muted/50 hover:bg-kanji hover:text-white rounded-xl transition-all text-muted-foreground "
                                        >
                                            <Volume2 className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {/* Reading */}
                                    {item.reading && (
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-muted-foreground/40 block uppercase tracking-widest font-display">Reading</span>
                                            <span className="text-foreground font-jp text-2xl font-bold">{item.reading}</span>
                                        </div>
                                    )}

                                    {/* Example */}
                                    <div className="bg-muted/30 rounded-2xl p-6 space-y-3 border border-border/50 ">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-foreground font-jp text-xl font-black">{item.exampleWord}</span>
                                            <span className="text-kanji font-jp text-sm font-bold opacity-80">{item.exampleReading}</span>
                                        </div>
                                        <div className="text-muted-foreground text-xs font-bold leading-relaxed border-t border-border/50 pt-3">
                                            {item.translation}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
