"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, MessageCircle } from "lucide-react";

interface HanachanStatusProps {
    status: 'READY' | 'THINKING' | 'TYPING' | 'ERROR';
}

export function HanachanStatus({ status }: HanachanStatusProps) {
    return (
        <div className="flex items-center gap-4 px-6 py-2 bg-neutral-white/50 backdrop-blur-md border border-neutral-gray/10 rounded-full ">
            <div className="relative">
                <div className={`w-3 h-3 rounded-full ${status === 'READY' ? 'bg-emerald-500' :
                        status === 'THINKING' ? 'bg-amber-500' :
                            status === 'TYPING' ? 'bg-primary' : 'bg-rose-500'
                    } ${status !== 'READY' && 'animate-pulse'}`} />
                {status !== 'READY' && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`absolute inset-0 rounded-full ${status === 'THINKING' ? 'bg-amber-500' : 'bg-primary'
                            }`}
                    />
                )}
            </div>

            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink">
                {status === 'READY' && 'Hanachan Ready'}
                {status === 'THINKING' && 'Analyzing Synapses...'}
                {status === 'TYPING' && 'Transmitting Response'}
                {status === 'ERROR' && 'Signal Interrupted'}
            </span>

            <AnimatePresence mode="wait">
                {status === 'READY' && (
                    <motion.div
                        key="ready"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                    >
                        <Sparkles size={14} className="text-secondary" />
                    </motion.div>
                )}
                {status === 'THINKING' && (
                    <motion.div
                        key="thinking"
                        initial={{ opacity: 0, rotate: -180 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    >
                        <Brain size={14} className="text-amber-500" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
