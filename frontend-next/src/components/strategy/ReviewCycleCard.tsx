'use client';

import * as React from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, Target, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { HELP_CONTENT } from '@/data/helpContent';
import { ReviewCycle, ReviewMetrics } from '@/mocks/strategyMockData';

export interface ReviewCycleCardProps {
    review: ReviewCycle;
    onViewDetails?: () => void;
    className?: string;
}

export function ReviewCycleCard({ review, onViewDetails, className }: ReviewCycleCardProps) {
    const cycleTypeColors = {
        daily: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '📊' },
        weekly: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: '📅' },
        phase: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: '🏆' },
    };

    const config = cycleTypeColors[review.cycle_type];
    const metrics = review.metrics;

    const accuracyTrend = metrics.accuracy_trend === 'improving' ? 'up' :
        metrics.accuracy_trend === 'declining' ? 'down' : 'stable';

    return (
        <div
            className={cn(
                'rounded-2xl bg-white border border-slate-100',
                'shadow-sm hover:shadow-lg transition-all duration-300',
                'overflow-hidden',
                className
            )}
        >
            {/* Header */}
            <div className={cn('px-5 py-4 flex items-center justify-between', config.bg, 'border-b', config.border)}>
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                        <h3 className={cn('font-bold capitalize', config.text)}>
                            {review.cycle_type} Review
                        </h3>
                        <p className="text-xs text-slate-500">
                            {new Date(review.period_start).toLocaleDateString()} - {new Date(review.period_end).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <InfoTooltip
                    title={HELP_CONTENT[`${review.cycle_type}_review`]?.title || `${review.cycle_type} Review`}
                    content={HELP_CONTENT[`${review.cycle_type}_review`]?.content || 'Periodic review of your progress.'}
                    iconSize={14}
                />
            </div>

            {/* Key Metrics Grid */}
            <div className="p-5 grid grid-cols-4 gap-4">
                <MetricBox
                    label="Study Time"
                    value={`${metrics.total_study_minutes}m`}
                    subtext={`${metrics.avg_daily_minutes}m/day avg`}
                />
                <MetricBox
                    label="Completion"
                    value={`${metrics.completion_rate}%`}
                    subtext={`${metrics.tasks_completed}/${metrics.tasks_total} tasks`}
                    highlight={metrics.completion_rate >= 80}
                />
                <MetricBox
                    label="Accuracy"
                    value={`${metrics.avg_accuracy}%`}
                    trend={accuracyTrend}
                />
                <MetricBox
                    label="Days Studied"
                    value={`${metrics.days_studied}/${metrics.days_in_period}`}
                    highlight={metrics.streak_maintained}
                    icon={metrics.streak_maintained ? <CheckCircle2 size={12} className="text-emerald-500" /> : null}
                />
            </div>

            {/* Priority Distribution */}
            <div className="px-5 pb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Priority Queue</p>
                <div className="flex h-3 rounded-full overflow-hidden">
                    <div
                        className="bg-red-500"
                        style={{ width: `${(metrics.red_items_count / (metrics.red_items_count + metrics.yellow_items_count + metrics.green_items_count)) * 100}%` }}
                    />
                    <div
                        className="bg-amber-500"
                        style={{ width: `${(metrics.yellow_items_count / (metrics.red_items_count + metrics.yellow_items_count + metrics.green_items_count)) * 100}%` }}
                    />
                    <div
                        className="bg-emerald-500"
                        style={{ width: `${(metrics.green_items_count / (metrics.red_items_count + metrics.yellow_items_count + metrics.green_items_count)) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                    <span>{metrics.red_items_count} RED</span>
                    <span>{metrics.yellow_items_count} YELLOW</span>
                    <span>{metrics.green_items_count} GREEN</span>
                </div>
            </div>

            {/* Wins & Challenges */}
            <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
                <div className="p-4">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Wins
                    </p>
                    <ul className="space-y-1">
                        {review.wins.slice(0, 3).map((win, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                <span className="text-emerald-500">•</span>
                                {win}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Challenges
                    </p>
                    <ul className="space-y-1">
                        {review.challenges.slice(0, 3).map((challenge, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                <span className="text-amber-500">•</span>
                                {challenge}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Next Cycle Goals */}
            {review.next_cycle_goals.length > 0 && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Target size={12} />
                        Next Cycle Goals
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {review.next_cycle_goals.map((goal, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-700">
                                {goal}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* View Details */}
            {onViewDetails && (
                <button
                    type="button"
                    onClick={onViewDetails}
                    className="w-full px-5 py-3 bg-white border-t border-slate-100 text-sm font-semibold text-brand-salmon hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                >
                    View Full Review
                    <ChevronRight size={16} />
                </button>
            )}
        </div>
    );
}

interface MetricBoxProps {
    label: string;
    value: string;
    subtext?: string;
    trend?: 'up' | 'down' | 'stable';
    highlight?: boolean;
    icon?: React.ReactNode;
}

function MetricBox({ label, value, subtext, trend, highlight, icon }: MetricBoxProps) {
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400';

    return (
        <div className="text-center">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
            <div className="flex items-center justify-center gap-1">
                <p className={cn('text-lg font-black', highlight ? 'text-emerald-600' : 'text-slate-900')}>
                    {value}
                </p>
                {icon}
                {trend && <TrendIcon size={14} className={trendColor} />}
            </div>
            {subtext && (
                <p className="text-[10px] text-slate-400 mt-0.5">{subtext}</p>
            )}
        </div>
    );
}

export default ReviewCycleCard;
