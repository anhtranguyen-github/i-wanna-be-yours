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
        icon: <Type className="w-8 h-8 text-primary" />,
        color: "bg-primary"
    },
    {
        title: "Grammar Graph",
        description: "Visualize grammar relationships.",
        href: "/tools/grammar-graph",
        icon: <Network className="w-8 h-8 text-primary" />,
        color: "bg-primary"
    },
    {
        title: "Translate",
        description: "Translation utilities.",
        href: "/tools/translate",
        icon: <Languages className="w-8 h-8 text-primary" />,
        color: "bg-primary"
    },
    {
        title: "Word Relations",
        description: "Explore connections between words.",
        href: "/tools/word-relations",
        icon: <ArrowRightLeft className="w-8 h-8 text-primary" />,
        color: "bg-primary"
    },
    {
        title: "Auto Task",
        description: "Automated learning tasks.",
        href: "/tools/auto-task",
        icon: <Wrench className="w-8 h-8 text-primary" />,
        color: "bg-primary"
    },
    {
        title: "Quick Kanji",
        description: "Rapid Kanji lookup and reference.",
        href: "/tools/quick-kanji",
        icon: <BrainCircuit className="w-8 h-8 text-primary" />,
        color: "bg-primary"
    },
    {
        title: "Quick Vocab",
        description: "Fast vocabulary reference.",
        href: "/tools/quick-vocab",
        icon: <FileText className="w-8 h-8 text-primary" />,
        color: "bg-primary"
    },
];

export default function ToolsPage() {
    return (
        <div className="container mx-auto py-16 px-6 max-w-7xl">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-black text-slate-900 mb-4 font-display tracking-tight">
                    Tools <span className="text-primary italic">Kit</span>
                </h1>
                <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
                    A suite of high-performance utilities designed to accelerate your Japanese language acquisition.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {routes.map((route) => (
                    <Link key={route.href} href={route.href} className="group">
                        <div className="clay-card h-full hover:-translate-y-2 transition-transform cursor-pointer flex flex-col items-center text-center p-10 bg-white border border-slate-100 shadow-xl shadow-primary/5 relative overflow-hidden group-hover:border-primary/30">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                            <div className={`mb-8 p-6 rounded-[2rem] bg-primary/5 group-hover:bg-primary/10 transition-all group-hover:scale-110 duration-500 bg-opacity-20 relative z-10`}>
                                {route.icon}
                            </div>

                            <h2 className="text-xl font-black text-slate-900 mb-3 font-display uppercase tracking-[0.15em] relative z-10">{route.title}</h2>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm relative z-10">{route.description}</p>

                            <div className="mt-8 flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                Launch Tool
                                <ArrowRightLeft size={12} className="rotate-45" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
