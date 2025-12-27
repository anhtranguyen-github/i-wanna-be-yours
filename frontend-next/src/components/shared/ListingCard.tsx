
"use client";

import React from 'react';
import { ArrowRight, Layers, MoreVertical, Share2, Pencil, Zap } from 'lucide-react';
import { ViewMode } from './ViewModeToggle';

export interface ListingMetadata {
    label: string;
    icon?: React.ReactNode;
    value?: string | number;
    color?: string;
}

interface ListingCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    iconBgColor?: string;
    metadata?: ListingMetadata[];
    onClick?: () => void;
    viewMode: ViewMode;
    badge?: {
        label: string;
        color?: string;
    };
    actionIcon?: React.ReactNode;
    onEdit?: () => void;
    onShare?: () => void;
    onQuickAction?: () => void;
    quickActionIcon?: React.ReactNode;
    quickActionLabel?: string;
}

export function ListingCard({
    title,
    description,
    icon,
    iconBgColor = 'bg-neutral-beige/50',
    metadata = [],
    onClick,
    viewMode,
    badge,
    actionIcon = <ArrowRight size={20} />,
    onEdit,
    onShare,
    onQuickAction,
    quickActionIcon,
    quickActionLabel = "Quick Study"
}: ListingCardProps) {
    const handleActionClick = (e: React.MouseEvent, action?: () => void) => {
        e.stopPropagation();
        if (action) action();
    };

    if (viewMode === 'LIST') {
        return (
            <div
                onClick={onClick}
                className={`
                    bg-neutral-white border border-neutral-gray/20 rounded-2xl p-4 flex items-center justify-between group 
                    hover:border-primary-strong transition-all cursor-pointer
                `}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center text-neutral-ink group-hover:bg-primary-strong group-hover:text-white transition-all`}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-black text-neutral-ink font-display group-hover:text-primary-strong transition-colors ring-offset-0 truncate">
                            {title}
                        </h4>
                        <p className="text-[10px] text-neutral-ink font-bold opacity-60 line-clamp-1 max-w-md">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-6">
                        {metadata.map((meta, i) => (
                            <div key={i} className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${meta.color || 'text-neutral-ink/40'}`}>
                                {meta.icon}
                                {meta.value} {meta.label}
                            </div>
                        ))}
                    </div>

                    {badge && (
                        <span className={`px-2 py-1 ${badge.color || 'bg-neutral-beige/30'} text-[9px] font-black uppercase tracking-widest rounded-lg`}>
                            {badge.label}
                        </span>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        {onQuickAction && (
                            <button
                                onClick={(e) => handleActionClick(e, onQuickAction)}
                                className="px-4 py-2 bg-primary-strong text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-ink transition-all shadow-lg shadow-primary-strong/20"
                            >
                                {quickActionIcon || <Zap size={14} fill="currentColor" />}
                                {quickActionLabel}
                            </button>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onShare && (
                                <button
                                    onClick={(e) => handleActionClick(e, onShare)}
                                    className="p-2 text-neutral-ink/40 hover:text-primary-strong hover:bg-primary-strong/10 rounded-lg transition-colors"
                                    title="Share"
                                >
                                    <Share2 size={16} />
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={(e) => handleActionClick(e, onEdit)}
                                    className="p-2 text-neutral-ink/40 hover:text-primary-strong hover:bg-primary-strong/10 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Pencil size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="text-neutral-ink/40 group-hover:text-primary-strong group-hover:translate-x-1 transition-all">
                        {actionIcon}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`
                bg-neutral-white border border-neutral-gray/20 rounded-[2rem] p-8 hover:border-primary-strong 
                transition-all group relative overflow-hidden h-full flex flex-col cursor-pointer
            `}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

            <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 ${iconBgColor} rounded-2xl flex items-center justify-center text-neutral-ink group-hover:bg-primary-strong group-hover:text-white transition-all`}>
                    {icon}
                </div>

                <div className="flex items-center gap-2 z-10">
                    {badge && (
                        <span className={`px-3 py-1.5 bg-neutral-white border border-neutral-gray/20 text-neutral-ink rounded-xl text-[9px] font-black uppercase tracking-widest`}>
                            {badge.label}
                        </span>
                    )}

                    <div className="flex items-center gap-1 bg-neutral-beige/30 p-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        {onShare && (
                            <button
                                onClick={(e) => handleActionClick(e, onShare)}
                                className="p-2 text-neutral-ink/40 hover:text-primary-strong hover:bg-white rounded-lg transition-all"
                                title="Share"
                            >
                                <Share2 size={16} />
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={(e) => handleActionClick(e, onEdit)}
                                className="p-2 text-neutral-ink/40 hover:text-primary-strong hover:bg-white rounded-lg transition-all"
                                title="Edit"
                            >
                                <Pencil size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <h3 className="text-2xl font-black text-neutral-ink font-display mb-3 group-hover:text-primary-strong transition-colors">
                {title}
            </h3>
            <p className="text-sm font-bold text-neutral-ink mb-8 line-clamp-2 opacity-80 flex-grow leading-relaxed">
                {description}
            </p>

            <div className="flex flex-col gap-4 mt-auto">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">
                    {metadata.map((meta, i) => (
                        <span key={i} className="flex items-center gap-2">
                            {meta.icon}
                            {meta.value} {meta.label}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-gray/10">
                    <div className="flex items-center gap-2">
                        {onQuickAction && (
                            <button
                                onClick={(e) => handleActionClick(e, onQuickAction)}
                                className="px-6 py-2.5 bg-neutral-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-strong transition-all shadow-xl shadow-neutral-ink/10"
                            >
                                {quickActionIcon || <Zap size={14} fill="currentColor" />}
                                {quickActionLabel}
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-neutral-ink group-hover:translate-x-2 transition-transform">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-60 transition-opacity">View Detail</span>
                        {actionIcon}
                    </div>
                </div>
            </div>
        </div>
    );
}
