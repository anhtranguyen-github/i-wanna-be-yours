"use client";

import Link from "next/link";
import { Headphones, Brain, BookOpen, FileText, Library } from "lucide-react";

const routes = [
    {
        title: "Podcasts & Videos",
        description: "Listen to Japanese podcasts and videos.",
        href: "/library/podcasts",
        icon: <Headphones className="w-6 h-6" />,
        color: "bg-blue-100 text-blue-700"
    },
    {
        title: "Reading",
        description: "Japanese short stories with translations.",
        href: "/library/reading",
        icon: <BookOpen className="w-6 h-6" />,
        color: "bg-primary/20 text-primary"
    },
    {
        title: "Mnemonics",
        description: "Memory aids for Kanji and vocabulary.",
        href: "/library/mnemonics",
        icon: <Brain className="w-6 h-6" />,
        color: "bg-accent/20 text-accent"
    },
    {
        title: "Grammar Library",
        description: "Comprehensive JLPT grammar patterns.",
        href: "/library/grammar",
        icon: <BookOpen className="w-6 h-6" />,
        color: "bg-secondary text-secondary-foreground"
    },
    {
        title: "Vocabulary",
        description: "Essential words for all JLPT levels.",
        href: "/library/vocabulary",
        icon: <BookOpen className="w-6 h-6" />,
        color: "bg-teal-100 text-teal-700"
    },
    {
        title: "Kanji",
        description: "Master kanji and their readings.",
        href: "/library/kanji",
        icon: <span className="text-xl font-jp font-bold">漢</span>,
        color: "bg-red-100 text-red-700"
    },
    {
        title: "Resources & Assets",
        description: "Your uploaded files and materials.",
        href: "/library/resources",
        icon: <FileText className="w-6 h-6" />,
        color: "bg-indigo-100 text-indigo-700"
    },
];

export default function LibraryPage() {
    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="bg-card border-b border-border px-6 py-8">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Library className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground font-display">Library</h1>
                        <p className="text-muted-foreground">Browse your learning resources</p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route) => (
                        <Link key={route.href} href={route.href}>
                            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-colors h-full flex flex-col items-center text-center cursor-pointer">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${route.color}`}>
                                    {route.icon}
                                </div>
                                <h2 className="text-lg font-bold text-foreground mb-2">{route.title}</h2>
                                <p className="text-sm text-muted-foreground">{route.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
