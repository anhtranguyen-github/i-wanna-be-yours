'use client';

import * as React from 'react';
import { Target, CheckCircle2, Circle, Clock, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { ProgressRing } from '@/components/ui/progress-ring';
import { TrendIndicator } from '@/components/ui/trend-indicator';
import { HELP_CONTENT } from '@/data/helpContent';
import { SMARTGoalEnhanced, SuccessCriterion } from '@/mocks/strategyMockData';

export interface SMARTGoalCardProps {
    goal: SMARTGoalEnhanced;
    onClick?: () => void;
    className?: string;
}

export function SMARTGoalCard({ goal, onClick, className }: SMARTGoalCardProps) {
    const daysRemaining = React.useMemo(() => {
        const deadline = new Date(goal.deadline);
        const today = new Date();
        return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }, [goal.deadline]);

    const statusColors = {
        active: 'bg-blue-50 text-blue-700 border-blue-200',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        overdue: 'bg-red-50 text-red-700 border-red-200',
    };

    const smartLetters = [
        { letter: 'S', label: 'Specific', content: goal.specific, color: 'bg-violet-500' },
        { letter: 'M', label: 'Measurable', content: goal.measurable, color: 'bg-blue-500' },
        { letter: 'A', label: 'Achievable', content: goal.achievable, color: 'bg-emerald-500' },
        { letter: 'R', label: 'Relevant', content: goal.relevant, color: 'bg-amber-500' },
        { letter: 'T', label: 'Time-bound', content: goal.timeBound, color: 'bg-rose-500' },
    ];

    return (
        <div
            className={cn(
                'relative rounded-2xl bg-white border border-slate-100',
                'shadow-sm hover:shadow-lg transition-all duration-300',
                'cursor-pointer group overflow-hidden',
                className
            )}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        >
            {/* Header */}
            <div className="p-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border', statusColors[goal.status])}>
                                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                {goal.linked_jlpt_level}
                            </span>
                            <InfoTooltip
                                title={HELP_CONTENT.smart_framework.title}
                                content={HELP_CONTENT.smart_framework.content}
                                iconSize={12}
                            />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 truncate group-hover:text-brand-salmon transition-colors">
                            {goal.title}
                        </h3>
                    </div>

                    <ProgressRing
                        progress={goal.progress}
                        size={60}
                        strokeWidth={6}
                        labelSize="sm"
                    />
                </div>

                {/* SMART Letters */}
                <div className="flex gap-1.5 mt-4">
                    {smartLetters.map((item) => (
                        <div
                            key={item.letter}
                            className="group/letter relative"
                        >
                            <div
                                className={cn(
                                    'w-8 h-8 rounded-lg flex items-center justify-center',
                                    'text-white font-bold text-sm',
                                    item.color
                                )}
                            >
                                {item.letter}
                            </div>
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/letter:block z-10">
                                <div className="bg-slate-900 text-white text-xs rounded-lg p-2 max-w-[200px] whitespace-normal">
                                    <p className="font-semibold mb-1">{item.label}</p>
                                    <p className="text-slate-300 text-[10px] leading-tight">{item.content}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Success Criteria Preview */}
            <div className="px-5 pb-3 border-t border-slate-50 pt-3">
                <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Success Criteria
                    </p>
                    <InfoTooltip
                        title={HELP_CONTENT.milestone_criteria.title}
                        content={HELP_CONTENT.milestone_criteria.content}
                        iconSize={10}
                    />
                </div>
                <div className="space-y-2">
                    {goal.success_criteria.slice(0, 2).map((criterion) => (
                        <CriterionRow key={criterion.id} criterion={criterion} />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock size={14} />
                        <span className="text-xs font-medium">
                            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-500" />
                        <span className="text-xs font-medium text-slate-500">
                            AI: {goal.ai_confidence_score}% confident
                        </span>
                        <InfoTooltip
                            title={HELP_CONTENT.ai_confidence.title}
                            content={HELP_CONTENT.ai_confidence.content}
                            iconSize={10}
                        />
                    </div>
                </div>
                <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-brand-salmon group-hover:translate-x-1 transition-all"
                />
            </div>
        </div>
    );
}

function CriterionRow({ criterion }: { criterion: SuccessCriterion }) {
    const progress = (criterion.current_value / criterion.target_value) * 100;
    const isComplete = progress >= 100;

    return (
        <div className="flex items-center gap-3">
            {isComplete ? (
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
            ) : (
                <Circle size={14} className="text-slate-300 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-700 truncate">
                        {criterion.label}
                    </span>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                        {criterion.current_value}/{criterion.target_value} {criterion.unit}
                    </span>
                </div>
                <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-500',
                            isComplete ? 'bg-emerald-500' : 'bg-brand-salmon'
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

export default SMARTGoalCard;
