"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useGlobalAuth } from '@/context/GlobalAuthContext';

interface GuestTeaserProps {
    toolName: string;
}

export const GuestTeaser: React.FC<GuestTeaserProps> = ({ toolName }) => {
    const { openAuth } = useGlobalAuth();

    const handleLogin = () => {
        openAuth('LOGIN', {
            title: 'Initialize Session',
            description: `Sign in to unlock deep linguistic analysis and state-of-the-art ${toolName} capabilities.`
        });
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-neutral-beige/80 backdrop-blur-md rounded-[2.5rem]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-md w-full bg-white border border-primary/20 p-8 rounded-[2rem] shadow-xl shadow-primary/10 relative overflow-hidden"
            >
                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(246,177,195,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(246,177,195,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-6 group">
                        <Lock className="text-primary w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    <h2 className="text-2xl font-black text-neutral-ink mb-4 font-display uppercase tracking-wider">
                        Access Restricted
                    </h2>

                    <p className="text-neutral-ink/70 text-sm mb-8 leading-relaxed font-bold">
                        Advanced linguistic modeling requires a synchronized session. Join the <span className="text-primary font-black">Hanachan Intelligence Tier</span> to unlock this tool.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                        <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col gap-2">
                            <Zap size={14} className="text-accent" />
                            <span className="text-[10px] uppercase tracking-wider text-neutral-ink font-black">Qwen3 Powered</span>
                            <p className="text-[9px] text-neutral-500 font-bold">1.7B Parameter syntactic analysis</p>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col gap-2">
                            <ShieldCheck size={14} className="text-teal-500" />
                            <span className="text-[10px] uppercase tracking-wider text-neutral-ink font-black">Hybrid Accuracy</span>
                            <p className="text-[9px] text-neutral-500 font-bold">MeCab-grounded token validation</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="w-full py-4 bg-primary hover:bg-primary-strong text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 transform hover:translate-y-[-2px] active:translate-y-[0px]"
                    >
                        Synchronize Now
                    </button>

                    <p className="mt-4 text-[9px] text-primary/50 uppercase tracking-widest font-black">
                        Priority Core: Sakura-V1 Active
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
