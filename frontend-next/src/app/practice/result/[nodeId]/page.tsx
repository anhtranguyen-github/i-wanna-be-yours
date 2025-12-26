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
import { processPracticeResult } from "@/utils/resultProcessor";

export default function PremiumResultPage() {
    const params = useParams();
    const router = useRouter();
    const nodeId = params?.nodeId as string;
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    const [sessionData, setSessionData] = useState<any>(null);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

    const [node, setNode] = useState<PracticeNode | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load data from API and localStorage
    useEffect(() => {
        if (!nodeId) return;

        const loadContent = async () => {
            setIsLoading(true);
            try {
                const data = await practiceService.getNodeSessionData(nodeId);
                setNode(data.node);
                setQuestions(data.questions);
            } catch (err) {
                console.error("Failed to load practice result content:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadContent();

        const stored = localStorage.getItem(`practice_session_${nodeId}`);
        if (stored) {
            try {
                setSessionData(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse session data", e);
            }
        }
    }, [nodeId]);

    const unifiedResult = useMemo(() => {
        if (!node || !unifiedResult || !questions.length) return null;
        return processPracticeResult(node, sessionData, questions);
    }, [node, sessionData, questions]);

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
        // In a real app, this would route to a chat or open a drawer
        console.log("Asking AI with context:", context);
        router.push(`/chat?message=${encodeURIComponent(`Can you explain why I was wrong with this question? ${context || ''}`)}`);
    };

    // Error state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
                <Sparkles className="w-12 h-12 text-primary animate-pulse mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">Reconstructing Session Results...</p>
            </div>
        );
    }

    if (!node || !unifiedResult) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-black text-foreground font-display mb-2">Results Not Found</h2>
                <p className="text-neutral-ink font-bold mb-6">We couldn&apos;t find your session data. Did you finish the practice?</p>
                <Link
                    href="/practice"
                    className="px-6 py-3 bg-foreground text-background font-black font-display text-sm rounded-xl"
                >
                    Back to Practice
                </Link>
            </div>
        );
    }

    const wrongQuestions = questions.filter(q => {
        const answers = sessionData?.answers || {};
        return answers[q.id]?.selectedOptionId && answers[q.id]?.selectedOptionId !== q.correctOptionId;
    });

    return (
        <ResultShell
            result={unifiedResult}
            onRetry={() => router.push(`/practice/session/${nodeId}`)}
            customActions={
                <button
                    onClick={() => handleAskAI()}
                    className="px-10 py-5 bg-secondary text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all  shadow-secondary/20"
                >
                    <MessageSquare size={20} />
                    Consult AI Tutor
                </button>
            }
        >
            {/* Detailed Review Section */}
            {wrongQuestions.length > 0 && (
                <div className="mt-20 space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center">
                            <XCircle size={20} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-neutral-ink font-display">Optimization Targets</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink">Review your incorrect transmissions</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {wrongQuestions.map((q) => {
                            const userAnswerId = sessionData?.answers[q.id]?.selectedOptionId;
                            const userOption = q.options.find(o => o.id === userAnswerId);
                            const correctOption = q.options.find(o => o.id === q.correctOptionId);
                            const isExpanded = expandedQuestions.has(q.id);

                            return (
                                <div key={q.id} className="bg-neutral-white border border-neutral-gray/10 rounded-[2.5rem] overflow-hidden  hover: transition-shadow">
                                    <button
                                        onClick={() => toggleQuestion(q.id)}
                                        className="w-full text-left p-8 flex items-center justify-between group"
                                    >
                                        <div className="flex-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary-strong/40 mb-2 block">{q.type} Protocol</span>
                                            <p className="text-xl font-black text-neutral-ink group-hover:text-primary-strong transition-colors">{q.content}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden md:block">
                                                <span className="block text-[8px] font-black uppercase text-rose-500/40">Your Response</span>
                                                <span className="text-sm font-bold text-rose-500">{userOption?.text || 'No Answer'}</span>
                                            </div>
                                            {isExpanded ? <ChevronUp size={24} className="text-neutral-ink" /> : <ChevronDown size={24} className="text-neutral-ink" />}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-8 pb-8 pt-4 border-t border-neutral-gray/5 bg-neutral-beige/10 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-2 block">Detected Error</span>
                                                    <p className="text-neutral-ink font-bold">{userOption?.text}</p>
                                                </div>
                                                <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-2 block">Correct Synchronity</span>
                                                    <p className="text-neutral-ink font-bold">{correctOption?.text}</p>
                                                </div>
                                            </div>

                                            {q.explanation && (
                                                <div className="p-8 bg-neutral-white border border-neutral-gray/10 rounded-2xl">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Brain size={16} className="text-primary-strong" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink">Linguistic Analysis</span>
                                                    </div>
                                                    <p className="text-neutral-ink font-bold leading-relaxed">{q.explanation}</p>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleAskAI(`I got this question wrong: "${q.content}". The correct answer was "${q.options.find(o => o.id === q.correctOptionId)?.text}". Can you explain why and give more examples?`)}
                                                className="w-full py-4 bg-neutral-ink text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-strong transition-all"
                                            >
                                                <Sparkles size={14} className="text-secondary" />
                                                Explain this specific case
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </ResultShell>
    );
}
