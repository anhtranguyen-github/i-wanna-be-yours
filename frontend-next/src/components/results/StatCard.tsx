"use client";

import React from "react";
import { motion } from "framer-motion";
import { SessionStat } from "@/types/results";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
    stat: SessionStat;
    index: number;
}

export function StatCard({ stat, index }: StatCardProps) {
    const Icon = stat.icon;

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 + (index * 0.1) }}
            className="bg-neutral-white/50 backdrop-blur-md border border-neutral-gray/10 p-6 rounded-[2rem]  hover: hover:border-primary/20 transition-all group overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors" />

            <div className="relative z-10 flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color ? `bg-${stat.color}/10 text-${stat.color}` : 'bg-primary/10 text-primary-strong'}`}>
                    {Icon && <Icon size={20} />}
                </div>
                {stat.trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${stat.trend === 'up' ? 'text-emerald-500' : stat.trend === 'down' ? 'text-rose-500' : 'text-neutral-ink'}`}>
                        {stat.trend === 'up' && <TrendingUp size={12} />}
                        {stat.trend === 'down' && <TrendingDown size={12} />}
                        {stat.trend === 'neutral' && <Minus size={12} />}
                        {stat.trend}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink mb-1">{stat.label}</span>
                <span className="text-2xl font-black text-neutral-ink font-display">{stat.value}</span>
            </div>
        </motion.div>
    );
}
