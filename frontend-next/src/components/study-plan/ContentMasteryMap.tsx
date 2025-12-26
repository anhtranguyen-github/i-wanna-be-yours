'use client';

import { BarChart3 } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';

interface ContentMasteryMapProps {
    mastery: {
        grammar: { percent: number; learned: number; total: number };
        kanji: { percent: number; learned: number; total: number };
        vocabulary: { percent: number; learned: number; total: number };
        reading: { percent: number; learned: number; total: number };
        listening: { percent: number; learned: number; total: number };
    };
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
    onCategoryClick?: (category: string) => void;
}

const CATEGORY_CONFIG = {
    vocabulary: { label: 'Vocabulary', emoji: '📚', color: 'bg-blue-500' },
    kanji: { label: 'Kanji', emoji: '漢', color: 'bg-purple-500' },
    grammar: { label: 'Grammar', emoji: '✏️', color: 'bg-emerald-500' },
    reading: { label: 'Reading', emoji: '📖', color: 'bg-amber-500' },
    listening: { label: 'Listening', emoji: '🎧', color: 'bg-pink-500' },
};

export function ContentMasteryMap({
    mastery,
    isExpanded,
    onToggle,
    onCategoryClick,
}: ContentMasteryMapProps) {
    const avgMastery = Math.round(
        (mastery.grammar.percent + mastery.kanji.percent + mastery.vocabulary.percent +
            mastery.reading.percent + mastery.listening.percent) / 5
    );

    const summaryContent = (
        <div className="flex items-center gap-2">
            <span className="text-lg font-black text-primary-strong">{avgMastery}%</span>
            <span className="text-xs text-neutral-ink/60">avg</span>
        </div>
    );

    const categories = [
        { key: 'vocabulary', ...mastery.vocabulary },
        { key: 'kanji', ...mastery.kanji },
        { key: 'grammar', ...mastery.grammar },
        { key: 'reading', ...mastery.reading },
        { key: 'listening', ...mastery.listening },
    ];

    return (
        <CollapsibleCard
            id="content-mastery"
            title="Content Mastery"
            subtitle="Your JLPT skill breakdown"
            icon={BarChart3}
            isExpanded={isExpanded}
            onToggle={onToggle}
            summaryContent={summaryContent}
        >
            <div className="space-y-4 mt-4">
                {categories.map(({ key, percent, learned, total }) => {
                    const config = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG];

                    return (
                        <button
                            key={key}
                            onClick={() => onCategoryClick?.(key)}
                            className="w-full group"
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{config.emoji}</span>
                                    <span className="font-bold text-neutral-ink group-hover:text-primary-strong transition-colors">
                                        {config.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-neutral-ink/60">
                                        {learned}/{total}
                                    </span>
                                    <span className="font-black text-neutral-ink">{percent}%</span>
                                </div>
                            </div>
                            <div className="h-2.5 bg-neutral-beige rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${config.color} rounded-full transition-all duration-500 group-hover:opacity-80`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </button>
                    );
                })}

                {/* Radar Chart Placeholder */}
                <div className="mt-6 p-6 bg-neutral-beige/30 rounded-xl text-center">
                    <p className="text-sm text-neutral-ink/60 font-medium">
                        Skill radar visualization available in expanded view
                    </p>
                </div>
            </div>
        </CollapsibleCard>
    );
}

export default ContentMasteryMap;
