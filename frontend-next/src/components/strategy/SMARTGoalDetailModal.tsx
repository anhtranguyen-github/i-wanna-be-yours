'use client';

import * as React from 'react';
import { X, Target, CheckCircle2, Circle, Clock, Sparkles, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DetailModal } from '@/components/ui/detail-modal';
import { ProgressRing } from '@/components/ui/progress-ring';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { TrendIndicator } from '@/components/ui/trend-indicator';
import { ExpandableSection } from '@/components/ui/expandable-section';
import { HELP_CONTENT } from '@/data/helpContent';
import { SMARTGoalEnhanced, OKRGoalEnhanced, getOKRsForSMARTGoal } from '@/mocks/strategyMockData';

export interface SMARTGoalDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: SMARTGoalEnhanced | null;
}

export function SMARTGoalDetailModal({ isOpen, onClose, goal }: SMARTGoalDetailModalProps) {
    const linkedOKRs = React.useMemo(() => {
        return goal ? getOKRsForSMARTGoal(goal.id) : [];
    }, [goal]);

    if (!goal) return null;

    const daysRemaining = Math.ceil(
        (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const smartDimensions = [
        { key: 'specific', label: 'Specific', value: goal.specific, helpKey: 'smart_specific', color: 'border-l-violet-500' },
        { key: 'measurable', label: 'Measurable', value: goal.measurable, helpKey: 'smart_measurable', color: 'border-l-blue-500' },
        { key: 'achievable', label: 'Achievable', value: goal.achievable, helpKey: 'smart_achievable', color: 'border-l-emerald-500' },
        { key: 'relevant', label: 'Relevant', value: goal.relevant, helpKey: 'smart_relevant', color: 'border-l-amber-500' },
        { key: 'timeBound', label: 'Time-bound', value: goal.timeBound, helpKey: 'smart_timebound', color: 'border-l-rose-500' },
    ];

    return (
        <DetailModal
            isOpen={isOpen}
            onClose={onClose}
            title={goal.title}
            subtitle={`JLPT ${goal.linked_jlpt_level} • ${goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}`}
            size="lg"
        >
            <div className="space-y-6">
                {/* Progress Overview */}
                <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl">
                    <ProgressRing
                        progress={goal.progress}
                        size={100}
                        strokeWidth={8}
                        labelSize="lg"
                    />
                    <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Days Remaining</p>
                                <p className={cn(
                                    'text-2xl font-bold',
                                    daysRemaining <= 7 ? 'text-red-600' : daysRemaining <= 30 ? 'text-amber-600' : 'text-slate-900'
                                )}>
                                    {daysRemaining > 0 ? daysRemaining : 'Overdue'}
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">AI Confidence</p>
                                    <InfoTooltip
                                        title={HELP_CONTENT.ai_confidence.title}
                                        content={HELP_CONTENT.ai_confidence.content}
                                        iconSize={10}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="text-amber-500" />
                                    <p className="text-2xl font-bold text-slate-900">{goal.ai_confidence_score}%</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Baseline</p>
                                <p className="text-lg font-semibold text-slate-600">{(goal.baseline_score ?? 0)}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Target</p>
                                <p className="text-lg font-semibold text-emerald-600">{(goal.target_score ?? 100)}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SMART Breakdown */}
                <ExpandableSection
                    title="SMART Breakdown"
                    subtitle="Each dimension of your goal"
                    icon={Target}
                    defaultOpen
                    helpTitle={HELP_CONTENT.smart_framework.title}
                    helpContent={HELP_CONTENT.smart_framework.content}
                >
                    <div className="space-y-3 mt-4">
                        {smartDimensions.map((dim) => (
                            <div
                                key={dim.key}
                                className={cn(
                                    'p-4 bg-white border border-slate-100 rounded-xl',
                                    'border-l-4',
                                    dim.color
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-slate-900">{dim.label}</p>
                                    <InfoTooltip
                                        title={HELP_CONTENT[dim.helpKey]?.title || dim.label}
                                        content={HELP_CONTENT[dim.helpKey]?.content || ''}
                                        iconSize={12}
                                    />
                                </div>
                                <p className="text-sm text-slate-600">{dim.value}</p>
                            </div>
                        ))}
                    </div>
                </ExpandableSection>

                {/* Success Criteria */}
                <ExpandableSection
                    title="Success Criteria"
                    subtitle="Measurable outcomes for completion"
                    icon={CheckCircle2}
                    defaultOpen
                    badge={`${(goal.success_criteria || []).filter(c => (c.current_value / c.target_value) >= 1).length}/${(goal.success_criteria || []).length}`}
                    badgeColor="success"
                    helpTitle={HELP_CONTENT.milestone_criteria.title}
                    helpContent={HELP_CONTENT.milestone_criteria.content}
                >
                    <div className="space-y-4 mt-4">
                        {(goal.success_criteria || []).map((criterion) => {
                            const progress = (criterion.current_value / criterion.target_value) * 100;
                            return (
                                <div key={criterion.id} className="p-4 bg-white border border-slate-100 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {progress >= 100 ? (
                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                            ) : (
                                                <Circle size={18} className="text-slate-300" />
                                            )}
                                            <p className="font-semibold text-slate-900">{criterion.label}</p>
                                        </div>
                                        <span className="text-sm font-medium text-slate-500">
                                            Weight: {Math.round(criterion.weight * 100)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        'h-full rounded-full transition-all duration-500',
                                                        progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-brand-salmon' : 'bg-amber-500'
                                                    )}
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 min-w-[100px] text-right">
                                            {criterion.current_value} / {criterion.target_value} {criterion.unit}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ExpandableSection>

                {/* Linked OKRs */}
                {linkedOKRs.length > 0 && (
                    <ExpandableSection
                        title="Linked OKRs"
                        subtitle="Key results driving this goal"
                        icon={TrendingUp}
                        badge={linkedOKRs.length}
                        helpTitle={HELP_CONTENT.okr_framework.title}
                        helpContent={HELP_CONTENT.okr_framework.content}
                    >
                        <div className="space-y-3 mt-4">
                            {linkedOKRs.map((okr) => (
                                <div key={okr.id} className="p-4 bg-white border border-slate-100 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-semibold text-slate-900">{okr.objective}</p>
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-full text-xs font-semibold',
                                            okr.risk_level === 'low' ? 'bg-emerald-50 text-emerald-700' :
                                                okr.risk_level === 'medium' ? 'bg-amber-50 text-amber-700' :
                                                    'bg-red-50 text-red-700'
                                        )}>
                                            {okr.risk_level.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-brand-salmon rounded-full"
                                                style={{ width: `${okr.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{okr.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ExpandableSection>
                )}

                {/* AI Recommendations */}
                {goal.ai_recommended_adjustments && goal.ai_recommended_adjustments.length > 0 && (
                    <ExpandableSection
                        title="AI Recommendations"
                        subtitle="Suggestions from Hanachan"
                        icon={Sparkles}
                        badge={goal.ai_recommended_adjustments.length}
                        badgeColor="warning"
                        helpTitle={HELP_CONTENT.ai_recommendation.title}
                        helpContent={HELP_CONTENT.ai_recommendation.content}
                    >
                        <ul className="space-y-2 mt-4">
                            {goal.ai_recommended_adjustments.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                    <Sparkles size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-800">{rec}</p>
                                </li>
                            ))}
                        </ul>
                    </ExpandableSection>
                )}
            </div>
        </DetailModal>
    );
}

export default SMARTGoalDetailModal;
