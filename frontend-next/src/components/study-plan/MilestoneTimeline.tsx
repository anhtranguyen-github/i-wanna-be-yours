'use client';

import { Calendar, Check, Lock, AlertTriangle } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';
import { Milestone, MilestoneStatus } from '@/types/studyPlanTypes';

interface MilestoneTimelineProps {
    milestones: Milestone[];
    currentMilestoneId: string | null;
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
    onMilestoneClick?: (milestone: Milestone) => void;
}

const STATUS_CONFIG: Record<MilestoneStatus, { icon: typeof Check; color: string; bgColor: string }> = {
    completed: { icon: Check, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    in_progress: { icon: Calendar, color: 'text-primary-strong', bgColor: 'bg-primary-strong/10' },
    pending: { icon: Lock, color: 'text-neutral-gray', bgColor: 'bg-neutral-beige' },
    overdue: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-100' },
};

export function MilestoneTimeline({
    milestones,
    currentMilestoneId,
    isExpanded,
    onToggle,
    onMilestoneClick,
}: MilestoneTimelineProps) {
    const completed = milestones.filter(m => m.status === 'completed').length;
    const total = milestones.length;

    const summaryContent = (
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-ink">
                {completed}/{total} Complete
            </span>
            <div className="flex gap-1">
                {milestones.slice(0, 5).map((m, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${m.status === 'completed' ? 'bg-emerald-500' :
                                m.status === 'in_progress' ? 'bg-primary-strong' :
                                    m.status === 'overdue' ? 'bg-red-500' : 'bg-neutral-gray/30'
                            }`}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <CollapsibleCard
            id="milestone-timeline"
            title="Milestones"
            subtitle={`${total - completed} remaining`}
            icon={Calendar}
            isExpanded={isExpanded}
            onToggle={onToggle}
            summaryContent={summaryContent}
            badge={`${completed}/${total}`}
            badgeVariant={completed === total ? 'success' : 'default'}
        >
            <div className="relative mt-4">
                {/* Timeline Line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-neutral-gray/20" />

                {/* Milestones */}
                <div className="space-y-4">
                    {milestones.map((milestone, index) => {
                        const config = STATUS_CONFIG[milestone.status];
                        const Icon = config.icon;
                        const isCurrent = milestone.id === currentMilestoneId;

                        return (
                            <button
                                key={milestone.id}
                                onClick={() => onMilestoneClick?.(milestone)}
                                className={`relative w-full flex items-start gap-4 p-3 rounded-xl transition-all text-left ${isCurrent ? 'bg-primary-strong/5 ring-2 ring-primary-strong/20' :
                                        'hover:bg-neutral-beige/50'
                                    }`}
                            >
                                {/* Icon */}
                                <div className={`relative z-10 p-2 rounded-full ${config.bgColor}`}>
                                    <Icon size={16} className={config.color} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`font-bold truncate ${milestone.status === 'completed' ? 'text-neutral-ink/60 line-through' : 'text-neutral-ink'
                                            }`}>
                                            {milestone.title}
                                        </h4>
                                        {isCurrent && (
                                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary-strong text-white rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-ink/60 mt-0.5">
                                        {new Date(milestone.target_end_date).toLocaleDateString()}
                                    </p>

                                    {/* Progress Bar */}
                                    {milestone.status === 'in_progress' && (
                                        <div className="mt-2 h-1.5 bg-neutral-gray/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-strong rounded-full"
                                                style={{ width: `${milestone.progress_percent}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Progress % */}
                                {milestone.status !== 'pending' && (
                                    <span className={`text-sm font-black ${config.color}`}>
                                        {Math.round(milestone.progress_percent)}%
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </CollapsibleCard>
    );
}

export default MilestoneTimeline;
