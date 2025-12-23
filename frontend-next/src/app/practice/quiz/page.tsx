"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, BookOpen, Filter, Search, ChevronRight, Loader2, AlertCircle, Brain, Plus } from "lucide-react";
import { getQuizzes, QuizListItem } from "@/services/quizService";

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const CATEGORIES = ["vocabulary", "grammar", "kanji", "reading"];

export default function QuizListPage() {
    const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [levelFilter, setLevelFilter] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => { fetchQuizzes(); }, [levelFilter, categoryFilter]);

    const fetchQuizzes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getQuizzes({ level: levelFilter || undefined, category: categoryFilter || undefined, limit: 50 });
            setQuizzes(response.quizzes);
        } catch (err) { setError("Failed to load quizzes. Please try again."); console.error(err); }
        finally { setLoading(false); }
    };

    const filteredQuizzes = quizzes.filter(quiz => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return quiz.title.toLowerCase().includes(term) || quiz.description.toLowerCase().includes(term);
    });

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-6 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Brain size={24} className="text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground font-display">Quizzes</h1>
                                <p className="text-sm text-muted-foreground">Test your knowledge</p>
                            </div>
                        </div>
                        <Link href="/practice/quiz/create" className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors">
                            <Plus size={18} /> Create Quiz
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input type="text" placeholder="Search quizzes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-muted rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="px-4 py-3 bg-muted rounded-xl border-none focus:outline-none text-sm font-bold">
                            <option value="">All Levels</option>
                            {JLPT_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-3 bg-muted rounded-xl border-none focus:outline-none text-sm font-bold capitalize">
                            <option value="">All Categories</option>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                        </select>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading quizzes...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-6">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-lg font-bold text-foreground mb-2">{error}</h2>
                        <button onClick={fetchQuizzes} className="px-6 py-3 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors">
                            Retry
                        </button>
                    </div>
                ) : filteredQuizzes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center mb-4">
                            <Filter size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">No quizzes found</h3>
                        <p className="text-muted-foreground">Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredQuizzes.map((quiz) => (
                            <Link key={quiz.id} href={`/practice/quiz/${quiz.id}`} className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2 py-1 bg-primary/10 rounded-lg text-xs font-bold text-primary">{quiz.jlpt_level}</span>
                                            <span className="px-2 py-1 bg-muted rounded-lg text-xs font-bold text-muted-foreground capitalize">{quiz.category}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-1">{quiz.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{quiz.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><BookOpen size={14} /> {quiz.question_count} questions</span>
                                            {quiz.time_limit_seconds && <span className="flex items-center gap-1"><Clock size={14} /> {Math.floor(quiz.time_limit_seconds / 60)}m</span>}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
