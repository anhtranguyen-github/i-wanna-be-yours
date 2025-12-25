'use client';

import * as React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronRight, Zap, BookOpen, Volume2, Eye, Pencil, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { HELP_CONTENT } from '@/data/helpContent';
import { PriorityMatrix, SkillPriority, ContentPriority } from '@/mocks/strategyMockData';

export interface PriorityMatrixCardProps {
    matrix: PriorityMatrix;
    onItemClick?: (item: ContentPriority) => void;
    onViewAll?: (priority: 'red' | 'yellow' | 'green') => void;
    className?: string;
    coachExplainer?: string;
}

const skillIcons: Record<string, React.ElementType> = {
    vocabulary: BookOpen,
    grammar: Pencil,
    kanji: Pencil,
    reading: Eye,
    listening: Volume2,
};

export function PriorityMatrixCard({
    matrix,
    onItemClick,
    onViewAll,
    className,
    coachExplainer,
}: PriorityMatrixCardProps) {
    const priorityConfig = {
        red: {
            label: 'Deep Teaching',
            color: 'bg-red-500',
            lightBg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-700',
            description: 'Critical gaps requiring focused study',
            helpKey: 'priority_red',
        },
        yellow: {
            label: 'Drill Practice',
            color: 'bg-amber-500',
            lightBg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-700',
            description: 'Needs more practice to solidify',
            helpKey: 'priority_yellow',
        },
        green: {
            label: 'Maintain',
            color: 'bg-emerald-500',
            lightBg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-700',
            description: 'Well-learned, periodic review',
            helpKey: 'priority_green',
        },
    };

    const groupedItems = React.useMemo(() => {
        const items = matrix.content_items || [];
        return {
            red: items.filter(i => i.priority === 'red'),
            yellow: items.filter(i => i.priority === 'yellow'),
            green: items.filter(i => i.priority === 'green'),
        };
    }, [matrix.content_items]);

    return (
        <div
            className={cn(
                'rounded-2xl bg-white border border-slate-100',
                'shadow-sm overflow-hidden',
                className
            )}
        >
            {/* Header */}
            <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-slate-700" />
                        <h3 className="font-bold text-lg text-neutral-ink">Priority Matrix</h3>
                        <InfoTooltip
                            title={HELP_CONTENT.priority_matrix.title}
                            content={HELP_CONTENT.priority_matrix.content}
                            iconSize={14}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-ink">
                        <span>Today&apos;s Focus:</span>
                        <span className={cn(
                            'px-2 py-0.5 rounded-full font-semibold',
                            matrix.today_focus === 'deep_teaching' ? 'bg-red-100 text-red-700' :
                                matrix.today_focus === 'drill_practice' ? 'bg-amber-100 text-amber-700' :
                                    'bg-emerald-100 text-emerald-700'
                        )}>
                            {(matrix.today_focus || 'drill_practice').replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Time Allocation Bar */}
                <div className="mt-4">
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-neutral-ink">Recommended Time Allocation</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden flex">
                        <div
                            className="bg-red-500 flex items-center justify-center"
                            style={{ width: `${((matrix.today_time_allocation?.red_minutes || 0) / ((matrix.today_time_allocation?.red_minutes || 0) + (matrix.today_time_allocation?.yellow_minutes || 0) + (matrix.today_time_allocation?.green_minutes || 0) || 1)) * 100}%` }}
                        >
                            <span className="text-[9px] text-white font-bold">{matrix.today_time_allocation?.red_minutes || 0}m</span>
                        </div>
                        <div
                            className="bg-amber-500 flex items-center justify-center"
                            style={{ width: `${((matrix.today_time_allocation?.yellow_minutes || 0) / ((matrix.today_time_allocation?.red_minutes || 0) + (matrix.today_time_allocation?.yellow_minutes || 0) + (matrix.today_time_allocation?.green_minutes || 0) || 1)) * 100}%` }}
                        >
                            <span className="text-[9px] text-white font-bold">{matrix.today_time_allocation?.yellow_minutes || 0}m</span>
                        </div>
                        <div
                            className="bg-emerald-500 flex items-center justify-center"
                            style={{ width: `${((matrix.today_time_allocation?.green_minutes || 0) / ((matrix.today_time_allocation?.red_minutes || 0) + (matrix.today_time_allocation?.yellow_minutes || 0) + (matrix.today_time_allocation?.green_minutes || 0) || 1)) * 100}%` }}
                        >
                            <span className="text-[9px] text-white font-bold">{matrix.today_time_allocation?.green_minutes || 0}m</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Skills Overview */}
            <div className="p-5 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-neutral-ink uppercase tracking-wide mb-3">
                    Skill Priorities
                </p>
                <div className="flex flex-wrap gap-2">
                    {(matrix.skills || []).map((skill) => {
                        const Icon = skillIcons[skill.skill] || BookOpen;
                        const config = priorityConfig[skill.priority] || priorityConfig.yellow;
                        return (
                            <div
                                key={skill.skill}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-lg border',
                                    config.lightBg,
                                    config.border
                                )}
                            >
                                <Icon size={14} className={config.text} />
                                <span className={cn('text-xs font-semibold capitalize', config.text)}>
                                    {skill.skill}
                                </span>
                                {skill.accuracy_trend !== 0 && (
                                    <span className={cn(
                                        'text-[10px] font-bold',
                                        skill.accuracy_trend > 0 ? 'text-emerald-600' : 'text-red-600'
                                    )}>
                                        {skill.accuracy_trend > 0 ? '+' : ''}{skill.accuracy_trend}%
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Priority Columns */}
            <div className="grid grid-cols-3 divide-x divide-slate-100">
                {(['red', 'yellow', 'green'] as const).map((priority) => {
                    const config = priorityConfig[priority];
                    const items = groupedItems[priority];
                    return (
                        <div key={priority} className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={cn('w-3 h-3 rounded-full', config.color)} />
                                <span className="text-xs font-semibold text-slate-700">{config.label}</span>
                                <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', config.lightBg, config.text)}>
                                    {items.length}
                                </span>
                                <InfoTooltip
                                    title={HELP_CONTENT[config.helpKey].title}
                                    content={HELP_CONTENT[config.helpKey].content}
                                    iconSize={10}
                                />
                            </div>

                            <div className="space-y-2">
                                {items.slice(0, 3).map((item) => (
                                    <button
                                        key={item.content_id}
                                        type="button"
                                        onClick={() => onItemClick?.(item)}
                                        className={cn(
                                            'w-full text-left p-2 rounded-lg border transition-all duration-200',
                                            'hover:shadow-sm',
                                            config.lightBg,
                                            config.border
                                        )}
                                    >
                                        <p className="text-xs font-medium text-neutral-ink truncate">
                                            {item.title}
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-neutral-ink capitalize">
                                                {item.content_type}
                                            </span>
                                            {item.error_count_last_7_days > 0 && (
                                                <span className="text-[10px] font-semibold text-red-600">
                                                    {item.error_count_last_7_days} errors
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {items.length > 3 && (
                                <button
                                    type="button"
                                    onClick={() => onViewAll?.(priority)}
                                    className={cn(
                                        'w-full mt-2 py-1.5 text-[10px] font-semibold rounded',
                                        config.text,
                                        'hover:underline'
                                    )}
                                >
                                    View all {items.length} items →
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {coachExplainer && (
                <div className="p-5 bg-primary/5 border-t border-slate-50 flex gap-3 items-start group hover:bg-primary/10 transition-colors">
                    <div className="bg-white p-1.5 rounded-lg shadow-sm">
                        <Brain size={16} className="text-primary" />
                    </div>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                        <span className="text-primary mr-1 not-italic tracking-wider uppercase font-black">Sensei Tip:</span>
                        {coachExplainer}
                    </p>
                </div>
            )}
        </div>
    );
}

export default PriorityMatrixCard;
