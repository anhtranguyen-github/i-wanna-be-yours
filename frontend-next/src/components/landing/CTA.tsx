import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CTA = () => {
    return (
        <section className="py-24 bg-white px-6">
            <div className="max-w-5xl mx-auto relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center text-white shadow-2xl">
                {/* Decorative BG */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

                <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-primary font-black text-[10px] uppercase tracking-widest border border-white/20">
                        <Sparkles size={14} className="fill-primary" /> Ready to Command?
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                        Initiate Your <br />
                        <span className="text-primary italic">Strategic Journey.</span>
                    </h2>

                    <p className="text-slate-400 font-medium text-lg leading-relaxed">
                        Join the elite circle of learners who treat language acquisition as a high-fidelity strategy. Start the deployment of your mastery today.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                        <Link
                            href="/study-plan"
                            className="w-full sm:w-auto px-12 py-6 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 group"
                        >
                            Get Started Now
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/library"
                            className="w-full sm:w-auto text-slate-400 hover:text-white font-black uppercase tracking-widest text-[10px] transition-colors"
                        >
                            Explore Documentation
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};
