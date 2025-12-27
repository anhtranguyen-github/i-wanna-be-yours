"use client";

import React, { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { flashcardService } from "@/services/flashcardService";
import {
    Play,
    RotateCcw,
    Check,
    X,
    ArrowRight,
    Loader2,
    RefreshCw,
    Brain,
    Trophy,
    Sparkles,
    ChevronLeft,
    Zap,
    History
} from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';
import { ResultShell } from '@/components/results/ResultShell';
import { UnifiedSessionResult } from '@/types/results';
import { saveRecord, startSession } from '@/services/recordService';
import Link from 'next/link';

export default function StudyPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [queue, setQueue] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);

    const currentSessionId = React.useRef<string | null>(null);
    const sessionStartedAt = React.useRef<number>(0);

    const deckId = searchParams.get('deckId');

    useEffect(() => {
        loadDueCards();
    }, [deckId]);

    useEffect(() => {
        if (!loading && queue.length > 0 && !currentSessionId.current) {
            sessionStartedAt.current = Date.now();
            // We don't have deck title easily here unless we fetch it or pass it.
            // For now, use 'Flashcard Session'
            startSession('FLASHCARD', deckId || '000000000000000000000000', 'Flashcard Session').then(sid => {
                currentSessionId.current = sid;
            });
        }
    }, [loading, queue.length, deckId]);

    useEffect(() => {
        if (sessionComplete) {
            const accuracy = queue.length > 0 ? Math.round((correctCount / queue.length) * 100) : 0;

            if (currentSessionId.current) {
                saveRecord({
                    itemType: 'FLASHCARD',
                    itemId: deckId || '000000000000000000000000',
                    itemTitle: 'Flashcard Session',
                    score: accuracy,
                    status: 'COMPLETED',
                    sessionId: currentSessionId.current,
                    duration: Math.round((Date.now() - sessionStartedAt.current) / 1000),
                    details: { count: queue.length }
                });
                currentSessionId.current = null;
            } else {
                // Fallback for legacy compatibility if startSession failed
                saveRecord({
                    itemType: 'FLASHCARD',
                    itemId: deckId || '000000000000000000000000',
                    score: accuracy,
                    status: 'COMPLETED',
                    details: { count: queue.length }
                });
            }
        }
    }, [sessionComplete, queue.length, correctCount, deckId]);

    // Handle session abandonment
    useEffect(() => {
        return () => {
            if (currentSessionId.current) {
                saveRecord({
                    itemType: 'FLASHCARD',
                    itemId: deckId || '000000000000000000000000',
                    itemTitle: 'Flashcard Session',
                    status: 'ABANDONED',
                    sessionId: currentSessionId.current
                });
            }
        };
    }, [deckId]);

    const loadDueCards = async () => {
        setLoading(true);
        try {
            const cards = await flashcardService.getDueFlashcards(deckId || undefined);
            const shuffled = cards.sort(() => Math.random() - 0.5);
            setQueue(shuffled);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (quality: number) => {
        const currentCard = queue[currentIndex];

        if (quality >= 4) {
            setCorrectCount(prev => prev + 1);
        }

        if (currentCard?._id) {
            try {
                await flashcardService.answerCard(currentCard._id, quality);
            } catch (error) {
                console.error("Failed to save answer:", error);
            }
        }

        if (currentIndex < queue.length - 1) {
            setFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 300);
        } else {
            setSessionComplete(true);
        }
    };

    const handleRetry = () => {
        setSessionComplete(false);
        setCurrentIndex(0);
        setCorrectCount(0);
        loadDueCards();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <Loader2 className="w-16 h-16 animate-spin text-secondary opacity-20" />
                    <Brain className="absolute inset-0 m-auto w-6 h-6 text-secondary animate-pulse" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">Initializing Synaptic Array...</p>
            </div>
        );
    }

    if (sessionComplete) {
        // Construct Result Object
        const accuracy = queue.length > 0 ? Math.round((correctCount / queue.length) * 100) : 0;
        const result: UnifiedSessionResult = {
            sessionId: deckId || 'session-id',
            type: 'FLASHCARD' as any, // Temporary cast as FLASHCARD might not be in the enum yet
            accuracy: accuracy,
            timeSeconds: 0, // Placeholder
            xpEarned: 12, // Placeholder
            score: accuracy,
            stats: [
                { label: 'Recall Accuracy', value: `${accuracy}%` },
                { label: 'Nodes Processed', value: queue.length },
                { label: 'Mastery Gain', value: '+12 XP' } // Fake XP for now
            ],
            feedback: {
                title: accuracy > 80 ? 'Exceptional Performance' : 'Session Complete',
                message: accuracy > 80 ? 'Your retention is optimal. Continue this cadence.' : 'Consistent practice builds permanent pathways.',
                suggestions: ['Review incorrectly answered cards', 'Practice more Kanji sets']
            },
            achievements: []
        };

        return (
            <ResultShell
                result={result}
                onRetry={handleRetry}
                customActions={
                    <button
                        onClick={() => router.push('/flashcards')}
                        className="h-16 px-10 bg-neutral-white border-2 border-neutral-gray/10 text-neutral-ink rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 hover:border-primary-strong/30 hover:bg-neutral-beige/10 transition-all active:scale-95 shadow-sm"
                    >
                        Return to Deck
                    </button>
                }
            />
        );
    }

    if (queue.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center selection:bg-secondary/20">
                <div className="w-32 h-32 bg-muted text-neutral-ink rounded-[2.5rem] flex items-center justify-center mb-8  border border-border/20">
                    <Sparkles size={48} />
                </div>
                <h1 className="text-3xl font-black text-foreground font-display tracking-tight mb-4 italic">Neural Quiessence</h1>
                <p className="text-neutral-ink font-bold italic mb-12 max-w-md">No pending nodes require immediate reinforcement at this cycle.</p>
                <Link
                    href="/flashcards"
                    className="px-10 py-5 bg-card border border-border/50 text-foreground rounded-2xl font-black font-display text-[10px] uppercase tracking-widest  hover:border-secondary/30 hover:text-secondary transition-all active:scale-95"
                >
                    Sync Registry
                </Link>
            </div>
        );
    }

    const currentCard = queue[currentIndex];
    const frontText = currentCard.front || currentCard.content?.front || currentCard.kanji || "???";
    const backText = currentCard.back || currentCard.content?.back || currentCard.meaning || "???";
    const backDisplay = Array.isArray(backText) ? backText.join(", ") : backText;

    const typeLabel = currentCard.card_type === "PERSONAL" ? "Private" : "Global";
    const deckLabel = currentCard.deck_name || "General";

    return (
        <div className="min-h-screen bg-neutral-beige/30 flex flex-col items-center py-12 px-8 overflow-hidden selection:bg-secondary/20">
            {/* Tactical Header */}
            <header className="w-full max-w-4xl flex items-center justify-between mb-12 z-10">
                <Link
                    href="/flashcards"
                    className="group w-12 h-12 bg-white hover:bg-neutral-white border border-neutral-gray/20 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                >
                    <X size={20} className="text-neutral-ink group-hover:text-destructive transition-colors" />
                </Link>

                <div className="flex-1 mx-12 flex flex-col gap-3">
                    <div className="h-2 bg-neutral-gray/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-strong transition-all duration-700 ease-spring"
                            style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-2xl font-black text-neutral-ink font-display leading-none mb-1">{currentIndex + 1}</div>
                    <div className="text-[9px] font-black text-neutral-ink/40 uppercase tracking-widest font-display">Node Index</div>
                </div>
            </header>

            {/* Neural Workspace */}
            <div className="flex-1 w-full max-w-4xl flex flex-col justify-center mb-32">
                <div
                    className="relative w-full aspect-[4/3] sm:aspect-[3/2] perspective-2000 cursor-pointer group"
                    onClick={() => setFlipped(!flipped)}
                >
                    <div className={`relative w-full h-full text-center transition-all duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>

                        {/* --- Front Spectrum --- */}
                        <div className="absolute w-full h-full backface-hidden bg-white rounded-[3rem] border border-neutral-gray/10 flex flex-col items-center justify-center p-12 shadow-xl shadow-neutral-gray/5 transition-all relative overflow-hidden group-hover:border-primary-strong/20">

                            <div className="absolute top-8 left-8 flex gap-3">
                                <span className="px-4 py-1.5 bg-neutral-beige rounded-xl text-[9px] font-black uppercase tracking-widest text-primary-strong font-display">
                                    {typeLabel}
                                </span>
                                <span className="px-4 py-1.5 bg-neutral-white border border-neutral-gray/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-ink font-display">
                                    {deckLabel}
                                </span>
                            </div>

                            <div className="flex-1 flex items-center justify-center w-full">
                                <div className="text-6xl sm:text-8xl lg:text-9xl font-black text-neutral-ink font-jp tracking-tight break-all">
                                    {frontText}
                                </div>
                            </div>

                            <div className="mt-auto flex items-center gap-3 text-neutral-ink/30 font-black font-display uppercase tracking-[0.3em] text-[10px]">
                                <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                                <span>Execute Reveal</span>
                            </div>
                        </div>

                        {/* --- Rear Spectrum --- */}
                        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-neutral-ink rounded-[3rem] flex flex-col items-center justify-center p-12 text-white overflow-hidden shadow-2xl shadow-neutral-ink/20">
                            <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                                <div className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight mb-8 leading-tight">
                                    {backDisplay}
                                </div>

                                {currentCard.reading && (
                                    <div className="px-10 py-4 bg-white/10 rounded-[2rem] border border-white/10">
                                        <span className="text-primary-sky font-jp text-3xl font-black">{currentCard.reading}</span>
                                    </div>
                                )}
                            </div>

                            {/* Neural Metadata */}
                            {currentCard.example && (
                                <div className="mt-8 opacity-60 text-sm font-bold max-w-lg tracking-tight line-clamp-2">
                                    "{currentCard.example}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SRS Command Matrix */}
                <div className={`absolute -bottom-24 left-0 right-0 flex justify-center gap-6 transition-all duration-500 ease-spring z-20 ${flipped ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
                    {currentCard?.userId === 'guest' ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleAnswer(4); }}
                            className="bg-neutral-ink text-white px-14 py-6 rounded-2xl font-black font-display text-[11px] uppercase tracking-[0.3em] hover:bg-neutral-ink/90 transition-all flex items-center gap-4 active:scale-95 shadow-xl"
                        >
                            <span>Commit & Advance</span>
                            <ArrowRight size={20} />
                        </button>
                    ) : (
                        <div className="flex items-center gap-4 p-3 bg-white border border-neutral-gray/10 rounded-[2.5rem] shadow-xl shadow-neutral-gray/5">
                            <SrsButton color="text-red-500 hover:bg-red-50" label="Reset" sub="1m" onClick={() => handleAnswer(1)} icon={<History size={18} />} />
                            <SrsButton color="text-amber-500 hover:bg-amber-50" label="Hard" sub="10m" onClick={() => handleAnswer(3)} icon={<Zap size={18} />} />
                            <SrsButton color="text-emerald-500 hover:bg-emerald-50" label="Good" sub="1d" onClick={() => handleAnswer(4)} icon={<Check size={18} />} />
                            <SrsButton color="text-blue-500 hover:bg-blue-50" label="Easy" sub="4d" onClick={() => handleAnswer(5)} icon={<Sparkles size={18} />} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SrsButton({ color, label, sub, onClick, icon }: any) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`flex flex-col items-center justify-center w-24 h-24 rounded-[2rem] transition-all duration-200 font-display font-black active:scale-95 ${color}`}
        >
            <div className="mb-2">{icon}</div>
            <span className="text-[10px] uppercase tracking-widest">{label}</span>
            <span className="text-[9px] opacity-40 font-bold mt-0.5 tracking-tighter">{sub}</span>
        </button>
    );
}
