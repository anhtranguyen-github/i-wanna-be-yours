'use client';

import { TrendingUp, AlertCircle, BarChart3, Tag } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';
import { PerformanceTrend } from '@/types/studyPlanTypes';

interface PerformanceTrendsPanelProps {
    trends: PerformanceTrend | null;
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
}

export function PerformanceTrendsPanel({
    trends,
    isExpanded,
    onToggle,
}: PerformanceTrendsPanelProps) {
    if (!trends) return null;

    const qualityScore = Math.round(trends.avg_note_quality * 10) / 10;
    const struggles = trends.identified_struggles || [];

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-emerald-500';
        if (score >= 6) return 'text-primary-strong';
        if (score >= 4) return 'text-amber-500';
        return 'text-rose-500';
    };

    const summaryContent = (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-ink">
                <BarChart3 size={14} className="text-neutral-ink/50" />
                Quality: <span className={getScoreColor(qualityScore)}>{qualityScore}/10</span>
            </div>
            {struggles.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm font-black text-rose-500">
                    <AlertCircle size={14} />
                    {struggles.length} Gaps
                </div>
            )}
        </div>
    );

    return (
        <CollapsibleCard
            id="performance-trends"
            title="Performance Insights"
            subtitle="Based on recent AI audits"
            icon={TrendingUp}
            isExpanded={isExpanded}
            onToggle={onToggle}
            summaryContent={summaryContent}
        >
            <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Note Quality Section */}
                <div className="p-5 bg-neutral-beige/20 rounded-2xl border border-neutral-gray/10">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 size={18} className="text-primary-strong" />
                        <h4 className="font-bold text-neutral-ink">Note Quality Trend</h4>
                    </div>

                    <div className="flex items-end gap-3 px-2">
                        <span className={`text-4xl font-black ${getScoreColor(qualityScore)}`}>
                            {qualityScore}
                        </span>
                        <div className="flex-1 h-3 bg-neutral-gray/10 rounded-full overflow-hidden mb-2">
                            <div
                                className={`h-full transition-all duration-1000 ${qualityScore >= 7 ? 'bg-emerald-500' :
                                        qualityScore >= 5 ? 'bg-primary-strong' : 'bg-rose-500'
                                    }`}
                                style={{ width: `${qualityScore * 10}%` }}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-neutral-ink/60 mt-3 font-medium">
                        Average score from your last study sessions as audited by Hanachan.
                    </p>
                </div>

                {/* Struggle Points Section */}
                <div className="p-5 bg-neutral-beige/20 rounded-2xl border border-neutral-gray/10">
                    <div className="flex items-center gap-2 mb-4">
                        <Tag size={18} className="text-rose-500" />
                        <h4 className="font-bold text-neutral-ink">Persistent Struggles</h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {struggles.length === 0 ? (
                            <p className="text-sm text-neutral-ink/50 italic py-2">
                                No persistent knowledge gaps identified yet. Keep it up!
                            </p>
                        ) : (
                            struggles.map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100 flex items-center gap-1.5"
                                >
                                    <AlertCircle size={12} />
                                    {tag}
                                </span>
                            ))
                        )}
                    </div>
                    <p className="text-xs text-neutral-ink/60 mt-4 font-medium">
                        Topics you've struggled with in long-term memory. Hanachan will prioritize these.
                    </p>
                </div>
            </div>
        </CollapsibleCard>
    );
}

export default PerformanceTrendsPanel;
