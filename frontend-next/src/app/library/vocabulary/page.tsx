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
                                JLPT <span className="text-vocab">Vocabulary</span>
                            </h1>
                            <p className="text-muted-foreground font-bold text-sm">Master essential words for every level</p>
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
                                        ? 'bg-vocab text-white '
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
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-vocab transition-colors" />
                        <input
                            type="text"
                            placeholder="Search in Japanese or English..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-muted/30 border border-border rounded-xl pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-4 focus:ring-vocab/10 focus:border-vocab/50 transition-all font-bold text-sm"
                        />
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32">
                        <div className="w-16 h-16 border-4 border-vocab border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest font-display">Loading Vocabulary...</p>
                    </div>
                ) : filteredWords.length === 0 ? (
                    <div className="text-center py-32 bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center">
                        <div className="w-24 h-24 bg-muted/50 rounded-2xl flex items-center justify-center mb-8 ">
                            <BookOpen className="w-12 h-12 text-muted-foreground/20" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-3 font-display">No Words Found</h3>
                        <p className="text-muted-foreground font-bold">Try adjusting your search or level.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredWords.map((word) => (
                            <div
                                key={word._id}
                                className="group relative bg-card hover:bg-card border border-border hover:border-vocab/30 rounded-2xl p-8 transition-all duration-500 hover:  flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="text-[10px] font-black text-vocab bg-vocab/10 px-4 py-1.5 rounded-full uppercase tracking-widest font-display ">
                                        {word.word_type || 'Word'}
                                    </div>
                                    <button
                                        onClick={() => playAudio(word.vocabulary_audio || '')}
                                        className="p-3 bg-muted/50 hover:bg-vocab hover:text-white rounded-xl transition-all text-muted-foreground  disabled:opacity-20"
                                        disabled={!word.vocabulary_audio}
                                    >
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <h3 className="text-3xl font-black text-foreground font-jp leading-tight group-hover:text-vocab transition-colors duration-500">
                                        {word.vocabulary_original}
                                    </h3>
                                    {word.vocabulary_simplified && word.vocabulary_simplified !== word.vocabulary_original && (
                                        <p className="text-xl text-vocab font-jp font-bold opacity-70">
                                            {word.vocabulary_simplified}
                                        </p>
                                    )}
                                    <div className="h-px w-full bg-border/50 my-6" />
                                    <p className="text-muted-foreground font-bold leading-relaxed text-sm">
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
