"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Activity,
    Database,
    Beaker,
    Play,
    Share2,
    Settings,
    BookOpen,
    BarChart3,
    Clock,
    UserCheck,
    ArrowLeft,
    CheckCircle2,
    ShieldCheck,
    Clipboard,
    History as HistoryIcon,
    AlertCircle,
    Copy,
    Trash2,
    Users
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { getNodeSessionData, getAttempts, cloneNode, deleteNode } from "@/services/practiceService";
import { fetchHistory } from "@/services/recordService";
import { motion } from "framer-motion";
import { toast } from "sonner";

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function MetricBox({ label, value, subtext, icon: Icon, trend }: any) {
    return (
        <div className="bg-white border border-neutral-gray/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon size={48} />
            </div>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Icon size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/50">{label}</span>
            </div>
            <div className="text-3xl font-black text-neutral-ink mb-1">{value}</div>
            <div className="text-[10px] font-bold text-neutral-ink/30 uppercase">{subtext}</div>
            {trend && (
                <div className={`mt-4 text-[10px] font-bold ${trend > 0 ? 'text-green-500' : 'text-amber-500'}`}>
                    {trend > 0 ? '+' : ''}{trend}% stability factor
                </div>
            )}
        </div>
    );
}

function SyllabusItem({ item, index }: any) {
    return (
        <div className="flex items-center gap-4 p-4 bg-neutral-beige/30 border border-transparent hover:border-blue-200 hover:bg-white transition-all rounded-xl group">
            <div className="w-8 h-8 rounded-lg bg-white border border-neutral-gray/10 flex items-center justify-center text-[10px] font-black text-blue-600">
                {index + 1}
            </div>
            <div className="flex-1">
                <div className="text-sm font-bold text-neutral-ink">{item.content}</div>
                <div className="text-[9px] font-black uppercase tracking-tighter text-neutral-ink/30">Protocol Entry</div>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-neutral-gray/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '65%' }} />
                </div>
                <span className="text-[9px] font-black text-blue-600/50">65%</span>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function PracticeDetailPage() {
    const { setId } = useParams() as { setId: string };
    const router = useRouter();
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    const [practiceSet, setPracticeSet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);
    const [personalBest, setPersonalBest] = useState<number | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { node, questions } = await getNodeSessionData(setId);
                setPracticeSet({ ...node, questions });

                if (user) {
                    const histData = await fetchHistory(10);
                    const relevant = histData.filter((h: any) => h.itemType === 'PRACTICE' && h.itemId === setId);
                    setRecords(relevant);

                    if (relevant.length > 0) {
                        setPersonalBest(Math.max(...relevant.map((r: any) => r.score || 0)));
                    }
                }
            } catch (err) {
                console.error("Failed to load practice details:", err);
                toast.error("Failed to load analysis blueprint");
            } finally {
                setLoading(false);
            }
        };

        if (setId) loadData();
    }, [setId, user]);

    const handleCommence = () => {
        router.push(`/practice/session/${setId}`);
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(setId);
        toast.info("Protocol ID replicated to clipboard");
    };

    const handleClone = async () => {
        if (!user) {
            openAuth('LOGIN', {
                flowType: 'PRACTICE',
                title: 'Clone to Your Collection',
                description: 'Sign in to clone this practice set to your personal collection.'
            });
            return;
        }

        try {
            const { id: newId } = await cloneNode(setId);
            toast.success('Practice set cloned!', {
                description: 'A copy has been added to your collection.'
            });
            router.push(`/practice/details/${newId}`);
        } catch (err) {
            toast.error('Failed to clone practice set');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this practice set?')) return;

        try {
            await deleteNode(setId);
            toast.success('Practice set deleted');
            router.push('/practice');
        } catch (err) {
            toast.error('Failed to delete practice set');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Activity className="text-blue-600 animate-spin" size={32} />
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-900/40">Synchronizing Neural Patterns...</div>
            </div>
        </div>
    );

    if (!practiceSet) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
                <h1 className="text-xl font-black text-neutral-ink mb-2">Analysis Failed</h1>
                <p className="text-sm font-bold text-neutral-ink/40 mb-6">Specified data node is unreachable or corrupt.</p>
                <Link href="/practice" className="px-6 py-2 bg-neutral-ink text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Return to Hub</Link>
            </div>
        </div>
    );

    const isOwner = user && user.id.toString() === practiceSet.creatorId;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Laboratory Header */}
            <div className="bg-white border-b border-neutral-gray/10 pt-16 pb-12 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />

                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <Link
                        href="/practice"
                        className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest mb-8"
                    >
                        <ArrowLeft size={16} />
                        Index / {practiceSet.mode || 'Drills'}
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-2 py-0.5 bg-blue-600 text-[9px] font-black text-white rounded uppercase tracking-widest">
                                    Protocol: {practiceSet.level || 'Standard'}
                                </span>
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-neutral-beige/50 rounded text-[9px] font-black text-neutral-ink/50 uppercase tracking-widest">
                                    {practiceSet.visibility === 'global' ? (
                                        <><ShieldCheck size={10} className="text-blue-500" /> Official</>
                                    ) : isOwner ? (
                                        practiceSet.visibility === 'public' ? 'Shared' : 'Private'
                                    ) : (
                                        <><Users size={10} /> By @{practiceSet.creatorName || 'User'}</>
                                    )}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-neutral-ink tracking-tight mb-4 lowercase">
                                {practiceSet.title}
                            </h1>
                            <p className="text-sm font-bold text-neutral-ink/50 leading-relaxed">
                                {practiceSet.description || "Comprehensive neural recalibration for targeted linguistic structures. Recommended minimum of 3 cycles for stability."}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleCommence}
                                className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3"
                            >
                                <Play size={20} fill="currentColor" />
                                Commence Practice
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Section: Analysis & Syllabus */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <MetricBox
                                label="Mastery Index"
                                value={personalBest ? `${personalBest}%` : '0.00%'}
                                subtext="Current Efficiency"
                                icon={Activity}
                                trend={personalBest ? 5 : null}
                            />
                            <MetricBox
                                label="Data Points"
                                value={practiceSet.questions?.length || 0}
                                subtext="Active Segments"
                                icon={Database}
                            />
                            <MetricBox
                                label="Mean Latency"
                                value="1.4s"
                                subtext="Response Speed"
                                icon={Clock}
                            />
                        </div>

                        {/* Syllabus Analysis */}
                        <section className="bg-white border border-neutral-gray/10 rounded-[2.5rem] p-10">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-neutral-ink uppercase tracking-tight flex items-center gap-3">
                                    <BookOpen size={20} className="text-blue-600" />
                                    Segment Analysis
                                </h2>
                                <div className="px-3 py-1 bg-neutral-beige rounded text-[9px] font-black text-neutral-ink/40 uppercase tracking-widest">
                                    {practiceSet.questions?.length || 0} Items
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {practiceSet.questions?.map((item: any, idx: number) => (
                                    <SyllabusItem key={idx} item={item} index={idx} />
                                ))}
                                {(!practiceSet.questions || practiceSet.questions.length === 0) && (
                                    <div className="col-span-full py-16 text-center">
                                        <Beaker size={32} className="mx-auto text-neutral-gray/30 mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/20">Empty Data Set</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Section: Ops & Records */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Ops Matrix */}
                        <section className="bg-white border border-neutral-gray/10 rounded-[2.5rem] p-8 space-y-4">
                            <h3 className="text-[10px] font-black text-neutral-ink/40 uppercase tracking-[0.2em] mb-4">Operations Matrix</h3>

                            <button
                                onClick={handleCopyId}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 transition-all text-neutral-ink group"
                            >
                                <div className="flex items-center gap-3">
                                    <Clipboard size={16} className="text-neutral-ink/30" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Protocol ID</span>
                                </div>
                                <div className="text-[9px] font-mono opacity-30 group-hover:opacity-100">{setId.slice(0, 8)}</div>
                            </button>

                            <button className="w-full flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all text-neutral-ink">
                                <Share2 size={16} className="text-neutral-ink/30" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Disseminate</span>
                            </button>

                            {/* Clone button - only for non-owners */}
                            {!isOwner && (
                                <button
                                    onClick={handleClone}
                                    className="w-full flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-neutral-ink"
                                >
                                    <Copy size={16} className="text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Clone to Collection</span>
                                </button>
                            )}

                            {isOwner && (
                                <>
                                    <button className="w-full flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all text-neutral-ink">
                                        <Settings size={16} className="text-neutral-ink/30" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Calibrate (Edit)</span>
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 hover:bg-red-100 transition-all"
                                    >
                                        <Trash2 size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Delete Protocol</span>
                                    </button>
                                </>
                            )}
                        </section>

                        {/* Recent Calibration Logs */}
                        <section className="bg-blue-900 border border-blue-800 rounded-[2.5rem] p-8 text-white">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <HistoryIcon size={14} className="text-blue-400" />
                                Calibration Registry
                            </h3>

                            <div className="space-y-6">
                                {records.length > 0 ? records.map((record, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:scale-150 transition-transform" />
                                            <div>
                                                <div className="text-[9px] font-black opacity-30 uppercase tracking-widest">
                                                    {new Date(record.timestamp).toLocaleDateString()}
                                                </div>
                                                <div className="text-[11px] font-bold">Cycle {records.length - idx}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black">{record.score}%</div>
                                            <div className="text-[8px] font-black opacity-30 uppercase">Stability</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center opacity-10">
                                        <BarChart3 size={24} className="mx-auto mb-2" />
                                        <p className="text-[9px] font-black uppercase tracking-widest">No local telemetry</p>
                                    </div>
                                )}
                            </div>

                            {!user && (
                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                                        <div className="text-[9px] font-bold opacity-60 uppercase mb-4 leading-relaxed">
                                            Authenticate to persist neural calibration data
                                        </div>
                                        <button
                                            onClick={() => openAuth('LOGIN')}
                                            className="w-full py-3 bg-white text-blue-900 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Identity Verification
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
