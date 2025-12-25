'use client';

import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface InfoTooltipProps {
    title: string;
    content: string;
    learnMoreUrl?: string;
    className?: string;
    iconSize?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
}

export function InfoTooltip({
    title,
    content,
    learnMoreUrl,
    className,
    iconSize = 14,
    side = 'top',
}: InfoTooltipProps) {
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        role="button"
                        tabIndex={0}
                        className={cn(
                            'inline-flex items-center justify-center rounded-full cursor-pointer',
                            'text-neutral-ink hover:text-blue-500 hover:bg-blue-50',
                            'transition-colors duration-200 p-0.5',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                            className
                        )}
                        aria-label={`Info about ${title}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <HelpCircle size={iconSize} />
                    </span>
                </TooltipTrigger>
                <TooltipContent
                    side={side}
                    className="max-w-[280px] bg-slate-900 text-white border-slate-700 p-3"
                >
                    <div className="space-y-1.5">
                        <p className="font-semibold text-sm text-white">{title}</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{content}</p>
                        {learnMoreUrl && (
                            <a
                                href={learnMoreUrl}
                                className="inline-block text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Learn more →
                            </a>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default InfoTooltip;
