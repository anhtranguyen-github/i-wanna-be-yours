"use client";

import React from 'react';
import {
    InboxIcon,
    DocumentChartBarIcon,
    ArrowUturnLeftIcon,
    PencilSquareIcon,
    SparklesIcon,
    ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import { GraduationCap, BookOpen, Languages, Brain } from 'lucide-react';

export interface FeatureItem {
    name: string;
    description?: string;
    icon: React.ReactNode;
    color: string;
    href?: string;
}

// Default features for the platform
export const defaultFeatures: FeatureItem[] = [
    {
        name: "YouTube Immersion",
        description: "Enhance learning with engaging video content.",
        icon: <InboxIcon className="h-6 w-6" />,
        color: "bg-brand-blue",
        href: "/tools/text-parser/youtube"
    },
    {
        name: "Text Parser",
        description: "Easily split and tokenize custom texts.",
        icon: <DocumentChartBarIcon className="h-6 w-6" />,
        color: "bg-brand-green",
        href: "/tools/text-parser"
    },
    {
        name: "Grammar",
        description: "Quick and clear grammar points with examples.",
        icon: <ArrowUturnLeftIcon className="h-6 w-6" />,
        color: "bg-brand-peach",
        href: "/knowledge-base/grammar"
    },
    {
        name: "Flashcards",
        description: "Effective spaced repetition flashcards.",
        icon: <PencilSquareIcon className="h-6 w-6" />,
        color: "bg-brand-indigo",
        href: "/flashcards"
    },
    {
        name: "Vocabulary",
        description: "Discover new words and sentences.",
        icon: <SparklesIcon className="h-6 w-6" />,
        color: "bg-brand-softBlue",
        href: "/tools/word-relations"
    },
    {
        name: "Kanji",
        description: "Simplified kanji learning techniques.",
        icon: <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />,
        color: "bg-brand-orange",
        href: "/tools/quick-kanji"
    }
];

// Condensed features for modal (4 items)
export const modalFeatures: FeatureItem[] = [
    {
        name: "Practice Tests",
        icon: <GraduationCap className="h-5 w-5" />,
        color: "bg-brand-green"
    },
    {
        name: "Flashcards",
        icon: <BookOpen className="h-5 w-5" />,
        color: "bg-brand-blue"
    },
    {
        name: "Grammar",
        icon: <Languages className="h-5 w-5" />,
        color: "bg-brand-peach"
    },
    {
        name: "Vocabulary",
        icon: <Brain className="h-5 w-5" />,
        color: "bg-brand-indigo"
    }
];

interface FeatureIconGridProps {
    features?: FeatureItem[];
    maxItems?: number;
    layout?: 'grid' | 'row';
    showDescriptions?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function FeatureIconGrid({
    features = defaultFeatures,
    maxItems,
    layout = 'grid',
    showDescriptions = true,
    size = 'md'
}: FeatureIconGridProps) {
    const displayFeatures = maxItems ? features.slice(0, maxItems) : features;

    const sizeStyles = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12'
    };

    if (layout === 'row') {
        return (
            <div className="flex flex-wrap justify-center gap-4">
                {displayFeatures.map((feature, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <div className={`${sizeStyles[size]} ${feature.color} rounded-xl flex items-center justify-center text-white`}>
                            {feature.icon}
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{feature.name}</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayFeatures.map((feature, idx) => (
                <div
                    key={idx}
                    className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-slate-100 hover:border-brand-green/30 hover:bg-brand-green/5 transition-colors"
                >
                    <div className={`flex-shrink-0 ${sizeStyles[size]} rounded-xl ${feature.color} flex items-center justify-center text-white`}>
                        {feature.icon}
                    </div>
                    <div>
                        <p className="font-bold text-brand-dark">{feature.name}</p>
                        {showDescriptions && feature.description && (
                            <p className="text-sm text-slate-500 leading-snug">{feature.description}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
