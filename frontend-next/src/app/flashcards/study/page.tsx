"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { flashcardService } from "@/services/flashcardService";
import { Brain, AlertTriangle, Zap, CheckCircle2, History } from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';
import { ResultShell } from '@/components/results/ResultShell';
import { UnifiedSessionResult } from '@/types/results';
import { saveRecord, startSession } from '@/services/recordService';
import Link from 'next/link';

// Components
import { StudyHeader } from "./components/StudyHeader";
import { StudyControls } from "./components/StudyControls";
import { Flashcard } from "./components/Flashcard";
import { OptionsModal, SettingsState } from "./components/OptionsModal";

export default function StudyPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Core Data
    const [queue, setQueue] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [sessionComplete, setSessionComplete] = useState(false);

    // Session Stats
    const [knownCount, setKnownCount] = useState(0);
    const [learningCount, setLearningCount] = useState(0);
    const historyStack = useRef<number[]>([]);

    // Features
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<SettingsState>({
        srsActive: true,
        frontSide: 'JAPANESE',
        showBothSides: false,
    });

    const currentSessionId = useRef<string | null>(null);
    const sessionStartedAt = useRef<number>(0);
    const autoPlayTimer = useRef<any>(null);
    const deckId = searchParams.get('deckId');

    // 1. Load data
    useEffect(() => {
        loadDueCards();
    }, [deckId]);

    // 2. Track session start
    useEffect(() => {
        if (!loading && queue.length > 0 && !currentSessionId.current) {
            sessionStartedAt.current = Date.now();
            startSession('FLASHCARD', deckId || 'default-deck', 'Flashcard Session').then(sid => {
                currentSessionId.current = sid;
            });
        }
    }, [loading, queue.length, deckId]);

    // 3. Auto-Play Logic
    useEffect(() => {
        if (isAutoPlaying && !sessionComplete) {
            if (!flipped) {
                autoPlayTimer.current = setTimeout(() => setFlipped(true), 2500);
            } else {
                autoPlayTimer.current = setTimeout(() => handleEvaluate(true), 3500);
            }
        } else {
            clearTimeout(autoPlayTimer.current);
        }
        return () => clearTimeout(autoPlayTimer.current);
    }, [isAutoPlaying, flipped, currentIndex, sessionComplete]);

    // 4. Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (sessionComplete || loading || isSettingsOpen) return;

            if (e.code === 'Space') {
                e.preventDefault();
                setFlipped(prev => !prev);
            }

            if (e.key === '1') handleEvaluate(false);
            if (e.key === '2') handleEvaluate(true);
            if (e.key === 'p' || e.key === 'P') setIsAutoPlaying(!isAutoPlaying);
            if (e.key === 's' || e.key === 'S') handleShuffle();
            if (e.key === 'u' || e.key === 'U') handleUndo();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [flipped, sessionComplete, loading, isSettingsOpen, isAutoPlaying]);

    const loadDueCards = async () => {
        setLoading(true);
        try {
            const cards = await flashcardService.getDueFlashcards(deckId || undefined);
            if (deckId && cards.length === 0) {
                setLoadError("Registry Segment Empty or Inaccessible");
                return;
            }
            const shuffled = [...cards].sort(() => Math.random() - 0.5);
            setQueue(shuffled);
        } catch (err) {
            console.error("Failed to load cards:", err);
            setLoadError("Registry Synchronization Failure");
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluate = (known: boolean) => {
        const currentCard = queue[currentIndex];

        // Track history for undo
        historyStack.current.push(currentIndex);

        if (known) setKnownCount(prev => prev + 1);
        else setLearningCount(prev => prev + 1);

        // Silent submit if SRS active
        if (settings.srsActive && currentCard?._id) {
            flashcardService.answerCard(currentCard._id, known ? 5 : 1).catch(err => {
                console.warn("Background answer submission failed:", err);
            });
        }

        if (currentIndex < queue.length - 1) {
            setFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 300);
        } else {
            finishSession();
        }
    };

    const handleNext = () => {
        if (currentIndex < queue.length - 1) {
            setFlipped(false);
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setFlipped(false);
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleShuffle = () => {
        setQueue(prev => [...prev].sort(() => Math.random() - 0.5));
        setCurrentIndex(0);
        setFlipped(false);
    };

    const handleUndo = () => {
        if (historyStack.current.length > 0) {
            const prevIndex = historyStack.current.pop()!;
            setCurrentIndex(prevIndex);
            setFlipped(false);
        }
    };

    const finishSession = () => {
        setSessionComplete(true);
        const accuracy = queue.length > 0 ? Math.round((knownCount / queue.length) * 100) : 0;

        if (currentSessionId.current) {
            saveRecord({
                itemType: 'FLASHCARD',
                itemId: deckId || 'default-deck',
                itemTitle: 'Flashcard Session',
                score: accuracy,
                status: 'COMPLETED',
                sessionId: currentSessionId.current,
                duration: Math.round((Date.now() - sessionStartedAt.current) / 1000),
                details: { count: queue.length, known: knownCount, learning: learningCount }
            });
            currentSessionId.current = null;
        }
    };

    const handleRetry = () => {
        setSessionComplete(false);
        setCurrentIndex(0);
        setKnownCount(0);
        setLearningCount(0);
        setFlipped(false);
        loadDueCards();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className="text-primary animate-pulse" size={32} />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-ink/40 mb-2">Neural Synchronization</p>
                    <h2 className="text-xl font-black text-neutral-ink font-display italic">Initializing Synaptic Array...</h2>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-black text-foreground font-display mb-2">
                    {loadError}
                </h2>
                <p className="text-neutral-ink font-bold mb-6 max-w-sm">
                    The requested linguistic registry could not be synchronized. It may have been decommissioned or moved to a private sector.
                </p>
                <Link
                    href="/flashcards"
                    className="px-6 py-3 bg-foreground text-background font-black font-display text-sm rounded-xl hover:bg-foreground/90 transition-colors"
                >
                    Back to Flashcard Hub
                </Link>
            </div>
        );
    }

    if (sessionComplete) {
        const accuracy = queue.length > 0 ? Math.round((knownCount / queue.length) * 100) : 100;
        const result: UnifiedSessionResult = {
            sessionId: deckId || 'session-id',
            type: 'FLASHCARD',
            accuracy: accuracy,
            timeSeconds: Math.round((Date.now() - sessionStartedAt.current) / 1000),
            xpEarned: Math.round(knownCount * 2 + learningCount * 0.5),
            score: accuracy,
            stats: [
                { label: 'Synaptic Success', value: `${accuracy}%`, icon: Zap },
                { label: 'Mastered Nodes', value: knownCount, icon: CheckCircle2 },
                { label: 'Reinforced Nodes', value: learningCount, icon: History }
            ],
            feedback: {
                title: accuracy > 80 ? 'Exceptional Intelligence' : 'Protocol Complete',
                message: accuracy > 80 ? 'Cognitive mapping complete with high fidelity.' : 'Target nodes processed. Neural pathways reinforced.',
                suggestions: ['Initiate subsequent study cycle', 'Synchronize with AI Laboratory']
            },
            achievements: []
        };

        return (
            <ResultShell
                result={result}
                onRetry={handleRetry}
                hubPath="/flashcards"
                hubLabel="Flashcard Hub"
                customActions={
                    <button
                        onClick={() => router.push('/flashcards')}
                        className="h-16 px-10 bg-white border border-slate-200 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3"
                    >
                        Return to Library
                    </button>
                }
            />
        );
    }

    const currentCard = queue[currentIndex];

    if (!currentCard && !loading && !sessionComplete) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center gap-6">
                <div className="w-16 h-16 bg-success/10 text-success rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-black text-foreground font-display mb-2">
                    All Nodes Synchronized
                </h2>
                <p className="text-neutral-ink font-bold mb-6 max-w-sm">
                    Review complete. No further synaptic reinforcement required at this time.
                </p>
                <Link
                    href="/flashcards"
                    className="px-6 py-3 bg-foreground text-background font-black font-display text-sm rounded-xl hover:bg-foreground/90 transition-colors"
                >
                    Return to Hub
                </Link>
            </div>
        );
    }

    if (!currentCard) return null; // Should not happen given guard above

    return (
        <div className="min-h-screen bg-neutral-beige/20 flex flex-col selection:bg-primary/20 overflow-hidden font-display relative">

            <OptionsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                setSettings={setSettings}
                onRestart={handleRetry}
            />

            <StudyHeader
                title={currentCard.set_name || 'General Practice'}
                currentIndex={currentIndex}
                totalCards={queue.length}
                knownCount={knownCount}
                learningCount={learningCount}
                onSettingsClick={() => setIsSettingsOpen(true)}
            />

            <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 pb-24 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Auto-Play Indicator */}
                <AnimatePresence>
                    {isAutoPlaying && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2.5 bg-neutral-ink border border-neutral-ink/20 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl z-40"
                        >
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Auto-Iteration Protocol Active
                        </motion.div>
                    )}
                </AnimatePresence>

                <Flashcard
                    card={currentCard}
                    flipped={flipped}
                    setFlipped={setFlipped}
                    showBothSides={settings.showBothSides}
                    frontSideSetting={settings.frontSide as any}
                />
            </main>

            <StudyControls
                flipped={flipped}
                srsActive={settings.srsActive}
                setSrsActive={(active) => setSettings({ ...settings, srsActive: active })}
                isAutoPlaying={isAutoPlaying}
                setIsAutoPlaying={setIsAutoPlaying}
                onUndo={handleUndo}
                onShuffle={handleShuffle}
                onEvaluate={handleEvaluate}
                onNext={handleNext}
                onPrev={handlePrev}
            />
        </div>
    );
}
