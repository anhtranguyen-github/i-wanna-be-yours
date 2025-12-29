'use client';

import { useState, useEffect } from 'react';
import { Target, AlertTriangle, ChevronDown, Check, Loader2, Sparkles } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';
import { studyPlanService } from '@/services/studyPlanService';

interface SmartGoal {
    _id: string;
    title: string;
    priority: number;
    status: string;
    measurable_metric: string;
    measurable_target: number;
    current_progress: number;
}

interface SmartGoalsPanelProps {
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
    onRecalibrate?: () => void;
}

const priorityConfig = {
    1: { label: 'Normal', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    2: { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    3: { label: 'High', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export function SmartGoalsPanel({ isExpanded, onToggle, onRecalibrate }: SmartGoalsPanelProps) {
    const [goals, setGoals] = useState<SmartGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            const { goals: data } = await studyPlanService.getSmartGoals();
            setGoals(data);
        } catch (error) {
            console.error('Failed to load goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePriorityChange = async (goalId: string, newPriority: number) => {
        setUpdating(goalId);
        try {
            await studyPlanService.updateGoalPriority(goalId, newPriority);
            setGoals(prev => prev.map(g =>
                g._id === goalId ? { ...g, priority: newPriority } : g
            ));
        } catch (error) {
            console.error('Failed to update priority:', error);
        } finally {
            setUpdating(null);
        }
    };

    const highPriorityCount = goals.filter(g => g.priority === 3).length;

    const summaryContent = (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-ink">
                <Target size={14} className="text-neutral-ink/50" />
                {goals.length} Goals
            </div>
            {highPriorityCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm font-black text-rose-500">
                    <AlertTriangle size={14} />
                    {highPriorityCount} High Priority
                </div>
            )}
        </div>
    );

    return (
        <CollapsibleCard
            id="smart-goals"
            title="Smart Goals"
            subtitle="AI-prioritized learning objectives"
            icon={Target}
            isExpanded={isExpanded}
            onToggle={onToggle}
            summaryContent={summaryContent}
        >
            <div className="space-y-3 mt-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-strong" />
                    </div>
                ) : goals.length === 0 ? (
                    <div className="text-center py-8 text-neutral-ink/50">
                        <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="font-medium">No smart goals yet</p>
                        <p className="text-sm">Ask Hanachan to suggest some goals!</p>
                    </div>
                ) : (
                    goals.map((goal) => {
                        const config = priorityConfig[goal.priority as keyof typeof priorityConfig] || priorityConfig[1];
                        const progress = Math.min(100, (goal.current_progress / goal.measurable_target) * 100);

                        return (
                            <div
                                key={goal._id}
                                className="p-4 bg-neutral-beige/20 rounded-xl border border-neutral-gray/10 flex flex-col gap-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-neutral-ink text-sm flex items-center gap-2">
                                            {goal.title}
                                            {goal.status === 'completed' && (
                                                <Check size={14} className="text-emerald-500" />
                                            )}
                                        </h4>
                                        <p className="text-xs text-neutral-ink/60 mt-0.5">
                                            {goal.measurable_metric}: {goal.current_progress}/{goal.measurable_target}
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={goal.priority}
                                            onChange={(e) => handlePriorityChange(goal._id, Number(e.target.value))}
                                            disabled={updating === goal._id}
                                            className={`appearance-none px-3 py-1.5 pr-7 text-xs font-bold rounded-lg border cursor-pointer ${config.color}`}
                                        >
                                            <option value={1}>Normal</option>
                                            <option value={2}>Medium</option>
                                            <option value={3}>High</option>
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        {updating === goal._id && (
                                            <Loader2 size={12} className="absolute -right-5 top-1/2 -translate-y-1/2 animate-spin" />
                                        )}
                                    </div>
                                </div>
                                <div className="h-1.5 bg-neutral-gray/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-strong transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}

                {onRecalibrate && goals.length > 0 && (
                    <button
                        onClick={onRecalibrate}
                        className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-primary to-primary-strong text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Sparkles size={16} />
                        Ask Hanachan to Recalibrate
                    </button>
                )}
            </div>
        </CollapsibleCard>
    );
}

export default SmartGoalsPanel;
