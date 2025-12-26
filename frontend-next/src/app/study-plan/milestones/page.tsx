'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
    ChevronLeft, CheckCircle2, Circle, Clock, Target,
    Loader2, Calendar, ChevronRight
} from 'lucide-react';
import {
    StudyPlanDetail,
    Milestone,
    JLPT_LEVEL_INFO,
} from '@/types/studyPlanTypes';
import studyPlanService from '@/services/studyPlanService';

function MilestonesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: userLoading } = useUser();

    const [plan, setPlan] = useState<StudyPlanDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login?redirect=/study-plan/milestones');
            return;
        }

        if (user) {
            loadPlan();
        }
    }, [user, userLoading]);

    const loadPlan = async () => {
        try {
            setLoading(true);
            const planId = searchParams.get('plan');

            let planData: StudyPlanDetail | null = null;

            if (planId) {
                planData = await studyPlanService.getPlan(planId);
            } else {
                planData = await studyPlanService.getActivePlan();
            }

            setPlan(planData);
        } catch (err) {
            console.error('Failed to load plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMilestones = plan?.milestones.filter(m => {
        if (filter === 'all') return true;
        return m.status === filter;
    }) || [];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-brand-green text-white';
            case 'in_progress': return 'bg-yellow-500 text-white';
            case 'overdue': return 'bg-red-500 text-white';
            default: return 'bg-gray-200 text-neutral-ink';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'in_progress': return 'In Progress';
            case 'overdue': return 'Overdue';
            default: return 'Not Started';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary">
            <Loader2 className="w-10 h-10 animate-spin text-primary-strong" />
        </div>
    );

    if (!plan) {
        return (
            <div className="min-h-screen bg-secondary py-12">
                <div className="container mx-auto px-6 max-w-2xl text-center">
                    <div className="bg-neutral-white p-12 rounded-[2.5rem] border border-neutral-gray/20 ">
                        <Target className="w-16 h-16 mx-auto mb-6 text-neutral-ink" />
                        <h2 className="text-2xl font-black text-brand-dark mb-4">
                            No Study Plan Found
                        </h2>
                        <Link href="/study-plan" className="btnPrimary">
                            Create Study Plan
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const levelInfo = JLPT_LEVEL_INFO[plan.target_level];
    const completedCount = plan.milestones.filter(m => m.status === 'completed').length;

    return (
        <div className="min-h-screen bg-secondary py-8 font-display">
            <div className="container mx-auto px-6 max-w-4xl">

                {/* Back Link */}
                <Link
                    href={`/study-plan/dashboard?plan=${plan.id}`}
                    className="inline-flex items-center gap-2 text-neutral-ink hover:text-primary-strong transition-colors font-black text-xs uppercase tracking-widest mb-8"
                >
                    <ChevronLeft size={20} />
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="bg-neutral-white p-8 rounded-[2.5rem] border border-neutral-gray/20  mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <div
                                    className="px-4 py-1.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest "
                                    style={{ backgroundColor: levelInfo.color }}
                                >
                                    {plan.target_level}
                                </div>
                                <h1 className="text-2xl font-black text-neutral-ink tracking-tight uppercase tracking-widest text-xs">
                                    Milestones
                                </h1>
                            </div>
                            <p className="text-neutral-ink text-xs font-black uppercase tracking-widest">
                                {completedCount} of {plan.milestones.length} completed
                            </p>
                        </div>

                        <div className="text-right">
                            <div className="text-4xl font-black text-neutral-ink">
                                {Math.round(plan.overall_progress_percent)}%
                            </div>
                            <div className="text-[10px] text-neutral-ink font-black uppercase tracking-widest mt-1">Overall Progress</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-8 h-4 bg-neutral-beige rounded-full overflow-hidden ">
                        <div
                            className="h-full bg-primary-strong rounded-full transition-all "
                            style={{ width: `${plan.overall_progress_percent}%` }}
                        />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-neutral-beige p-1.5 rounded-2xl gap-1 mb-10 overflow-x-auto border border-neutral-gray/20">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'in_progress', label: 'In Progress' },
                        { id: 'pending', label: 'Not Started' },
                        { id: 'completed', label: 'Completed' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as typeof filter)}
                            className={`
                                px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300
                                ${filter === tab.id
                                    ? 'bg-neutral-white text-primary-strong  border border-neutral-gray/10'
                                    : 'text-neutral-ink hover:text-neutral-ink'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Milestones List */}
                <div className="space-y-4">
                    {filteredMilestones.length === 0 ? (
                        <div className="clay-card p-12 text-center">
                            <Circle className="w-12 h-12 mx-auto mb-4 text-neutral-ink" />
                            <p className="text-neutral-ink">No milestones match this filter.</p>
                        </div>
                    ) : (
                        filteredMilestones.map((milestone) => {
                            const isCurrent = milestone.id === plan.current_milestone_id;

                            return (
                                <Link
                                    key={milestone.id}
                                    href={`/study-plan/milestones/${milestone.id}`}
                                    className={`
                                        bg-neutral-white p-8 rounded-[2rem] border transition-all duration-500 group  hover: relative overflow-hidden
                                        ${isCurrent ? 'border-primary-strong/50 ring-4 ring-primary-strong/5' : 'border-neutral-gray/20'}
                                    `}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Status Icon */}
                                        <div className={`
                                            w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg 
                                            ${milestone.status === 'completed'
                                                ? 'bg-primary-leaf text-white'
                                                : milestone.status === 'in_progress'
                                                    ? 'bg-accent text-white'
                                                    : 'bg-neutral-beige text-neutral-gray'
                                            }
                                        `}>
                                            {milestone.status === 'completed' ? (
                                                <CheckCircle2 size={24} />
                                            ) : (
                                                milestone.milestone_number
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-black text-neutral-ink group-hover:text-primary-strong transition-colors font-display tracking-tight">
                                                    {milestone.title}
                                                </h3>
                                                {isCurrent && (
                                                    <span className="px-3 py-1 bg-primary-strong/10 text-primary-strong text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary-strong/20">
                                                        Current
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-neutral-ink font-medium mb-3">
                                                {milestone.description}
                                            </p>

                                            {/* Meta Info */}
                                            <div className="flex flex-wrap gap-4 text-xs text-neutral-ink font-bold">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {new Date(milestone.target_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    {' - '}
                                                    {new Date(milestone.target_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-1 capitalize">
                                                    <Target size={14} />
                                                    {milestone.category}
                                                </div>
                                                <div className={`px-2 py-0.5 rounded font-bold ${getStatusColor(milestone.status)}`}>
                                                    {getStatusLabel(milestone.status)}
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mt-4">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-neutral-ink">Progress</span>
                                                    <span className="font-bold text-brand-dark">{Math.round(milestone.progress_percent)}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${milestone.status === 'completed'
                                                            ? 'bg-brand-green'
                                                            : 'bg-brand-salmon'
                                                            }`}
                                                        style={{ width: `${milestone.progress_percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <ChevronRight size={20} className="text-neutral-ink group-hover:text-brand-salmon transition-colors shrink-0 mt-4" />
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MilestonesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-brand-salmon" />
            </div>
        }>
            <MilestonesContent />
        </Suspense>
    );
}
