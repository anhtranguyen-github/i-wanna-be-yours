'use client';

import { PageHeader } from '@/components/shared/PageHeader';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Loader2, Settings, Zap, ArrowRight, Target
} from 'lucide-react';
import {
    StudyPlanDetail,
    DailyTask,
    JLPT_LEVEL_INFO,
    StudySession,
    ReflectionEntry,
} from '@/types/studyPlanTypes';
import { PlanCheckoutModal } from '@/components/strategy/PlanCheckoutModal';
import studyPlanService from '@/services/studyPlanService';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { useUser } from '@/context/UserContext';

// New collapsible card components
import {
    ObjectiveOKRPanel,
    MilestoneTimeline,
    TodaysTasks,
    ContentMasteryMap,
    StudyStreak,
    ActivityRecords,
    ReflectionPrompt,
    ExamReadinessBar,
    VisionReminder,
    PerformanceTrendsPanel,
    SmartGoalsPanel,
} from './';

interface CardStates {
    'objective-okr': boolean;
    'milestone-timeline': boolean;
    'todays-tasks': boolean;
    'content-mastery': boolean;
    'study-streak': boolean;
    'activity-records': boolean;
    'reflection-prompt': boolean;
    'exam-readiness': boolean;
    'vision-reminder': boolean;
    'performance-trends': boolean;
    'smart-goals': boolean;
}

export function StudyPlanDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: userLoading } = useUser();
    const { openAuth } = useGlobalAuth();

    // Data states
    const [plan, setPlan] = useState<StudyPlanDetail | null>(null);
    const [tasks, setTasks] = useState<DailyTask[]>([]);
    const [sessions, setSessions] = useState<StudySession[]>([]);
    const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
    const [streak, setStreak] = useState({ current: 0, longest: 0 });
    const [trends, setTrends] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI states
    const [expandedCards, setExpandedCards] = useState<CardStates>({
        'objective-okr': true,
        'milestone-timeline': false,
        'todays-tasks': true,
        'content-mastery': false,
        'study-streak': false,
        'activity-records': false,
        'reflection-prompt': false,
        'exam-readiness': true,
        'vision-reminder': false,
        'performance-trends': true,
        'smart-goals': true,
    });

    // Checkout modal
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutData, setCheckoutData] = useState<any>(null);
    const [creating, setCreating] = useState(false);

    // Load UI preferences
    const loadUIPreferences = useCallback(async () => {
        try {
            const prefs = await studyPlanService.getUIPreferences();
            if (prefs.expandedCards) {
                setExpandedCards(prev => ({ ...prev, ...prefs.expandedCards }));
            }
        } catch (err) {
            console.error('Failed to load UI preferences', err);
        }
    }, []);

    // Save UI preference when card is toggled
    const handleCardToggle = useCallback(async (cardId: string, isExpanded: boolean) => {
        setExpandedCards(prev => {
            const updated = { ...prev, [cardId]: isExpanded };
            // Save to backend (fire and forget)
            studyPlanService.saveUIPreferences({ expandedCards: updated }).catch(console.error);
            return updated;
        });
    }, []);

    // Load all data
    const loadData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const planId = searchParams.get('plan');

            // Load plan
            let planData = planId
                ? await studyPlanService.getPlan(planId)
                : await studyPlanService.getActivePlan();

            if (planData) {
                setPlan(planData);
                localStorage.removeItem('pending_study_plan_setup');

                // Load additional data in parallel
                const [tasksRes, sessionsRes, streakRes, reflectionsRes, trendsRes] = await Promise.all([
                    studyPlanService.getMyDailyTasks(),
                    studyPlanService.getStudySessions(20),
                    studyPlanService.getStudyStreak(),
                    studyPlanService.getReflections(5),
                    studyPlanService.getPerformanceTrends(30),
                ]);

                setTasks(tasksRes.tasks || []);
                setSessions(sessionsRes.sessions?.map(s => ({
                    id: s.id,
                    userId: '',
                    skill: s.skill as any,
                    effortLevel: s.effortLevel as any,
                    durationMinutes: s.durationMinutes,
                    createdAt: s.createdAt,
                })) || []);
                setStreak(streakRes);
                setReflections(reflectionsRes.reflections?.map(r => ({
                    id: r.id,
                    userId: '',
                    weekStartDate: r.weekStartDate,
                    content: r.content,
                    createdAt: r.createdAt,
                })) || []);
                setTrends(trendsRes);
            }
        } catch (err: any) {
            console.error('Error loading dashboard data:', err);
            setError(err.message || 'Failed to load study plan');
        } finally {
            setLoading(false);
        }
    }, [user, searchParams]);

    useEffect(() => {
        if (!userLoading && user) {
            loadData();
            loadUIPreferences();
        }

        // Check for pending guest setup
        if (!userLoading && user && !loading && !plan) {
            const pendingSetup = localStorage.getItem('pending_study_plan_setup');
            if (pendingSetup) {
                try {
                    const data = JSON.parse(pendingSetup);
                    setCheckoutData(data);
                    setShowCheckout(true);
                } catch (e) {
                    localStorage.removeItem('pending_study_plan_setup');
                }
            }
        }
    }, [user, userLoading, loadData, loadUIPreferences]);

    const handleConfirmCheckout = async () => {
        if (!checkoutData) return;

        try {
            setCreating(true);
            const result = await studyPlanService.createMyPlan(
                checkoutData.targetLevel,
                new Date(checkoutData.examDate),
                {
                    daily_study_minutes: checkoutData.dailyMinutes,
                    study_days_per_week: checkoutData.studyDays,
                    preferred_focus: checkoutData.focusAreas,
                }
            );

            localStorage.removeItem('pending_study_plan_setup');
            setShowCheckout(false);
            router.push(`/study-plan?plan=${result.id}&new=true`);
            loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to create plan');
        } finally {
            setCreating(false);
        }
    };

    const handleTaskComplete = async (taskId: string) => {
        try {
            await studyPlanService.completeTask(taskId);
            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, status: 'completed' as const } : t
            ));
        } catch (err) {
            console.error('Failed to complete task', err);
        }
    };

    const handleReflectionSubmit = async (content: string) => {
        try {
            const result = await studyPlanService.submitReflection(content);
            // Reload reflections
            const reflectionsRes = await studyPlanService.getReflections(5);
            setReflections(reflectionsRes.reflections?.map(r => ({
                id: r.id,
                userId: '',
                weekStartDate: r.weekStartDate,
                content: r.content,
                createdAt: r.createdAt,
            })) || []);
        } catch (err) {
            console.error('Failed to submit reflection', err);
        }
    };

    if (userLoading || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-lg font-bold text-neutral-ink tracking-tight">Loading your study plan...</p>
                </div>
            </div>
        );
    }

    if (!plan) return <NoPlanView user={user} openAuth={openAuth} />;

    const levelInfo = JLPT_LEVEL_INFO[plan.target_level];

    // Derive data for components
    const objective = {
        id: plan.id,
        title: `Pass JLPT ${plan.target_level}`,
        targetExam: plan.target_level,
        targetDate: plan.exam_date,
        progress: plan.overall_progress_percent,
    };

    const keyResults = [
        { id: '1', label: 'Vocabulary Mastery', currentValue: Math.round(plan.overall_progress_percent * 30), targetValue: 3000, metricType: 'count' as const },
        { id: '2', label: 'Grammar Points', currentValue: Math.round(plan.overall_progress_percent * 2), targetValue: 200, metricType: 'count' as const },
        { id: '3', label: 'Kanji Learned', currentValue: Math.round(plan.overall_progress_percent * 6), targetValue: 600, metricType: 'count' as const },
    ];

    // Derive mastery from progress (placeholder - will be from real data)
    const contentMastery = {
        vocabulary: { percent: Math.round(plan.overall_progress_percent * 0.9), learned: Math.round(plan.overall_progress_percent * 27), total: 3000 },
        grammar: { percent: Math.round(plan.overall_progress_percent * 0.8), learned: Math.round(plan.overall_progress_percent * 1.6), total: 200 },
        kanji: { percent: Math.round(plan.overall_progress_percent * 0.7), learned: Math.round(plan.overall_progress_percent * 4.2), total: 600 },
        reading: { percent: Math.round(plan.overall_progress_percent * 0.6), learned: 0, total: 100 },
        listening: { percent: Math.round(plan.overall_progress_percent * 0.5), learned: 0, total: 100 },
    };

    const examReadiness = Math.round(
        (contentMastery.vocabulary.percent + contentMastery.grammar.percent +
            contentMastery.kanji.percent + contentMastery.reading.percent +
            contentMastery.listening.percent) / 5
    );

    return (
        <div className="min-h-screen bg-secondary pb-12">

            {/* Header */}
            <PageHeader
                title="Study Plan Dashboard"
                subtitle={
                    <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-strong animate-pulse" />
                        JLPT {plan.target_level} • {plan.days_remaining} days remaining
                    </span>
                }
                icon={<Zap size={24} className="fill-primary-strong text-primary-strong" />}
                iconBgColor="bg-neutral-beige border border-neutral-gray/20"
                rightContent={
                    <Link
                        href="/study-plan/settings"
                        className="flex items-center gap-2 px-4 py-2 text-neutral-ink hover:text-primary-strong transition-colors"
                    >
                        <Settings size={18} />
                        <span className="text-sm font-bold">Settings</span>
                    </Link>
                }
            />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-12 gap-6 min-w-0">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Objective & OKR */}
                        <ObjectiveOKRPanel
                            objective={objective}
                            keyResults={keyResults}
                            isExpanded={expandedCards['objective-okr']}
                            onToggle={handleCardToggle}
                        />

                        {/* Today's Tasks */}
                        <TodaysTasks
                            tasks={tasks}
                            isExpanded={expandedCards['todays-tasks']}
                            onToggle={handleCardToggle}
                            onTaskComplete={handleTaskComplete}
                        />

                        {/* Milestone Timeline */}
                        <MilestoneTimeline
                            milestones={plan.milestones}
                            currentMilestoneId={plan.current_milestone_id}
                            isExpanded={expandedCards['milestone-timeline']}
                            onToggle={handleCardToggle}
                        />

                        {/* Performance Trends */}
                        <PerformanceTrendsPanel
                            trends={trends}
                            isExpanded={expandedCards['performance-trends']}
                            onToggle={handleCardToggle}
                            onRecalibrate={() => router.push('/chat?prompt=Please+recalibrate+my+study+priorities+based+on+my+recent+struggles')}
                        />

                        {/* Content Mastery */}
                        <ContentMasteryMap
                            mastery={contentMastery}
                            isExpanded={expandedCards['content-mastery']}
                            onToggle={handleCardToggle}
                        />

                        {/* Reflection */}
                        <ReflectionPrompt
                            recentReflections={reflections}
                            isExpanded={expandedCards['reflection-prompt']}
                            onToggle={handleCardToggle}
                            onSubmit={handleReflectionSubmit}
                        />
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Exam Readiness */}
                        <ExamReadinessBar
                            readinessPercent={examReadiness}
                            daysRemaining={plan.days_remaining}
                            targetExam={plan.target_level}
                            breakdown={{
                                vocabulary: contentMastery.vocabulary.percent,
                                grammar: contentMastery.grammar.percent,
                                kanji: contentMastery.kanji.percent,
                                reading: contentMastery.reading.percent,
                                listening: contentMastery.listening.percent,
                            }}
                            isExpanded={expandedCards['exam-readiness']}
                            onToggle={handleCardToggle}
                        />

                        {/* Study Streak */}
                        <StudyStreak
                            currentStreak={streak.current}
                            longestStreak={streak.longest}
                            recentSessions={sessions}
                            isExpanded={expandedCards['study-streak']}
                            onToggle={handleCardToggle}
                        />

                        {/* Activity Records */}
                        <ActivityRecords
                            sessions={sessions}
                            isExpanded={expandedCards['activity-records']}
                            onToggle={handleCardToggle}
                        />

                        {/* Smart Goals */}
                        <SmartGoalsPanel
                            isExpanded={expandedCards['smart-goals']}
                            onToggle={handleCardToggle}
                            onRecalibrate={() => router.push('/chat?prompt=Please+recalibrate+my+study+priorities+based+on+my+recent+struggles')}
                        />

                        {/* Vision Reminder */}
                        <VisionReminder
                            objective={objective}
                            userName={user?.email?.split('@')[0]}
                            isExpanded={expandedCards['vision-reminder']}
                            onToggle={handleCardToggle}
                        />
                    </div>
                </div>
            </main>

            {/* Modals */}
            {checkoutData && (
                <PlanCheckoutModal
                    isOpen={showCheckout}
                    onClose={() => setShowCheckout(false)}
                    onConfirm={handleConfirmCheckout}
                    planSummary={checkoutData}
                    loading={creating}
                />
            )}
        </div>
    );
}

function NoPlanView({ user, openAuth }: { user: any, openAuth: any }) {
    return (
        <div className="min-h-screen bg-secondary py-12 px-6">
            <div className="max-w-4xl mx-auto space-y-12 text-center">
                <div>
                    <h1 className="text-4xl font-black text-neutral-ink tracking-tight">Study Plan Dashboard</h1>
                    <p className="text-xl text-neutral-ink/70 font-medium mt-2">
                        Create a personalized JLPT study plan
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-10 bg-neutral-white border border-neutral-gray/10 rounded-3xl group hover:border-primary-strong/20 transition-all">
                        <Target size={48} className="text-primary-strong mx-auto mb-6 group-hover:scale-110 transition-transform" />
                        <h2 className="text-xl font-black text-neutral-ink mb-4">Create Study Plan</h2>
                        <p className="text-neutral-ink/60 mb-6">Set your target JLPT level and exam date to get started.</p>
                        <Link
                            href="/study-plan/setup"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-strong text-white font-bold rounded-xl hover:bg-primary-strong/90 transition-colors"
                        >
                            Get Started <ArrowRight size={18} />
                        </Link>
                    </div>

                    {!user && (
                        <div className="p-10 bg-neutral-ink text-white rounded-3xl group">
                            <Zap size={48} className="text-primary-strong mx-auto mb-6 group-hover:scale-110 transition-transform" />
                            <h2 className="text-xl font-black mb-4">Sync Your Progress</h2>
                            <p className="text-white/70 mb-6">Log in to save your study plan and track progress across devices.</p>
                            <button
                                onClick={() => openAuth('REGISTER')}
                                className="px-6 py-3 bg-white text-neutral-ink font-bold rounded-xl hover:bg-white/90 transition-colors"
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudyPlanDashboard;
