'use client';

import { Target, TrendingUp, AlertCircle } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';

interface KeyResult {
    id: string;
    label: string;
    currentValue: number;
    targetValue: number;
    metricType: 'percentage' | 'count' | 'streak';
    trend?: 'up' | 'down' | 'stable';
}

interface ObjectiveOKRPanelProps {
    objective: {
        id: string;
        title: string;
        targetExam: string;
        targetDate: string;
        progress: number;
    } | null;
    keyResults: KeyResult[];
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
    onKeyResultClick?: (kr: KeyResult) => void;
}

export function ObjectiveOKRPanel({
    objective,
    keyResults,
    isExpanded,
    onToggle,
    onKeyResultClick,
}: ObjectiveOKRPanelProps) {
    if (!objective) return null;

    const overallProgress = Math.round(objective.progress);

    const summaryContent = (
        <div className="flex items-center gap-3">
            <div className="text-right">
                <span className="text-2xl font-black text-primary-strong">{overallProgress}%</span>
                <p className="text-xs text-neutral-ink/60 font-medium">Complete</p>
            </div>
        </div>
    );

    return (
        <CollapsibleCard
            id="objective-okr"
            title={objective.title}
            subtitle={`Target: ${objective.targetExam} by ${new Date(objective.targetDate).toLocaleDateString()}`}
            icon={Target}
            isExpanded={isExpanded}
            onToggle={onToggle}
            summaryContent={summaryContent}
        >
            <div className="space-y-4 mt-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-bold text-neutral-ink">Overall Progress</span>
                        <span className="font-black text-primary-strong">{overallProgress}%</span>
                    </div>
                    <div className="h-3 bg-neutral-beige rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-strong to-primary-sky rounded-full transition-all duration-500"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                </div>

                {/* Key Results */}
                <div className="space-y-3 mt-6">
                    <h4 className="text-xs font-black text-neutral-ink uppercase tracking-widest">Key Results</h4>
                    {keyResults.map((kr) => {
                        const progress = Math.round((kr.currentValue / kr.targetValue) * 100);
                        const isOnTrack = progress >= 50;

                        return (
                            <button
                                key={kr.id}
                                onClick={() => onKeyResultClick?.(kr)}
                                className="w-full p-4 bg-neutral-beige/50 rounded-xl hover:bg-neutral-beige transition-colors text-left group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-neutral-ink group-hover:text-primary-strong transition-colors">
                                        {kr.label}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {kr.trend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
                                        {!isOnTrack && <AlertCircle size={14} className="text-amber-500" />}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-neutral-gray/20 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${progress >= 80 ? 'bg-emerald-500' :
                                                    progress >= 50 ? 'bg-primary-strong' : 'bg-amber-500'
                                                }`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-black text-neutral-ink">
                                        {kr.currentValue}/{kr.targetValue}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </CollapsibleCard>
    );
}

export default ObjectiveOKRPanel;
