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
            <div className="min-h-screen bg-brand-cream flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
            </div>
        );
    }

    if (error || !grammar) {
        return (
            <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <p className="text-slate-600 mb-4">{error || "Grammar point not found"}</p>
                <Link
                    href="/library/grammar"
                    className="px-6 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-bold text-slate-600"
                >
                    Back to Library
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-cream pb-20">
            {/* Header / Nav */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/library/grammar"
                            className="flex items-center gap-2 text-slate-500 hover:text-brand-dark transition-colors font-medium text-sm"
                        >
                            <ArrowLeft size={18} />
                            Back to Library
                        </Link>

                        <div className="flex gap-2">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                                {grammar.p_tag?.replace('JLPT_', '')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Title Card */}
                <div className="bg-white rounded-3xl p-8 mb-6 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <BookOpen size={120} className="text-brand-dark" />
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-5xl font-black text-brand-dark mb-4 tracking-tight leading-tight">
                            {grammar.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-600 font-medium leading-relaxed">
                            {grammar.short_explanation}
                        </p>

                        <div className="flex flex-wrap gap-3 mt-8">
                            <button
                                onClick={handleAddToStudyList}
                                disabled={added || adding}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${added
                                    ? "bg-green-100 text-green-700 border border-green-200 cursor-default"
                                    : "bg-brand-dark text-white hover:bg-black hover:shadow-lg"
                                    }`}
                            >
                                {adding ? <Loader2 size={18} className="animate-spin" /> :
                                    added ? <CheckCircle size={18} /> :
                                        <Plus size={18} />}
                                {added ? "Added to Reviews" : "Add to Reviews"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Formation */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100">
                            <h2 className="text-lg font-black text-brand-dark mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-pink-500 rounded-full"></span>
                                Formation
                            </h2>
                            <div className="bg-slate-50 rounded-xl p-4 text-slate-700 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                                {grammar.formation}
                            </div>
                        </div>

                        {/* Explanation */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100">
                            <h2 className="text-lg font-black text-brand-dark mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                Usage & nuance
                            </h2>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-7">
                                {grammar.long_explanation}
                            </div>
                        </div>

                        {/* Examples */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100">
                            <h2 className="text-lg font-black text-brand-dark mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                                Example Sentences
                            </h2>

                            <div className="space-y-6">
                                {grammar.examples?.map((ex, idx) => (
                                    <div key={idx} className="group relative pl-4 border-l-2 border-slate-100 hover:border-brand-green transition-colors pb-1">
                                        <div className="mb-2">
                                            <p className="text-lg font-bold text-slate-800 leading-relaxed font-jp">
                                                {ex.jp}
                                            </p>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-1 font-medium">{ex.romaji}</p>
                                        <p className="text-slate-600">{ex.en}</p>

                                        {/* Audio Button (if available) */}
                                        {ex.grammar_audio && (
                                            <button
                                                onClick={() => playAudio(ex.grammar_audio)}
                                                className="absolute top-0 right-0 p-2 text-slate-300 hover:text-brand-green transition-colors"
                                            >
                                                <PlayCircle size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sidebar info or Ads placeholder */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-brand-cream-dark rounded-2xl p-6 border border-brand-cream-darker">
                            <h3 className="font-bold text-brand-dark mb-2">Study Tip</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Use the "Add to Reviews" button to include this grammar point in your daily SRS flashcards.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
