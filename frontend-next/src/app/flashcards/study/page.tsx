"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { flashcardService } from "@/services/flashcardService";
import {
    Play,
    RotateCcw,
    Check,
    X,
    ArrowRight,
    Loader2,
    RefreshCw
} from "lucide-react";

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
            // Shuffle cards
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

        // Call API to update SRS
        if (currentCard?._id) {
            try {
                await flashcardService.answerCard(currentCard._id, quality);
            } catch (error) {
                console.error("Failed to save answer:", error);
                // Could verify toast/undo here
            }
        }

        if (currentIndex < queue.length - 1) {
            setFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 300); // 300ms matches the flip animation duration
        } else {
            setSessionComplete(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream space-y-4">
                <Loader2 className="animate-spin text-brand-green" size={48} />
                <p className="text-brand-dark font-medium animate-pulse">Preparing your session...</p>
            </div>
        );
    }

    if (sessionComplete) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream p-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-32 h-32 bg-green-100 text-brand-green rounded-full flex items-center justify-center mb-6 shadow-clay-lg">
                    <Check size={64} strokeWidth={3} />
                </div>
                <h1 className="text-4xl font-black text-brand-dark mb-4">Session Complete!</h1>
                <p className="text-slate-500 mb-10 text-lg max-w-md">
                    You've reviewed all cards due for now. Keep up the great work!
                </p>
                <button
                    onClick={() => window.location.href = '/flashcards'}
                    className="
                        group flex items-center gap-3 px-8 py-4 
                        bg-brand-dark text-white rounded-2xl font-bold text-lg
                        shadow-lg hover:shadow-xl hover:scale-105 transition-all
                    "
                >
                    <span>Back to Dashboard</span>
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        );
    }

    if (queue.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream p-6 text-center animate-in fade-in duration-500">
                <div className="w-32 h-32 bg-brand-softBlue text-brand-dark rounded-full flex items-center justify-center mb-6 shadow-clay-lg">
                    <SparkleIcon />
                </div>
                <h1 className="text-4xl font-black text-brand-dark mb-4">All Caught Up!</h1>
                <p className="text-slate-500 mb-10 text-lg max-w-md">
                    No cards are currently due for review. Check back later or explore the library.
                </p>
                <button
                    onClick={() => window.location.href = '/flashcards'}
                    className="
                        px-8 py-4 bg-white text-brand-dark border-2 border-brand-dark/10
                        rounded-2xl font-bold text-lg hover:bg-white/50 transition-all
                    "
                >
                    Back to Dashboard
                </button>
            </div>
        )
    }

    const currentCard = queue[currentIndex];
    const content = currentCard.content || {};

    // Normalize content display
    const frontText = content.front || content.kanji || content.vocabulary_original || content.title || "???";
    const backText = content.back || content.meaning || content.english_meaning || "???"; // Fallback logic

    // Attempt to handle arrays if backend sends them (e.g. meanings)
    const backDisplay = Array.isArray(backText) ? backText.join(", ") : backText;

    // Type badge
    const typeLabel = currentCard.card_type === "PERSONAL" ? "Custom" : (content.p_tag || "Static");
    const deckLabel = currentCard.deck_name || "General";

    return (
        <div className="min-h-screen bg-brand-cream flex flex-col items-center py-8 px-4 overflow-hidden relative">

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-surface to-transparent -z-10"></div>

            {/* Header / Progress */}
            <div className="w-full max-w-3xl flex items-center justify-between mb-8 z-10 px-2">
                <button onClick={() => window.location.href = '/flashcards'} className="p-2 rounded-xl hover:bg-black/5 text-slate-400 hover:text-brand-dark transition-all">
                    <X size={28} />
                </button>

                <div className="flex-1 mx-6 flex flex-col gap-2">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-brand-green rounded-full transition-all duration-500 ease-out relative"
                            style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-brand-dark">{currentIndex + 1}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">of {queue.length}</span>
                </div>
            </div>

            {/* Card Container */}
            <div className="flex-1 w-full max-w-3xl flex flex-col justify-center relative z-10 mb-24">

                <div
                    className="relative w-full aspect-[4/3] sm:aspect-[3/2] perspective-1000 cursor-pointer group"
                    onClick={() => setFlipped(!flipped)}
                >
                    <div
                        className={`relative w-full h-full text-center transition-all duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}
                    >

                        {/* --- Front Side --- */}
                        <div className="
                            absolute w-full h-full backface-hidden 
                            bg-white rounded-[2rem] shadow-clay hover:shadow-clay-lg 
                            flex flex-col items-center justify-center p-8 sm:p-12 
                            border border-white/60 transition-all duration-300
                        ">
                            {/* Badges */}
                            <div className="absolute top-6 left-6 flex gap-2">
                                <span className="px-3 py-1 bg-brand-softBlue text-brand-dark text-[10px] font-black uppercase tracking-widest rounded-lg">
                                    {typeLabel}
                                </span>
                                <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                    {deckLabel}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 flex items-center justify-center w-full">
                                <div className="text-5xl sm:text-7xl lg:text-8xl font-black text-brand-dark tracking-tight break-all">
                                    {frontText}
                                </div>
                            </div>

                            <div className="mt-auto flex items-center gap-2 text-slate-300 font-bold uppercase tracking-[0.2em] text-xs">
                                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                <span>Tap to Flip</span>
                            </div>
                        </div>

                        {/* --- Back Side --- */}
                        <div className="
                            absolute w-full h-full backface-hidden rotate-y-180 
                            bg-brand-dark rounded-[2rem] shadow-clay-lg 
                            flex flex-col items-center justify-center p-8 sm:p-12 
                            text-white border border-white/10
                        ">
                            {/* Glass Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-[2rem]"></div>

                            <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 break-words max-w-full">
                                    {backDisplay}
                                </div>

                                {/* Pronunciation/Reading if available */}
                                {content.reading && (
                                    <div className="mt-4 px-6 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
                                        <span className="text-brand-green font-jp text-xl">{content.reading}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SRS Controls - Only visible when flipped */}
                <div className={`
                    absolute -bottom-24 left-0 right-0 
                    flex justify-center gap-3 sm:gap-6 
                    transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${flipped ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'}
                 `}>
                    {currentCard?.userId === 'guest' ? (
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleAnswer(4); }}
                                className="bg-brand-dark text-white px-12 py-5 rounded-2xl font-bold text-lg shadow-clay hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <span>Next Card</span>
                                <ArrowRight size={20} />
                            </button>
                            <span className="text-xs text-brand-dark/50 font-bold uppercase tracking-widest">Guest Mode</span>
                        </div>
                    ) : (
                        <>
                            <SrsButton color="bg-red-50 text-red-500" label="Again" sub="1m" onClick={() => handleAnswer(1)} />
                            <SrsButton color="bg-orange-50 text-orange-500" label="Hard" sub="10m" onClick={() => handleAnswer(3)} />
                            <SrsButton color="bg-brand-green/10 text-brand-green" label="Good" sub="1d" onClick={() => handleAnswer(4)} />
                            <SrsButton color="bg-blue-50 text-blue-500" label="Easy" sub="4d" onClick={() => handleAnswer(5)} />
                        </>
                    )}
                </div>

            </div>
        </div>
    )
}

function SrsButton({ color, label, sub, onClick }: any) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`
                flex flex-col items-center justify-center
                w-20 h-20 sm:w-24 sm:h-24 rounded-2xl
                ${color} hover:brightness-95 hover:scale-105 active:scale-95
                transition-all shadow-sm font-bold border border-transparent hover:border-black/5
            `}
        >
            <span className="text-lg sm:text-xl">{label}</span>
            <span className="text-xs opacity-60 font-medium">{sub}</span>
        </button>
    )
}

function SparkleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
    )
}
