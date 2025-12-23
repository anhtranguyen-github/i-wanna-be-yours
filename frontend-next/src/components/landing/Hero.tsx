import Link from 'next/link';
import React from 'react';
import { ArrowRight, Sparkles, Target, Zap } from 'lucide-react';
import Image from 'next/image';

export const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#F8FAFC]">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -mr-96 -mt-96 opacity-60" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/20 rounded-full blur-[100px] -ml-48 -mb-48 opacity-40" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Content Column */}
                    <div className="text-left space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/5">
                            <Sparkles size={14} className="fill-primary" />
                            The New Era of Japanese Mastery
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.95] font-display">
                            STRATEGIC <br />
                            <span className="text-primary italic">INTELLIGENCE.</span>
                        </h1>

                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                            The ultimate OS for linguistic acquisition. From AI-powered semantic analysis to structured strategic planning, Hanabira is your command center for Japanese mastery.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                            <Link
                                href="/study-plan"
                                className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 group"
                            >
                                Initiate Strategy
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/tools"
                                className="w-full sm:w-auto px-10 py-5 bg-white border border-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-50 shadow-xl shadow-primary/5 flex items-center justify-center gap-3"
                            >
                                <Zap size={18} className="text-primary" />
                                Explore Lab
                            </Link>
                        </div>

                        <div className="flex items-center gap-8 pt-8 border-t border-slate-100">
                            <div>
                                <p className="text-2xl font-black text-slate-900 leading-none">N5-N1</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Full Coverage</p>
                            </div>
                            <div className="h-8 w-px bg-slate-100" />
                            <div>
                                <p className="text-2xl font-black text-slate-900 leading-none">AI Native</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Deep Analysis</p>
                            </div>
                            <div className="h-8 w-px bg-slate-100" />
                            <div>
                                <p className="text-2xl font-black text-slate-900 leading-none">24/7</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Strategic Support</p>
                            </div>
                        </div>
                    </div>

                    {/* Visual Column */}
                    <div className="relative animate-in fade-in slide-in-from-right-12 duration-1000 delay-300">
                        <div className="relative rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/10 border border-white p-2 bg-white/50 backdrop-blur-sm">
                            <div className="aspect-square bg-white rounded-[2.5rem] overflow-hidden relative group">
                                <Image
                                    src="/hanabira_hero_illustration.png"
                                    alt="Hanabira Strategic Intelligence"
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        {/* Floating Micro-Cards */}
                        <div className="absolute -top-8 -left-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xl animate-bounce duration-[4000ms]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">OKR Tracking</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Progress: 84%</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-8 -right-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xl animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">PACT Active</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Streak: 12 days</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
