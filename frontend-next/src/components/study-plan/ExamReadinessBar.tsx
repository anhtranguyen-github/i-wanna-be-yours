'use client';

import { Gauge, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';

interface ExamReadinessBarProps {
    readinessPercent: number;
    daysRemaining: number;
    targetExam: string;
    breakdown: {
        vocabulary: number;
        grammar: number;
        kanji: number;
        reading: number;
        listening: number;
    };
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
}

export function ExamReadinessBar({
    readinessPercent,
    daysRemaining,
    targetExam,
    breakdown,
    isExpanded,
    onToggle,
}: ExamReadinessBarProps) {
    const getReadinessStatus = (percent: number) => {
        if (percent >= 80) return { label: 'Exam Ready', color: 'text-emerald-600', bg: 'bg-emerald-500' };
        if (percent >= 60) return { label: 'On Track', color: 'text-blue-600', bg: 'bg-blue-500' };
        if (percent >= 40) return { label: 'Needs Work', color: 'text-amber-600', bg: 'bg-amber-500' };
        return { label: 'Behind', color: 'text-red-600', bg: 'bg-red-500' };
    };

    const status = getReadinessStatus(readinessPercent);

    const summaryContent = (
        <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status.bg} animate-pulse`} />
            <span className={`font-black ${status.color}`}>{readinessPercent}%</span>
        </div>
    );

    const categories = [
        { key: 'vocabulary', label: 'Vocabulary', percent: breakdown.vocabulary },
        { key: 'grammar', label: 'Grammar', percent: breakdown.grammar },
        { key: 'kanji', label: 'Kanji', percent: breakdown.kanji },
        { key: 'reading', label: 'Reading', percent: breakdown.reading },
        { key: 'listening', label: 'Listening', percent: breakdown.listening },
    ];

    const lowestCategory = categories.reduce((min, cat) =>
        cat.percent < min.percent ? cat : min
    );

    return (
        <CollapsibleCard
            id="exam-readiness"
            title="Exam Readiness"
            subtitle={`${targetExam} in ${daysRemaining} days`}
            icon={Gauge}
            isExpanded={isExpanded}
            onToggle={onToggle}
            summaryContent={summaryContent}
            badge={status.label}
            badgeVariant={readinessPercent >= 60 ? 'success' : readinessPercent >= 40 ? 'warning' : 'danger'}
        >
            <div className="mt-4 space-y-6">
                {/* Main Gauge */}
                <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-neutral-ink">Overall Readiness</span>
                        <span className={`text-2xl font-black ${status.color}`}>{readinessPercent}%</span>
                    </div>
                    <div className="h-4 bg-neutral-beige rounded-full overflow-hidden">
                        <div
                            className={`h-full ${status.bg} rounded-full transition-all duration-700`}
                            style={{ width: `${readinessPercent}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-neutral-ink/50">
                        <span>0%</span>
                        <span>Pass Threshold (60%)</span>
                        <span>100%</span>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div>
                    <h4 className="text-xs font-black text-neutral-ink uppercase tracking-widest mb-3">
                        Section Breakdown
                    </h4>
                    <div className="grid grid-cols-5 gap-2">
                        {categories.map(cat => {
                            const isLow = cat.percent < 50;
                            return (
                                <div
                                    key={cat.key}
                                    className={`p-3 rounded-xl text-center ${isLow ? 'bg-red-50 border border-red-200' : 'bg-neutral-beige/50'
                                        }`}
                                >
                                    <span className={`text-lg font-black ${isLow ? 'text-red-600' : 'text-neutral-ink'}`}>
                                        {cat.percent}%
                                    </span>
                                    <p className="text-[10px] font-bold text-neutral-ink/60 mt-1 truncate">
                                        {cat.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recommendation */}
                <div className={`p-4 rounded-xl flex items-start gap-3 ${readinessPercent >= 60 ? 'bg-emerald-50' : 'bg-amber-50'
                    }`}>
                    {readinessPercent >= 60 ? (
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                        <p className={`text-sm font-bold ${readinessPercent >= 60 ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                            {readinessPercent >= 60
                                ? "You're on track for the exam!"
                                : `Focus on ${lowestCategory.label} to improve your readiness.`
                            }
                        </p>
                        <p className="text-xs text-neutral-ink/60 mt-1">
                            {daysRemaining} days remaining to prepare
                        </p>
                    </div>
                </div>
            </div>
        </CollapsibleCard>
    );
}

export default ExamReadinessBar;
