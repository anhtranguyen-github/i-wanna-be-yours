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
            title: 'Initialize Neural Session',
            description: `Sign in to unlock deep linguistic analysis and state-of-the-art ${toolName} capabilities.`
        });
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-md w-full bg-neutral-900 border border-cyan-500/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6 group">
                        <Lock className="text-cyan-400 w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-4 font-display">
                        NEURAL ACCESS RESTRICTED
                    </h2>

                    <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
                        State-of-the-art linguistic modeling requires a synchronized neural session. Join the <span className="text-cyan-400 font-bold">Hanabira Intelligence Tier</span> to unlock this tool.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex flex-col gap-2">
                            <Zap size={14} className="text-yellow-400" />
                            <span className="text-[10px] uppercase tracking-wider text-neutral-300 font-bold">Qwen3 Powered</span>
                            <p className="text-[9px] text-neutral-500">1.7B Parameter syntactic analysis</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex flex-col gap-2">
                            <ShieldCheck size={14} className="text-green-400" />
                            <span className="text-[10px] uppercase tracking-wider text-neutral-300 font-bold">Hybrid Accuracy</span>
                            <p className="text-[9px] text-neutral-500">MeCab-grounded token validation</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] transform hover:translate-y-[-2px] active:translate-y-[0px]"
                    >
                        Synchronize Now
                    </button>

                    <p className="mt-4 text-[9px] text-neutral-600 uppercase tracking-widest font-black">
                        Priority Core: Sakura-V1 Active
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
