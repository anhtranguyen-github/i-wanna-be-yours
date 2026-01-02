"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

export default function Loading() {
    return (
        <div>
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-neutral-beige/10 backdrop-blur-sm">
                {/* Ambient Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative flex flex-col items-center gap-8">
                    {/* Neural Pulsar */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        {/* Ripple Rings */}
                        {[0.6, 1, 1.4].map((scale, i) => (
                            <motion.div
                                key={i}
                                className="absolute inset-0 border-2 border-primary/20 rounded-full"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{
                                    scale: scale + 0.5,
                                    opacity: [0, 0.4, 0]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.4,
                                    ease: "easeOut"
                                }}
                            />
                        ))}

                        {/* Main Orb */}
                        <motion.div
                            className="w-16 h-16 bg-white border-2 border-primary/20 rounded-2xl shadow-2xl flex items-center justify-center z-10"
                            animate={{
                                rotate: [0, 90, 180, 270, 360],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            style={{ transformOrigin: 'center' }}
                        >
                            <Brain className="text-primary-strong animate-pulse" size={32} />
                        </motion.div>

                        {/* Spinning Outer Ring */}
                        <div className="absolute inset-0 border-t-2 border-primary-strong rounded-full animate-spin duration-1000" />
                    </div>

                    {/* Progress Text */}
                    <div className="text-center space-y-2 z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-ink/30 animate-pulse">
                            Neural Reconstitution
                        </p>
                        <h2 className="text-xl font-black text-neutral-ink font-display italic tracking-tight">
                            Initializing Synaptic Array...
                        </h2>
                    </div>
                </div>

                {/* Bottom Status Feed */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-primary-strong rounded-full animate-ping" />
                    <span className="text-[9px] font-bold text-neutral-ink/40 uppercase tracking-widest">
                        Linguistic registry synchronization in progress
                    </span>
                </div>
            </div>
        </div>
    );
}
