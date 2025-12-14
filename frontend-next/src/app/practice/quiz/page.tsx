"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    GraduationCap,
    Clock,
    BookOpen,
    Filter,
    Search,
    ChevronRight,
    Loader2,
    AlertCircle
} from "lucide-react";
import { getQuizzes, QuizListItem } from "@/services/quizService";

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const CATEGORIES = ["vocabulary", "grammar", "kanji", "reading"];

export default function QuizListPage() {
    const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [levelFilter, setLevelFilter] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchQuizzes();
    }, [levelFilter, categoryFilter]);

    const fetchQuizzes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getQuizzes({
                level: levelFilter || undefined,
                category: categoryFilter || undefined,
                limit: 50,
            });
            setQuizzes(response.quizzes);
        } catch (err) {
            setError("Failed to load quizzes. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Client-side search filtering
    const filteredQuizzes = quizzes.filter(quiz => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            quiz.title.toLowerCase().includes(term) ||
            quiz.description.toLowerCase().includes(term)
        );
    });

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "vocabulary": return "bg-green-100 text-green-700";
            case "grammar": return "bg-blue-100 text-blue-700";
            case "kanji": return "bg-red-100 text-red-700";
            case "reading": return "bg-purple-100 text-purple-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case "N5": return "bg-emerald-100 text-emerald-700";
            case "N4": return "bg-teal-100 text-teal-700";
            case "N3": return "bg-amber-100 text-amber-700";
            case "N2": return "bg-orange-100 text-orange-700";
            case "N1": return "bg-rose-100 text-rose-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <div className="min-h-screen bg-brand-cream text-brand-dark pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                            <GraduationCap size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-brand-dark">Quizzes</h1>
                            <p className="text-slate-500 text-sm">Test your knowledge with JLPT-style quizzes</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search quizzes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                        </div>

                        {/* Level Filter */}
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">All Levels</option>
                            {JLPT_LEVELS.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>

                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 capitalize"
                        >
                            <option value="">All Categories</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat} className="capitalize">{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                        <p className="text-slate-600">{error}</p>
                        <button
                            onClick={fetchQuizzes}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredQuizzes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Filter className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-500">No quizzes found matching your filters.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredQuizzes.map((quiz) => (
                            <Link
                                key={quiz.id}
                                href={`/practice/quiz/${quiz.id}`}
                                className="block bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${getLevelColor(quiz.jlpt_level)}`}>
                                                {quiz.jlpt_level}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold capitalize ${getCategoryColor(quiz.category)}`}>
                                                {quiz.category}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-brand-dark group-hover:text-blue-600 transition-colors">
                                            {quiz.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                                            {quiz.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <BookOpen size={14} />
                                                {quiz.question_count} questions
                                            </span>
                                            {quiz.time_limit_seconds && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {Math.floor(quiz.time_limit_seconds / 60)} min
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
