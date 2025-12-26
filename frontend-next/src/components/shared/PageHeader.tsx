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
        <header className="bg-neutral-beige/20 border-b border-neutral-gray/20 px-6 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Back Button (Above) */}
                {backHref && backPosition === 'above' && (
                    <Link
                        href={backHref}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-ink hover:text-primary-strong mb-6 transition-colors group w-fit"
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
                            <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center shrink-0`}>
                                {icon}
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-black text-neutral-ink font-display">
                                {renderedTitle}
                            </h1>
                            {subtitle && (
                                <p className="text-neutral-ink mt-1 font-bold">{subtitle}</p>
                            )}
                        </div>
                    </div>

                    {rightContent && (
                        <div className="flex items-center gap-4">{rightContent}</div>
                    )}
                </div>

                {/* Optional content below (SearchNexus, filters, etc.) */}
                {children && (
                    <div className="mt-6">
                        {children}
                    </div>
                )}
            </div>
        </header>
    );
}
