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
        <div className="min-h-screen bg-neutral-900 text-white p-6 pb-24 md:pb-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/library"
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                                JLPT Kanji
                            </h1>
                            <p className="text-neutral-400">Master kanji characters and their readings</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    {/* Level Selector */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        {LEVELS.map((level) => (
                            <button
                                key={level}
                                onClick={() => handleLevelChange(level)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                                    ${selectedLevel === level
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                                        : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                                    }
                                `}
                            >
                                JLPT {level}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search kanji, meaning, or reading..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                ) : filteredKanji.length === 0 ? (
                    <div className="text-center py-20 text-neutral-400">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No kanji found.</p>
                        <p className="text-sm">Try adjusting your search or level.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredKanji.map((item) => (
                            <div
                                key={item._id}
                                className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-red-500/30 rounded-xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Main Kanji */}
                                    <div className="text-6xl font-bold font-jp text-white mb-2">
                                        {item.kanji}
                                    </div>

                                    {/* Audio Button */}
                                    {(item.k_audio || item.audio) && (
                                        <button
                                            onClick={() => playAudio(item.k_audio || item.audio || '')}
                                            className="p-2 hover:bg-red-500 hover:text-white rounded-full transition-colors text-neutral-400"
                                        >
                                            <Volume2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3 mt-2">
                                    {/* Reading */}
                                    {item.reading && (
                                        <div className="text-sm">
                                            <span className="text-neutral-500 block text-xs uppercase tracking-wider mb-0.5">Reading</span>
                                            <span className="text-red-200 font-jp text-lg">{item.reading}</span>
                                        </div>
                                    )}

                                    {/* Example */}
                                    <div className="bg-black/20 rounded-lg p-3 space-y-1">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-white font-jp text-lg font-medium">{item.exampleWord}</span>
                                            <span className="text-neutral-400 font-jp text-sm">{item.exampleReading}</span>
                                        </div>
                                        <div className="text-neutral-300 text-sm leading-snug">
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
