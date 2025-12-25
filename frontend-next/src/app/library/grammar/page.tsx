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
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary ">
                            <Book size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-foreground font-display tracking-tight">
                                Grammar <span className="text-primary">Library</span>
                            </h1>
                            <p className="text-muted-foreground font-bold text-sm">Master Japanese grammar patterns</p>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-4 flex-1 md:max-w-2xl justify-end">
                        <div className="relative group flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-ink group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search patterns..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm "
                            />
                        </div>
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="px-6 py-3 bg-card border border-border rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary  font-display cursor-pointer"
                        >
                            {JLPT_LEVELS.map(l => (
                                <option key={l.value} value={l.value}>{l.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content Area */}
                <div className="pt-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest font-display">Loading Grammar...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-card rounded-2xl border-2 border-dashed border-border p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-destructive/5 rounded-2xl flex items-center justify-center mb-8 ">
                                <CloudOff className="w-12 h-12 text-destructive/20" />
                            </div>
                            <p className="text-foreground font-black text-xl font-display mb-4">{error}</p>
                            <button
                                onClick={fetchGrammars}
                                className="flex items-center gap-3 px-8 py-4 bg-primary text-white font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all  font-display uppercase tracking-widest text-xs"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredGrammars.length === 0 ? (
                        <div className="bg-card rounded-2xl border-2 border-dashed border-border p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-muted/50 rounded-2xl flex items-center justify-center mb-8 ">
                                <Filter className="w-12 h-12 text-neutral-ink" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground mb-4 font-display">No Patterns Found</h3>
                            <p className="text-muted-foreground font-bold">Try adjusting your search terms or level filter.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredGrammars.map((grammar) => (
                                <Link
                                    key={grammar._id}
                                    href={`/library/grammar/${encodeURIComponent(grammar.title)}`}
                                    className="group relative bg-card rounded-2xl border border-border p-8 hover:border-primary/30 hover:  transition-all duration-500 overflow-hidden flex flex-col h-full"
                                >
                                    <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12 group-hover:rotate-0 duration-700">
                                        <Book size={180} />
                                    </div>

                                    <div className="relative z-10 space-y-4 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors font-display line-clamp-1 leading-tight flex-1">
                                                {grammar.title}
                                            </h3>
                                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 font-display">
                                                {grammar.p_tag.replace('JLPT_', '')}
                                            </span>
                                        </div>

                                        <p className="text-muted-foreground font-bold text-sm leading-relaxed line-clamp-2 flex-1 pt-2">
                                            {grammar.short_explanation}
                                        </p>

                                        <div className="pt-6 border-t border-border/50 flex items-center justify-between group-hover:border-primary/20 transition-colors">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-ink font-display group-hover:text-primary transition-colors">View Pattern</span>
                                            <ArrowRight size={18} className="text-neutral-ink group-hover:text-primary group-hover:translate-x-2 transition-all" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

