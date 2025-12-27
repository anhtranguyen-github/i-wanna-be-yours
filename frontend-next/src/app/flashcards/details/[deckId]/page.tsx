"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Brain,
    Layers,
    History as HistoryIcon,
    Star,
    Play,
    Share2,
    Edit3,
    Eye,
    Clock,
    Calendar,
    ChevronRight,
    Search,
    Volume2,
    Lock,
    Trophy,
    ArrowLeft,
    CheckCircle2,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { fetchDeckById } from "@/services/deckService";
import { fetchHistory } from "@/services/recordService";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function SRSMetric({ label, value, subtext, icon: Icon, color }: any) {
    return (
        <div className="bg-white/40 backdrop-blur-sm border border-neutral-gray/10 rounded-3xl p-6 hover:bg-white transition-all group">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl bg-${color}-50 text-${color}-600`}>
                    <Icon size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink/40">{label}</span>
            </div>
            <div className="text-3xl font-light text-neutral-ink mb-1 font-serif">{value}</div>
            <div className="text-[10px] font-bold text-neutral-ink/20 uppercase tracking-widest">{subtext}</div>
        </div>
    );
}

function CardPeek({ card, index }: any) {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <div
            className="group relative bg-white border border-neutral-gray/5 p-6 rounded-2xl hover:shadow-xl hover:shadow-neutral-gray/5 transition-all cursor-pointer overflow-hidden"
            onMouseEnter={() => setIsRevealed(true)}
            onMouseLeave={() => setIsRevealed(false)}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-[8px] font-black font-display text-neutral-ink">#{index + 1}</span>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[100px] text-center">
                <AnimatePresence mode="wait">
                    {!isRevealed ? (
                        <motion.div
                            key="front"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-2xl font-jp text-neutral-ink font-bold"
                        >
                            {card.front}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="back"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="space-y-1"
                        >
                            <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 opacity-40">Definition</div>
                            <div className="text-lg font-bold text-neutral-ink leading-tight">{card.back}</div>
                            {card.sub_detail && <div className="text-xs text-neutral-ink/40 font-jp">{card.sub_detail}</div>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function FlashcardDetailPage() {
    const { deckId } = useParams() as { deckId: string };
    const router = useRouter();
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    const [deck, setDeck] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const fetchedDeck = await fetchDeckById(deckId);
                setDeck(fetchedDeck);

                if (user) {
                    const histData = await fetchHistory(10);
                    const relevant = histData.filter((h: any) => h.itemType === 'FLASHCARD' && h.itemId === deckId);
                    setRecords(relevant);
                }
            } catch (err) {
                console.error("Failed to load deck details:", err);
                toast.error("Synaptic Registry unreachable");
            } finally {
                setLoading(false);
            }
        };

        if (deckId) loadData();
    }, [deckId, user]);

    const handleCommence = () => {
        router.push(`/flashcards/study?deckId=${deckId}`);
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(deckId);
        toast.success("Deck Frequency replicated", {
            description: "Unique identifier copied to clipboard."
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FCFCFC] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border border-neutral-gray/10 rounded-full animate-ping opacity-20" />
                    <Brain className="absolute inset-0 m-auto text-neutral-ink/20 animate-pulse" size={32} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-ink/20 font-display">Tuning Synaptic Frequencies...</div>
            </div>
        </div>
    );

    if (!deck) return (
        <div className="min-h-screen bg-[#FCFCFC] flex items-center justify-center">
            <div className="text-center max-w-sm px-8">
                <div className="w-20 h-20 bg-neutral-beige/50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Layers size={32} className="text-neutral-ink opacity-20" />
                </div>
                <h1 className="text-2xl font-serif text-neutral-ink mb-2">Registry Void</h1>
                <p className="text-sm text-neutral-ink/40 mb-8">The requested synaptic cluster does not exist in this dimension.</p>
                <Link href="/flashcards" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-ink hover:text-primary transition-colors">
                    <ArrowLeft size={16} /> Return to Library
                </Link>
            </div>
        </div>
    );

    const filteredCards = deck.cards?.filter((c: any) =>
        c.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.back.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const isOwner = user && user.id.toString() === deck.userId;

    return (
        <div className="min-h-screen bg-[#FCFCFC] text-neutral-ink">
            {/* Paper-White Header */}
            <div className="bg-white border-b border-neutral-gray/5 pt-20 pb-16">
                <div className="max-w-6xl mx-auto px-8">
                    <Link
                        href="/flashcards"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink/30 hover:text-neutral-ink transition-colors mb-12"
                    >
                        <ArrowLeft size={14} />
                        Library Registry
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-6">
                                <span className="px-3 py-1 bg-neutral-beige/50 text-[9px] font-black uppercase tracking-widest text-neutral-ink/60 rounded-full">
                                    {deck.level || 'General'}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-ink/20">
                                    {deck.visibility || 'Private'} Archive
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-serif text-neutral-ink leading-tight tracking-tight mb-6">
                                {deck.title}
                            </h1>
                            <p className="text-lg text-neutral-ink/40 font-medium max-w-xl leading-relaxed italic">
                                {deck.description || "An elegant collection of linguistic nodes for persistent reinforcement. Optimal for deep synaptic integration."}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button
                                onClick={handleCommence}
                                className="w-full sm:w-auto px-12 py-6 bg-neutral-ink text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-neutral-ink/10 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
                            >
                                <Play size={18} className="fill-current group-hover:scale-110 transition-transform" />
                                Commence Study
                            </button>
                            <button
                                onClick={handleCopyId}
                                className="w-full sm:w-auto p-6 bg-white border border-neutral-gray/10 rounded-full text-neutral-ink/40 hover:text-neutral-ink hover:border-neutral-ink/20 transition-all shadow-sm"
                                title="Share frequency ID"
                            >
                                <Share2 size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-8 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                    {/* Left: Mastery & Analytics */}
                    <div className="lg:col-span-8 space-y-20">

                        {/* Synaptic Health Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            <SRSMetric
                                label="Retention Rate"
                                value="94.2%"
                                subtext="Synaptic Stability"
                                icon={Sparkles}
                                color="emerald"
                            />
                            <SRSMetric
                                label="Active Nodes"
                                value={deck.cards?.length || 0}
                                subtext="Registry Mass"
                                icon={Layers}
                                color="blue"
                            />
                            <SRSMetric
                                label="Next Review"
                                value="Today"
                                subtext="Calibration Window"
                                icon={Calendar}
                                color="amber"
                            />
                        </div>

                        {/* Card Browser */}
                        <section>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                <div>
                                    <h2 className="text-2xl font-serif text-neutral-ink mb-1 italic">Library Browser</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/20">Peek into the registry index</p>
                                </div>
                                <div className="relative max-w-xs w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-ink/20" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Scan nodes..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-6 py-3 bg-white border border-neutral-gray/5 rounded-2xl focus:outline-none focus:border-neutral-ink/20 transition-all text-sm font-bold placeholder:text-neutral-ink/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {filteredCards.map((card: any, idx: number) => (
                                    <CardPeek key={idx} card={card} index={idx} />
                                ))}
                                {filteredCards.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-white border border-dashed border-neutral-gray/10 rounded-3xl">
                                        <Eye size={32} className="mx-auto text-neutral-ink/10 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/20">No matching signatures detected</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right: Social & Registry Logs */}
                    <div className="lg:col-span-4 space-y-12">

                        {/* Control Matrix */}
                        <section className="bg-white border border-neutral-gray/10 rounded-[3rem] p-10 space-y-6 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink/20 mb-8">Registry Commands</h3>

                            {isOwner && (
                                <button className="w-full flex items-center justify-between p-4 bg-neutral-beige/20 hover:bg-neutral-beige/40 rounded-2xl transition-all text-neutral-ink group">
                                    <div className="flex items-center gap-3">
                                        <Edit3 size={18} className="text-neutral-ink/20 group-hover:text-neutral-ink transition-colors" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Modify Registry</span>
                                    </div>
                                    <ChevronRight size={16} className="text-neutral-ink/10" />
                                </button>
                            )}

                            <button className="w-full flex items-center justify-between p-4 bg-neutral-beige/20 hover:bg-neutral-beige/40 rounded-2xl transition-all text-neutral-ink group">
                                <div className="flex items-center gap-3">
                                    <Trophy size={18} className="text-neutral-ink/20 group-hover:text-neutral-ink transition-colors" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Global Top Rank</span>
                                </div>
                                <span className="text-[10px] font-black text-neutral-ink/40">#12</span>
                            </button>

                            <button className="w-full flex items-center justify-between p-4 bg-neutral-beige/20 hover:bg-neutral-beige/40 rounded-2xl transition-all text-neutral-ink group">
                                <div className="flex items-center gap-3">
                                    <Clock size={18} className="text-neutral-ink/20 group-hover:text-neutral-ink transition-colors" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Time Invested</span>
                                </div>
                                <span className="text-[10px] font-black text-neutral-ink/40">4.2h</span>
                            </button>
                        </section>

                        {/* Recent Reinforcement Activity */}
                        <section>
                            <div className="flex items-center justify-between mb-8 px-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink/30">Reinforcement Logs</h3>
                                <HistoryIcon size={14} className="text-neutral-ink/20" />
                            </div>

                            <div className="space-y-4">
                                {records.length > 0 ? records.slice(0, 5).map((record, idx) => (
                                    <div key={idx} className="bg-white border border-neutral-gray/5 p-6 rounded-3xl flex items-center justify-between hover:border-neutral-ink/10 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-neutral-ink/10" />
                                            <div>
                                                <div className="text-[9px] font-black text-neutral-ink/20 uppercase tracking-widest">
                                                    {new Date(record.timestamp).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs font-bold text-neutral-ink">Reinforcement Session</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-neutral-ink">{record.score}%</div>
                                            <div className="text-[8px] font-black text-neutral-ink/20 uppercase">Recall</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center opacity-10">
                                        <HistoryIcon size={32} className="mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Reinforcement History</p>
                                    </div>
                                )}
                            </div>

                            {!user && (
                                <div className="mt-8">
                                    <div className="p-8 bg-neutral-ink text-white rounded-[2.5rem] text-center shadow-xl shadow-neutral-ink/10">
                                        <Lock size={24} className="mx-auto mb-4 opacity-30" />
                                        <h4 className="text-sm font-black uppercase tracking-widest mb-2 leading-relaxed italic">Identity Verification Required</h4>
                                        <p className="text-[10px] font-medium opacity-40 mb-8 leading-relaxed">Persist your synaptic health metrics and SRS forecast by verifying your identity.</p>
                                        <button
                                            onClick={() => openAuth('LOGIN')}
                                            className="w-full py-4 bg-white text-neutral-ink rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                                        >
                                            Verify Identity
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}
