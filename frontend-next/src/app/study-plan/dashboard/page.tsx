'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
    Calendar, Target, Clock, CheckCircle2, Circle,
    ChevronRight, Play, Loader2, AlertCircle, Settings,
    TrendingUp, BookOpen, Sparkles, Award, Lock
} from 'lucide-react';
import {
    StudyPlanDetail,
    DailyTask,
    JLPT_LEVEL_INFO,
    Milestone,
} from '@/types/studyPlanTypes';
import studyPlanService from '@/services/studyPlanService';
import { useGlobalAuth } from '@/context/GlobalAuthContext';

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: userLoading } = useUser();
    const { openAuth } = useGlobalAuth();

    const [plan, setPlan] = useState<StudyPlanDetail | null>(null);
    const [tasks, setTasks] = useState<DailyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showNewPlanBanner, setShowNewPlanBanner] = useState(false);

    useEffect(() => {
        if (!userLoading && !user) {
            // Contextual Auth for Dashboard
            openAuth('REGISTER', {
                flowType: 'STUDY_PLAN',
                title: "Track Your Progress",
                description: "Log in to see your daily tasks, milestone progress, and study statistics."
            });
            return;
        }

        if (user) {
            loadData();
        }
    }, [user, userLoading]);

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setShowNewPlanBanner(true);
            setTimeout(() => setShowNewPlanBanner(false), 5000);
        }
    }, [searchParams]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Get plan ID from URL or fetch active plan
            const planId = searchParams.get('plan');

            let planData: StudyPlanDetail | null = null;

            if (planId) {
                planData = await studyPlanService.getPlan(planId);
            } else {
                planData = await studyPlanService.getActivePlan();
            }

            if (planData) {
                setPlan(planData);

                // Load daily tasks
                const { tasks: dailyTasks } = await studyPlanService.getMyDailyTasks();
                setTasks(dailyTasks);
            }
        } catch (err: any) {
            console.error('Failed to load plan:', err);
            setError(err.message || 'Failed to load study plan');
        } finally {
            setLoading(false);
        }
    };

    const handleTaskComplete = async (taskId: string) => {
        try {
            await studyPlanService.completeTask(taskId);
            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, status: 'completed' as const } : t
            ));
        } catch (err) {
            console.error('Failed to complete task:', err);
        }
    };

    const getCurrentMilestone = (): Milestone | undefined => {
        if (!plan) return undefined;
        return plan.milestones.find(m => m.id === plan.current_milestone_id);
    };

    const getUpcomingMilestones = (): Milestone[] => {
        if (!plan) return [];
        return plan.milestones.filter(m => m.status !== 'completed').slice(0, 3);
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-salmon mx-auto mb-4" />
                    <p className="text-gray-500">Loading your study plan...</p>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30 py-12">
                <div className="container mx-auto px-6 max-w-2xl text-center">
                    <div className="clay-card p-12">
                        {user ? (
                            <>
                                <Target className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                                <h2 className="text-2xl font-black text-brand-dark mb-4">
                                    No Active Study Plan
                                </h2>
                                <p className="text-gray-500 mb-8">
                                    Create a personalized study plan to start your JLPT journey.
                                </p>
                                <Link href="/study-plan/setup" className="btnPrimary">
                                    Create Study Plan
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="relative w-20 h-20 mx-auto mb-8">
                                    <div className="absolute inset-0 bg-brand-salmon/20 rounded-full animate-ping" />
                                    <div className="relative z-10 w-20 h-20 bg-brand-salmon rounded-full flex items-center justify-center">
                                        <Lock className="text-white" size={32} />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-black text-brand-dark mb-4">
                                    Guest Dashboard Locked
                                </h2>
                                <p className="text-gray-500 mb-8">
                                    Your personal study dashboard and progress tracking are only available to logged-in students.
                                </p>
                                <button
                                    onClick={() => openAuth('REGISTER', { flowType: 'STUDY_PLAN' })}
                                    className="btnPrimary"
                                >
                                    Login to View Dashboard
                                </button>
                                <div className="mt-6">
                                    <Link href="/study-plan/setup" className="text-sm font-bold text-brand-salmon hover:underline">
                                        Or create a new plan as a guest
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const levelInfo = JLPT_LEVEL_INFO[plan.target_level];
    const currentMilestone = getCurrentMilestone();
    const upcomingMilestones = getUpcomingMilestones();
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30 py-8">
            <div className="container mx-auto px-6 max-w-5xl">

                {/* New Plan Banner */}
                {showNewPlanBanner && (
                    <div className="mb-6 p-4 bg-brand-green/10 border border-brand-green/30 rounded-2xl flex items-center gap-3 animate-fadeIn">
                        <Sparkles className="text-brand-green" size={24} />
                        <span className="font-bold text-brand-dark">
                            Your study plan has been created! Let&apos;s get started.
                        </span>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="px-4 py-2 rounded-xl text-white font-black"
                                style={{ backgroundColor: levelInfo.color }}
                            >
                                {plan.target_level}
                            </div>
                            <h1 className="text-2xl font-black text-brand-dark">
                                Study Plan Dashboard
                            </h1>
                        </div>
                        <p className="text-gray-500">
                            {levelInfo.name} • Exam on {new Date(plan.exam_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>

                    <Link
                        href={`/study-plan/settings?plan=${plan.id}`}
                        className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <Settings size={20} className="text-gray-600" />
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Days Remaining */}
                    <div className="clay-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-brand-salmon/10">
                                <Calendar className="text-brand-salmon" size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-brand-dark">{plan.days_remaining}</div>
                                <div className="text-xs text-gray-500 font-medium">Days Left</div>
                            </div>
                        </div>
                    </div>

                    {/* Overall Progress */}
                    <div className="clay-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-brand-green/10">
                                <TrendingUp className="text-brand-green" size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-brand-dark">{Math.round(plan.overall_progress_percent)}%</div>
                                <div className="text-xs text-gray-500 font-medium">Complete</div>
                            </div>
                        </div>
                    </div>

                    {/* Daily Study */}
                    <div className="clay-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-brand-sky/10">
                                <Clock className="text-brand-sky" size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-brand-dark">{plan.daily_study_minutes}</div>
                                <div className="text-xs text-gray-500 font-medium">Min/Day</div>
                            </div>
                        </div>
                    </div>

                    {/* Milestones */}
                    <div className="clay-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-yellow-100">
                                <Award className="text-yellow-600" size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-brand-dark">
                                    {plan.milestones.filter(m => m.status === 'completed').length}/{plan.milestones.length}
                                </div>
                                <div className="text-xs text-gray-500 font-medium">Milestones</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Left Column - Today's Tasks */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Today's Tasks */}
                        <div className="clay-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-black text-brand-dark flex items-center gap-2">
                                    <BookOpen size={20} />
                                    Today&apos;s Tasks
                                </h2>
                                <span className="text-sm text-gray-500 font-medium">
                                    {completedTasks}/{totalTasks} completed
                                </span>
                            </div>

                            {tasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-gray-500">No tasks for today. Check back tomorrow!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tasks.map((task, idx) => (
                                        <div
                                            key={task.id || idx}
                                            className={`
                                                p-4 rounded-xl border-2 flex items-center gap-4 transition-all
                                                ${task.status === 'completed'
                                                    ? 'border-brand-green/30 bg-brand-green/5'
                                                    : 'border-gray-100 hover:border-brand-salmon/30'
                                                }
                                            `}
                                        >
                                            <button
                                                onClick={() => task.id && handleTaskComplete(task.id)}
                                                disabled={task.status === 'completed'}
                                                className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                                                    ${task.status === 'completed'
                                                        ? 'bg-brand-green text-white'
                                                        : 'border-2 border-gray-300 hover:border-brand-salmon hover:bg-brand-salmon/10'
                                                    }
                                                `}
                                            >
                                                {task.status === 'completed' ? (
                                                    <CheckCircle2 size={18} />
                                                ) : (
                                                    <Circle size={18} className="text-gray-300" />
                                                )}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-bold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-brand-dark'}`}>
                                                    {task.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 truncate">{task.description}</p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-gray-400 font-medium">
                                                    ~{task.estimated_minutes} min
                                                </span>
                                                {task.status !== 'completed' && (
                                                    <button className="p-2 rounded-lg hover:bg-brand-salmon/10 transition-colors">
                                                        <Play size={16} className="text-brand-salmon" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Current Milestone */}
                        {currentMilestone && (
                            <div className="clay-card p-6">
                                <h2 className="text-lg font-black text-brand-dark mb-4 flex items-center gap-2">
                                    <Target size={20} />
                                    Current Milestone
                                </h2>

                                <div className="p-5 bg-gradient-to-r from-brand-salmon/10 to-brand-sky/10 rounded-xl">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <span className="text-xs font-bold text-brand-salmon">
                                                Milestone {currentMilestone.milestone_number}
                                            </span>
                                            <h3 className="text-xl font-black text-brand-dark mt-1">
                                                {currentMilestone.title}
                                            </h3>
                                        </div>
                                        <span className={`
                                            px-3 py-1 rounded-lg text-xs font-bold
                                            ${currentMilestone.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {currentMilestone.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4">{currentMilestone.description}</p>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-500">Progress</span>
                                            <span className="font-bold text-brand-dark">{Math.round(currentMilestone.progress_percent)}%</span>
                                        </div>
                                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-brand-salmon to-brand-sky rounded-full transition-all"
                                                style={{ width: `${currentMilestone.progress_percent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Criteria */}
                                    <div className="space-y-2">
                                        {currentMilestone.criteria.map((c, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 capitalize">{c.type.replace('_', ' ')}</span>
                                                <span className="font-bold text-brand-dark">
                                                    {c.current_value ?? 0} / {c.target_value} {c.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Milestones List */}
                    <div className="space-y-6">

                        {/* Milestones */}
                        <div className="clay-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-black text-brand-dark">Milestones</h2>
                                <Link
                                    href={`/study-plan/milestones?plan=${plan.id}`}
                                    className="text-sm text-brand-salmon hover:underline font-bold"
                                >
                                    View All
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {plan.milestones.map((milestone) => {
                                    const isCurrent = milestone.id === plan.current_milestone_id;

                                    return (
                                        <Link
                                            key={milestone.id}
                                            href={`/study-plan/milestones/${milestone.id}`}
                                            className={`
                                                block p-4 rounded-xl border-2 transition-all group
                                                ${isCurrent
                                                    ? 'border-brand-salmon bg-brand-salmon/5'
                                                    : milestone.status === 'completed'
                                                        ? 'border-brand-green/30 bg-brand-green/5'
                                                        : 'border-gray-100 hover:border-gray-200'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                                                    ${milestone.status === 'completed'
                                                        ? 'bg-brand-green text-white'
                                                        : isCurrent
                                                            ? 'bg-brand-salmon text-white'
                                                            : 'bg-gray-200 text-gray-500'
                                                    }
                                                `}>
                                                    {milestone.status === 'completed' ? (
                                                        <CheckCircle2 size={16} />
                                                    ) : (
                                                        milestone.milestone_number
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-brand-dark text-sm truncate">
                                                        {milestone.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500">
                                                        {Math.round(milestone.progress_percent)}% complete
                                                    </p>
                                                </div>

                                                <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-salmon transition-colors shrink-0" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="clay-card p-6">
                            <h2 className="text-lg font-black text-brand-dark mb-4">Quick Actions</h2>

                            <div className="space-y-2">
                                <Link
                                    href="/flashcards"
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="p-2 rounded-lg bg-brand-salmon/10 group-hover:bg-brand-salmon group-hover:text-white transition-all">
                                        <BookOpen size={18} className="text-brand-salmon group-hover:text-white" />
                                    </div>
                                    <span className="font-bold text-brand-dark">Review Flashcards</span>
                                </Link>

                                <Link
                                    href="/practice/quiz"
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="p-2 rounded-lg bg-brand-sky/10 group-hover:bg-brand-sky group-hover:text-white transition-all">
                                        <Target size={18} className="text-brand-sky group-hover:text-white" />
                                    </div>
                                    <span className="font-bold text-brand-dark">Take a Quiz</span>
                                </Link>

                                <Link
                                    href="/chat"
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="p-2 rounded-lg bg-brand-green/10 group-hover:bg-brand-green group-hover:text-white transition-all">
                                        <Sparkles size={18} className="text-brand-green group-hover:text-white" />
                                    </div>
                                    <span className="font-bold text-brand-dark">Ask Hanachan</span>
                                </Link>

                                <Link
                                    href={`/study-plan/assessments?plan=${plan.id}`}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                        <Award size={18} className="text-purple-500 group-hover:text-white" />
                                    </div>
                                    <span className="font-bold text-brand-dark">Assessments</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-brand-salmon" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
