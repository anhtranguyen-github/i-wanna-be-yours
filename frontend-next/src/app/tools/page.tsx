"use client";

import Link from "next/link";
import { ClayCard } from "@/components/ui/clay-card";
import {
    Wrench,
    Type,
    Network,
    Languages,
    ArrowRightLeft,
    FileText,
    BrainCircuit
} from "lucide-react";

const routes = [
    {
        title: "Text Parser",
        description: "Analyze and tokenize Japanese text.",
        href: "/tools/text-parser",
        icon: <Type className="w-8 h-8 text-brand-green" />,
        color: "bg-brand-green"
    },
    {
        title: "Grammar Graph",
        description: "Visualize grammar relationships.",
        href: "/tools/grammar-graph",
        icon: <Network className="w-8 h-8 text-brand-blue" />,
        color: "bg-brand-blue"
    },
    {
        title: "Translate",
        description: "Translation utilities.",
        href: "/tools/translate",
        icon: <Languages className="w-8 h-8 text-brand-peach" />,
        color: "bg-brand-peach"
    },
    {
        title: "Word Relations",
        description: "Explore connections between words.",
        href: "/tools/word-relations",
        icon: <ArrowRightLeft className="w-8 h-8 text-purple-500" />,
        color: "bg-purple-100"
    },
    {
        title: "Auto Task",
        description: "Automated learning tasks.",
        href: "/tools/auto-task",
        icon: <Wrench className="w-8 h-8 text-gray-500" />,
        color: "bg-gray-100"
    },
    {
        title: "Quick Kanji",
        description: "Rapid Kanji lookup and reference.",
        href: "/tools/quick-kanji",
        icon: <BrainCircuit className="w-8 h-8 text-red-500" />,
        color: "bg-red-100"
    },
    {
        title: "Quick Vocab",
        description: "Fast vocabulary reference.",
        href: "/tools/quick-vocab",
        icon: <FileText className="w-8 h-8 text-orange-500" />,
        color: "bg-orange-100"
    },
];

export default function ToolsPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-7xl">
            <h1 className="text-4xl font-display font-extrabold text-brand-dark mb-12 text-center">
                Tools <span className="text-brand-green">Kit</span>
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
