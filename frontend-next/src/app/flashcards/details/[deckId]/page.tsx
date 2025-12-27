"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Brain,
    Layers,
    Calendar,
    Search,
    Eye,
    Sparkles,
    Copy,
    Trash2,
    Share2,
    Edit3,
    Trophy,
    Clock,
    Lock,
    Users,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { fetchDeckById, cloneFlashcardSet, deleteFlashcardSet } from "@/services/flashcardService";
import { fetchHistory } from "@/services/recordService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Unified Components
import { DetailLayout, DetailGrid, DetailMain, DetailSidebar } from "@/components/shared/details/DetailLayout";
import { DetailHeader } from "@/components/shared/details/DetailHeader";
import { MetricCard, MetricGrid } from "@/components/shared/details/MetricCard";
import { CommandPanel } from "@/components/shared/details/CommandPanel";

// =============================================================================
// LOCAL SUB-COMPONENTS
// =============================================================================

function CardPeek({ card, index }: any) {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <div
            className="group relative bg-white border border-neutral-gray/5 p-6 rounded-2xl hover:shadow-xl hover:shadow-neutral-gray/5 transition-all cursor-pointer overflow-hidden h-48 flex flex-col justify-center text-center"
            onMouseEnter={() => setIsRevealed(true)}
            onMouseLeave={() => setIsRevealed(false)}
        >
            <div className="absolute top-4 right-4 opacity-10">
                <span className="text-[8px] font-black font-display text-neutral-ink">#{index + 1}</span>
            </div>

            <AnimatePresence mode="wait">
                {!isRevealed ? (
                    <motion.div
                        key="front"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-2xl font-jp text-neutral-ink font-bold line-clamp-3"
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
                        <div className="text-[10px] font-black text-primary-strong uppercase tracking-widest mb-2 opacity-60">Definition</div>
                        <div className="text-lg font-bold text-neutral-ink leading-tight line-clamp-3">{card.back}</div>
                        {card.sub_detail && <div className="text-xs text-neutral-ink/40 font-jp mt-1">{card.sub_detail}</div>}
                    </motion.div>
                )}
            </AnimatePresence>
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

    const handleClone = async () => {
        if (!user) {
            openAuth('LOGIN', {
                flowType: 'FLASHCARDS',
                title: 'Clone to Your Collection',
                description: 'Sign in to clone this deck to your personal collection.'
            });
            return;
        }

        try {
            const { id: newId } = await cloneFlashcardSet(deckId);
            toast.success('Deck cloned successfully!', {
                description: 'A copy has been added to your collection.'
            });
            router.push(`/flashcards/details/${newId}`);
        } catch (err) {
            toast.error('Failed to clone deck');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this deck?')) return;

        try {
            await deleteFlashcardSet(deckId);
            toast.success('Deck deleted');
            router.push('/flashcards');
        } catch (err) {
            toast.error('Failed to delete deck');
        }
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
                <Link href="/flashcards" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-ink hover:text-primary-strong transition-colors">
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

    // Define Actions for CommandPanel
    const commandActions: any[] = [
        {
            label: "Share Frequency",
            icon: Share2,
            onClick: handleCopyId
        }
    ];

    if (!isOwner) {
        commandActions.push({
            label: "Clone to Collection",
            icon: Copy,
            onClick: handleClone,
            variant: "PRIMARY" as any,
            requireAuth: !user,
            authTooltip: "Login to Clone"
        });
    }

    if (isOwner) {
        commandActions.push({
            label: "Delete Deck",
            icon: Trash2,
            onClick: handleDelete,
            variant: "DANGER" as any
        });
    }

    return (
        <DetailLayout>
            <DetailHeader
                title={deck.title}
                description={deck.description || "An elegant collection of linguistic nodes for persistent reinforcement."}
                tags={[
                    { label: deck.levels?.[0] || 'General', color: 'bg-neutral-beige text-neutral-ink' },
                    {
                        label: deck.visibility === 'global' ? 'Official' : deck.visibility === 'public' ? 'Public' : 'Private',
                        icon: deck.visibility === 'global' ? <Users size={12} /> : undefined
                    }
                ]}
                backHref="/flashcards"
                backLabel="Return to Registry"
                onAction={handleCommence}
                actionLabel="Commence Study"
            />

            <DetailGrid>
                <DetailMain>
                    <MetricGrid>
                        <MetricCard
                            label="Retention Rate"
                            value="94.2%"
                            icon={<Sparkles size={18} />}
                            trend="+2.4%"
                            trendDirection="up"
                            isLocked={!user}
                            onLockClick={() => openAuth('LOGIN', { flowType: 'FLASHCARDS', title: 'Retention Analytics', description: 'Log in to visualize your memory strength and long-term retention metrics.' })}
                        />
                        <MetricCard
                            label="Active Nodes"
                            value={deck.cards?.length || 0}
                            icon={<Layers size={18} />}
                        />
                        <MetricCard
                            label="Next Review"
                            value="Today"
                            icon={<Calendar size={18} />}
                            isLocked={!user}
                            onLockClick={() => openAuth('LOGIN', { flowType: 'FLASHCARDS', title: 'Schedule Sync', description: 'Smart scheduling and review dates require a personal account.' })}
                        />
                    </MetricGrid>

                    {/* Card Browser Section */}
                    <div className="bg-neutral-white rounded-[2.5rem] p-8 border border-neutral-gray/20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div>
                                <h2 className="text-xl font-black font-display text-neutral-ink mb-1">Registry Index</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/30">
                                    {filteredCards.length} Nodes Detected
                                </p>
                            </div>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-ink/20" size={16} />
                                <input
                                    type="text"
                                    placeholder="Scan nodes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 bg-neutral-gray/5 border border-transparent rounded-xl focus:bg-white focus:border-neutral-gray/20 focus:outline-none transition-all text-sm font-bold placeholder:text-neutral-ink/30"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredCards.map((card: any, idx: number) => (
                                <CardPeek key={idx} card={card} index={idx} />
                            ))}
                        </div>

                        {filteredCards.length === 0 && (
                            <div className="py-20 text-center opacity-40">
                                <Eye size={32} className="mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No matching signatures</p>
                            </div>
                        )}
                    </div>
                </DetailMain>

                <DetailSidebar>
                    <CommandPanel actions={commandActions} />

                    {/* User Stats/History Panel within Sidebar */}
                    <div className="bg-neutral-white rounded-[2.5rem] p-8 border border-neutral-gray/20">
                        <h3 className="text-xs font-black text-neutral-ink/40 uppercase tracking-[0.2em] mb-6 font-display">
                            Reinforcement Logs
                        </h3>

                        <div className="space-y-4">
                            {records.length > 0 ? records.slice(0, 3).map((record, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-gray/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${record.score >= 80 ? 'bg-green-400' : 'bg-amber-400'}`} />
                                        <span className="text-xs font-bold text-neutral-ink/60">
                                            {new Date(record.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className="text-xs font-black text-neutral-ink">{record.score}%</span>
                                </div>
                            )) : (
                                <div className="text-center py-6">
                                    <Clock size={20} className="mx-auto mb-2 text-neutral-ink/20" />
                                    <span className="text-[10px] font-bold text-neutral-ink/30 uppercase">No history found</span>
                                </div>
                            )}
                        </div>

                        {!user && (
                            <div className="mt-6 pt-6 border-t border-neutral-gray/10">
                                <div className="bg-neutral-ink/5 rounded-2xl p-4 text-center">
                                    <Lock size={16} className="mx-auto mb-2 text-neutral-ink/40" />
                                    <p className="text-[9px] font-bold text-neutral-ink/40 mb-3 leading-relaxed">
                                        Log in to track your mastery progress over time.
                                    </p>
                                    <button
                                        onClick={() => openAuth('LOGIN')}
                                        className="text-[9px] font-black uppercase tracking-widest text-primary-strong hover:underline"
                                    >
                                        Authenticate
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </DetailSidebar>
            </DetailGrid>
        </DetailLayout>
    );
}
