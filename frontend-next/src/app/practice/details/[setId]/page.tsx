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
    Clock,
    ArrowLeft,
    ShieldCheck,
    Clipboard,
    History as HistoryIcon,
    AlertCircle,
    Copy,
    Trash2,
    Users,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { getNodeSessionData, getAttempts, cloneNode, deleteNode } from "@/services/practiceService";
import { fetchHistory } from "@/services/recordService";
import { toast } from "sonner";

// Unified Components
import { DetailLayout, DetailGrid, DetailMain, DetailSidebar } from "@/components/shared/details/DetailLayout";
import { DetailHeader } from "@/components/shared/details/DetailHeader";
import { MetricCard, MetricGrid } from "@/components/shared/details/MetricCard";
import { CommandPanel } from "@/components/shared/details/CommandPanel";

// =============================================================================
// LOCAL SUB-COMPONENTS
// =============================================================================

function SyllabusItem({ item, index }: any) {
    return (
        <div className="flex items-center gap-4 p-4 bg-white border border-neutral-gray/10 hover:border-practice-blue/30 hover:bg-neutral-gray/5 transition-all rounded-xl group">
            <div className="w-8 h-8 rounded-lg bg-practice-blue/10 border border-practice-blue/20 flex items-center justify-center text-[10px] font-black text-practice-blue">
                {index + 1}
            </div>
            <div className="flex-1">
                <div className="text-sm font-bold text-neutral-ink">{item.content}</div>
                <div className="text-[9px] font-black uppercase tracking-tighter text-neutral-ink/30">Protocol Entry</div>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-neutral-gray/10 rounded-full overflow-hidden">
                    <div className="h-full bg-practice-blue" style={{ width: '65%' }} />
                </div>
                <span className="text-[9px] font-black text-practice-blue/50">65%</span>
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
                <Activity className="text-practice-blue animate-spin" size={32} />
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

    // Define Actions for CommandPanel
    const commandActions: any[] = [
        {
            label: "Protocol ID",
            icon: Clipboard,
            onClick: handleCopyId
        },
        {
            label: "Disseminate",
            icon: Share2,
            onClick: () => { } // Placeholder
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
            label: "Calibrate (Edit)",
            icon: Settings,
            onClick: () => { }, // TODO: Edit Logic
            disabled: true // Placeholder
        });
        commandActions.push({
            label: "Delete Protocol",
            icon: Trash2,
            onClick: handleDelete,
            variant: "DANGER" as any
        });
    }

    return (
        <DetailLayout>
            <DetailHeader
                title={practiceSet.title}
                description={practiceSet.description || "Comprehensive neural recalibration for targeted linguistic structures."}
                tags={[
                    { label: `Protocol: ${practiceSet.levels?.[0] || 'Standard'}`, color: 'bg-practice-blue/10 text-practice-blue' },
                    {
                        label: practiceSet.visibility === 'global' ? 'Official Protocol' : practiceSet.visibility === 'public' ? 'Public' : 'Private',
                        icon: practiceSet.visibility === 'global' ? <ShieldCheck size={12} /> : undefined
                    }
                ]}
                backHref="/practice"
                backLabel="Index / Drills"
                onAction={handleCommence}
                actionLabel="Commence Practice"
                variant="TECHNICAL"
                actionIcon={<Play size={20} fill="currentColor" />}
            />

            <DetailGrid>
                <DetailMain>
                    <MetricGrid>
                        <MetricCard
                            label="Your Mastery Index"
                            value={personalBest ? `${personalBest}%` : '---'}
                            icon={<Activity size={18} />}
                            trend={personalBest ? "+5%" : undefined}
                            trendDirection="up"
                            isLocked={!user}
                            onLockClick={() => openAuth('LOGIN', { flowType: 'PRACTICE', title: 'Unlock Mastery Tracking', description: 'Sign in to sync your practice history and visualize your learning curve.' })}
                        />
                        <MetricCard
                            label="Data Points"
                            value={practiceSet.questions?.length || 0}
                            icon={<Database size={18} />}
                        />
                        <MetricCard
                            label="Mean Latency"
                            value="1.4s"
                            icon={<Clock size={18} />}
                            isLocked={!user}
                            onLockClick={() => openAuth('LOGIN', { flowType: 'PRACTICE', title: 'Latency Analysis', description: 'Real-time performance metrics are reserved for authenticated operators.' })}
                        />
                    </MetricGrid>

                    {/* Syllabus / Segment Analysis */}
                    <div className="bg-neutral-white rounded-[2.5rem] p-10 border border-neutral-gray/20">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-neutral-ink uppercase tracking-tight flex items-center gap-3">
                                <BookOpen size={20} className="text-practice-blue" />
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
                    </div>
                </DetailMain>

                <DetailSidebar>
                    <CommandPanel actions={commandActions} title="Operations Matrix" />

                    {/* Calibration Registry (History) */}
                    <div className="bg-neutral-white rounded-[2.5rem] p-8 border border-neutral-gray/20">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-neutral-ink/40">
                                <HistoryIcon size={14} className="text-practice-blue" />
                                Calibration Registry
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {records.length > 0 ? records.map((record, idx) => (
                                <div key={idx} className="flex items-center justify-between group p-2 hover:bg-neutral-gray/5 rounded transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-practice-blue group-hover:scale-150 transition-transform" />
                                        <div>
                                            <div className="text-[9px] font-black opacity-30 uppercase tracking-widest">
                                                {new Date(record.timestamp).toLocaleDateString()}
                                            </div>
                                            <div className="text-[11px] font-bold text-neutral-ink">Cycle {records.length - idx}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-neutral-ink">{record.score}%</div>
                                        <div className="text-[8px] font-black opacity-30 uppercase">Stability</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center opacity-30">
                                    <BarChart3 size={24} className="mx-auto mb-2" />
                                    <p className="text-[9px] font-black uppercase tracking-widest">No local telemetry</p>
                                </div>
                            )}
                        </div>

                        {!user && (
                            <div className="mt-8 pt-8 border-t border-neutral-gray/10">
                                <div className="p-4 bg-practice-blue/5 rounded-xl border border-practice-blue/10 text-center">
                                    <div className="text-[9px] font-bold text-practice-blue uppercase mb-4 leading-relaxed">
                                        Authenticate to persist neural calibration data
                                    </div>
                                    <button
                                        onClick={() => openAuth('LOGIN')}
                                        className="w-full py-3 bg-practice-blue text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90"
                                    >
                                        Identity Verification
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
