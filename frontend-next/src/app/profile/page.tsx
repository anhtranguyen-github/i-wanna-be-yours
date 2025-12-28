"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    User as UserIcon,
    Zap,
    Layers,
    History as HistoryIcon,
    Trophy,
    Settings,
    Calendar,
    Flame,
    ChevronRight,
    Star,
    BookOpen,
    Pencil,
    Globe,
    ShieldCheck,
    Clock,
    Heart,
    ArrowUpRight
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { AuthErrorScreen } from "@/components/auth/AuthErrorScreen";
import learnerProgressService from "@/services/learnerProgressService";
import {
    ProgressSummaryResponse,
    Achievement
} from "@/types/learnerProgressTypes";
import { PageHeader } from "@/components/shared";
import { NeuralMemoryTab } from "@/components/profile/NeuralMemoryTab";

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ProfileStat({ title, value, icon, color, unit = "" }: any) {
    return (
        <div className="bg-white/80 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
                {icon}
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/30 italic">{title}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-neutral-ink font-display leading-none">{value}</span>
                    {unit && <span className="text-xs font-bold text-neutral-ink/40">{unit}</span>}
                </div>
            </div>
        </div>
    );
}

function AchievementItem({ achievement }: { achievement: Achievement }) {
    return (
        <div className={`
            group flex items-center gap-4 p-5 rounded-[2rem] border transition-all duration-500
            ${achievement.earned
                ? "bg-gradient-to-br from-white to-neutral-beige/20 border-primary/10 shadow-sm"
                : "bg-neutral-beige/10 border-transparent opacity-40 grayscale blur-[0.5px] hover:blur-0 hover:opacity-100 hover:grayscale-0"
            }
        `}>
            <div className={`
                w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110
                ${achievement.earned ? "bg-white shadow-sm" : "bg-neutral-beige/30"}
            `}>
                {achievement.icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-black text-neutral-ink font-display tracking-tight truncate">{achievement.name}</h4>
                    {achievement.earned && <ShieldCheck size={14} className="text-primary-strong shrink-0" />}
                </div>
                <p className="text-xs text-neutral-ink/50 font-bold line-clamp-1">{achievement.description}</p>
            </div>
        </div>
    );
}

function ActivityRecord({ activity }: { activity: any }) {
    const isHighScale = activity.score && activity.score >= 90;

    return (
        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/60 transition-colors group">
            <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
                ${isHighScale ? "bg-primary-strong/10 text-primary-strong" : "bg-neutral-beige/50 text-neutral-ink/30"}
            `}>
                {activity.activity_type.includes('quiz') ? <Zap size={20} /> : <HistoryIcon size={20} />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <p className="font-black text-neutral-ink capitalize font-display text-sm">
                        {activity.activity_type.replace(/_/g, ' ')}
                    </p>
                    {activity.score !== undefined && (
                        <span className={`text-xs font-black ${isHighScale ? "text-primary-strong" : "text-neutral-ink/40"}`}>
                            {activity.score}%
                        </span>
                    )}
                </div>
                <p className="text-[10px] font-bold text-neutral-ink/30 uppercase tracking-widest mt-0.5">
                    {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function ProfilePage() {
    const { user, loading: userLoading } = useUser();
    const router = useRouter();

    const [progressData, setProgressData] = useState<ProgressSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                setError("Failed to load profile insights");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user?.id]);

    const stats = progressData?.progress;
    const achievements = progressData?.achievements || [];
    const recentActivities = progressData?.recent_activities || [];

    if (userLoading || (loading && user)) {
        return (
            <div className="min-h-screen bg-neutral-beige/20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary-strong/20 border-t-primary-strong rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl">🌸</span>
                        </div>
                    </div>
                    <p className="text-neutral-ink font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Mastery...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-neutral-beige/20 flex items-center justify-center px-6">
                <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-xl shadow-neutral-ink/5 space-y-8">
                    <div className="w-20 h-20 bg-neutral-beige/50 rounded-full flex items-center justify-center mx-auto text-4xl">
                        👤
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-neutral-ink font-display">Identity Required</h2>
                        <p className="text-neutral-ink/60 font-bold leading-relaxed">
                            Profiles are reserved for registered users tracking their Japanese ascent.
                            Start your journey to unlock personalized stats and achievements.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-neutral-ink text-white py-4 rounded-2xl font-black hover:bg-primary-strong transition-all shadow-lg shadow-neutral-ink/10"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-beige/20 pb-24">
            <PageHeader
                title="Personal Ascent"
                subtitle="Your Japanese mastery, metrics, and milestones"
                icon={<UserIcon size={24} className="text-white" />}
                iconBgColor="bg-primary-strong"
                rightContent={
                    <button
                        onClick={() => router.push('/settings')}
                        className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-md border border-white rounded-2xl text-neutral-ink font-black text-xs hover:border-primary-strong transition-all"
                    >
                        <Settings size={16} />
                        Settings
                    </button>
                }
            />

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <NeuralMemoryTab />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* LEFT COLUMN: Identity & Stats */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Identity Card */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary-strong/5 -xl rounded-[3rem] -z-10 group-hover:bg-primary-strong/10 transition-colors" />
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-10">
                                <div className="relative shrink-0">
                                    <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-5xl shadow-xl shadow-primary-strong/5 border-4 border-white">
                                        🌸
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-strong text-white rounded-full flex items-center justify-center font-black text-xs border-4 border-white shadow-lg">
                                        {stats?.current_streak || 0}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4 text-center md:text-left">
                                    <div>
                                        <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                            <h1 className="text-4xl font-black text-neutral-ink font-display tracking-tight">Active Scholar</h1>
                                            <span className="px-3 py-1 bg-primary-strong/10 text-primary-strong text-[10px] font-black uppercase tracking-widest rounded-full leading-none">Hanabira Pro</span>
                                        </div>
                                        <p className="text-neutral-ink/40 font-bold mt-1">{user.email}</p>
                                    </div>
                                    <p className="text-neutral-ink/60 font-medium leading-relaxed max-w-lg">
                                        &quot;Climbing the peaks of N3 vocabulary. Currently focusing on JLPT grammar patterns and daily flashcard discipline.&quot;
                                    </p>
                                    <div className="flex items-center justify-center md:justify-start gap-4">
                                        <div className="flex items-center gap-2">
                                            <Flame size={16} className="text-orange-500" />
                                            <span className="text-xs font-black text-neutral-ink">{stats?.current_streak || 0}-Day Streak</span>
                                        </div>
                                        <div className="w-1.5 h-1.5 bg-neutral-beige/50 rounded-full" />
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-blue-500" />
                                            <span className="text-xs font-black text-neutral-ink">Joined Dec 2025</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mastery Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <ProfileStat
                                title="Vocabulary"
                                value={stats?.vocabulary_mastered || 0}
                                icon={<BookOpen size={24} />}
                                color="bg-primary-strong/10 text-primary-strong"
                            />
                            <ProfileStat
                                title="Kanji"
                                value={stats?.kanji_mastered || 0}
                                icon={<Pencil size={24} />}
                                color="bg-orange-500/10 text-orange-600"
                            />
                            <ProfileStat
                                title="Grammar"
                                value={stats?.grammar_points_learned || 0}
                                icon={<Globe size={24} />}
                                color="bg-blue-500/10 text-blue-600"
                            />
                            <ProfileStat
                                title="Study Time"
                                value={learnerProgressService.formatStudyTime(stats?.total_study_time_minutes || 0)}
                                icon={<Clock size={24} />}
                                color="bg-neutral-ink/5 text-neutral-ink"
                            />
                        </div>

                        {/* Achievements Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-black text-neutral-ink font-display flex items-center gap-3">
                                    <Trophy size={22} className="text-yellow-500" />
                                    Hall of Mastery
                                </h3>
                                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/30 italic">
                                    {progressData?.achievements_count || 0} / {progressData?.total_achievements_available || 12} Earned
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {achievements.length > 0 ? achievements.map((achievement) => (
                                    <AchievementItem key={achievement.id} achievement={achievement} />
                                )) : (
                                    <div className="col-span-full py-12 text-center bg-white/40 rounded-[2.5rem] border border-dashed border-neutral-gray/30">
                                        <p className="text-neutral-ink/40 font-black uppercase tracking-widest text-xs">No achievements unlocked yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Activities & Insights */}
                    <div className="space-y-12">

                        {/* Weekly Goal Progress */}
                        <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-sm space-y-8">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-neutral-ink font-display">Weekly Rhythm</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/30 italic">Target completion</p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { label: 'Flashcards', current: stats?.weekly_goals?.flashcard_reviews?.current || 0, target: stats?.weekly_goals?.flashcard_reviews?.target || 100, color: 'bg-primary-strong' },
                                    { label: 'Quizzes', current: stats?.weekly_goals?.quizzes_completed?.current || 0, target: stats?.weekly_goals?.quizzes_completed?.target || 5, color: 'bg-orange-500' },
                                    { label: 'Study Time', current: stats?.weekly_goals?.study_minutes?.current || 0, target: stats?.weekly_goals?.study_minutes?.target || 150, color: 'bg-blue-500' },
                                ].map((goal, i) => {
                                    const progress = Math.min(100, (goal.current / goal.target) * 100);
                                    return (
                                        <div key={i} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/60">{goal.label}</span>
                                                <span className="text-xs font-black text-neutral-ink">{goal.current}/{goal.target}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-neutral-beige/50 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${goal.color} rounded-full transition-all duration-1000 ease-out`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Activity Records */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-lg font-black text-neutral-ink font-display flex items-center gap-3">
                                    <Clock size={20} className="text-neutral-ink/30" />
                                    Vault Records
                                </h3>
                                <button className="text-[10px] font-black uppercase tracking-widest text-primary-strong hover:underline decoration-2 underline-offset-4 decoration-primary-strong/30">View All</button>
                            </div>
                            <div className="bg-white/40 backdrop-blur-sm rounded-[2.5rem] p-4 border border-white/40 divide-y divide-white/20">
                                {recentActivities.length > 0 ? recentActivities.map((activity, i) => (
                                    <ActivityRecord key={i} activity={activity} />
                                )) : (
                                    <div className="py-12 text-center italic text-neutral-ink/30 text-xs font-bold">
                                        No recent activity logged.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Social / Link Card */}
                        <div className="bg-gradient-to-br from-neutral-ink to-neutral-ink/80 rounded-[2.5rem] p-8 text-white space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                <ArrowUpRight size={120} strokeWidth={4} />
                            </div>
                            <div className="space-y-2 relative z-10">
                                <h3 className="text-xl font-black font-display tracking-tight">Study Plan Sync</h3>
                                <p className="text-sm text-white/60 font-medium leading-relaxed">
                                    Your profile is automatically synced with your active Study Plan.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/study-plan')}
                                className="w-full bg-white text-neutral-ink py-4 rounded-2xl font-black text-xs hover:bg-primary-strong hover:text-white transition-all relative z-10"
                            >
                                Open Active Plan
                            </button>
                        </div>

                    </div>

                </div>
            </main>
        </div>
    );
}
