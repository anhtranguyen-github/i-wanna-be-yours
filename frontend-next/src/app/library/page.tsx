"use client";

import Link from "next/link";
import { Headphones, Brain, BookOpen, FileText } from "lucide-react";

const routes = [
    {
        title: "Podcasts & Videos",
        description: "Listen to Japanese podcasts and videos. Add your own too!",
        href: "/library/podcasts",
        icon: <Headphones className="w-8 h-8 text-brand-blue" />,
        color: "bg-brand-blue"
    },
    {
        title: "Reading",
        description: "Japanese short stories with translations.",
        href: "/library/reading",
        icon: <BookOpen className="w-8 h-8 text-brand-green" />,
        color: "bg-brand-green"
    },
    {
        title: "Mnemonics",
        description: "Memory aids for Kanji and vocabulary.",
        href: "/library/mnemonics",
        icon: <Brain className="w-8 h-8 text-orange-500" />,
        color: "bg-orange-100"
    },
    {
        title: "Grammar Library",
        description: "Comprehensive JLPT grammar patterns and usage.",
        href: "/library/grammar",
        icon: <BookOpen className="w-8 h-8 text-pink-500" />,
        color: "bg-pink-100"
    },
    {
        title: "Vocabulary",
        description: "Essential words for all JLPT levels.",
        href: "/library/vocabulary",
        icon: <BookOpen className="w-8 h-8 text-teal-500" />,
        color: "bg-teal-100"
    },
    {
        title: "Kanji",
        description: "Master kanji and their readings.",
        href: "/library/kanji",
        icon: <span className="text-3xl font-jp font-bold text-red-500">漢</span>,
        color: "bg-red-100"
    },
    {
        title: "Resources & Assets",
        description: "Your uploaded files, PDFs, and learning materials.",
        href: "/library/resources",
        icon: <FileText className="w-8 h-8 text-indigo-500" />,
        color: "bg-indigo-500"
    },
];

export default function LibraryPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-7xl">
            <h1 className="text-4xl font-display font-extrabold text-brand-dark mb-12 text-center">
                My <span className="text-brand-softBlue">Library</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {routes.map((route) => (
                    <Link key={route.href} href={route.href} className="group">
                        <div className="clay-card h-full hover:-translate-y-2 transition-transform cursor-pointer flex flex-col items-center text-center p-8 bg-white relative overflow-hidden">
                            <div className={`mb-6 p-5 rounded-2xl ${route.color} bg-opacity-20 group-hover:bg-opacity-30 transition-all`}>
                                {route.icon}
                            </div>
                            <h2 className="text-2xl font-display font-bold text-brand-dark mb-3">{route.title}</h2>
                            <p className="text-gray-500 font-medium leading-relaxed">{route.description}</p>

                            {/* Decorative blur */}
                            <div className={`absolute -bottom-10 -right-10 w-24 h-24 ${route.color} rounded-full blur-3xl opacity-20`} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
