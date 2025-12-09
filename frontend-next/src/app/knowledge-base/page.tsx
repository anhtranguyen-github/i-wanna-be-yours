"use client";

import Link from "next/link";
import { ClayCard } from "@/components/ui/clay-card";
import {
    Book,
    Cpu,
    PenTool,
    Globe,
    Type,
    List
} from "lucide-react";

const routes = [
    {
        title: "Grammar",
        description: "Extensive grammar guide.",
        href: "/knowledge-base/grammar",
        icon: <Book className="w-8 h-8 text-brand-blue" />,
    },
    {
        title: "Kanji",
        description: "Kanji characters and meanings.",
        href: "/knowledge-base/kanji",
        icon: <Cpu className="w-8 h-8 text-brand-green" />,
    },
    {
        title: "Kana",
        description: "Hiragana and Katakana charts.",
        href: "/knowledge-base/kana",
        icon: <Type className="w-8 h-8 text-brand-peach" />,
    },
    {
        title: "Radicals",
        description: "Kanji radicals reference.",
        href: "/knowledge-base/radicals",
        icon: <PenTool className="w-8 h-8 text-purple-500" />,
    },
    {
        title: "Verbs",
        description: "Verb conjugations and usage.",
        href: "/knowledge-base/verbs",
        icon: <Globe className="w-8 h-8 text-orange-500" />,
    },
    {
        title: "All",
        description: "Browse all knowledge base items.",
        href: "/knowledge-base/all",
        icon: <List className="w-8 h-8 text-gray-500" />,
    },
];

export default function KnowledgeBasePage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-4xl font-extrabold text-brand-dark mb-8 text-center">Knowledge Base</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map((route) => (
                    <Link key={route.href} href={route.href} className="group">
                        <ClayCard className="h-full hover:scale-105 transition-transform cursor-pointer flex flex-col items-center text-center p-8">
                            <div className="mb-4 p-4 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                                {route.icon}
                            </div>
                            <h2 className="text-2xl font-bold text-brand-dark mb-2">{route.title}</h2>
                            <p className="text-gray-600">{route.description}</p>
                        </ClayCard>
                    </Link>
                ))}
            </div>
        </div>
    );
}
