'use client';

import * as React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from './info-tooltip';

export interface StatCardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon: LucideIcon;
    iconColor?: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    helpTitle?: string;
    helpContent?: string;
    helpUrl?: string;
    onClick?: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function StatCard({
    label,
    value,
    unit,
    icon: Icon,
    iconColor = 'text-primary',
    trend,
    trendValue,
    helpTitle,
    helpContent,
    helpUrl,
    onClick,
    className,
    size = 'md',
}: StatCardProps) {
    const isClickable = !!onClick;

    const sizeClasses = {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    const valueSizes = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-3xl',
    };

    const iconSizes = {
        sm: 16,
        md: 20,
        lg: 24,
    };

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400';

    return (
        <div
            className={cn(
                'relative rounded-2xl bg-white border border-slate-100',
                'shadow-sm hover:shadow-md transition-all duration-300',
                sizeClasses[size],
                isClickable && 'cursor-pointer hover:border-primary/30 group',
                className
            )}
            onClick={onClick}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
        >
            {/* Header with icon and help */}
            <div className="flex items-start justify-between mb-2">
                <div className={cn('p-2 rounded-xl bg-slate-50', iconColor.replace('text-', 'bg-').replace('salmon', 'salmon/10'))}>
                    <Icon size={iconSizes[size]} className={iconColor} />
                </div>
                <div className="flex items-center gap-1">
                    {helpContent && (
                        <InfoTooltip
                            title={helpTitle || label}
                            content={helpContent}
                            learnMoreUrl={helpUrl}
                            iconSize={12}
                        />
                    )}
                    {isClickable && (
                        <ChevronRight
                            size={16}
                            className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                        />
                    )}
                </div>
            </div>

            {/* Label */}
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                {label}
            </p>

            {/* Value */}
            <div className="flex items-baseline gap-1">
                <span className={cn('font-black text-slate-900', valueSizes[size])}>
                    {value}
                </span>
                {unit && (
                    <span className="text-sm font-medium text-slate-400">{unit}</span>
                )}
            </div>

            {/* Trend */}
            {trend && trendValue && (
                <div className={cn('flex items-center gap-1 mt-2', trendColor)}>
                    <TrendIcon size={14} />
                    <span className="text-xs font-semibold">{trendValue}</span>
                </div>
            )}
        </div>
    );
}

export default StatCard;
