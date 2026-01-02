"use client";

import React, { useState, useEffect } from 'react';
import {
    Activity,
    Cpu,
    Zap,
    MessageSquare,
    Layers,
    CheckCircle,
    AlertCircle,
    Clock,
    ArrowRight
} from 'lucide-react';

interface TraceEvent {
    step: string;
    status: string;
    timestamp: string;
    metadata: any;
}

interface Trace {
    trace_id: string;
    user_id: string;
    events: TraceEvent[];
    last_active: string;
}

export default function HanachanIODashboard() {
    const [traces, setTraces] = useState<Trace[]>([]);
    const [loading, setLoading] = useState(true);
    const [systemStatus, setSystemStatus] = useState({
        redis: 'checking',
        mongodb: 'checking',
        chromadb: 'checking',
        openai: 'checking'
    });
    const [memoryStats, setMemoryStats] = useState({ episodic_count: 0, semantic_count: 0 });

    const fetchTraces = async () => {
        try {
            const res = await fetch('/api/hanachan/traces?limit=10');
            const data = await res.json();
            setTraces(data.traces || []);
            setLoading(false);

            // Fetch Memory Stats for demo user
            const mRes = await fetch('http://localhost:5400/memory/stats?userId=user_demo_1');
            if (mRes.ok) {
                const mData = await mRes.json();
                setMemoryStats(mData);
            }
        } catch (err) {
            // Background fetch silent fail
        }
    };

    useEffect(() => {
        fetchTraces();
        const interval = setInterval(fetchTraces, 5000);

        // Mock system status - in real app would hit a /health endpoint
        setSystemStatus({
            redis: 'online',
            mongodb: 'online',
            chromadb: 'online',
            openai: 'online'
        });

        return () => clearInterval(interval);
    }, []);

    const injectSignal = async (type: string, priority: string = 'P2') => {
        try {
            const res = await fetch('/api/hanachan/signals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, priority, user_id: 'user_demo_1' })
            });
            const data = await res.json();
            if (res.ok) {
                fetchTraces();
            }
        } catch (err) {
            // Signal injection silent fail
        }
    };

    const getStepIcon = (step: string) => {
        switch (step) {
            case 'signal_produced': return <Zap className="w-4 h-4 text-accent" />;
            case 'policy_evaluated': return <Layers className="w-4 h-4 text-blue-500" />;
            case 'agent_invoked': return <Cpu className="w-4 h-4 text-primary" />;
            case 'response_delivered': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black font-display text-foreground flex items-center gap-3">
                        <Activity className="w-10 h-10 text-primary" />
                        Hanachan I/O
                    </h1>
                    <p className="text-neutral-ink mt-1">Real-time trace & orchestration of intelligent workflows.</p>
                </div>

                <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
                    <StatusIndicator label="Redis" status={systemStatus.redis} />
                    <div className="w-px h-8 bg-neutral-ink/10" />
                    <StatusIndicator label="MongoDB" status={systemStatus.mongodb} />
                    <div className="w-px h-8 bg-neutral-ink/10" />
                    <StatusIndicator label="AI Core" status={systemStatus.openai} />
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Live Nervous System Stream */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold font-display flex items-center gap-2">
                            <Zap className="w-5 h-5 text-accent" />
                            Workflow Traces
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-neutral-ink">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Live Monitoring
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="h-64 flex items-center justify-center bg-card rounded-2xl border border-border animate-pulse">
                                <p className="text-neutral-ink">Loading neural pathways...</p>
                            </div>
                        ) : traces.length === 0 ? (
                            <div className="h-64 flex items-center justify-center bg-card rounded-2xl border border-border">
                                <p className="text-neutral-ink">No active sessions detected.</p>
                            </div>
                        ) : (
                            traces.map((trace) => (
                                <div key={trace.trace_id} className="bg-card rounded-2xl border border-border overflow-hidden hover: transition-all duration-300">
                                    <div className="p-4 bg-muted/20 border-b border-border flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-neutral-ink">
                                            <span className="text-xs font-mono truncate max-w-[150px]">TRACE: {trace.trace_id}</span>
                                            <span className="px-2 py-0.5 bg-secondary/50 rounded-full text-[10px] font-bold uppercase tracking-wider">USER: {trace.user_id}</span>
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-neutral-ink/50">{new Date(trace.last_active).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="p-6 relative">
                                        {/* Connection Line */}
                                        <div className="absolute top-1/2 left-8 right-8 h-px bg-slate-100 -translate-y-1/2 z-0" />

                                        <div className="flex justify-between items-center relative z-10">
                                            {trace.events.map((event, idx) => (
                                                <div key={idx} className="flex flex-col items-center gap-2 group">
                                                    <div className={`p-3 rounded-full border-2 transition-transform group-hover:scale-110 ${event.status === 'SUCCESS' || event.status === 'ACCEPTED'
                                                        ? 'bg-white border-primary shadow-Sakura-Soft'
                                                        : 'bg-white border-neutral-ink shadow-sm opacity-50'
                                                        }`}>
                                                        {getStepIcon(event.step)}
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-neutral-ink">{event.step.replace('_', ' ')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Metadata Peek */}
                                    <div className="px-6 pb-4 flex gap-4 overflow-x-auto">
                                        {trace.events.filter(e => e.metadata && Object.keys(e.metadata).length > 0).map((e, i) => (
                                            <div key={i} className="text-[10px] bg-secondary/30 px-2 py-1 rounded border border-border/50 text-neutral-ink whitespace-nowrap">
                                                {e.step}: {JSON.stringify(e.metadata)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar: AI Reasoner State */}
                <div className="space-y-6">
                    {/* Signal Injection */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm border-t-4 border-t-accent">
                        <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-accent" />
                            Neural Command Center
                        </h3>
                        <p className="text-xs text-neutral-ink mb-4 italic">Manually trigger intelligent workflows for testing.</p>
                        <div className="grid grid-cols-1 gap-2">
                            <button
                                onClick={() => injectSignal('streak_at_risk', 'P1')}
                                className="flex items-center justify-between px-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-xl text-xs font-bold transition-colors group"
                            >
                                <span>Streak at Risk (P1)</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => injectSignal('lesson_completed', 'P2')}
                                className="flex items-center justify-between px-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-xl text-xs font-bold transition-colors group"
                            >
                                <span>Lesson Completed (P2)</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => injectSignal('missed_goal', 'P0')}
                                className="flex items-center justify-between px-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-xl text-xs font-bold border border-red-100 text-red-600 transition-colors group"
                            >
                                <span>Critical Missed Goal (P0)</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                        <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-4">
                            <Cpu className="w-5 h-5 text-primary" />
                            AI Memory Load
                        </h3>
                        <div className="space-y-4">
                            <MemoryStat
                                label="Episodic History"
                                value={`${memoryStats.episodic_count} nodes`}
                                color="bg-sakura-pink"
                                percent={Math.min(100, (memoryStats.episodic_count / 100) * 100)}
                            />
                            <MemoryStat
                                label="Semantic Facts"
                                value={`${memoryStats.semantic_count} vectors`}
                                color="bg-indigo-500"
                                percent={Math.min(100, (memoryStats.semantic_count / 50) * 100)}
                            />
                            <MemoryStat label="Signal Buffer" value="0 queued" color="bg-accent" percent={0} />
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm overflow-hidden relative">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                        <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-4 text-Sakura-Strong">
                            <MessageSquare className="w-5 h-5" />
                            System Nudges
                        </h3>
                        <div className="space-y-3">
                            <NudgeItem
                                time="Live"
                                msg={`Active Context: ${memoryStats.episodic_count > 0 ? 'Rich history available' : 'Waiting for interactions...'}`}
                                icon={<CheckCircle className="w-3 h-3 text-emerald-500" />}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatusIndicator({ label, status }: { label: string; status: string }) {
    const isOnline = status === 'online';
    return (
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-sm' : 'bg-amber-500'}`} />
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-neutral-ink uppercase leading-none">{label}</span>
                <span className={`text-[10px] font-bold ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {status.toUpperCase()}
                </span>
            </div>
        </div>
    );
}

function MemoryStat({ label, value, color, percent }: { label: string; value: string; color: string; percent: number }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
                <span className="text-neutral-ink">{label}</span>
                <span className="text-foreground">{value}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}

function NudgeItem({ time, msg, icon }: { time: string; msg: string; icon: React.ReactNode }) {
    return (
        <div className="flex gap-3 text-xs">
            <div className="mt-1">{icon}</div>
            <div>
                <p className="text-foreground leading-snug">{msg}</p>
                <span className="text-[10px] text-neutral-ink uppercase font-bold opacity-50">{time}</span>
            </div>
        </div>
    );
}
