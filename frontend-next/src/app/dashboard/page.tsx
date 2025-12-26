"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { AuthErrorScreen } from "@/components/auth/AuthErrorScreen";
import learnerProgressService from "@/services/learnerProgressService";
import {
    ProgressSummaryResponse,
    Achievement,
    WeeklyStats,
    LearnerProgress,
    CATEGORY_COLORS,
} from "@/types/learnerProgressTypes";

// Icons
import {
    FireIcon,
    TrophyIcon,
    BookOpenIcon,
    AcademicCapIcon,
    ChartBarIcon,
    ClockIcon,
    CheckCircleIcon,
    SparklesIcon,
    ArrowTrendingUpIcon,
    CalendarDaysIcon,
    PencilSquareIcon,
    ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";

import {
    StatCard,
    ProgressRing,
    StreakBadge,
    StreakDisplay,
    WeeklyProgressBar,
    AchievementBadge,
    AchievementGrid,
    ProgressSummaryMini
} from "@/components/dashboard/DashboardComponents";

// ============================================
// Internal Page Components (Refactored)
// ============================================

interface AchievementCardProps {
    achievement: Achievement;
}

function AchievementCard({ achievement }: AchievementCardProps) {
    return (
        <div
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 border ${achievement.earned
                ? "bg-white border-primary/20 "
                : "bg-muted/30 border-transparent opacity-50 grayscale"
                }`}
        >
            <span className="text-3xl">{achievement.icon}</span>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate font-display">
                    {achievement.name}
                </p>
                <p className="text-xs text-neutral-ink truncate font-medium">
                    {achievement.description}
                </p>
            </div>
            {achievement.earned && (
                <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0" />
            )}
        </div>
    );
}

function WeeklyGoalCard({ label, current, target, icon, color, unit = "" }: any) {
    const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    return (
        <div className="bg-white rounded-xl p-4 border border-border ">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                    <div className="w-5 h-5" style={{ color }}>{icon}</div>
                </div>
                <p className="text-xs font-bold text-neutral-ink uppercase tracking-tight font-display">{label}</p>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-black text-foreground font-display">{current}{unit}</span>
                <span className="text-xs font-bold text-neutral-ink">/ {target}{unit}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

function QuickAction({ label, icon, href, color }: any) {
    const router = useRouter();
    return (
        <button
            onClick={() => router.push(href)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-border  hover:  transition-all duration-300 group"
        >
            <div className="p-3 rounded-xl group-hover:scale-110 transition-transform" style={{ backgroundColor: `${color}15` }}>
                <div className="w-6 h-6" style={{ color }}>{icon}</div>
            </div>
            <span className="text-xs font-bold text-neutral-ink group-hover:text-foreground transition-colors font-display">{label}</span>
        </button>
    );
}

// ============================================
// Main Dashboard Page
// ============================================

export default function LearningDashboardPage() {
    const { user, loading: userLoading } = useUser();
    const { openAuth } = useGlobalAuth();
    const router = useRouter();

    const [progressData, setProgressData] = useState<ProgressSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isGuest = !user;

    // No demo data for guests, just placeholders
    const progress = progressData?.progress;

    // Fetch progress data for logged-in users
    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        async function fetchData() {
            try {
                setLoading(true);
                const data = await learnerProgressService.getProgress(user!.id.toString());
                setProgressData(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching progress:", err);
                setError("Failed to load progress data");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user?.id]);

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-neutral-ink dark:text-neutral-ink">Loading your progress...</p>
                </div>
            </div>
        );
    }

    if (error && !isGuest) {
        // Check if it's an auth error (401/403)
        const isAuthError = error.toLowerCase().includes('unauthorized') ||
            error.toLowerCase().includes('authentication') ||
            error.toLowerCase().includes('session');

        if (isAuthError) {
            return (
                <AuthErrorScreen
                    title="Session Expired"
                    message="Your session has expired. Please log in again to view your progress."
                    onRetry={() => window.location.reload()}
                />
            );
        }

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-neutral-ink mb-2">Failed to load progress data</h2>
                    <p className="text-neutral-ink mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const weeklyStats = progressData?.weekly_stats;
    const achievements = progressData?.achievements || [];

    const recentActivities = progressData?.recent_activities || [];

    // Calculate overall weekly progress with null safety
    const weeklyProgress = (() => {
        const goals = progress?.weekly_goals;
        if (!goals) return 0;

        const flashcardProgress = goals.flashcard_reviews?.target
            ? (goals.flashcard_reviews.current || 0) / goals.flashcard_reviews.target
            : 0;
        const quizProgress = goals.quizzes_completed?.target
            ? (goals.quizzes_completed.current || 0) / goals.quizzes_completed.target
            : 0;
        const studyProgress = goals.study_minutes?.target
            ? (goals.study_minutes.current || 0) / goals.study_minutes.target
            : 0;

        return Math.round(((flashcardProgress + quizProgress + studyProgress) / 3) * 100);
    })();

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Premium Guest Banner */}
                {isGuest && (
                    <div className="relative mb-10 p-1 md:p-1.5 rounded-[2.5rem] bg-gradient-to-r from-primary/10 via-secondary to-accent/10 overflow-hidden  group transition-all duration-500">
                        <div className="absolute inset-0 bg-white/40 -3xl rounded-[2.3rem]" />

                        <div className="relative z-10 p-6 md:p-10 rounded-[2.3rem] flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl  animate-bounce-slow">
                                    🌸
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl md:text-4xl font-black text-foreground mb-2 tracking-tight font-display">
                                        Your Personalized <span className="text-primary">Japanese Engine</span>
                                    </h2>
                                    <p className="text-neutral-ink font-bold max-w-xl leading-relaxed">
                                        You&apos;re currently in Preview Mode. Create an account to save your progress, unlock AI deep-dives, and sync across all your devices.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                                <button
                                    onClick={() => openAuth('REGISTER', { flowType: 'GENERAL' })}
                                    className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:opacity-90   transition-all whitespace-nowrap"
                                >
                                    Claim Your Progress
                                </button>
                                <button
                                    onClick={() => openAuth('LOGIN')}
                                    className="px-8 py-4 bg-card  text-foreground border border-white font-black rounded-2xl hover:bg-white  transition-all whitespace-nowrap"
                                >
                                    Login
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Tutor Insights (Guest specific or Premium) */}
                {isGuest && (
                    <div className="bg-card rounded-2xl p-6 md:p-8 mb-10  hover: border border-border flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group transition-all">
                        <div className="absolute top-0 right-0 p-4 transform translate-x-4 -translate-y-4 opacity-5 group-hover:scale-110 transition-transform">
                            <SparklesIcon className="w-32 h-32 text-primary" />
                        </div>

                        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center shrink-0 ">
                            <ChatBubbleLeftRightIcon className="w-10 h-10 text-primary" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-full">AI Insight</span>
                                <h3 className="text-xl font-black text-foreground tracking-tight font-display">Hanachan Assistant</h3>
                            </div>
                            <p className="text-neutral-ink font-bold leading-relaxed italic max-w-2xl">
                                &quot;You&apos;re making amazing progress with N3 vocabulary! Based on our demo patterns, your retention is 15% higher in the morning. I recommend focusing on Kanji tomorrow to maintain your 5-day streak!&quot;
                            </p>
                        </div>

                        <div className="shrink-0">
                            <button
                                onClick={() => openAuth('REGISTER', { flowType: 'CHAT', title: 'Unlock Your Mentor' })}
                                className="group flex items-center gap-2 text-primary font-black hover:gap-3 transition-all font-display"
                            >
                                Get Personal Insights <ArrowTrendingUpIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-foreground mb-2 font-display">
                        Learning Dashboard
                    </h1>
                    <p className="text-neutral-ink font-bold">
                        Track your Japanese learning progress and achievements
                    </p>
                </div>

                {/* Top Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Vocabulary Mastered"
                        value={progress?.vocabulary_mastered || 0}
                        icon={<BookOpenIcon className="w-full h-full" />}
                        color="hsl(var(--vocab))"
                        description="words learned"
                    />
                    <StatCard
                        title="Kanji Learned"
                        value={progress?.kanji_mastered || 0}
                        icon={<PencilSquareIcon className="w-full h-full" />}
                        color="hsl(var(--kanji))"
                        description="characters"
                    />
                    <StatCard
                        title="Grammar Points"
                        value={progress?.grammar_points_learned || 0}
                        icon={<AcademicCapIcon className="w-full h-full" />}
                        color="hsl(var(--grammar))"
                        description="patterns studied"
                    />
                    <StatCard
                        title="Study Time"
                        value={learnerProgressService.formatStudyTime(progress?.total_study_time_minutes || 0)}
                        icon={<ClockIcon className="w-full h-full" />}
                        color="hsl(var(--primary))"
                        description="total time"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* Left Column - Streak & Weekly Progress */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Streak Card */}
                        <StreakDisplay
                            current={progress?.current_streak || 0}
                            longest={progress?.longest_streak || 0}
                        />

                        {/* Weekly Progress Overview */}
                        <div className="bg-card rounded-2xl p-6  border border-border">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-foreground font-display">
                                    Weekly Progress
                                </h3>
                                <CalendarDaysIcon className="w-5 h-5 text-neutral-ink" />
                            </div>

                            <div className="flex justify-center mb-6">
                                <ProgressRing
                                    progress={weeklyProgress}
                                    size={150}
                                    strokeWidth={12}
                                />
                            </div>

                            <div className="space-y-4">
                                <WeeklyGoalCard
                                    label="Flashcard Reviews"
                                    current={progress?.weekly_goals?.flashcard_reviews?.current || 0}
                                    target={progress?.weekly_goals?.flashcard_reviews?.target || 100}
                                    icon={<SparklesIcon className="w-full h-full" />}
                                    color="hsl(var(--primary))"
                                />
                                <WeeklyGoalCard
                                    label="Quizzes Completed"
                                    current={progress?.weekly_goals?.quizzes_completed?.current || 0}
                                    target={progress?.weekly_goals?.quizzes_completed?.target || 5}
                                    icon={<ChartBarIcon className="w-full h-full" />}
                                    color="hsl(var(--grammar))"
                                />
                                <WeeklyGoalCard
                                    label="Study Minutes"
                                    current={progress?.weekly_goals?.study_minutes?.current || 0}
                                    target={progress?.weekly_goals?.study_minutes?.target || 150}
                                    icon={<ClockIcon className="w-full h-full" />}
                                    color="hsl(var(--primary))"
                                    unit="m"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Middle Column - Quick Actions & Recent Activity */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-card rounded-2xl p-6  border border-border">
                            <h3 className="text-xl font-black text-foreground mb-4 font-display">
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <QuickAction
                                    label="Flashcards"
                                    icon={<SparklesIcon className="w-full h-full" />}
                                    href="/flashcards"
                                    color="hsl(var(--primary))"
                                />
                                <QuickAction
                                    label="Quiz"
                                    icon={<ChartBarIcon className="w-full h-full" />}
                                    href="/practice"
                                    color="hsl(var(--grammar))"
                                />
                                <QuickAction
                                    label="Study Plan"
                                    icon={<CalendarDaysIcon className="w-full h-full" />}
                                    href="/study-plan"
                                    color="hsl(var(--kanji))"
                                />
                                <QuickAction
                                    label="AI Tutor"
                                    icon={<ChatBubbleLeftRightIcon className="w-full h-full" />}
                                    href="/chat"
                                    color="hsl(var(--primary))"
                                />
                            </div>
                        </div>

                        {/* This Week Stats */}
                        <div className="bg-card rounded-2xl p-6  border border-border">
                            <h3 className="text-xl font-black text-foreground mb-4 font-display">
                                This Week
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-border">
                                    <span className="text-neutral-ink font-bold">Cards Reviewed</span>
                                    <span className="font-black text-foreground font-display">
                                        {weeklyStats?.flashcard_reviews || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border">
                                    <span className="text-neutral-ink font-bold">Quizzes Taken</span>
                                    <span className="font-black text-foreground font-display">
                                        {weeklyStats?.quizzes_completed || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border">
                                    <span className="text-neutral-ink font-bold">Avg. Quiz Score</span>
                                    <span className="font-black text-foreground font-display">
                                        {weeklyStats?.avg_quiz_score || 0}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-neutral-ink font-bold">Days Active</span>
                                    <span className="font-black text-foreground font-display">
                                        {weeklyStats?.days_active || 0} / 7
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Achievements */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6  border border-gray-100 dark:border-gray-700 h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-neutral-ink dark:text-white">
                                    Achievements
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-neutral-ink dark:text-neutral-ink">
                                    <TrophyIcon className="w-4 h-4 text-yellow-500" />
                                    <span>{isGuest ? "0/12" : `${progressData?.achievements_count || 0}/${progressData?.total_achievements_available || 0}`}</span>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                {isGuest ? (
                                    <div className="space-y-3 opacity-60">
                                        {[
                                            { name: 'Day 1 Warrior', desc: 'Start your first lesson', icon: '🎯' },
                                            { name: 'Kanji Sensei', desc: 'Master 100 Kanji', icon: '✍️' },
                                            { name: 'Polyglot', desc: 'Complete 5 levels', icon: '📚' },
                                            { name: 'Perfect Score', desc: '100% on any N3 quiz', icon: '⭐' },
                                        ].map((mock, i) => (
                                            <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-200 grayscale">
                                                <span className="text-3xl">{mock.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-neutral-ink truncate">{mock.name}</p>
                                                    <p className="text-xs text-neutral-ink truncate">{mock.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => openAuth('REGISTER', { flowType: 'GENERAL' })}
                                            className="w-full py-3 bg-slate-100 text-slate-600 font-black rounded-xl text-sm hover:bg-brand-softBlue/10 hover:text-brand-softBlue transition-all"
                                        >
                                            Collect Them All
                                        </button>
                                    </div>
                                ) : achievements.length > 0 ? (
                                    achievements.slice(0, 8).map((achievement) => (
                                        <AchievementCard key={achievement.id} achievement={achievement} />
                                    ))
                                ) : (
                                    <p className="text-neutral-ink text-center py-8 font-bold">
                                        Start learning to earn achievements!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-card rounded-2xl p-6  border border-border">
                    <h3 className="text-xl font-black text-foreground mb-4 font-display">
                        Recent Activity
                    </h3>
                    {isGuest ? (
                        <div className="py-12 text-center group cursor-pointer" onClick={() => openAuth('REGISTER', { flowType: 'GENERAL' })}>
                            <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform ">
                                <ClockIcon className="w-8 h-8 text-primary" />
                            </div>
                            <h4 className="text-2xl font-black text-foreground mb-2 font-display">Unlock Your Timeline</h4>
                            <p className="text-neutral-ink max-w-sm mx-auto mb-6 font-bold">
                                Track every quiz, flashcard session, and milestone with a detailed history of your Japanese journey.
                            </p>
                            <button className="px-8 py-3 bg-foreground text-background font-black rounded-2xl hover:opacity-90  transition-all">
                                Create Account
                            </button>
                        </div>
                    ) : recentActivities.length > 0 ? (
                        <div className="space-y-3">
                            {recentActivities.map((activity, index) => (
                                <div
                                    key={activity.id || index}
                                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                                >
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <ChartBarIcon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-foreground capitalize font-display">
                                            {activity.activity_type.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs font-bold text-neutral-ink">
                                            {new Date(activity.timestamp).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    {activity.score !== undefined && (
                                        <span className="px-3 py-1 text-xs font-black text-primary bg-primary/10 rounded-full font-display">
                                            {activity.score}%
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-neutral-ink dark:text-neutral-ink text-center py-8">
                            No recent activity. Start learning to see your progress here!
                        </p>
                    )}
                </div>
            </div >
        </div >
    );
}
