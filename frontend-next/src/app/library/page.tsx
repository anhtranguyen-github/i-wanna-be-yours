"use client";

import Link from "next/link";
import { Headphones, Brain, BookOpen, FileText, Library } from "lucide-react";

const routes = [
    {
        title: "Podcasts & Videos",
        description: "Listen to Japanese podcasts and videos.",
        href: "/library/podcasts",
        icon: <Headphones className="w-6 h-6" />,
        color: "bg-primary-sky/20 text-primary-sky"
    },
    {
        title: "Reading",
        description: "Japanese short stories with translations.",
        href: "/library/reading",
        icon: <BookOpen className="w-6 h-6" />,
        color: "bg-primary/20 text-primary-strong"
    },
    {
        title: "Mnemonics",
        description: "Memory aids for Kanji and vocabulary.",
        href: "/library/mnemonics",
        icon: <Brain className="w-6 h-6" />,
        color: "bg-primary-leaf/20 text-primary-leaf"
    },
    {
        title: "Grammar Library",
        description: "Comprehensive JLPT grammar patterns.",
        href: "/library/grammar",
        icon: <BookOpen className="w-6 h-6" />,
        color: "bg-secondary-lavender/20 text-secondary-lavender"
    },
    {
        title: "Vocabulary",
        description: "Essential words for all JLPT levels.",
        href: "/library/vocabulary",
        icon: <BookOpen className="w-6 h-6" />,
        color: "bg-accent-jade/20 text-accent-jade"
    },
    {
        title: "Kanji",
        description: "Master kanji and their readings.",
        href: "/library/kanji",
        icon: <span className="text-xl font-jp font-bold">漢</span>,
        color: "bg-accent-red/20 text-accent-red"
    },
    {
        title: "Resources & Assets",
        description: "Your uploaded files and materials.",
        href: "/library/resources",
        icon: <FileText className="w-6 h-6" />,
        color: "bg-primary-sky/20 text-primary-sky"
    },
];

import { PageHeader } from "@/components/shared";

export default function LibraryPage() {
    return (
        <div className="min-h-screen bg-background pb-24">
            <PageHeader
                title="Library"
                subtitle="Browse your learning resources"
                icon={<Library className="w-6 h-6 text-primary-strong" />}
            />

            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route) => (
                        <Link key={route.href} href={route.href}>
                            <div className="bg-card rounded-2xl border border-neutral-gray/30 p-8  hover: hover:border-primary/40 transition-all h-full flex flex-col items-center text-center cursor-pointer">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6  ${route.color}`}>
                                    {route.icon}
                                </div>
                                <h2 className="text-xl font-black text-neutral-ink mb-3 font-display">{route.title}</h2>
                                <p className="text-sm text-neutral-ink leading-relaxed font-bold">{route.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
