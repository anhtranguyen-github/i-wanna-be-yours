"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    BookOpen,
    Plus,
    CheckCircle,
    Loader2,
    AlertCircle,
    PlayCircle,
    Copy,
    Share2
} from "lucide-react";
import { getGrammarDetails, addToStudyList, GrammarPoint } from "@/services/grammarService";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";

export default function GrammarDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

    // The slug is the encoded title
    const encodedTitle = params?.slug as string;
    const decodedTitle = decodeURIComponent(encodedTitle);

    const [grammar, setGrammar] = useState<GrammarPoint | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        if (!decodedTitle) return;
        fetchDetails();
    }, [decodedTitle]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await getGrammarDetails(decodedTitle);
            setGrammar(response.grammar);
        } catch (err) {
            console.error(err);
            setError("Failed to load grammar details.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToStudyList = async () => {
        if (!user) {
            openAuth("REGISTER", {
                flowType: 'LIBRARY',
                title: "Add to Your Reviews",
                description: "Sign up to track this grammar point and get SRS review reminders from Hanachan."
            });
            return;
        }

        if (!grammar) return;

        setAdding(true);
        try {
            await addToStudyList(
                String(user.id),
                grammar.p_tag,
                grammar.s_tag
            );
            setAdded(true);
        } catch (err) {
            console.error(err);
            alert("Failed to add to study list.");
        } finally {
            setAdding(false);
        }
    };

    const playAudio = (url?: string) => {
        if (!url) return;
        const audio = new Audio(url);
        audio.play().catch(e => console.error("Audio play failed", e));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest font-display">Loading Details...</p>
            </div>
        );
    }

    if (error || !grammar) {
        return (
            <div className="min-h-screen bg-background p-6 md:p-12 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-destructive/5 rounded-2xl flex items-center justify-center mb-8 ">
                    <AlertCircle className="w-12 h-12 text-destructive/20" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-4 font-display">{error || "Grammar point not found"}</h3>
                <Link
                    href="/library/grammar"
                    className="flex items-center gap-3 px-8 py-4 bg-foreground text-background font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all  font-display uppercase tracking-widest text-xs"
                >
                    <ArrowLeft size={18} />
                    Back to Library
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-10">
                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/library/grammar"
                        className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-all active:scale-95 group"
                    >
                        <ArrowLeft size={24} />
                        <span className="text-xs font-black uppercase tracking-widest font-display">Back to Library</span>
                    </Link>

                    <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase font-display border border-primary/20">
                        {grammar.p_tag?.replace('JLPT_', '')}
                    </span>
                </div>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Title Card */}
                    <div className="bg-card rounded-2xl p-10 md:p-12  border border-border relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12">
                            <BookOpen size={200} />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <h1 className="text-5xl md:text-6xl font-black text-foreground font-display tracking-tight leading-tight">
                                {grammar.title}
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground font-bold leading-relaxed max-w-2xl">
                                {grammar.short_explanation}
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <button
                                    onClick={handleAddToStudyList}
                                    disabled={added || adding}
                                    className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black transition-all active:scale-95  font-display uppercase tracking-widest text-xs ${added
                                        ? "bg-green-500/10 text-green-600 border border-green-500/20 cursor-default shadow-none"
                                        : "bg-foreground text-background hover:opacity-90"
                                        }`}
                                >
                                    {adding ? <Loader2 size={18} className="animate-spin" /> :
                                        added ? <CheckCircle size={18} /> :
                                            <Plus size={18} />}
                                    {added ? "In Your Reviews" : "Add to Reviews"}
                                </button>

                                <button className="p-5 bg-card border border-border rounded-2xl text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all ">
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                        <div className="md:col-span-3 space-y-10">
                            {/* Formation */}
                            <div className="bg-card rounded-2xl p-8 border border-border ">
                                <h2 className="text-xs font-black text-primary/50 uppercase tracking-[0.2em] font-display mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    Formation Rules
                                </h2>
                                <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 text-foreground font-black font-display text-lg leading-relaxed whitespace-pre-wrap ">
                                    {grammar.formation}
                                </div>
                            </div>

                            {/* Explanation */}
                            <div className="bg-card rounded-2xl p-8 border border-border ">
                                <h2 className="text-xs font-black text-primary/50 uppercase tracking-[0.2em] font-display mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    Usage & Nuance
                                </h2>
                                <div className="prose prose-slate max-w-none text-muted-foreground font-bold leading-8 text-[17px]">
                                    {grammar.long_explanation}
                                </div>
                            </div>

                            {/* Examples */}
                            <div className="bg-card rounded-2xl p-8 border border-border ">
                                <h2 className="text-xs font-black text-primary/50 uppercase tracking-[0.2em] font-display mb-8 flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    Example Sentences
                                </h2>

                                <div className="space-y-10">
                                    {grammar.examples?.map((ex, idx) => (
                                        <div key={idx} className="group relative pl-8 border-l-4 border-muted hover:border-primary/30 transition-all duration-500">
                                            <div className="space-y-4">
                                                <p className="text-2xl font-bold text-foreground leading-[1.6] font-jp group-hover:text-primary transition-colors">
                                                    {ex.jp}
                                                </p>
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-black text-neutral-ink uppercase tracking-widest font-display italic leading-relaxed">
                                                        {ex.romaji}
                                                    </p>
                                                    <p className="text-base font-bold text-muted-foreground leading-relaxed">
                                                        {ex.en}
                                                    </p>
                                                </div>
                                            </div>

                                            {ex.grammar_audio && (
                                                <button
                                                    onClick={() => playAudio(ex.grammar_audio)}
                                                    className="absolute top-0 right-0 w-12 h-12 bg-muted/30 text-muted-foreground hover:bg-primary hover:text-white rounded-xl transition-all  flex items-center justify-center"
                                                >
                                                    <PlayCircle size={24} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-1 space-y-8 pt-4">
                            <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10"></div>
                                <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4 font-display">Study Tip</h3>
                                <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                                    Use the <span className="text-foreground">"Add to Reviews"</span> button to include this grammar pattern in your daily SRS review queue.
                                </p>
                            </div>

                            <div className="p-8 bg-card border border-border rounded-2xl ">
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 font-display">Mastery Level</h3>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-1/3 rounded-full"></div>
                                </div>
                                <p className="text-[10px] font-black text-neutral-ink uppercase tracking-widest mt-4 font-display">Beginner 33%</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

