'use client';

import { BookOpen, Play, CheckCircle2, Clock } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';
import { DailyTask } from '@/types/studyPlanTypes';

interface TodaysTasksProps {
    tasks: DailyTask[];
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
    onTaskStart?: (task: DailyTask) => void;
    onTaskComplete?: (taskId: string) => void;
}

export function TodaysTasks({
    tasks,
    isExpanded,
    onToggle,
    onTaskStart,
    onTaskComplete,
}: TodaysTasksProps) {
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const totalMinutes = tasks.reduce((acc, t) => acc + t.estimated_minutes, 0);
    const completedMinutes = tasks
        .filter(t => t.status === 'completed')
        .reduce((acc, t) => acc + t.estimated_minutes, 0);

    const summaryContent = (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-ink">
                <Clock size={14} className="text-neutral-ink/50" />
                {completedMinutes}/{totalMinutes} min
            </div>
            <span className="text-sm font-black text-primary-strong">
                {completedCount}/{tasks.length}
            </span>
        </div>
    );

    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'flashcard': return '📚';
            case 'quiz': return '📝';
            case 'grammar_lesson': return '✏️';
            case 'reading': return '📖';
            default: return '📌';
        }
    };

    return (
        <CollapsibleCard
            id="todays-tasks"
            title="Today's Tasks"
            subtitle={`${totalMinutes} minutes planned`}
            icon={BookOpen}
            isExpanded={isExpanded}
            onToggle={onToggle}
            summaryContent={summaryContent}
            badge={completedCount === tasks.length ? '✓' : `${tasks.length - completedCount}`}
            badgeVariant={completedCount === tasks.length ? 'success' : 'default'}
        >
            <div className="space-y-3 mt-4">
                {tasks.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-neutral-ink/60 font-medium">No tasks scheduled for today</p>
                    </div>
                ) : (
                    tasks.map((task, idx) => {
                        const isCompleted = task.status === 'completed';

                        return (
                            <div
                                key={task.id || idx}
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${isCompleted
                                        ? 'bg-neutral-beige/30 border-transparent opacity-70'
                                        : 'bg-neutral-white border-neutral-gray/10 hover:border-primary-strong/20'
                                    }`}
                            >
                                {/* Action Button */}
                                <button
                                    onClick={() => {
                                        if (isCompleted) return;
                                        if (task.id) onTaskComplete?.(task.id);
                                    }}
                                    disabled={isCompleted}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${isCompleted
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-neutral-beige text-neutral-gray hover:bg-primary-strong/10 hover:text-primary-strong'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 size={24} />
                                    ) : (
                                        <Play size={20} className="translate-x-0.5" />
                                    )}
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getTaskIcon(task.task_type)}</span>
                                        <h4 className={`font-bold ${isCompleted ? 'text-neutral-ink/50 line-through' : 'text-neutral-ink'
                                            }`}>
                                            {task.title}
                                        </h4>
                                    </div>
                                    <p className="text-sm text-neutral-ink/60 mt-0.5">{task.description}</p>
                                </div>

                                {/* Time */}
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-neutral-ink/70">
                                        {task.estimated_minutes} min
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </CollapsibleCard>
    );
}

export default TodaysTasks;
