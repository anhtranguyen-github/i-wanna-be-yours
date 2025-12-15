'use client';

import {
    Target, Calendar, Clock, CheckCircle2, Circle,
    TrendingUp, Award, BookOpen
} from 'lucide-react';

interface StudyPlanStatusArtifactProps {
    data: {
        target_level: string;
        exam_date: string;
        days_remaining: number;
        overall_progress: number;
        current_milestone: {
            number: number;
            title: string;
            progress: number;
            category: string;
        } | null;
        today_completed: number;
        today_total: number;
    };
}

interface DailyTasksArtifactProps {
    data: {
        date: string;
        tasks: Array<{
            id?: string;
            title: string;
            description?: string;
            minutes: number;
            completed: boolean;
            type: string;
        }>;
    };
}

const LEVEL_COLORS: Record<string, string> = {
    N5: '#10B981',
    N4: '#3B82F6',
    N3: '#8B5CF6',
    N2: '#F59E0B',
    N1: '#EF4444',
};

export function StudyPlanStatusArtifact({ data }: StudyPlanStatusArtifactProps) {
    const levelColor = LEVEL_COLORS[data.target_level] || '#6B7280';

    return (
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
            {/* Header */}
            <div
                className="p-4 text-white"
                style={{ backgroundColor: levelColor }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Target size={24} />
                        <div>
                            <div className="text-sm opacity-80">Target</div>
                            <div className="text-xl font-black">JLPT {data.target_level}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black">{data.days_remaining}</div>
                        <div className="text-xs opacity-80">days left</div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="px-4 py-3 bg-gray-50">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-bold text-gray-800">{data.overall_progress.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${data.overall_progress}%`,
                            backgroundColor: levelColor,
                        }}
                    />
                </div>
            </div>

            {/* Current Milestone */}
            {data.current_milestone && (
                <div className="p-4 border-t border-gray-100">
                    <div className="text-xs font-bold text-gray-500 mb-2">CURRENT MILESTONE</div>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: levelColor }}
                        >
                            {data.current_milestone.number}
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-gray-800">{data.current_milestone.title}</div>
                            <div className="text-sm text-gray-500 capitalize">
                                {data.current_milestone.category} • {data.current_milestone.progress.toFixed(0)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Today's Stats */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                        <BookOpen size={18} />
                        <span className="text-sm">Today's Tasks</span>
                    </div>
                    <div className="text-sm font-bold">
                        <span className="text-brand-green">{data.today_completed}</span>
                        <span className="text-gray-400">/{data.today_total}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function DailyTasksArtifact({ data }: DailyTasksArtifactProps) {
    return (
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-brand-salmon to-brand-sky text-white">
                <div className="flex items-center gap-2">
                    <Calendar size={20} />
                    <span className="font-bold">Today's Study Tasks</span>
                </div>
                <div className="text-sm opacity-80 mt-1">
                    {new Date(data.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    })}
                </div>
            </div>

            {/* Tasks List */}
            <div className="p-4 space-y-3">
                {data.tasks.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                        No tasks for today
                    </div>
                ) : (
                    data.tasks.map((task, idx) => (
                        <div
                            key={task.id || idx}
                            className={`
                                flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                                ${task.completed
                                    ? 'border-brand-green/30 bg-brand-green/5'
                                    : 'border-gray-100'
                                }
                            `}
                        >
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                ${task.completed
                                    ? 'bg-brand-green text-white'
                                    : 'border-2 border-gray-300'
                                }
                            `}>
                                {task.completed ? (
                                    <CheckCircle2 size={18} />
                                ) : (
                                    <Circle size={18} className="text-gray-300" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className={`font-bold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                    {task.title}
                                </div>
                                {task.description && (
                                    <div className="text-sm text-gray-500 truncate">
                                        {task.description}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1 text-gray-400 text-sm shrink-0">
                                <Clock size={14} />
                                {task.minutes}m
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Summary */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-600">
                        {data.tasks.filter(t => t.completed).length} of {data.tasks.length} completed
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />
                        ~{data.tasks.reduce((sum, t) => sum + t.minutes, 0)} min total
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export artifact types for registration
export const STUDY_PLAN_ARTIFACT_TYPES = {
    study_plan_status: StudyPlanStatusArtifact,
    daily_tasks: DailyTasksArtifact,
};
