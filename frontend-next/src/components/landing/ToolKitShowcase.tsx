"use client";
import React from 'react';
import { Type, Network, Languages, ArrowRightLeft, BrainCircuit, FileText, Wrench } from 'lucide-react';

const tools = [
    { name: "Text Parser", icon: Type },
    { name: "Grammar Graph", icon: Network },
    { name: "Translate AI", icon: Languages },
    { name: "Word Relations", icon: ArrowRightLeft },
    { name: "Quick Kanji", icon: BrainCircuit },
    { name: "Quick Vocab", icon: FileText },
    { name: "Auto Task", icon: Wrench },
];

export const ToolKitShowcase = () => {
    return (
        <section className="py-24 bg-[#F8FAFC] border-y border-slate-100 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-16">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-neutral-ink font-display">THE INTELLIGENCE KIT</h2>
                        <p className="text-neutral-ink font-medium">Professional-grade utilities at your fingertips.</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-8 animate-marquee whitespace-nowrap px-6">
                {[...tools, ...tools].map((tool, i) => (
                    <div
                        key={i}
                        className="inline-flex items-center gap-4 bg-white px-8 py-6 rounded-3xl border border-slate-100  shadow-primary/5 hover:border-primary/30 transition-all cursor-default group"
                    >
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <tool.icon size={24} />
                        </div>
                        <span className="text-xl font-black text-neutral-ink tracking-tight">{tool.name}</span>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                    display: flex;
                    width: max-content;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
};
