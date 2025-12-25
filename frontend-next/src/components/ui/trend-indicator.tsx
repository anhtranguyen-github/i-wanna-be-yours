'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrendIndicatorProps {
    trend: 'up' | 'down' | 'stable';
    value?: string | number;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'pill' | 'minimal';
    className?: string;
}

export function TrendIndicator({
    trend,
    value,
    label,
    size = 'md',
    variant = 'default',
    className,
}: TrendIndicatorProps) {
    const colors = {
        up: {
            text: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
        },
        down: {
            text: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
        },
        stable: {
            text: 'text-neutral-ink',
            bg: 'bg-slate-50',
            border: 'border-slate-200',
        },
    };

    const sizes = {
        sm: { icon: 12, text: 'text-xs' },
        md: { icon: 14, text: 'text-sm' },
        lg: { icon: 16, text: 'text-base' },
    };

    const Icon = variant === 'minimal'
        ? (trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus)
        : (trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus);

    const currentColors = colors[trend];
    const currentSize = sizes[size];

    if (variant === 'minimal') {
        return (
            <div className={cn('inline-flex items-center gap-0.5', currentColors.text, className)}>
                <Icon size={currentSize.icon} />
                {value && <span className={cn('font-semibold', currentSize.text)}>{value}</span>}
            </div>
        );
    }

    if (variant === 'pill') {
        return (
            <div
                className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border',
                    currentColors.bg,
                    currentColors.border,
                    currentColors.text,
                    className
                )}
            >
                <Icon size={currentSize.icon} />
                {value && <span className={cn('font-semibold', currentSize.text)}>{value}</span>}
                {label && <span className={cn('font-medium opacity-80', currentSize.text)}>{label}</span>}
            </div>
        );
    }

    // Default variant
    return (
        <div className={cn('inline-flex items-center gap-1', currentColors.text, className)}>
            <Icon size={currentSize.icon} />
            <div className="flex items-baseline gap-1">
                {value && <span className={cn('font-semibold', currentSize.text)}>{value}</span>}
                {label && <span className={cn('font-medium opacity-70', currentSize.text)}>{label}</span>}
            </div>
        </div>
    );
}

export default TrendIndicator;
