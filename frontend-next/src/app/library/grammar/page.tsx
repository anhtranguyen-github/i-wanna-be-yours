"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Book,
    Search,
    Filter,
    Loader2,
    CloudOff,
    ArrowRight
} from "lucide-react";
import { getGrammars, GrammarPoint } from "@/services/grammarService";
import { useUser } from "@/context/UserContext";

const JLPT_LEVELS = [
    { label: "N5", value: "JLPT_N5" },
    { label: "N4", value: "JLPT_N4" },
    { label: "N3", value: "JLPT_N3" },
    { label: "N2", value: "JLPT_N2" },
    { label: "N1", value: "JLPT_N1" },
];

export default function GrammarListPage() {
    const { user } = useUser();
    const [grammars, setGrammars] = useState<GrammarPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [selectedLevel, setSelectedLevel] = useState("JLPT_N5"); // Default to N5 to show something
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchGrammars();
    }, [selectedLevel]);

    const fetchGrammars = async () => {
        setLoading(true);
        setError(null);
        try {
            // We fetch all s_tags for the level
            const response = await getGrammars({ p_tag: selectedLevel });
            // Sort standardly? Maybe by s_tag if it's numeric-ish order, or just title
            const sorted = response.grammars.sort((a, b) => a.title.localeCompare(b.title));
            setGrammars(sorted);
        } catch (err) {
            setError("Failed to load grammar points. Please check your connection.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Derived state for search
    const filteredGrammars = grammars.filter(g =>
        g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.short_explanation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getLevelColor = (level: string) => {
        switch (level) {
            case "JLPT_N5": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "JLPT_N4": return "bg-teal-100 text-teal-700 border-teal-200";
            case "JLPT_N3": return "bg-amber-100 text-amber-700 border-amber-200";
            case "JLPT_N2": return "bg-orange-100 text-orange-700 border-orange-200";
            case "JLPT_N1": return "bg-rose-100 text-rose-700 border-rose-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="min-h-screen bg-brand-cream pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600">
                                <Book size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-brand-dark tracking-tight">Grammar Library</h1>
                                <p className="text-slate-500 text-sm">Master Japanese grammar patterns</p>
                            </div>
                        </div>

                        {/* Search & Filter */}
                        <div className="flex flex-1 md:justify-end gap-3">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search grammar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                                />
                            </div>
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                            >
                                {JLPT_LEVELS.map(l => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-pink-500" />
                        <p>Loading grammar points...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <CloudOff className="w-16 h-16 text-slate-300 mb-4" />
                        <p className="text-slate-600 font-medium mb-2">{error}</p>
                        <button
                            onClick={fetchGrammars}
                            className="text-pink-600 hover:text-pink-700 font-bold underline"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredGrammars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Filter className="w-16 h-16 text-slate-200 mb-4" />
                        <p className="text-slate-500 text-lg">No grammar points found.</p>
                        <p className="text-slate-400 text-sm">Try changing your search or level filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGrammars.map((grammar) => (
                            <Link
                                key={grammar._id}
                                href={`/library/grammar/${encodeURIComponent(grammar.title)}`}
                                className="group bg-white rounded-2xl border border-slate-100 p-6 hover:border-pink-200 hover:shadow-lg hover:shadow-pink-500/5 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Book size={64} className="text-brand-dark transform rotate-12" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-black text-brand-dark group-hover:text-pink-600 transition-colors line-clamp-1" title={grammar.title}>
                                            {grammar.title}
                                        </h3>
                                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border ${getLevelColor(grammar.p_tag)}`}>
                                            {grammar.p_tag.replace('JLPT_', '')}
                                        </span>
                                    </div>

                                    <p className="text-slate-600 font-medium mb-4 line-clamp-2 min-h-[3rem]">
                                        {grammar.short_explanation}
                                    </p>

                                    <div className="flex items-center text-sm font-bold text-slate-400 group-hover:text-pink-500 transition-colors">
                                        <span>View Details</span>
                                        <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
