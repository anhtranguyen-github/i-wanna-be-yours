import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Info } from 'lucide-react';

interface Tag {
    label: string;
    icon?: React.ReactNode;
    color?: string; // e.g. "bg-primary/10 text-primary"
}

interface DetailHeaderProps {
    title: string;
    subtitle?: string;
    description: string;
    tags?: Tag[];
    backHref: string;
    backLabel?: string;
    onAction?: () => void;
    actionLabel?: string;
    actionIcon?: React.ReactNode;
    image?: React.ReactNode; // Optional hero image/icon
    variant?: 'DEFAULT' | 'GAME' | 'TECHNICAL'; // Affects styling cues
    className?: string;
}

export function DetailHeader({
    title,
    subtitle,
    description,
    tags = [],
    backHref,
    backLabel = "Back to Registry",
    onAction,
    actionLabel = "Start Session",
    actionIcon = <Play size={20} fill="currentColor" />,
    image,
    variant = 'DEFAULT',
    className = ''
}: DetailHeaderProps) {

    // Theme variants
    const accentColor =
        variant === 'GAME' ? 'text-quoot-red border-quoot-red' :
            variant === 'TECHNICAL' ? 'text-practice-blue border-practice-blue' :
                'text-neutral-ink border-neutral-gray';

    return (
        <header className={`bg-neutral-white border-b border-neutral-gray/10 px-6 lg:px-12 py-12 relative overflow-hidden ${className}`}>
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-beige/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="max-w-[1920px] mx-auto relative z-10">
                {/* Back Link */}
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink/50 hover:text-primary-strong transition-colors mb-8 group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    {backLabel}
                </Link>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    {/* Main Info */}
                    <div className="flex-1 max-w-4xl">
                        {/* Tags */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {tags.map((tag, i) => (
                                    <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tag.color || 'bg-neutral-gray/10 text-neutral-ink'}`}>
                                        {tag.icon}
                                        {tag.label}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Title */}
                        <h1 className="text-5xl lg:text-7xl font-black font-display text-neutral-ink tracking-tight mb-4 leading-[0.9]">
                            {title}
                        </h1>

                        {/* Subtitle/Desc */}
                        <div className="space-y-2">
                            {subtitle && (
                                <h2 className="text-lg font-bold text-primary-strong font-display italic">
                                    {subtitle}
                                </h2>
                            )}
                            <p className="text-neutral-ink/60 font-medium text-lg max-w-2xl leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Action Block */}
                    {onAction && (
                        <div className="flex flex-col gap-4 shrink-0">
                            <button
                                onClick={onAction}
                                className="h-16 px-10 bg-neutral-ink text-neutral-white rounded-[2rem] font-black font-display text-sm uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neutral-ink/20 hover:shadow-2xl"
                            >
                                {actionIcon}
                                {actionLabel}
                            </button>
                            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-neutral-ink/40 uppercase tracking-wider">
                                <Info size={12} />
                                <span>Press Enter to Start</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
