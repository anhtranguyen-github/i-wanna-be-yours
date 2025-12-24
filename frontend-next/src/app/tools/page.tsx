"use client";

import Link from "next/link";
import {
    Wrench,
    Type,
    Network,
    Languages,
    ArrowRightLeft,
    FileText,
    BrainCircuit,
    Wrench as WrenchIcon
} from "lucide-react";

const routes = [
    {
        title: "Text Parser",
        description: "Analyze and tokenize Japanese text.",
        href: "/tools/text-parser",
        icon: <Type className="w-6 h-6" />,
        color: "bg-blue-50 text-blue-600"
    },
    {
        title: "Grammar Graph",
        description: "Visualize grammar relationships.",
        href: "/tools/grammar-graph",
        icon: <Network className="w-6 h-6" />,
        color: "bg-indigo-50 text-indigo-600"
    },
    {
        title: "Translate",
        description: "Linguistic bridge for Japanese & Korean.",
        href: "/tools/translate",
        icon: <Languages className="w-6 h-6" />,
        color: "bg-primary/10 text-primary"
    },
    {
        title: "Auto Task",
        description: "Automated learning tasks.",
        href: "/tools/auto-task",
        icon: <Wrench className="w-6 h-6" />,
        color: "bg-slate-100 text-slate-600"
    },
    {
        title: "Quick Kanji",
        description: "Rapid Kanji lookup and reference.",
        href: "/tools/quick-kanji",
        icon: <BrainCircuit className="w-6 h-6" />,
        color: "bg-red-50 text-red-600"
    },
    {
        title: "Quick Vocab",
        description: "Fast vocabulary reference.",
        href: "/tools/quick-vocab",
        icon: <FileText className="w-6 h-6" />,
        color: "bg-teal-50 text-teal-600"
    },
];

export default function ToolsPage() {
    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="bg-card border-b border-border px-6 py-8">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <WrenchIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground font-display">
                            Linguistic <span className="text-primary">Laboratory</span>
                        </h1>
                        <p className="text-muted-foreground mt-1">High-performance utilities for Japanese acquisition</p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route) => (
                        <Link key={route.href} href={route.href}>
                            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-all group h-full flex flex-col items-center text-center cursor-pointer">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300 ${route.color}`}>
                                    {route.icon}
                                </div>
                                <h2 className="text-lg font-bold text-foreground mb-2">{route.title}</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">{route.description}</p>

                                <div className="mt-auto pt-6 flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    Launch Tool
                                    <ArrowRightLeft size={12} className="rotate-45" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
