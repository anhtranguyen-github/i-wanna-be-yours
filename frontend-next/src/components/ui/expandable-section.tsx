'use client';

import * as React from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from './info-tooltip';

export interface ExpandableSectionProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    defaultOpen?: boolean;
    badge?: string | number;
    badgeColor?: 'default' | 'success' | 'warning' | 'danger';
    helpTitle?: string;
    helpContent?: string;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    children: React.ReactNode;
}

export function ExpandableSection({
    title,
    subtitle,
    icon: Icon,
    defaultOpen = false,
    badge,
    badgeColor = 'default',
    helpTitle,
    helpContent,
    className,
    headerClassName,
    contentClassName,
    children,
}: ExpandableSectionProps) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = React.useState<number | undefined>(
        defaultOpen ? undefined : 0
    );

    React.useEffect(() => {
        if (contentRef.current) {
            setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
        }
    }, [isOpen]);

    const badgeColors = {
        default: 'bg-slate-100 text-slate-600',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
    };

    return (
        <div className={cn('rounded-2xl bg-white border border-slate-100 overflow-hidden', className)}>
            {/* Header */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-center justify-between p-4',
                    'hover:bg-slate-50 transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-brand-salmon/20 focus:ring-inset',
                    headerClassName
                )}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-2 rounded-xl bg-brand-salmon/10">
                            <Icon size={18} className="text-brand-salmon" />
                        </div>
                    )}
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">{title}</h3>
                            {badge !== undefined && (
                                <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', badgeColors[badgeColor])}>
                                    {badge}
                                </span>
                            )}
                            {helpContent && (
                                <InfoTooltip
                                    title={helpTitle || title}
                                    content={helpContent}
                                    iconSize={12}
                                />
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                </div>

                <ChevronDown
                    size={20}
                    className={cn(
                        'text-slate-400 transition-transform duration-300',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>

            {/* Content */}
            <div
                style={{ height: contentHeight }}
                className="overflow-hidden transition-[height] duration-300 ease-in-out"
            >
                <div ref={contentRef} className={cn('p-4 pt-0 border-t border-slate-50', contentClassName)}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default ExpandableSection;
