'use client';

import * as React from 'react';
import { Target, TrendingUp, TrendingDown, Minus, ChevronRight, ChevronDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { TrendIndicator } from '@/components/ui/trend-indicator';
import { HELP_CONTENT } from '@/data/helpContent';
import { OKRGoalEnhanced, KeyResultEnhanced } from '@/mocks/strategyMockData';

export interface OKRObjectiveCardProps {
    okr: OKRGoalEnhanced;
    onClick?: () => void;
    className?: string;
}

export function OKRObjectiveCard({ okr, onClick, className }: OKRObjectiveCardProps) {
    const [expandedKR, setExpandedKR] = React.useState<string | null>(null);

    const riskColors = {
        low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    };

    const risk = riskColors[okr.risk_level];

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
            <div
                className="p-5 cursor-pointer group"
                onClick={onClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border', risk.bg, risk.text, risk.border)}>
                                {okr.risk_level.toUpperCase()} RISK
                            </span>
                            {okr.on_track ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-600">
                                    <CheckCircle2 size={12} />
                                    On Track
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs text-amber-600">
                                    <AlertTriangle size={12} />
                                    At Risk
                                </span>
                            )}
                            <InfoTooltip
                                title={HELP_CONTENT.okr_objective.title}
                                content={HELP_CONTENT.okr_objective.content}
                                iconSize={12}
                            />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-salmon transition-colors">
                            {okr.objective}
                        </h3>
                        {okr.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{okr.description}</p>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                            <p className="text-3xl font-black text-slate-900">{okr.progress}%</p>
                            <p className="text-xs text-slate-500">Complete</p>
                        </div>
                        <ChevronRight
                            size={16}
                            className="text-slate-300 group-hover:text-brand-salmon group-hover:translate-x-1 transition-all"
                        />
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-500',
                                okr.on_track ? 'bg-emerald-500' : 'bg-amber-500'
                            )}
                            style={{ width: `${okr.progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Key Results */}
            <div className="border-t border-slate-100">
                <div className="px-5 py-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Key Results
                        </p>
                        <InfoTooltip
                            title={HELP_CONTENT.okr_key_result.title}
                            content={HELP_CONTENT.okr_key_result.content}
                            iconSize={10}
                        />
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                        {okr.keyResults.filter(kr => (kr.current / kr.target) >= 1).length}/{okr.keyResults.length} complete
                    </span>
                </div>
                <div className="divide-y divide-slate-50">
                    {okr.keyResults.map((kr) => (
                        <KeyResultRow
                            key={kr.id}
                            keyResult={kr}
                            expanded={expandedKR === kr.id}
                            onToggle={() => setExpandedKR(expandedKR === kr.id ? null : kr.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Blockers */}
            {okr.blockers.length > 0 && (
                <div className="px-5 py-3 bg-red-50 border-t border-red-100">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                        Blockers
                    </p>
                    <ul className="space-y-1">
                        {okr.blockers.map((blocker, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-red-600">
                                <AlertTriangle size={12} />
                                {blocker}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

interface KeyResultRowProps {
    keyResult: KeyResultEnhanced;
    expanded: boolean;
    onToggle: () => void;
}

function KeyResultRow({ keyResult, expanded, onToggle }: KeyResultRowProps) {
    const progress = (keyResult.current / keyResult.target) * 100;
    const isComplete = progress >= 100;

    return (
        <div className="px-5 py-3">
            <button
                type="button"
                className="w-full text-left"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isComplete ? (
                            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
                        )}
                        <span className={cn(
                            'text-sm font-medium truncate',
                            isComplete ? 'text-slate-500 line-through' : 'text-slate-900'
                        )}>
                            {keyResult.title}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <TrendIndicator
                            trend={keyResult.trend === 'improving' ? 'up' : keyResult.trend === 'declining' ? 'down' : 'stable'}
                            size="sm"
                            variant="minimal"
                        />
                        <span className="text-sm font-bold text-slate-700 min-w-[80px] text-right">
                            {keyResult.current}/{keyResult.target}
                        </span>
                        <ChevronDown
                            size={14}
                            className={cn(
                                'text-slate-400 transition-transform duration-200',
                                expanded && 'rotate-180'
                            )}
                        />
                    </div>
                </div>

                {/* Mini progress bar */}
                <div className="mt-2 ml-7">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-500',
                                isComplete ? 'bg-emerald-500' : keyResult.trend === 'declining' ? 'bg-red-500' : 'bg-brand-salmon'
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>
            </button>

            {/* Expanded Details */}
            {expanded && (
                <div className="mt-3 ml-7 p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <span className="text-slate-500">Velocity</span>
                            <div className="flex items-center gap-1">
                                <InfoTooltip
                                    title={HELP_CONTENT.okr_velocity.title}
                                    content={HELP_CONTENT.okr_velocity.content}
                                    iconSize={10}
                                />
                                <span className="font-semibold text-slate-900">
                                    {keyResult.velocity} {keyResult.unit}/day
                                </span>
                            </div>
                        </div>
                        <div>
                            <span className="text-slate-500">Confidence</span>
                            <p className="font-semibold text-slate-900">{keyResult.confidence}%</p>
                        </div>
                        {keyResult.projected_completion && (
                            <div className="col-span-2">
                                <span className="text-slate-500">Projected Completion</span>
                                <div className="flex items-center gap-1">
                                    <InfoTooltip
                                        title={HELP_CONTENT.okr_projected_completion.title}
                                        content={HELP_CONTENT.okr_projected_completion.content}
                                        iconSize={10}
                                    />
                                    <span className="font-semibold text-slate-900">
                                        {new Date(keyResult.projected_completion).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <span className="text-xs text-slate-500">Contributing Activities</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {keyResult.contributing_task_types.map((type) => (
                                <span key={type} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-600">
                                    {type}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OKRObjectiveCard;
