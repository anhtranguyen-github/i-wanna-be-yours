'use client';

import * as React from 'react';
import { Flame, CheckCircle2, Circle, Clock, Zap, Target, Activity, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { ProgressRing } from '@/components/ui/progress-ring';
import { HELP_CONTENT } from '@/data/helpContent';
import { PACTStatEnhanced, PACTAction } from '@/mocks/strategyMockData';

export interface PACTDailyCardProps {
    pact: PACTStatEnhanced;
    onActionToggle?: (actionId: string) => void;
    onContextCheckIn?: () => void;
    onClick?: () => void;
    className?: string;
}

export function PACTDailyCard({
    pact,
    onActionToggle,
    onContextCheckIn,
    onClick,
    className,
}: PACTDailyCardProps) {
    const completedToday = pact.actions.filter(a => a.completed_today).length;
    const totalActions = pact.actions.length;
    const todayProgress = (completedToday / totalActions) * 100;

    const moodEmojis = {
        unmotivated: '😔',
        neutral: '😐',
        focused: '🎯',
        energized: '⚡',
    };

    const energyColors = [
        'bg-red-500',
        'bg-red-400',
        'bg-orange-400',
        'bg-amber-400',
        'bg-yellow-400',
        'bg-lime-400',
        'bg-green-400',
        'bg-emerald-400',
        'bg-teal-400',
        'bg-cyan-400',
    ];

    return (
        <div
            className={cn(
                'rounded-2xl bg-white border border-slate-100',
                'shadow-sm hover:shadow-lg transition-all duration-300',
                'overflow-hidden',
                className
            )}
        >
            {/* Header with Purpose */}
            <div className="p-5 bg-gradient-to-br from-brand-salmon/10 to-brand-peach/10">
                <div className="flex items-center gap-2 mb-2">
                    <Target size={18} className="text-brand-salmon" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Daily Purpose
                    </span>
                    <InfoTooltip
                        title={HELP_CONTENT.pact_purpose.title}
                        content={HELP_CONTENT.pact_purpose.content}
                        iconSize={12}
                    />
                </div>
                <p className="text-lg font-bold text-slate-900 italic">
                    &quot;{pact.purpose}&quot;
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-brand-salmon rounded-full transition-all duration-500"
                            style={{ width: `${pact.purpose_alignment_score}%` }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                        {pact.purpose_alignment_score}% aligned
                    </span>
                </div>
            </div>

            {/* Streak & Stats */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Streak */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Flame
                                size={32}
                                className={cn(
                                    'transition-all duration-300',
                                    pact.streak_current > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-300'
                                )}
                            />
                            {pact.streak_current >= 7 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                    🔥
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{pact.streak_current}</p>
                            <p className="text-xs text-slate-500">Day Streak</p>
                        </div>
                    </div>

                    {/* Streak Progress */}
                    <div className="pl-4 border-l border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">
                            Goal: {pact.streak_target} days
                        </p>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${Math.min((pact.streak_current / pact.streak_target) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Today Progress Ring */}
                <ProgressRing
                    progress={todayProgress}
                    size={56}
                    strokeWidth={5}
                    labelSize="sm"
                    color={todayProgress === 100 ? '#10b981' : '#f4a89a'}
                >
                    <span className="text-xs font-bold text-slate-900">
                        {completedToday}/{totalActions}
                    </span>
                </ProgressRing>
            </div>

            {/* Context Check-in */}
            {pact.last_context && (
                <button
                    type="button"
                    onClick={onContextCheckIn}
                    className="w-full px-5 py-3 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Brain size={18} className="text-blue-500" />
                        <span className="text-sm font-medium text-slate-700">Today&apos;s Check-in</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-lg">{moodEmojis[pact.last_context.mood]}</span>
                        <div className="flex gap-0.5">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'w-1.5 h-3 rounded-sm',
                                        i < pact.last_context.energy_level ? energyColors[i] : 'bg-slate-200'
                                    )}
                                />
                            ))}
                        </div>
                        <InfoTooltip
                            title={HELP_CONTENT.context_energy.title}
                            content={HELP_CONTENT.context_energy.content}
                            iconSize={12}
                        />
                    </div>
                </button>
            )}

            {/* Today's Actions */}
            <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Zap size={16} className="text-amber-500" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Today&apos;s Actions
                    </p>
                    <InfoTooltip
                        title={HELP_CONTENT.pact_actions.title}
                        content={HELP_CONTENT.pact_actions.content}
                        iconSize={10}
                    />
                </div>

                <div className="space-y-3">
                    {pact.actions.map((action) => (
                        <ActionItem
                            key={action.id}
                            action={action}
                            onToggle={() => onActionToggle?.(action.id)}
                        />
                    ))}
                </div>
            </div>

            {/* View Details Link */}
            {onClick && (
                <button
                    type="button"
                    onClick={onClick}
                    className="w-full px-5 py-3 bg-slate-50 text-sm font-semibold text-brand-salmon hover:bg-slate-100 transition-colors"
                >
                    View Full PACT Details →
                </button>
            )}
        </div>
    );
}

interface ActionItemProps {
    action: PACTAction;
    onToggle?: () => void;
}

function ActionItem({ action, onToggle }: ActionItemProps) {
    const actionTypeColors = {
        study: 'bg-blue-100 text-blue-700',
        review: 'bg-emerald-100 text-emerald-700',
        practice: 'bg-amber-100 text-amber-700',
        test: 'bg-violet-100 text-violet-700',
    };

    const timeColors = {
        morning: '🌅',
        afternoon: '☀️',
        evening: '🌆',
        night: '🌙',
    };

    return (
        <div
            className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
                action.completed_today
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-slate-100 hover:border-brand-salmon/30'
            )}
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex-shrink-0"
            >
                {action.completed_today ? (
                    <CheckCircle2 size={22} className="text-emerald-500" />
                ) : (
                    <Circle size={22} className="text-slate-300 hover:text-brand-salmon transition-colors" />
                )}
            </button>

            <div className="flex-1 min-w-0">
                <p className={cn(
                    'text-sm font-medium',
                    action.completed_today ? 'text-slate-500 line-through' : 'text-slate-900'
                )}>
                    {action.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', actionTypeColors[action.action_type])}>
                        {action.action_type.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {action.target_minutes}m
                    </span>
                    <span className="text-[10px]">{timeColors[action.best_time_of_day]}</span>
                </div>
            </div>

            <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-slate-700">{action.completion_rate}%</p>
                <p className="text-[10px] text-slate-400">rate</p>
            </div>
        </div>
    );
}

export default PACTDailyCard;
