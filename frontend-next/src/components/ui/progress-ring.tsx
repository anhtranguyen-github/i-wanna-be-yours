'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressRingProps {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    color?: string;
    backgroundColor?: string;
    showLabel?: boolean;
    labelSize?: 'sm' | 'md' | 'lg';
    className?: string;
    children?: React.ReactNode;
}

export function ProgressRing({
    progress,
    size = 80,
    strokeWidth = 8,
    color = '#f4a89a',
    backgroundColor = '#e2e8f0',
    showLabel = true,
    labelSize = 'md',
    className,
    children,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    const labelSizes = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl',
    };

    return (
        <div className={cn('relative inline-flex items-center justify-center', className)}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
                {children || (showLabel && (
                    <span className={cn('font-bold text-neutral-ink', labelSizes[labelSize])}>
                        {Math.round(progress)}%
                    </span>
                ))}
            </div>
        </div>
    );
}

export default ProgressRing;
