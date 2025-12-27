import React from 'react';
import { LucideIcon, Lock } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    color?: string; // e.g. "text-primary-strong"
    className?: string;
    isLocked?: boolean;
    onLockClick?: () => void;
}

export function MetricCard({
    label,
    value,
    icon,
    trend,
    trendDirection = 'neutral',
    color = 'text-primary-strong',
    className = '',
    isLocked = false,
    onLockClick
}: MetricCardProps) {
    return (
        <div
            onClick={isLocked ? onLockClick : undefined}
            className={`bg-neutral-white rounded-[2rem] p-6 border border-neutral-gray/20 hover:border-primary-strong/20 transition-all group ${className} ${isLocked ? 'cursor-pointer' : ''}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-neutral-beige/50 text-neutral-ink group-hover:bg-primary/5 transition-colors`}>
                    {icon}
                </div>
                {isLocked ? (
                    <span className="bg-amber-100 text-amber-700 p-2 rounded-lg">
                        <Lock size={14} />
                    </span>
                ) : trend && (
                    <span className={`text-xs font-black px-2 py-1 rounded-lg uppercase tracking-wider ${trendDirection === 'up' ? 'bg-green-100 text-green-700' :
                        trendDirection === 'down' ? 'bg-red-100 text-red-700' : 'bg-neutral-gray/10 text-neutral-ink/50'
                        }`}>
                        {trend}
                    </span>
                )}
            </div>

            <div className="flex flex-col relative">
                <span className={`text-3xl lg:text-4xl font-black font-display tracking-tight mb-1 ${color} ${isLocked ? 'blur-md select-none opacity-30' : ''}`}>
                    {value}
                </span>
                <span className="text-xs font-bold text-neutral-ink/40 uppercase tracking-widest font-display">
                    {label}
                </span>
                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                            Locked
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function MetricGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {children}
        </div>
    );
}
