'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
    Loader2, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import studyPlanService from '@/services/studyPlanService';

interface PlanHealthProps {
    planId: string;
    compact?: boolean;
}

interface HealthData {
    health_status: 'ahead' | 'on_track' | 'slightly_behind' | 'significantly_behind';
    expected_progress: number;
    actual_progress: number;
    progress_gap: number;
    overdue_milestones: number;
    issues: Array<{
        type: string;
        milestone_id?: string;
        title?: string;
        days_overdue?: number;
    }>;
    recommendations: Array<{
        type: string;
        message: string;
    }>;
}

export default function PlanHealthCard({ planId, compact = false }: PlanHealthProps) {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadHealth();
    }, [planId]);

    const loadHealth = async () => {
        try {
            setLoading(true);
            const data = await studyPlanService.checkPlanHealth(planId);
            setHealth(data);
        } catch (err) {
            console.error('Failed to load health:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: HealthData['health_status']) => {
        switch (status) {
            case 'ahead':
                return {
                    icon: TrendingUp,
                    label: 'Ahead of Schedule',
                    color: 'text-brand-green',
                    bg: 'bg-brand-green/10',
                    border: 'border-brand-green/30',
                };
            case 'on_track':
                return {
                    icon: CheckCircle2,
                    label: 'On Track',
                    color: 'text-brand-sky',
                    bg: 'bg-brand-sky/10',
                    border: 'border-brand-sky/30',
                };
            case 'slightly_behind':
                return {
                    icon: AlertTriangle,
                    label: 'Slightly Behind',
                    color: 'text-yellow-600',
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                };
            case 'significantly_behind':
                return {
                    icon: TrendingDown,
                    label: 'Needs Attention',
                    color: 'text-red-500',
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                };
        }
    };

    if (loading) {
        return (
            <div className={`clay-card p-6 ${compact ? '' : 'mb-6'}`}>
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-ink" />
                </div>
            </div>
        );
    }

    if (!health) {
        return null;
    }

    const config = getStatusConfig(health.health_status);
    const StatusIcon = config.icon;

    if (compact) {
        return (
            <div className={`p-4 rounded-xl border-2 ${config.bg} ${config.border}`}>
                <div className="flex items-center gap-3">
                    <StatusIcon className={config.color} size={24} />
                    <div>
                        <div className={`font-bold ${config.color}`}>{config.label}</div>
                        <div className="text-xs text-neutral-ink">
                            {health.actual_progress.toFixed(0)}% complete
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`clay-card overflow-hidden border-2 ${config.border}`}>
            {/* Header */}
            <div className={`p-5 ${config.bg}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-white border border-gray-100`}>
                            <StatusIcon className={config.color} size={24} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-black ${config.color}`}>
                                {config.label}
                            </h3>
                            <p className="text-sm text-neutral-ink">
                                {health.actual_progress.toFixed(0)}% vs {health.expected_progress.toFixed(0)}% expected
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => loadHealth()}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className="text-neutral-ink" />
                    </button>
                </div>

                {/* Progress Comparison Bar */}
                <div className="mt-4">
                    <div className="h-4 bg-white rounded-full overflow-hidden relative">
                        {/* Expected Progress Marker */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                            style={{ left: `${health.expected_progress}%` }}
                        />
                        {/* Actual Progress */}
                        <div
                            className={`h-full rounded-full ${health.health_status === 'ahead' || health.health_status === 'on_track'
                                ? 'bg-brand-green'
                                : health.health_status === 'slightly_behind'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                            style={{ width: `${health.actual_progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-neutral-ink">
                        <span>Actual: {health.actual_progress.toFixed(0)}%</span>
                        <span>Expected: {health.expected_progress.toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="p-5 bg-white">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between text-sm font-bold text-neutral-ink hover:text-brand-dark transition-colors"
                >
                    <span>Recommendations ({health.recommendations.length})</span>
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expanded && (
                    <div className="mt-4 space-y-3">
                        {health.recommendations.map((rec, idx) => (
                            <div
                                key={idx}
                                className="p-3 bg-gray-50 rounded-xl text-sm"
                            >
                                <span className="text-neutral-ink">{rec.message}</span>
                            </div>
                        ))}

                        {health.issues.length > 0 && (
                            <div className="pt-3 border-t">
                                <div className="text-xs font-bold text-red-500 mb-2">
                                    Issues ({health.issues.length})
                                </div>
                                {health.issues.map((issue, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 bg-red-50 rounded-xl text-sm text-red-600"
                                    >
                                        {issue.title && (
                                            <span className="font-bold">{issue.title}</span>
                                        )}
                                        {issue.days_overdue && (
                                            <span className="ml-2">
                                                ({issue.days_overdue} days overdue)
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
