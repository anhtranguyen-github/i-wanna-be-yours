"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
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

// ============================================
// Progress Ring Component
// ============================================

interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    sublabel?: string;
}

function ProgressRing({
    progress,
    size = 120,
    strokeWidth = 8,
    color = "#4CAF50",
    label,
    sublabel,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(progress)}%
                </span>
                {label && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                )}
            </div>
        </div>
    );
}

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number;
    color?: string;
    description?: string;
}

function StatCard({ title, value, icon, trend, color = "#4CAF50", description }: StatCardProps) {
    return (
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group">
            {/* Background decoration */}
            <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full transform translate-x-8 -translate-y-8 opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: color }}
            />

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    {description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{description}</p>
                    )}
                    {trend !== undefined && (
                        <div className="flex items-center mt-2">
                            <ArrowTrendingUpIcon
                                className={`w-4 h-4 ${trend >= 0 ? "text-green-500" : "text-red-500 rotate-180"}`}
                            />
                            <span
                                className={`text-sm font-medium ml-1 ${trend >= 0 ? "text-green-500" : "text-red-500"
                                    }`}
                            >
                                {trend >= 0 ? "+" : ""}{trend}%
                            </span>
                        </div>
                    )}
                </div>
                <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${color}20` }}
                >
                    <div className="w-6 h-6" style={{ color }}>
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Streak Display Component
// ============================================

interface StreakDisplayProps {
    current: number;
    longest: number;
}

function StreakDisplay({ current, longest }: StreakDisplayProps) {
    const flames = Math.min(current, 7);

    return (
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Study Streak</h3>
                <FireIcon className="w-8 h-8 text-yellow-300 animate-pulse" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold">{current}</span>
                <span className="text-xl opacity-80">days</span>
            </div>

            <div className="flex gap-1 mb-4">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${i < flames ? "bg-yellow-400" : "bg-white/30"
                            }`}
                    />
                ))}
            </div>

            <p className="text-sm opacity-80">
                🏆 Longest streak: {longest} days
            </p>
        </div>
    );
}

// ============================================
// Achievement Card Component
// ============================================

interface AchievementCardProps {
    achievement: Achievement;
}

function AchievementCard({ achievement }: AchievementCardProps) {
    return (
        <div
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${achievement.earned
                ? "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800"
                : "bg-gray-50 dark:bg-gray-800/50 opacity-50 grayscale"
                }`}
        >
            <span className="text-3xl">{achievement.icon}</span>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {achievement.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {achievement.description}
                </p>
            </div>
            {achievement.earned && (
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            )}
        </div>
    );
}

// ============================================
// Weekly Goal Card Component
// ============================================

interface WeeklyGoalCardProps {
    label: string;
    current: number;
    target: number;
    icon: React.ReactNode;
    color: string;
    unit?: string;
}

function WeeklyGoalCard({ label, current, target, icon, color, unit = "" }: WeeklyGoalCardProps) {
    const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                    <div className="w-5 h-5" style={{ color }}>{icon}</div>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {current}{unit}
                </span>
                <span className="text-sm text-gray-400">/ {target}{unit}</span>
            </div>

            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

// ============================================
// Quick Action Button Component
// ============================================

interface QuickActionProps {
    label: string;
    icon: React.ReactNode;
    href: string;
    color: string;
}

function QuickAction({ label, icon, href, color }: QuickActionProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push(href)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group"
        >
            <div
                className="p-3 rounded-xl group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${color}15` }}
            >
                <div className="w-6 h-6" style={{ color }}>{icon}</div>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
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

    // Demo data for guests
    const demoProgress = {
        vocabulary_mastered: 127,
        kanji_mastered: 34,
        grammar_points_learned: 18,
        total_study_time_minutes: 480,
        current_streak: 5,
        longest_streak: 12,
        weekly_goals: {
            flashcard_reviews: { current: 45, target: 100 },
            quizzes_completed: { current: 2, target: 5 },
            study_minutes: { current: 65, target: 150 },
        }
    };

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
                    <p className="text-gray-600 dark:text-gray-400">Loading your progress...</p>
                </div>
            </div>
        );
    }

    if (error && !isGuest) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Use demo data for guests, real data for logged-in users
    const progress = isGuest ? demoProgress : progressData?.progress;
    const weeklyStats = isGuest ? { flashcard_reviews: 45, quizzes_completed: 2, avg_quiz_score: 78, days_active: 5 } : progressData?.weekly_stats;
    const achievements = isGuest ? [
        { id: '1', name: 'First Steps', description: 'Complete your first lesson', icon: '🎯', earned: true },
        { id: '2', name: 'Week Warrior', description: '7-day study streak', icon: '🔥', earned: true },
        { id: '3', name: 'Vocab Builder', description: 'Learn 100 words', icon: '📚', earned: true },
        { id: '4', name: 'Kanji Master', description: 'Learn 100 kanji', icon: '✍️', earned: false },
    ] : progressData?.achievements || [];
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Guest Banner */}
                {
                    isGuest && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-brand-green to-brand-blue rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <p className="font-bold text-lg">👋 You're viewing demo data</p>
                                <p className="text-white/80 text-sm">Create a free account to track your real progress and unlock all features.</p>
                            </div>
                            <button
                                onClick={() => openAuth('REGISTER')}
                                className="px-6 py-2 bg-white text-brand-green font-bold rounded-xl hover:bg-white/90 transition-all whitespace-nowrap"
                            >
                                Sign Up Free
                            </button>
                        </div>
                    )
                }

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Learning Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Track your Japanese learning progress and achievements
                    </p>
                </div>

                {/* Top Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Vocabulary Mastered"
                        value={progress?.vocabulary_mastered || 0}
                        icon={<BookOpenIcon className="w-full h-full" />}
                        color={CATEGORY_COLORS.vocabulary}
                        description="words learned"
                    />
                    <StatCard
                        title="Kanji Learned"
                        value={progress?.kanji_mastered || 0}
                        icon={<PencilSquareIcon className="w-full h-full" />}
                        color={CATEGORY_COLORS.kanji}
                        description="characters"
                    />
                    <StatCard
                        title="Grammar Points"
                        value={progress?.grammar_points_learned || 0}
                        icon={<AcademicCapIcon className="w-full h-full" />}
                        color={CATEGORY_COLORS.grammar}
                        description="patterns studied"
                    />
                    <StatCard
                        title="Study Time"
                        value={learnerProgressService.formatStudyTime(progress?.total_study_time_minutes || 0)}
                        icon={<ClockIcon className="w-full h-full" />}
                        color="#9C27B0"
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
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Weekly Progress
                                </h3>
                                <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="flex justify-center mb-6">
                                <ProgressRing
                                    progress={weeklyProgress}
                                    size={140}
                                    strokeWidth={12}
                                    color="#4CAF50"
                                    label="complete"
                                />
                            </div>

                            <div className="space-y-4">
                                <WeeklyGoalCard
                                    label="Flashcard Reviews"
                                    current={progress?.weekly_goals?.flashcard_reviews?.current || 0}
                                    target={progress?.weekly_goals?.flashcard_reviews?.target || 100}
                                    icon={<SparklesIcon className="w-full h-full" />}
                                    color="#4CAF50"
                                />
                                <WeeklyGoalCard
                                    label="Quizzes Completed"
                                    current={progress?.weekly_goals?.quizzes_completed?.current || 0}
                                    target={progress?.weekly_goals?.quizzes_completed?.target || 5}
                                    icon={<ChartBarIcon className="w-full h-full" />}
                                    color="#2196F3"
                                />
                                <WeeklyGoalCard
                                    label="Study Minutes"
                                    current={progress?.weekly_goals?.study_minutes?.current || 0}
                                    target={progress?.weekly_goals?.study_minutes?.target || 150}
                                    icon={<ClockIcon className="w-full h-full" />}
                                    color="#9C27B0"
                                    unit="m"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Middle Column - Quick Actions & Recent Activity */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <QuickAction
                                    label="Flashcards"
                                    icon={<SparklesIcon className="w-full h-full" />}
                                    href="/flashcards"
                                    color="#4CAF50"
                                />
                                <QuickAction
                                    label="Quiz"
                                    icon={<ChartBarIcon className="w-full h-full" />}
                                    href="/quiz"
                                    color="#2196F3"
                                />
                                <QuickAction
                                    label="Study Plan"
                                    icon={<CalendarDaysIcon className="w-full h-full" />}
                                    href="/study-plan"
                                    color="#FF9800"
                                />
                                <QuickAction
                                    label="AI Tutor"
                                    icon={<ChatBubbleLeftRightIcon className="w-full h-full" />}
                                    href="/chat"
                                    color="#9C27B0"
                                />
                            </div>
                        </div>

                        {/* This Week Stats */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                This Week
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">Cards Reviewed</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {weeklyStats?.flashcard_reviews || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">Quizzes Taken</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {weeklyStats?.quizzes_completed || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">Avg. Quiz Score</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {weeklyStats?.avg_quiz_score || 0}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-600 dark:text-gray-400">Days Active</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {weeklyStats?.days_active || 0} / 7
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Achievements */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Achievements
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                    <TrophyIcon className="w-4 h-4 text-yellow-500" />
                                    <span>{progressData?.achievements_count || 0}/{progressData?.total_achievements_available || 0}</span>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                {achievements.length > 0 ? (
                                    achievements.slice(0, 8).map((achievement) => (
                                        <AchievementCard key={achievement.id} achievement={achievement} />
                                    ))
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                        Start learning to earn achievements!
                                    </p>
                                )}
                            </div>

                            {achievements.length > 8 && (
                                <button className="w-full mt-4 py-2 text-sm text-blue-500 hover:text-blue-600 transition">
                                    View all achievements →
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Activity
                    </h3>
                    {recentActivities.length > 0 ? (
                        <div className="space-y-3">
                            {recentActivities.map((activity, index) => (
                                <div
                                    key={activity.id || index}
                                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                                >
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                        <ChartBarIcon className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                                            {activity.activity_type.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(activity.timestamp).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    {activity.score !== undefined && (
                                        <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30 rounded-full">
                                            {activity.score}%
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                            No recent activity. Start learning to see your progress here!
                        </p>
                    )}
                </div>
            </div >
        </div >
    );
}
