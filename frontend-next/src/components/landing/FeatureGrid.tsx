import React from 'react';
import { Brain, Layers, Layout, LineChart, MessageSquare, Search, Zap } from 'lucide-react';

export const FeatureGrid = () => {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20 space-y-4">
                    <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em]">The Ecosystem</h2>
                    <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-display">
                        Linguistic <span className="text-primary">Command</span> Control.
                    </p>
                    <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                        A unified platform replacing fragmented tools with a single, high-fidelity intelligence system.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">

                    {/* Bento Item: Strategic Planning */}
                    <div className="md:col-span-8 group relative rounded-[2.5rem] border border-slate-100 bg-slate-50 overflow-hidden shadow-xl shadow-primary/5 p-10 hover:border-primary/30 transition-all">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary/20 transition-colors" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-lg mb-6">
                                <LineChart size={28} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Strategic Management</h3>
                            <p className="text-slate-500 font-medium max-w-md leading-relaxed">
                                Define long-term OKRs, set tactical SMART goals, and track daily PACT commitments. Your learning isn&apos;t just practice—it&apos;s a planned operation.
                            </p>

                            <div className="mt-auto flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-primary">
                                <span>OKR Engine</span>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <span>PACT Tracker</span>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <span>SMART Logic</span>
                            </div>
                        </div>
                    </div>

                    {/* Bento Item: AI Analysis */}
                    <div className="md:col-span-4 group relative rounded-[2.5rem] border border-slate-100 bg-slate-900 overflow-hidden shadow-2xl p-10 hover:shadow-primary/20 transition-all text-white">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-primary/30 transition-colors" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary shadow-lg mb-6">
                                <Brain size={28} />
                            </div>
                            <h3 className="text-2xl font-black mb-4 tracking-tight">Semantic Intelligence</h3>
                            <p className="opacity-60 text-sm font-medium leading-relaxed">
                                Deep-dive into Japanese syntax with our proprietary parser and grammar visualization engine.
                            </p>
                        </div>
                    </div>

                    {/* Bento Item: Content Lab */}
                    <div className="md:col-span-4 group relative rounded-[2.5rem] border border-slate-100 bg-white overflow-hidden shadow-xl shadow-primary/5 p-10 hover:border-primary/30 transition-all">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                                <Layers size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Resource Vault</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                A curated library of podcasts, stories, and mnemonics, all integrated into your review cycle.
                            </p>
                        </div>
                    </div>

                    {/* Bento Item: Practice Tools */}
                    <div className="md:col-span-8 group relative rounded-[2.5rem] border border-slate-100 bg-emerald-50 overflow-hidden shadow-xl shadow-primary/5 p-10 hover:border-primary/30 transition-all">
                        <div className="absolute bottom-0 right-0 w-96 h-48 bg-primary/5 rounded-t-[100px] blur-2xl -mb-12 group-hover:bg-primary/10 transition-colors" />

                        <div className="relative z-10 flex items-center justify-between h-full">
                            <div className="max-w-xs">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm">
                                    <Zap size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">High-Entropy Practice</h3>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                    Rapid-fire Kanji and Vocabulary tools designed for maximum retention in minimum time.
                                </p>
                            </div>

                            <div className="hidden lg:grid grid-cols-2 gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-12 h-12 bg-white rounded-xl border border-primary/20" />
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
