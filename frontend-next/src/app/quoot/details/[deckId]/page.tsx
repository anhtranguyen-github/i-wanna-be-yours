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
    CheckCircle2,
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

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({ label, value, icon: Icon, colorClass, highlight = false }: any) {
    return (
        <div className={`
            relative overflow-hidden group p-6 rounded-[2rem] border transition-all duration-500
            ${highlight
                ? 'bg-primary-strong border-primary-strong text-white shadow-xl shadow-primary/20 scale-105'
                : 'bg-white/80 backdrop-blur-md border-neutral-gray/20 text-neutral-ink hover:border-primary-strong/30 hover:shadow-lg'}
        `}>
            <div className={`
                absolute -right-4 -top-4 w-24 h-24 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700
                ${colorClass || 'text-neutral-ink'}
            `}>
                <Icon size={96} />
            </div>

            <div className="relative z-10">
                <div className={`p-2 rounded-xl w-fit mb-4 ${highlight ? 'bg-white/20' : 'bg-neutral-beige'}`}>
                    <Icon size={20} className={highlight ? 'text-white' : 'text-primary-strong'} />
                </div>
                <div className={`text-3xl font-black font-display mb-1 ${highlight ? 'text-white' : ''}`}>
                    {value}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${highlight ? 'text-white/70' : 'text-neutral-ink/50'}`}>
                    {label}
                </div>
            </div>
        </div>
    );
}

function ItemRow({ item, index }: any) {
    const [revealed, setRevealed] = useState(false);

    return (
        <div
            onMouseEnter={() => setRevealed(true)}
            onMouseLeave={() => setRevealed(false)}
            className="flex items-center gap-6 p-4 rounded-2xl bg-white/40 border border-neutral-gray/10 hover:border-primary-strong/30 hover:bg-white/60 transition-all group"
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
    const [isCopying, setIsCopying] = useState(false);

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
        setIsCopying(true);
        toast.success("Arena ID copied to clipboard!");
        setTimeout(() => setIsCopying(false), 2000);
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

    return (
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            {/* Holographic Header Background */}
            <div className="h-[40vh] bg-neutral-ink relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary-strong/20 to-neutral-ink" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#ff336644,transparent)]" />

                {/* Back Button */}
                <Link
                    href="/quoot"
                    className="absolute top-8 left-8 z-20 flex items-center gap-2 text-[10px] font-black text-white hover:text-primary transition-colors uppercase tracking-widest group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Hub
                </Link>

                {/* Animated Particles (CSS based) */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                    {/* Simplified representation of grid lines or particles */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-12 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-8"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-primary-strong rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                                    {arena.level || 'N3'} Level
                                </span>
                                <span className="flex items-center gap-1 px-3 py-1 bg-neutral-beige/30 rounded-full text-[10px] font-black text-neutral-beige/80 uppercase tracking-widest">
                                    {arena.visibility === 'global' ? (
                                        <><ShieldCheck size={10} /> Official</>
                                    ) : isOwner ? (
                                        arena.visibility === 'public' ? 'Shared' : 'Private'
                                    ) : (
                                        `By @${arena.creatorName || 'User'}`
                                    )}
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white font-display tracking-tighter leading-none">
                                {arena.title}
                            </h1>
                            <p className="text-lg font-bold text-neutral-beige/40 max-w-xl">
                                {arena.description || "Master these symbols and dominate the arena. Every correct answer brings you closer to legendary status."}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handlePlay}
                                className="group relative px-12 py-6 bg-primary-strong rounded-3xl overflow-hidden active:scale-95 transition-all shadow-2xl shadow-primary/40"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                <div className="relative z-10 flex items-center gap-3 text-white">
                                    <Play size={24} fill="currentColor" />
                                    <span className="text-xl font-black uppercase tracking-widest font-display">Play Now</span>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Main Content Grid */}
            <main className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Stats & Items */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Highlights Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <StatCard
                                label="Top Rank"
                                value={arena.topScore ? `${arena.topScore}%` : '---'}
                                icon={Crown}
                                colorClass="text-secondary"
                                highlight={true}
                            />
                            <StatCard
                                label="Total Items"
                                value={arena.cardCount || 0}
                                icon={Layers}
                                colorClass="text-primary"
                            />
                            <StatCard
                                label="Global Plays"
                                value={arena.playCount || '1.2k'}
                                icon={Users}
                                colorClass="text-neutral-ink"
                            />
                        </div>

                        {/* Item Browser */}
                        <div className="bg-white/60 backdrop-blur-xl border border-neutral-gray/20 rounded-[3rem] p-10">
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
                    </div>

                    {/* Right Column: Actions & Social */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Command Center */}
                        <div className="bg-neutral-white border border-neutral-gray/20 rounded-[3rem] p-8 space-y-4">
                            <h3 className="text-sm font-black text-neutral-ink font-display uppercase tracking-[0.2em] mb-6">Commands</h3>

                            <button
                                onClick={handleShare}
                                className="w-full flex items-center justify-between p-4 bg-neutral-beige rounded-2xl hover:bg-primary/10 hover:text-primary-strong transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Share2 size={18} />
                                    <span className="text-xs font-black uppercase tracking-widest">Share Arena</span>
                                </div>
                                <div className="text-[10px] font-mono opacity-40 group-hover:opacity-100">{deckId.slice(0, 8)}...</div>
                            </button>

                            {/* Clone button - only for non-owners */}
                            {!isOwner && (
                                <button
                                    onClick={handleClone}
                                    className="w-full flex items-center gap-3 p-4 bg-neutral-beige rounded-2xl hover:bg-primary/10 hover:text-primary-strong transition-all"
                                >
                                    <Copy size={18} />
                                    <span className="text-xs font-black uppercase tracking-widest">Clone to My Collection</span>
                                </button>
                            )}

                            {isOwner && (
                                <>
                                    <button className="w-full flex items-center gap-3 p-4 bg-neutral-beige rounded-2xl hover:bg-secondary/10 hover:text-secondary transition-all">
                                        <Edit3 size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Forge (Edit)</span>
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-2xl text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
                                    >
                                        <Trash2 size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Delete Arena</span>
                                    </button>
                                </>
                            )}

                            {!user && (
                                <div className="pt-4 mt-4 border-t border-neutral-gray/10">
                                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                                        <p className="text-[10px] font-bold text-primary-strong leading-relaxed">
                                            SIGN IN TO JOIN THE LEADERBOARD AND TRACK YOUR MASTERY.
                                        </p>
                                        <button
                                            onClick={() => openAuth('LOGIN')}
                                            className="mt-3 w-full py-3 bg-primary-strong text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Sign In
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Personal History or Global Activity */}
                        <div className="bg-neutral-ink rounded-[3rem] p-8 text-white">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-black font-display uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Trophy size={14} className="text-primary" />
                                    {user ? "Your Battles" : "Recent Activity"}
                                </h3>
                            </div>

                            <div className="space-y-6">
                                {history.length > 0 ? history.map((record, idx) => (
                                    <div key={idx} className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black">
                                            {record.score}%
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                                {new Date(record.timestamp).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs font-bold truncate max-w-[150px]">
                                                {record.status === 'COMPLETED' ? 'Victory' : 'Retreat'}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center opacity-20">
                                        <History size={32} className="mx-auto mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No local records</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
