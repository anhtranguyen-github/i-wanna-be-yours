"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    iconBgColor?: string;
    highlightWord?: string;
    backHref?: string;
    backLabel?: string;
    backPosition?: 'above' | 'inline';
    rightContent?: React.ReactNode;
    children?: React.ReactNode;
}

export function PageHeader({
    title,
    subtitle,
    icon,
    iconBgColor = "bg-primary/20",
    highlightWord,
    backHref,
    backLabel = "Back",
    backPosition = 'above',
    rightContent,
    children
}: PageHeaderProps) {
    // Split title for highlight
    let renderedTitle: React.ReactNode = title;
    if (highlightWord && title.includes(highlightWord)) {
        const parts = title.split(highlightWord);
        renderedTitle = (
            <>
                {parts[0]}
                <span className="text-primary-strong">{highlightWord}</span>
                {parts[1] || ''}
            </>
        );
    }

    return (
        <>
            {/* Sticky Header Bar */}
            <header className="bg-neutral-white/95 backdrop-blur-sm border-b border-neutral-gray/20 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto">
                    {/* Back Button (Above) */}
                    {backHref && backPosition === 'above' && (
                        <Link
                            href={backHref}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-ink hover:text-primary-strong mb-4 transition-colors group w-fit"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            {backLabel}
                        </Link>
                    )}

                    {/* Title Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Inline Back Button */}
                            {backHref && backPosition === 'inline' && (
                                <Link
                                    href={backHref}
                                    className="flex items-center gap-2 text-neutral-ink hover:text-primary-strong transition-colors group mr-2"
                                >
                                    <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                                </Link>
                            )}

                            {icon && (
                                <div className={`w-10 h-10 ${iconBgColor} rounded-xl flex items-center justify-center shrink-0`}>
                                    {icon}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-black text-neutral-ink font-display">
                                    {renderedTitle}
                                </h1>
                                {subtitle && (
                                    <p className="text-neutral-ink/60 text-sm font-bold">{subtitle}</p>
                                )}
                            </div>
                        </div>

                        {rightContent && (
                            <div className="flex items-center gap-3">{rightContent}</div>
                        )}
                    </div>
                </div>
            </header>

            {/* Expandable Children Area (NOT sticky - filters expand here) */}
            {children && (
                <div className="bg-neutral-beige/30 px-6 py-4 border-b border-neutral-gray/10">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </div>
            )}
        </>
    );
}
