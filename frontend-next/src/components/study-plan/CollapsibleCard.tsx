'use client';

import * as React from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CollapsibleCard - A wrapper component for dashboard sections.
 * 
 * Features:
 * - Collapsed (summary) and expanded (detail) views
 * - Keyboard accessible (Space/Enter to toggle)
 * - Smooth animation transitions
 * - Persists state via callback
 */

export interface CollapsibleCardProps {
    id: string;
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
    summaryContent: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    headerClassName?: string;
    badge?: string | number;
    badgeVariant?: 'default' | 'success' | 'warning' | 'danger';
}

export function CollapsibleCard({
    id,
    title,
    subtitle,
    icon: Icon,
    isExpanded,
    onToggle,
    summaryContent,
    children,
    className,
    headerClassName,
    badge,
    badgeVariant = 'default',
}: CollapsibleCardProps) {
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = React.useState<number | undefined>(
        isExpanded ? undefined : 0
    );

    React.useEffect(() => {
        if (contentRef.current) {
            setContentHeight(isExpanded ? contentRef.current.scrollHeight : 0);
        }
    }, [isExpanded]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(id, !isExpanded);
        }
    };

    const badgeColors = {
        default: 'bg-neutral-beige text-neutral-ink',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
    };

    return (
        <div
            className={cn(
                'rounded-[1.5rem] bg-neutral-white border border-neutral-gray/10 overflow-hidden transition-shadow duration-300',
                isExpanded && 'shadow-lg shadow-neutral-gray/5',
                className
            )}
        >
            {/* Header - Always Clickable */}
            <button
                type="button"
                onClick={() => onToggle(id, !isExpanded)}
                onKeyDown={handleKeyDown}
                className={cn(
                    'w-full flex items-center justify-between p-5',
                    'hover:bg-neutral-beige/30 transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary-strong/20 focus:ring-inset',
                    headerClassName
                )}
                aria-expanded={isExpanded}
                aria-controls={`${id}-content`}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-2.5 rounded-xl bg-primary-strong/10">
                            <Icon size={20} className="text-primary-strong" />
                        </div>
                    )}
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-neutral-ink tracking-tight">{title}</h3>
                            {badge !== undefined && (
                                <span className={cn(
                                    'px-2 py-0.5 rounded-full text-xs font-bold',
                                    badgeColors[badgeVariant]
                                )}>
                                    {badge}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-xs text-neutral-ink/70 font-medium mt-0.5">{subtitle}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Summary Content (shown when collapsed) */}
                    {!isExpanded && (
                        <div className="hidden md:block">
                            {summaryContent}
                        </div>
                    )}

                    <ChevronDown
                        size={20}
                        className={cn(
                            'text-neutral-ink/50 transition-transform duration-300',
                            isExpanded && 'rotate-180'
                        )}
                    />
                </div>
            </button>

            {/* Expandable Content */}
            <div
                id={`${id}-content`}
                style={{ height: contentHeight }}
                className="overflow-hidden transition-[height] duration-300 ease-in-out"
            >
                <div ref={contentRef} className="p-5 pt-0 border-t border-neutral-gray/10">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default CollapsibleCard;
