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

];

import { PageHeader } from "@/components/shared";

export default function ToolsPage() {
    return (
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            <PageHeader
                title="Tools"
                subtitle="Utilities for Japanese acquisition"
                icon={<WrenchIcon className="w-6 h-6 text-white" />}
                iconBgColor="bg-neutral-ink"
            />

            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Content Removed */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route) => (
                        <Link key={route.href} href={route.href}>
                            <div className="bg-neutral-white rounded-[2rem] border border-neutral-gray/20 p-8 hover:border-primary-strong transition-all group h-full flex flex-col items-center text-center cursor-pointer">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500  ${route.color}`}>
                                    {route.icon}
                                </div>
                                <h2 className="text-xl font-black text-neutral-ink mb-2 font-display">{route.title}</h2>
                                <p className="text-sm text-neutral-ink leading-relaxed font-bold opacity-60">{route.description}</p>

                                <div className="mt-auto pt-8 flex items-center gap-3 text-primary-strong font-black uppercase tracking-[0.2em] text-[10px] items-center opacity-0 group-hover:opacity-100 transition-all translate-y-3 group-hover:translate-y-0">
                                    Launch Tool
                                    <ArrowRightLeft size={16} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
