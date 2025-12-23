/**
 * Dashboard Components
 * 
 * Reusable components for displaying learning progress and statistics.
 */

"use client";

import {
    FireIcon,
    TrophyIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { Achievement, LearnerProgress, WeeklyStats } from "@/types/learnerProgressTypes";

// ============================================
// Progress Ring Component
// ============================================

interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    showPercentage?: boolean;
    children?: React.ReactNode;
}

export function ProgressRing({
    progress,
    size = 120,
    strokeWidth = 8,
    color = "hsl(var(--primary))",
    label,
    showPercentage = true,
    children,
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
                {children || (
                    <>
                        {showPercentage && (
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {Math.round(progress)}%
                            </span>
                        )}
                        {label && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                        )}
                    </>
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
    onClick?: () => void;
}

export function StatCard({ title, value, icon, trend, color = "#4CAF50", description, onClick }: StatCardProps) {
    const Wrapper = onClick ? 'button' : 'div';

    return (
        <Wrapper
            onClick={onClick}
            className={`relative overflow-hidden bg-card rounded-2xl p-6  hover: transition-all duration-300 border border-border group text-left w-full ${onClick ? 'cursor-pointer' : ''}`}
        >
            {/* Background decoration */}
            <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full transform translate-x-8 -translate-y-8 opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: color }}
            />

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-tight font-display">
                        {title}
                    </p>
                    <p className="text-3xl font-display font-black text-foreground">{value}</p>
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
        </Wrapper>
    );
}

// ============================================
// Streak Badge Component
// ============================================

interface StreakBadgeProps {
    streak: number;
    size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    return (
        <div
            className={`inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-full font-bold  ${sizeClasses[size]}`}
        >
            <FireIcon className={`${iconSizes[size]} text-accent`} />
            <span>{streak}</span>
        </div>
    );
}

// ============================================
// Mini Streak Display
// ============================================

interface MiniStreakProps {
    current: number;
    message?: string;
}

export function MiniStreak({ current, message }: MiniStreakProps) {
    const defaultMessage = current === 0
        ? "Start studying!"
        : current === 1
            ? "Great start!"
            : `${current} day streak!`;

    return (
        <div className="flex items-center gap-2">
            <StreakBadge streak={current} size="sm" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
                {message || defaultMessage}
            </span>
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

export function StreakDisplay({ current, longest }: StreakDisplayProps) {
    return (
        <div className="bg-card rounded-2xl p-8  border border-border overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-foreground font-display">
                    Learning Streak
                </h3>
                <FireIcon className="w-10 h-10 text-accent animate-bounce-slow" />
            </div>

            <div className="flex items-end gap-3 mb-8">
                <span className="text-7xl font-black text-foreground font-display leading-none">
                    {current}
                </span>
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest font-display pb-2">
                    Days Running
                </span>
            </div>

            <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-2xl border border-border/50 ">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white ">
                    <TrophyIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-display">
                        Longest Streak
                    </p>
                    <p className="text-lg font-black text-foreground font-display">
                        {longest} Days
                    </p>
                </div>
            </div>

            <p className="mt-8 text-sm font-bold text-muted-foreground leading-relaxed">
                Study every day to keep your streak alive and build your mastery!
            </p>
        </div>
    );
}

// ============================================
// Achievement Badge Component
// ============================================

interface AchievementBadgeProps {
    achievement: Achievement;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export function AchievementBadge({ achievement, size = 'md', showLabel = false }: AchievementBadgeProps) {
    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-4xl',
    };

    return (
        <div
            className={`inline-flex flex-col items-center gap-1 ${!achievement.earned ? 'opacity-40 grayscale' : ''
                }`}
            title={achievement.earned ? `${achievement.name}: ${achievement.description}` : 'Not earned yet'}
        >
            <span className={sizeClasses[size]}>{achievement.icon}</span>
            {showLabel && (
                <span className="text-xs text-gray-600 dark:text-gray-400 text-center max-w-[60px] truncate">
                    {achievement.name}
                </span>
            )}
        </div>
    );
}

// ============================================
// Weekly Progress Bar Component
// ============================================

interface WeeklyProgressBarProps {
    current: number;
    target: number;
    label: string;
    color?: string;
    showLabel?: boolean;
}

export function WeeklyProgressBar({
    current,
    target,
    label,
    color = "hsl(var(--primary))",
    showLabel = true
}: WeeklyProgressBarProps) {
    const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

    return (
        <div className="space-y-1">
            {showLabel && (
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{label}</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                        {current}/{target}
                    </span>
                </div>
            )}
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
// Progress Summary Mini Card
// ============================================

interface ProgressSummaryMiniProps {
    progress: LearnerProgress | null;
    variant?: 'compact' | 'inline';
}

export function ProgressSummaryMini({ progress, variant = 'compact' }: ProgressSummaryMiniProps) {
    if (!progress) return null;

    if (variant === 'inline') {
        return (
            <div className="flex items-center gap-4 text-sm">
                <MiniStreak current={progress.current_streak} />
                <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{progress.vocabulary_mastered}</span>
                    <span className="text-gray-500">words</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{progress.kanji_mastered}</span>
                    <span className="text-gray-500">kanji</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl p-4 border border-border ">
            <div className="flex items-center justify-between mb-3">
                <MiniStreak current={progress.current_streak} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {progress.vocabulary_mastered}
                    </p>
                    <p className="text-xs text-gray-500">Vocab</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {progress.kanji_mastered}
                    </p>
                    <p className="text-xs text-gray-500">Kanji</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {progress.grammar_points_learned}
                    </p>
                    <p className="text-xs text-gray-500">Grammar</p>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Achievement Grid Component
// ============================================

interface AchievementGridProps {
    achievements: Achievement[];
    maxDisplay?: number;
    showAll?: boolean;
    onViewAll?: () => void;
}

export function AchievementGrid({
    achievements,
    maxDisplay = 8,
    showAll = false,
    onViewAll
}: AchievementGridProps) {
    const displayAchievements = showAll ? achievements : achievements.slice(0, maxDisplay);
    const earnedFirst = [...displayAchievements].sort((a, b) =>
        (b.earned ? 1 : 0) - (a.earned ? 1 : 0)
    );

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {earnedFirst.map((achievement) => (
                    <AchievementBadge key={achievement.id} achievement={achievement} size="md" />
                ))}
            </div>
            {!showAll && achievements.length > maxDisplay && onViewAll && (
                <button
                    onClick={onViewAll}
                    className="text-sm font-bold text-primary hover:opacity-80 transition-all font-display"
                >
                    View all {achievements.length} achievements →
                </button>
            )}
        </div>
    );
}
