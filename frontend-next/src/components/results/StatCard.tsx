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

    const getColors = () => {
        const c = stat.color || 'primary';
        if (c.includes('emerald')) return 'bg-emerald-500/10 text-emerald-600';
        if (c.includes('rose')) return 'bg-rose-500/10 text-rose-600';
        if (c.includes('amber')) return 'bg-amber-500/10 text-amber-600';
        if (c.includes('blue')) return 'bg-blue-500/10 text-blue-600';
        if (c.includes('purple')) return 'bg-purple-500/10 text-purple-600';
        if (c.includes('secondary')) return 'bg-secondary/10 text-secondary';
        return 'bg-primary-strong/10 text-primary-strong';
    };

    const colorClasses = getColors();

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 + (index * 0.1), duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden bg-neutral-beige/10 backdrop-blur-xl border border-neutral-gray/10 p-7 rounded-[2.5rem] hover:border-primary-strong/30 transition-all duration-500"
        >
            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${colorClasses}`}>
                        {Icon && <Icon size={24} />}
                    </div>

                    <div>
                        <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink/50 mb-1 leading-none">
                            {stat.label}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-neutral-ink font-display tracking-tight">
                                {stat.value}
                            </span>
                        </div>
                    </div>
                </div>

                {stat.trend && (
                    <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${stat.trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' :
                        stat.trend === 'down' ? 'bg-rose-500/10 text-rose-600' :
                            'bg-neutral-gray/10 text-neutral-ink'
                        }`}>
                        {stat.trend === 'up' && <TrendingUp size={12} />}
                        {stat.trend === 'down' && <TrendingDown size={12} />}
                        {stat.trend === 'neutral' && <Minus size={12} />}
                        {stat.trend}
                    </div>
                )}
            </div>

            {/* Micro-sparkle decoration */}
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-700" />
        </motion.div>
    );
}
