'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, Filter, Volume2, BookOpen } from 'lucide-react';
import { getVocabulary, TanosWord } from '@/services/vocabularyService';
import { useGlobalAuth } from '@/context/GlobalAuthContext';

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

export default function VocabularyListPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { openAuth } = useGlobalAuth();

    const [selectedLevel, setSelectedLevel] = useState<string>(searchParams.get('level') || 'N5');
    const [words, setWords] = useState<TanosWord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredWords, setFilteredWords] = useState<TanosWord[]>([]);

    useEffect(() => {
        const fetchWords = async () => {
            setLoading(true);
            try {
                // Fetch words for the selected JLPT level
                const fetchedWords = await getVocabulary({ p_tag: `JLPT_${selectedLevel}` });
                setWords(fetchedWords);
                setFilteredWords(fetchedWords);
            } catch (error) {
                console.error("Failed to fetch vocabulary", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWords();
    }, [selectedLevel]);

    useEffect(() => {
        // Filter internally based on search term
        if (!searchTerm) {
            setFilteredWords(words);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = words.filter(word =>
                word.vocabulary_original.includes(searchTerm) ||
                (word.vocabulary_simplified && word.vocabulary_simplified.includes(searchTerm)) ||
                (word.vocabulary_english && word.vocabulary_english.toLowerCase().includes(lowerTerm))
            );
            setFilteredWords(filtered);
        }
    }, [searchTerm, words]);

    const handleLevelChange = (level: string) => {
        setSelectedLevel(level);
        router.push(`/library/vocabulary?level=${level}`);
    };

    const playAudio = (audioPath: string) => {
        if (!audioPath) return;
        // Construct full audio URL (assuming served from public or backend)
        // If served from backend 8000, we might need a proxy or full URL. 
        // Based on typical setup, audio might be static files. 
        // Let's assume frontend proxy or absolute URL availability. 
        // For now, try playing directly.
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
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                                JLPT Vocabulary
                            </h1>
                            <p className="text-neutral-400">Master essential words for every level</p>
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
                                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
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
                            placeholder="Search in Japanese or English..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-pink-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
                    </div>
                ) : filteredWords.length === 0 ? (
                    <div className="text-center py-20 text-neutral-400">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No words found.</p>
                        <p className="text-sm">Try adjusting your search or level.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredWords.map((word) => (
                            <div
                                key={word._id}
                                className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-pink-500/30 rounded-xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/5"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-xs font-mono text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded">
                                        {word.word_type || 'Word'}
                                    </div>
                                    <button
                                        onClick={() => playAudio(word.vocabulary_audio || '')}
                                        className="p-2 hover:bg-pink-500 hover:text-white rounded-full transition-colors text-neutral-400 disabled:opacity-30"
                                        disabled={!word.vocabulary_audio}
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold text-white mb-1">
                                        {word.vocabulary_original}
                                    </h3>
                                    {word.vocabulary_simplified && word.vocabulary_simplified !== word.vocabulary_original && (
                                        <p className="text-lg text-pink-200/80 font-jp">
                                            {word.vocabulary_simplified}
                                        </p>
                                    )}
                                    <div className="h-px w-full bg-white/5 my-2" />
                                    <p className="text-neutral-300 leading-relaxed text-sm">
                                        {word.vocabulary_english}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
