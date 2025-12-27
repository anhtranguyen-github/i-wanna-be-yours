"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { flashcardService } from "@/services/flashcardService";
import {
    RotateCcw,
    Check,
    ArrowRight,
    Loader2,
    Brain,
    Sparkles,
    Zap,
    History,
    X,
    Keyboard,
    Info,
    ChevronDown,
    ChevronUp,
    Settings,
    Play,
    Pause,
    Shuffle,
    Undo2,
    CheckCircle2,
    XCircle,
    Volume2,
    Star,
    ArrowLeft,
    AlertTriangle
} from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';
import { ResultShell } from '@/components/results/ResultShell';
import { UnifiedSessionResult } from '@/types/results';
import { saveRecord, startSession } from '@/services/recordService';
import Link from 'next/link';

// --- Components ---

interface OptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: any;
    setSettings: (s: any) => void;
    onRestart: () => void;
}

function OptionsModal({ isOpen, onClose, settings, setSettings, onRestart }: OptionsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <div className="absolute inset-0 bg-neutral-ink/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-card border border-border/50 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-border/50 flex items-center justify-between">
                    <h2 className="text-3xl font-black text-foreground font-display tracking-tight">System Config</h2>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Track Progress */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Track Progress</h3>
                            <p className="text-xs text-neutral-ink font-medium">Persist results to SRS database</p>
                        </div>
                        <Toggle
                            enabled={settings.srsActive}
                            setEnabled={(val) => setSettings({ ...settings, srsActive: val })}
                        />
                    </div>

                    {/* Front Side */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Front Side</h3>
                            <p className="text-xs text-neutral-ink font-medium">Linguistic perspective anchor</p>
                        </div>
                        <select
                            value={settings.frontSide}
                            onChange={(e) => setSettings({ ...settings, frontSide: e.target.value })}
                            className="bg-muted border border-border/50 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="JAPANESE">Japanese</option>
                            <option value="DEFINITION">Definition</option>
                        </select>
                    </div>

                    {/* Show Both Sides */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Synthesis Mode</h3>
                            <p className="text-xs text-neutral-ink font-medium">Show both sides of cards</p>
                        </div>
                        <Toggle
                            enabled={settings.showBothSides}
                            setEnabled={(val) => setSettings({ ...settings, showBothSides: val })}
                        />
                    </div>

                    {/* Keyboard Shortcuts */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                        <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-neutral-ink">Keyboard Command Matrix</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <ShortcutItem keys={["Space"]} label="Flip Card" />
                            <ShortcutItem keys={["←", "→"]} label="Navigate" />
                            <ShortcutItem keys={["1", "2"]} label="Evaluation" />
                            <ShortcutItem keys={["P"]} label="Auto-Iterate" />
                            <ShortcutItem keys={["S"]} label="Registry Shuffle" />
                            <ShortcutItem keys={["U"]} label="Neural Undo" />
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-muted/30 border-t border-border/50 flex gap-4">
                    <button
                        onClick={() => { onRestart(); onClose(); }}
                        className="flex-1 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                        Restart Cycle
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                        Confirm Sync
                    </button>
                </div>
            </div>
        </div>
    );
}

function Toggle({ enabled, setEnabled }: { enabled: boolean; setEnabled: (v: boolean) => void }) {
    return (
        <button
            onClick={() => setEnabled(!enabled)}
            className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${enabled ? 'bg-primary' : 'bg-muted border border-border/50'}`}
        >
            <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );
}

function ShortcutItem({ keys, label }: { keys: string[]; label: string }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-[10px] font-bold text-neutral-ink">{label}</span>
            <div className="flex gap-1">
                {keys.map(k => (
                    <kbd key={k} className="px-2 py-1 bg-muted border border-border/50 rounded-md text-[9px] font-black">{k}</kbd>
                ))}
            </div>
        </div>
    );
}

// --- Main Page ---

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
    const [settings, setSettings] = useState({
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
            // We can't easily undo the counts because we don't know which one it was
            // but for simplicity in this redesign session, we just move back.
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

    // --- State Components ---

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
            type: 'FLASHCARD' as any,
            accuracy: accuracy,
            timeSeconds: Math.round((Date.now() - sessionStartedAt.current) / 1000),
            xpEarned: Math.round(knownCount * 2 + learningCount * 0.5),
            score: accuracy,
            stats: [
                { label: 'Synaptic Success', value: `${accuracy}%`, icon: 'Zap' },
                { label: 'Mastered Nodes', value: knownCount, icon: 'CheckCircle2' },
                { label: 'Reinforced Nodes', value: learningCount, icon: 'History' }
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
    const sideA = settings.frontSide === 'JAPANESE' ? (currentCard.front || currentCard.kanji) : (currentCard.back || currentCard.meaning);
    const sideB = settings.frontSide === 'JAPANESE' ? (currentCard.back || currentCard.meaning) : (currentCard.front || currentCard.kanji);

    // Convert back array to string
    const displayB = Array.isArray(sideB) ? sideB.join(", ") : sideB;

    return (
        <div className="min-h-screen bg-neutral-beige/20 flex flex-col selection:bg-primary/20 overflow-hidden font-display relative">

            <OptionsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                setSettings={setSettings}
                onRestart={handleRetry}
            />

            {/* --- TOP HUD --- */}
            <header className="bg-white/80 backdrop-blur-md border-b border-neutral-gray/10 px-8 py-4 sticky top-0 z-[60] flex items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                    <Link href="/flashcards" className="w-10 h-10 bg-neutral-beige/10 border border-neutral-gray/20 rounded-xl flex items-center justify-center hover:bg-neutral-white transition-all shadow-sm">
                        <ArrowLeft size={18} className="text-neutral-ink" />
                    </Link>
                    <div className="hidden sm:block">
                        <h1 className="text-lg font-black text-neutral-ink tracking-tight truncate max-w-[200px] md:max-w-md">{currentCard.set_name || 'Personal Registry'}</h1>
                        <p className="text-[9px] font-black text-neutral-ink/30 uppercase tracking-[0.2em]">Diagnostic Session</p>
                    </div>
                </div>

                {/* Progress Cluster */}
                <div className="flex-1 flex flex-col items-center gap-1.5 max-w-sm">
                    <div className="flex items-center justify-between w-full px-1">
                        <span className="text-[9px] font-black text-neutral-ink uppercase tracking-widest">{currentIndex + 1} / {queue.length}</span>
                        <div className="flex gap-1.5">
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-100/50 rounded-lg text-rose-500 text-[8px] font-black uppercase tracking-widest">
                                {learningCount}
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100/50 rounded-lg text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                                {knownCount}
                            </div>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-beige/30 rounded-full overflow-hidden border border-neutral-gray/5">
                        <div
                            className="h-full bg-primary-strong transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,107,157,0.3)]"
                            style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="hidden md:flex h-10 px-5 bg-neutral-ink text-white rounded-xl items-center gap-2 font-black text-[9px] uppercase tracking-widest hover:bg-neutral-ink/90 transition-all shadow-lg shadow-neutral-ink/10">
                        <Sparkles size={14} className="text-primary" />
                        Synthesize Questions
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-10 h-10 bg-neutral-white border border-neutral-gray/20 rounded-xl flex items-center justify-center hover:border-primary/40 transition-all shadow-sm text-neutral-ink"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* --- CORE STAGE --- */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-2xl relative z-10">
                    {/* Auto-Play Indicator */}
                    <AnimatePresence>
                        {isAutoPlaying && (
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2.5 bg-neutral-ink border border-neutral-ink/20 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl animate-in slide-in-from-top-4 duration-500">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Auto-Iteration Protocol Active
                            </div>
                        )}
                    </AnimatePresence>

                    <div
                        onClick={() => setFlipped(!flipped)}
                        className="relative w-full aspect-[4/3] sm:aspect-[1.4] perspective-2000 cursor-pointer group"
                    >
                        <div className={`relative w-full h-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>

                            {/* Front Face: Primary Lexicon */}
                            <div className="absolute w-full h-full backface-hidden bg-white border-2 border-neutral-gray/10 rounded-[3rem] flex flex-col items-center justify-center p-8 sm:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] group-hover:border-primary/20 transition-all">
                                <div className="absolute top-10 left-10">
                                    <div className="text-[10px] font-bold text-neutral-ink/20 uppercase tracking-[0.4em]">Primary Lexicon</div>
                                </div>

                                <div className="text-center space-y-10 w-full px-4">
                                    <h2 className="text-6xl sm:text-8xl font-black text-neutral-ink font-jp tracking-tighter leading-tight">
                                        {sideA}
                                    </h2>

                                    {settings.showBothSides && (
                                        <div className="pt-10 border-t-2 border-neutral-beige/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <p className="text-2xl sm:text-4xl font-bold text-neutral-ink/30 italic tracking-tight">{displayB}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                                    <div className="flex items-center gap-3 bg-neutral-beige/10 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-ink/30 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                        <Keyboard size={12} className="text-primary-strong" />
                                        <span>Strike <kbd className="font-sans px-1.5 py-0.5 bg-white border border-neutral-gray/20 rounded-md text-neutral-ink font-bold shadow-sm">SPACE</kbd> to reveal</span>
                                    </div>
                                </div>
                            </div>

                            {/* Back Face: Synaptic Resolution */}
                            <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-neutral-ink border-2 border-neutral-ink/5 rounded-[3rem] flex flex-col items-center justify-center p-8 sm:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative overflow-hidden group/back">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

                                <div className="absolute top-10 left-10 z-10">
                                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Synaptic Resolution</div>
                                </div>

                                <div className="text-center space-y-10 relative z-10 w-full">
                                    <h2 className="text-4xl sm:text-6xl font-black text-white leading-[1.15] tracking-tight drop-shadow-xl">
                                        {displayB}
                                    </h2>

                                    {currentCard.reading && (
                                        <div className="inline-block px-8 py-4 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-inner">
                                            <span className="text-primary font-jp text-3xl sm:text-5xl font-black">{currentCard.reading}</span>
                                        </div>
                                    )}

                                    {(currentCard.mnemonic || currentCard.example) && (
                                        <div className="max-w-md mx-auto p-6 bg-white/5 border border-white/5 rounded-3xl text-[11px] font-semibold text-white/40 leading-relaxed italic animate-in fade-in zoom-in-95 duration-700">
                                            "{currentCard.mnemonic || currentCard.example}"
                                        </div>
                                    )}
                                </div>

                                <div className="absolute top-10 right-10 z-10 flex flex-col gap-2">
                                    <button className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/20 hover:text-white transition-all hover:scale-105 active:scale-95">
                                        <Volume2 size={18} />
                                    </button>
                                    <button className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/20 hover:text-white transition-all hover:scale-105 active:scale-95">
                                        <Star size={18} />
                                    </button>
                                </div>

                                <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-40">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Registry Match Confirmed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* --- COMMAND DECK (FOOTER) --- */}
            <footer className="w-full fixed bottom-0 left-0 p-8 sm:p-12 pointer-events-none flex flex-col sm:flex-row items-center sm:items-end justify-between z-50 gap-6">
                {/* SRS Gate */}
                <div className="pointer-events-auto">
                    <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] p-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center gap-4 group hover:shadow-[0_20px_50px_-10px_rgba(255,107,157,0.2)] transition-all">
                        <Toggle
                            enabled={settings.srsActive}
                            setEnabled={(val) => setSettings({ ...settings, srsActive: val })}
                        />
                        <div className="pr-5 border-r border-neutral-beige/40">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] block text-neutral-ink/40 group-hover:text-neutral-ink transition-colors">Track</span>
                            <span className="text-[11px] font-black uppercase tracking-[0.1em] block text-primary-strong leading-none">Intelligence</span>
                        </div>
                    </div>
                </div>

                {/* Evaluation Cluster */}
                <div className={`pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${flipped ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-90 pointer-events-none'}`}>
                    <div className="flex items-center gap-4 p-4 bg-neutral-ink border-2 border-white/10 rounded-[4rem] shadow-2xl relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-transparent to-emerald-500/20 rounded-[4rem] blur-xl opacity-50 -z-10" />

                        {settings.srsActive ? (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEvaluate(false); }}
                                    className="px-10 py-7 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center gap-4 transition-all hover:scale-[1.03] active:scale-95 group shadow-xl shadow-rose-500/30"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                        <XCircle size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Reset Signal</div>
                                        <div className="text-[13px] font-black uppercase tracking-widest whitespace-nowrap">Still Learning</div>
                                    </div>
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEvaluate(true); }}
                                    className="px-10 py-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center gap-4 transition-all hover:scale-[1.03] active:scale-95 group shadow-xl shadow-emerald-500/30"
                                >
                                    <div className="text-right">
                                        <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Neural Match</div>
                                        <div className="text-[13px] font-black uppercase tracking-widest whitespace-nowrap">Know perfectly</div>
                                    </div>
                                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                        <CheckCircle2 size={20} />
                                    </div>
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-4 px-4 py-2">
                                <button onClick={handlePrev} className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-inner">
                                    <ArrowLeft size={24} />
                                </button>
                                <button onClick={handleNext} className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-inner">
                                    <ArrowRight size={24} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Automation Cluster */}
                <div className="pointer-events-auto flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-white rounded-[2.5rem] p-2.5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]">
                    <button
                        onClick={handleUndo}
                        className="w-11 h-11 bg-neutral-beige/10 border border-neutral-gray/10 rounded-xl flex items-center justify-center hover:bg-neutral-beige/20 transition-all text-neutral-ink/60 hover:text-neutral-ink shadow-sm"
                        title="Neural Undo"
                    >
                        <Undo2 size={16} />
                    </button>
                    <button
                        onClick={handleShuffle}
                        className="w-11 h-11 bg-neutral-beige/10 border border-neutral-gray/10 rounded-xl flex items-center justify-center hover:bg-neutral-beige/20 transition-all text-neutral-ink/60 hover:text-neutral-ink shadow-sm"
                        title="Registry Shuffle"
                    >
                        <Shuffle size={16} />
                    </button>
                    <div className="w-px h-6 bg-neutral-gray/10 mx-1" />
                    <button
                        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${isAutoPlaying ? 'bg-primary-strong text-white scale-110 shadow-primary/30' : 'bg-neutral-ink text-white hover:bg-neutral-ink/90'}`}
                    >
                        {isAutoPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                </div>
            </footer>

            <style jsx global>{`
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .perspective-2000 { perspective: 2000px; }
                
                .ease-spring { transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    );
}
