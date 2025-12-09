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
    },
    {
        title: "Grammar Graph",
        description: "Visualize grammar relationships.",
        href: "/tools/grammar-graph",
        icon: <Network className="w-8 h-8 text-brand-blue" />,
    },
    {
        title: "Translate",
        description: "Translation utilities.",
        href: "/tools/translate",
        icon: <Languages className="w-8 h-8 text-brand-peach" />,
    },
    {
        title: "Word Relations",
        description: "Explore connections between words.",
        href: "/tools/word-relations",
        icon: <ArrowRightLeft className="w-8 h-8 text-purple-500" />,
    },
    {
        title: "Auto Task",
        description: "Automated learning tasks.",
        href: "/tools/auto-task",
        icon: <Wrench className="w-8 h-8 text-gray-500" />,
    },
    {
        title: "Quick Kanji",
        description: "Rapid Kanji lookup and reference.",
        href: "/tools/quick-kanji",
        icon: <BrainCircuit className="w-8 h-8 text-red-500" />,
    },
    {
        title: "Quick Vocab",
        description: "Fast vocabulary reference.",
        href: "/tools/quick-vocab",
        icon: <FileText className="w-8 h-8 text-orange-500" />,
    },
];

export default function ToolsPage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-4xl font-extrabold text-brand-dark mb-8 text-center">Tools</h1>
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
