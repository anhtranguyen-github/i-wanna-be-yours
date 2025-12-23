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
import Link from "next/link";

export default function StudyPage() {
    const [queue, setQueue] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionComplete, setSessionComplete] = useState(false);

    useEffect(() => {
        loadDueCards();
    }, []);

    const loadDueCards = async () => {
        setLoading(true);
        try {
            const cards = await flashcardService.getDueFlashcards();
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

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <Loader2 className="w-16 h-16 animate-spin text-secondary opacity-20" />
                    <Brain className="absolute inset-0 m-auto w-6 h-6 text-secondary animate-pulse" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 font-display">Initializing Synaptic Array...</p>
            </div>
        );
    }

    if (sessionComplete) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center selection:bg-secondary/20">
                <div className="relative group mb-12">
                    <div className="absolute inset-0 bg-secondary/20 rounded-[3rem] blur-3xl animate-pulse" />
                    <div className="relative w-32 h-32 bg-secondary text-secondary-foreground rounded-[2.5rem] flex items-center justify-center  border border-secondary/20 rotate-6 group-hover:rotate-0 transition-transform duration-700">
                        <Trophy size={48} />
                    </div>
                </div>

                <h1 className="text-4xl font-black text-foreground font-display tracking-tighter mb-4 italic leading-none">
                    Session <span className="text-secondary italic-none not-italic">Synchronized</span>
                </h1>

                <p className="text-muted-foreground font-bold italic mb-12 max-w-md leading-relaxed tracking-tight">
                    All currently due neural nodes have been successfully reinforced. Cognitive integrity is optimal.
                </p>

                <div className="grid grid-cols-2 gap-6 w-full max-w-sm mb-12">
                    <div className="bg-muted/30 rounded-3xl p-6 border border-border/20 ">
                        <div className="text-2xl font-black text-secondary font-display mb-1">{queue.length}</div>
                        <div className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest font-display">Recall Nodes</div>
                    </div>
                    <div className="bg-muted/30 rounded-3xl p-6 border border-border/20 ">
                        <div className="text-2xl font-black text-foreground font-display mb-1">100%</div>
                        <div className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest font-display">Throughput</div>
                    </div>
                </div>

                <Link
                    href="/flashcards"
                    className="group flex items-center gap-4 px-12 py-5 bg-foreground text-background rounded-2xl font-black font-display text-[11px] uppercase tracking-[0.25em]  hover:opacity-95 transition-all active:scale-95"
                >
                    Return to Cluster
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </Link>
            </div>
        );
    }

    if (queue.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center selection:bg-secondary/20">
                <div className="w-32 h-32 bg-muted text-muted-foreground/30 rounded-[2.5rem] flex items-center justify-center mb-8  border border-border/20">
                    <Sparkles size={48} />
                </div>
                <h1 className="text-3xl font-black text-foreground font-display tracking-tight mb-4 italic">Neural Quiessence</h1>
                <p className="text-muted-foreground font-bold italic mb-12 max-w-md">No pending nodes require immediate reinforcement at this cycle.</p>
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
    const content = currentCard.content || {};

    const frontText = content.front || content.kanji || content.vocabulary_original || content.title || "???";
    const backText = content.back || content.meaning || content.english_meaning || "???";
    const backDisplay = Array.isArray(backText) ? backText.join(", ") : backText;

    const typeLabel = currentCard.card_type === "PERSONAL" ? "Private" : (content.p_tag || "Global");
    const deckLabel = currentCard.deck_name || "General";

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-12 px-8 overflow-hidden selection:bg-secondary/20">
            {/* Tactical Header */}
            <header className="w-full max-w-4xl flex items-center justify-between mb-12 z-10">
                <Link
                    href="/flashcards"
                    className="group w-12 h-12 bg-muted/50 hover:bg-card border border-border/30 rounded-2xl flex items-center justify-center transition-all  active:scale-90"
                >
                    <X size={20} className="text-muted-foreground group-hover:text-destructive transition-colors" />
                </Link>

                <div className="flex-1 mx-12 flex flex-col gap-3">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden  border border-border/10">
                        <div
                            className="h-full bg-secondary shadow-[0_0_15px_rgba(var(--secondary),0.4)] transition-all duration-700 ease-spring"
                            style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-2xl font-black text-foreground font-display leading-none mb-1 italic">{currentIndex + 1}</div>
                    <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest font-display">Node Index</div>
                </div>
            </header>

            {/* Neural Workspace */}
            <div className="flex-1 w-full max-w-4xl flex flex-col justify-center mb-32">
                <div
                    className="relative w-full aspect-[4/3] sm:aspect-[3/2] perspective-2000 cursor-pointer group"
                    onClick={() => setFlipped(!flipped)}
                >
                    <div className={`relative w-full h-full text-center transition-all duration-700 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>

                        {/* --- Front Spectrum --- */}
                        <div className="absolute w-full h-full backface-hidden bg-card rounded-[3.5rem]  border border-border/50 flex flex-col items-center justify-center p-12 transition-all duration-500 hover: group-hover:border-secondary/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-secondary/10 transition-colors" />

                            <div className="absolute top-8 left-8 flex gap-3">
                                <span className="px-4 py-1.5 bg-muted rounded-xl text-[9px] font-black uppercase tracking-widest text-secondary font-display  border border-secondary/10 italic">
                                    {typeLabel}
                                </span>
                                <span className="px-4 py-1.5 bg-muted/50 border border-border/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 font-display italic">
                                    {deckLabel}
                                </span>
                            </div>

                            <div className="flex-1 flex items-center justify-center w-full">
                                <div className="text-6xl sm:text-8xl lg:text-9xl font-black text-foreground font-jp tracking-tighter break-all italic group-hover:text-secondary transition-colors duration-500">
                                    {frontText}
                                </div>
                            </div>

                            <div className="mt-auto flex items-center gap-3 text-muted-foreground/20 font-black font-display uppercase tracking-[0.3em] text-[10px] italic group-hover:text-secondary/40 transition-colors">
                                <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                                <span>Execute Reveal</span>
                            </div>
                        </div>

                        {/* --- Rear Spectrum --- */}
                        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-foreground rounded-[3.5rem]  flex flex-col items-center justify-center p-12 text-background border border-border/10 overflow-hidden group/back">
                            <div className="absolute inset-0 bg-gradient-to-br from-background/20 to-transparent pointer-events-none" />
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary/20 rounded-full blur-[60px] group-hover/back:scale-150 transition-transform duration-1000" />

                            <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                                <div className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight mb-8 leading-tight italic">
                                    {backDisplay}
                                </div>

                                {content.reading && (
                                    <div className="px-10 py-4 bg-background/10 rounded-[2rem]  border border-background/20  group-hover/back:border-secondary/30 transition-all duration-500">
                                        <span className="text-secondary font-jp text-3xl font-black">{content.reading}</span>
                                    </div>
                                )}
                            </div>

                            {/* Neural Metadata (Optional Examples) */}
                            {content.example && (
                                <div className="mt-8 opacity-40 text-sm font-bold max-w-lg italic tracking-tight line-clamp-2">
                                    "{content.example}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SRS Command Matrix */}
                <div className={`absolute -bottom-24 left-0 right-0 flex justify-center gap-6 transition-all duration-700 ease-spring ${flipped ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-90 pointer-events-none'}`}>
                    {currentCard?.userId === 'guest' ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleAnswer(4); }}
                            className="bg-foreground text-background px-14 py-6 rounded-2xl font-black font-display text-[11px] uppercase tracking-[0.3em]  hover:opacity-95 transition-all flex items-center gap-4 active:scale-90"
                        >
                            <span>Commit & Advance</span>
                            <ArrowRight size={20} />
                        </button>
                    ) : (
                        <div className="flex items-center gap-6 p-4 bg-muted/20  rounded-[2.5rem] border border-border/20 ">
                            <SrsButton color="text-destructive bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground" label="Reset" sub="1m" onClick={() => handleAnswer(1)} icon={<History size={16} />} />
                            <SrsButton color="text-secondary bg-secondary/10 hover:bg-secondary hover:text-secondary-foreground" label="Stress" sub="10m" onClick={() => handleAnswer(3)} icon={<Zap size={16} />} />
                            <SrsButton color="text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground" label="Sync" sub="1d" onClick={() => handleAnswer(4)} icon={<Check size={16} />} />
                            <SrsButton color="text-foreground bg-foreground/10 hover:bg-foreground hover:text-background" label="Master" sub="4d" onClick={() => handleAnswer(5)} icon={<Sparkles size={16} />} />
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
            className={`flex flex-col items-center justify-center w-24 h-24 rounded-[1.75rem] transition-all duration-500 font-display font-black  active:scale-90 ${color}`}
        >
            <div className="mb-1">{icon}</div>
            <span className="text-[10px] uppercase tracking-widest">{label}</span>
            <span className="text-[8px] opacity-40 font-bold mt-1 tracking-tighter">{sub}</span>
        </button>
    );
}
