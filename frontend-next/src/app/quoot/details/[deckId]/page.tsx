"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Zap,
    Trophy,
    Crown,
    Play,
    Share2,
    Edit3,
    Layers,
    Eye,
    Clock,
    Users,
    ArrowLeft,
    Lock,
    History,
    Copy,
    Trash2,
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { fetchQuootArenaById, cloneQuootArena, deleteQuootArena } from "@/services/quootService";
import { fetchHistory } from "@/services/recordService";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Unified Components
import { DetailLayout, DetailGrid, DetailMain, DetailSidebar } from "@/components/shared/details/DetailLayout";
import { DetailHeader } from "@/components/shared/details/DetailHeader";
import { MetricCard, MetricGrid } from "@/components/shared/details/MetricCard";
import { CommandPanel } from "@/components/shared/details/CommandPanel";

// =============================================================================
// LOCAL SUB-COMPONENTS
// =============================================================================

function ItemRow({ item, index }: any) {
    const [revealed, setRevealed] = useState(false);

    return (
        <div
            onMouseEnter={() => setRevealed(true)}
            onMouseLeave={() => setRevealed(false)}
            className="flex items-center gap-6 p-4 rounded-2xl bg-white border border-neutral-gray/10 hover:border-primary-strong/30 hover:bg-neutral-gray/5 transition-all group"
        >
            <div className="w-10 h-10 rounded-xl bg-neutral-beige flex items-center justify-center text-xs font-black text-neutral-ink/50">
                {String(index + 1).padStart(2, '0')}
            </div>

            <div className="flex-1">
                <div className="text-sm font-black text-neutral-ink mb-0.5">{item.front}</div>
                <div className="text-[10px] font-bold text-neutral-ink/40 uppercase tracking-widest">Question</div>
            </div>

            <div className="flex-1 overflow-hidden">
                <motion.div
                    animate={{ y: revealed ? 0 : 20, opacity: revealed ? 1 : 0 }}
                    className="text-sm font-bold text-primary-strong italic"
                >
                    {item.back}
                </motion.div>
                {!revealed && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-neutral-ink/20 uppercase tracking-tighter">
                        <Lock size={10} /> Hover to reveal
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function QuootDetailPage() {
    const { deckId } = useParams() as { deckId: string };
    const router = useRouter();
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    const [arena, setArena] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const loadPageData = async () => {
            try {
                const data = await fetchQuootArenaById(deckId);
                setArena(data);

                if (user) {
                    const histData = await fetchHistory(5);
                    setHistory(histData.filter((h: any) => h.itemType === 'QUOOT' && h.itemId === deckId));
                }
            } catch (err) {
                console.error("Failed to load arena details:", err);
                toast.error("Failed to load arena details");
            } finally {
                setLoading(false);
            }
        };

        if (deckId) loadPageData();
    }, [deckId, user]);

    const handleShare = () => {
        navigator.clipboard.writeText(deckId);
        toast.success("Arena ID copied to clipboard!");
    };

    const handlePlay = () => {
        router.push(`/quoot/${deckId}`);
    };

    const handleClone = async () => {
        if (!user) {
            openAuth('LOGIN', {
                flowType: 'QUOOT',
                title: 'Clone to Your Collection',
                description: 'Sign in to clone this arena to your personal collection.'
            });
            return;
        }

        try {
            const { id: newId } = await cloneQuootArena(deckId);
            toast.success('Arena cloned successfully!', {
                description: 'A copy has been added to your collection.'
            });
            router.push(`/quoot/details/${newId}`);
        } catch (err) {
            toast.error('Failed to clone arena');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this arena?')) return;

        try {
            await deleteQuootArena(deckId);
            toast.success('Arena deleted');
            router.push('/quoot');
        } catch (err) {
            toast.error('Failed to delete arena');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-neutral-beige/20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Zap className="text-primary-strong animate-pulse" size={48} />
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink animate-pulse">Initializing Battle Arena...</div>
            </div>
        </div>
    );

    if (!arena) return (
        <div className="min-h-screen bg-neutral-beige/20 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-black mb-4">Arena Not Found</h1>
                <Link href="/quoot" className="text-primary-strong font-black uppercase text-xs tracking-widest">Back to Hub</Link>
            </div>
        </div>
    );

    const isOwner = user && user.id.toString() === arena.userId;

    // Define Actions for CommandPanel
    const commandActions: any[] = [
        {
            label: "Share Arena",
            icon: Share2,
            onClick: handleShare
        }
    ];

    if (!isOwner) {
        commandActions.push({
            label: "Clone to Collection",
            icon: Copy,
            onClick: handleClone,
            variant: "PRIMARY" as any
        });
    }

    if (isOwner) {
        commandActions.push({
            label: "Forge (Edit)",
            icon: Edit3,
            onClick: () => { }, // TODO: Edit Logic
            disabled: true // Placeholder
        });
        commandActions.push({
            label: "Delete Arena",
            icon: Trash2,
            onClick: handleDelete,
            variant: "DANGER" as any
        });
    }

    return (
        <DetailLayout>
            <DetailHeader
                title={arena.title}
                description={arena.description || "Master these symbols and dominate the arena. Every correct answer brings you closer to legendary status."}
                tags={[
                    { label: `${arena.levels?.[0] || 'N3'} Level`, color: 'bg-primary-strong/10 text-primary-strong' },
                    {
                        label: arena.visibility === 'global' ? 'Official Arena' : arena.visibility === 'public' ? 'Public' : 'Private',
                        icon: arena.visibility === 'global' ? <ShieldCheck size={12} /> : undefined
                    }
                ]}
                backHref="/quoot"
                backLabel="Back to Arena Hub"
                onAction={handlePlay}
                actionLabel="Enter Arena"
                actionIcon={<Play size={20} fill="currentColor" />}
                variant="GAME"
            />

            <DetailGrid>
                <DetailMain>
                    <MetricGrid>
                        <MetricCard
                            label="Top Rank"
                            value={arena.topScore ? `${arena.topScore}%` : '---'}
                            icon={<Crown size={18} />}
                            color="text-primary-strong"
                            trend="Season High"
                            trendDirection="up"
                        />
                        <MetricCard
                            label="Total Items"
                            value={arena.cardCount || 0}
                            icon={<Layers size={18} />}
                        />
                        <MetricCard
                            label="Global Plays"
                            value={arena.playCount || '1.2k'}
                            icon={<Users size={18} />}
                        />
                    </MetricGrid>

                    {/* Syllabus Browser */}
                    <div className="bg-neutral-white rounded-[2.5rem] p-10 border border-neutral-gray/20">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-neutral-ink font-display uppercase tracking-tight flex items-center gap-4">
                                <Eye size={24} className="text-primary-strong" />
                                The Syllabus
                            </h2>
                            <div className="text-[10px] font-black text-neutral-ink/30 uppercase tracking-widest">
                                {arena.cards?.length || 0} Vocab Units
                            </div>
                        </div>

                        <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                            {arena.cards?.map((card: any, idx: number) => (
                                <ItemRow key={idx} item={card} index={idx} />
                            ))}
                            {(!arena.cards || arena.cards.length === 0) && (
                                <div className="py-20 text-center text-neutral-ink/20">
                                    <Layers size={48} className="mx-auto mb-4" />
                                    <p className="font-bold">Items restricted for this venue.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DetailMain>

                <DetailSidebar>
                    <CommandPanel actions={commandActions} title="Battle Commands" />

                    {/* Game History/Stats */}
                    <div className="bg-neutral-white rounded-[2.5rem] p-8 border border-neutral-gray/20">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-black font-display text-neutral-ink/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Trophy size={14} className="text-primary-strong" />
                                {user ? "Your Battles" : "Activity"}
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {history.length > 0 ? history.map((record, idx) => (
                                <div key={idx} className="flex items-center gap-4 group p-3 hover:bg-neutral-gray/5 rounded-xl transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-primary-strong/10 flex items-center justify-center text-xs font-black text-primary-strong">
                                        {record.score}%
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                            {new Date(record.timestamp).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs font-bold text-neutral-ink">
                                            {record.status === 'COMPLETED' ? 'Victory' : 'Retreat'}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-8 text-center opacity-30">
                                    <History size={24} className="mx-auto mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No local records</p>
                                </div>
                            )}
                        </div>

                        {!user && (
                            <div className="pt-6 mt-6 border-t border-neutral-gray/10">
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 text-center">
                                    <Crown size={20} className="mx-auto mb-2 text-primary-strong" />
                                    <p className="text-[9px] font-bold text-primary-strong leading-relaxed mb-3">
                                        Sign in to join the leaderboard and track your mastery.
                                    </p>
                                    <button
                                        onClick={() => openAuth('LOGIN')}
                                        className="w-full py-3 bg-primary-strong text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                                    >
                                        Sign In
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
// =============================================================================
