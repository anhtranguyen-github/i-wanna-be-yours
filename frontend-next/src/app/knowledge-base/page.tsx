"use client";

import Link from "next/link";
import {
    Book,
    Cpu,
    PenTool,
    Globe,
    Type,
    List,
    Search
} from "lucide-react";

const routes = [
    {
        title: "Grammar",
        description: "Extensive grammar guide.",
        href: "/knowledge-base/grammar",
        icon: <Book className="w-8 h-8 text-brand-blue" />,
        color: "bg-brand-blue"
    },
    {
        title: "Kanji",
        description: "Kanji characters and meanings.",
        href: "/knowledge-base/kanji",
        icon: <Cpu className="w-8 h-8 text-brand-green" />,
        color: "bg-brand-green"
    },
    {
        title: "Kana",
        description: "Hiragana and Katakana charts.",
        href: "/knowledge-base/kana",
        icon: <Type className="w-8 h-8 text-brand-peach" />,
        color: "bg-brand-peach"
    },
    {
        title: "Radicals",
        description: "Kanji radicals reference.",
        href: "/knowledge-base/radicals",
        icon: <PenTool className="w-8 h-8 text-purple-500" />,
        color: "bg-purple-100"
    },
    {
        title: "Verbs",
        description: "Verb conjugations and usage.",
        href: "/knowledge-base/verbs",
        icon: <Globe className="w-8 h-8 text-orange-500" />,
        color: "bg-orange-100"
    },
    {
        title: "All",
        description: "Browse all knowledge base items.",
        href: "/knowledge-base/all",
        icon: <List className="w-8 h-8 text-gray-500" />,
        color: "bg-gray-100"
    },
];

export default function KnowledgeBasePage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-7xl">
            <h1 className="text-4xl font-display font-extrabold text-brand-dark mb-12 text-center text-shadow-clay">
                Knowledge <span className="text-brand-indigo">Base</span>
            </h1>

            <div className="max-w-xl mx-auto mb-16 relative">
                <input
                    type="text"
                    placeholder="Search for grammar, kanji, or topics..."
                    className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-brand-indigo/20 shadow-clay-inner focus:outline-none focus:border-brand-indigo focus:ring-4 focus:ring-brand-indigo/10 transition-all font-medium text-brand-dark"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {routes.map((route) => (
                    <Link key={route.href} href={route.href} className="group">
                        <div className="clay-card h-full hover:-translate-y-2 transition-transform cursor-pointer flex flex-col items-center text-center p-8 bg-white relative overflow-hidden">
                            <div className={`mb-6 p-5 rounded-2xl shadow-inner ${route.color} bg-opacity-20 group-hover:bg-opacity-30 transition-all`}>
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
