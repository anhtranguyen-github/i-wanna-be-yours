"use client";

/**
 * Premium Practice Result Page
 * Featuring "Midnight Sakura" design, Lantern Score Indicator, and AI Assistant
 */

import React, { useMemo, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Trophy, CheckCircle2, XCircle, AlertTriangle,
    RotateCcw, Home, ChevronRight, Target, BookOpen,
    Clock, Flame, Star, ArrowLeft, Sparkles, MessageSquare,
    ChevronDown, ChevronUp, Brain, Volume2
} from "lucide-react";
import { practiceService } from "@/services/practiceService";
import { Question, PracticeNode } from "@/types/practice";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { ResultShell } from "@/components/results/ResultShell";
import { mapResultIcons } from "@/utils/resultProcessor";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

export default function PremiumResultPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const nodeId = params?.nodeId as string;
    const attemptId = searchParams.get('attemptId');
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
    const [unifiedResult, setUnifiedResult] = useState<any>(null);

    const [node, setNode] = useState<PracticeNode | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load data from API
    useEffect(() => {
        if (!nodeId) return;

        const loadContent = async () => {
            setIsLoading(true);
            try {
                // Fetch node details
                const data = await practiceService.getNodeSessionData(nodeId);
                setNode(data.node);
                setQuestions(data.questions);

                // Fetch attempt details if attemptId is present, or fetch the latest for the user
                if (attemptId) {
                    console.log("Fetching attempt result for ID:", attemptId);
                    // The service already uses skipAuthCheck: true
                    const resultData = await practiceService.getAttemptResult(attemptId);
                    console.log("Backend result received:", resultData);
                    setUnifiedResult(mapResultIcons(resultData));
                } else {
                    // Fallback to latest attempt if no ID (only if user is logged in)
                    const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || Cookies.get('accessToken')) : null;
                    if (token) {
                        const attemptsData = await practiceService.getAttempts();
                        const latest = attemptsData.attempts?.find((a: any) => a.nodeId === nodeId);
                        if (latest) {
                            const resultData = await practiceService.getAttemptResult(latest.id);
                            setUnifiedResult(mapResultIcons(resultData));
                        }
                    } else {
                        // For guest, if no attemptId, we can't show much but maybe a generic score 0
                        setUnifiedResult(mapResultIcons({
                            result: {
                                score: 0,
                                accuracy: 0,
                                feedback: { title: "Protocol Complete", message: "Anonymous analysis limited. Sign in to save progress.", suggestions: ["Create an account"] }
                            }
                        }));
                    }
                }
            } catch (err) {
                console.error("Failed to load practice result content:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadContent();
    }, [nodeId, attemptId, user]);

    // Session Claiming Logic
    // If a guest finishes an exam and then logs in, we claim that anonymous result for them.
    useEffect(() => {
        if (user && unifiedResult?.isAnonymous && attemptId) {
            const autoClaim = async () => {
                try {
                    console.log("[AuthAware] Anonymous result detected for logged-in user. Claiming...");
                    await practiceService.claimAttempt(attemptId);

                    // Refresh data after claiming
                    const resultData = await practiceService.getAttemptResult(attemptId);
                    setUnifiedResult(mapResultIcons(resultData));
                    console.log("[AuthAware] Attempt claimed and refreshed.");
                } catch (e) {
                    console.error("[AuthAware] Failed to claim anonymous attempt:", e);
                }
            };
            autoClaim();
        }
    }, [user, unifiedResult?.isAnonymous, attemptId]);

    const toggleQuestion = (id: string) => {
        setExpandedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleAskAI = (context?: string) => {
        if (!user) {
            openAuth('LOGIN', {
                title: 'Hanachan AI Assistance',
                description: 'Log in to get personalized explanations and study tips from Hanachan.',
                flowType: 'PRACTICE'
            });
            return;
        }
        router.push(`/chat?message=${encodeURIComponent(`Can you explain why I was wrong with this question? ${context || ''}`)}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-beige/20 flex flex-col items-center justify-center p-8">
                <div className="relative w-24 h-24 mb-6">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-primary/20 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-t-secondary/60 rounded-full border-transparent"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className="text-primary-strong animate-pulse" size={32} />
                    </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-ink/60 font-display">Neural Reconstitution...</p>
            </div>
        );
    }

    if (!node || !unifiedResult) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95">
                <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-[2rem] flex items-center justify-center mb-8 border border-destructive/20 shadow-2xl shadow-destructive/5">
                    <AlertTriangle size={48} />
                </div>
                <h2 className="text-3xl font-black text-foreground font-display mb-4 italic">Registry Inaccessible</h2>
                <p className="text-neutral-ink font-bold mb-8 max-w-sm">
                    The requested practice diagnostic could not be synchronized. It may have been decommissioned or moved to a restricted sector.
                </p>
                <Link
                    href="/practice"
                    className="px-10 py-5 bg-foreground text-background font-black font-display text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-foreground/90 transition-all active:scale-95 shadow-xl shadow-foreground/10"
                >
                    Return to Nexus Hub
                </Link>
            </div>
        );
    }

    const wrongQuestions = questions.filter(q => {
        const storedAnswer = unifiedResult?.answers?.find((a: any) => a.questionId === q.id);
        return storedAnswer && !storedAnswer.isCorrect;
    });

    return (
        <ResultShell
            result={unifiedResult}
            onRetry={() => router.push(`/practice/session/${nodeId}`)}
            hubPath="/practice"
            hubLabel="Practice Nexus"
            customActions={
                <button
                    onClick={() => handleAskAI()}
                    className="h-16 px-10 bg-neutral-white border-2 border-neutral-gray/10 text-neutral-ink rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 hover:border-primary-strong/30 hover:bg-neutral-beige/10 transition-all active:scale-95 shadow-sm"
                >
                    <MessageSquare size={20} className="text-secondary" />
                    Consult AI Tutor
                </button>
            }
        >
            {/* Detailed Review Section */}
            {wrongQuestions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.8 }}
                    className="mt-24 space-y-12"
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-gray/10">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                                <Target size={28} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-neutral-ink font-display tracking-tight">Optimization Vectors</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-ink/40">Resolve identified linguistic anomalies</p>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-neutral-white rounded-xl border border-neutral-gray/10 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/60">Total Errors: </span>
                            <span className="text-lg font-black text-rose-600">{wrongQuestions.length}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {wrongQuestions.map((q, i) => {
                            const storedAnswer = unifiedResult?.answers?.find((a: any) => a.questionId === q.id);
                            const userOption = q.options.find(o => o.id === storedAnswer?.selectedOptionId);
                            const correctOption = q.options.find(o => o.id === q.correctOptionId);
                            const isExpanded = expandedQuestions.has(q.id);

                            return (
                                <motion.div
                                    key={q.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 3 + (i * 0.1) }}
                                    className="bg-neutral-white/60 backdrop-blur-md border border-neutral-gray/10 rounded-[2.5rem] overflow-hidden group hover:border-primary-strong/30 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-primary/5"
                                >
                                    <button
                                        onClick={() => toggleQuestion(q.id)}
                                        className="w-full text-left p-10 flex items-center justify-between gap-8 group"
                                    >
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-primary-strong/10 text-primary-strong rounded-lg text-[9px] font-black uppercase tracking-widest">{q.type || 'Cognitive'}</span>
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-ink/30 italic">Target #{i + 1}</span>
                                            </div>
                                            <p className="text-2xl font-black text-neutral-ink leading-tight group-hover:text-primary-strong transition-colors font-jp">{q.content}</p>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            <div className="text-right hidden sm:block">
                                                <span className="block text-[9px] font-black uppercase tracking-widest text-rose-500/50 mb-1">Detected</span>
                                                <span className="text-lg font-black text-rose-600">{userOption?.text || 'Void'}</span>
                                            </div>
                                            <div className={`w-12 h-12 rounded-xl border border-neutral-gray/10 flex items-center justify-center group-hover:bg-neutral-white transition-all ${isExpanded ? 'rotate-180 bg-neutral-white shadow-inner' : ''}`}>
                                                <ChevronDown size={20} className="text-neutral-ink/60" />
                                            </div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-10 pb-10 border-t border-neutral-gray/5 bg-neutral-beige/20 space-y-8 overflow-hidden"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                                    <div className="p-8 bg-rose-500/5 rounded-[2rem] border border-rose-500/10 shadow-inner group/box">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <XCircle size={16} className="text-rose-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/60">Anomalous Input</span>
                                                        </div>
                                                        <p className="text-xl font-black text-neutral-ink font-jp">{userOption?.text || 'No response captured'}</p>
                                                    </div>
                                                    <div className="p-8 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 shadow-inner group/box">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60">Correct Terminal</span>
                                                        </div>
                                                        <p className="text-xl font-black text-neutral-ink font-jp">{correctOption?.text}</p>
                                                    </div>
                                                </div>

                                                {q.explanation && (
                                                    <div className="p-10 bg-neutral-white border border-neutral-gray/10 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                                        <div className="flex items-center gap-4 mb-6 relative z-10">
                                                            <div className="w-10 h-10 bg-primary-strong/10 text-primary-strong rounded-xl flex items-center justify-center">
                                                                <Brain size={20} />
                                                            </div>
                                                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-neutral-ink/60">Linguistic Analysis</span>
                                                        </div>
                                                        <p className="text-xl font-bold text-neutral-ink/80 leading-relaxed font-jp relative z-10 italic">
                                                            &quot;{q.explanation}&quot;
                                                        </p>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => handleAskAI(`I got this question wrong: "${q.content}". My answer: "${userOption?.text}". Correct: "${correctOption?.text}". Explain why.`)}
                                                    className="w-full h-16 bg-neutral-ink text-neutral-beige rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-primary-strong transition-all shadow-xl shadow-neutral-ink/10 group/ai"
                                                >
                                                    <Sparkles size={18} className="text-secondary group-hover:scale-125 transition-transform" />
                                                    Initiate Specific Node Breakdown
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </ResultShell>
    );
}
