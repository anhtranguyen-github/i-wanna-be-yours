'use client';

import { Flame, TrendingUp } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';
import { StudySession } from '@/types/studyPlanTypes';

interface StudyStreakProps {
    currentStreak: number;
    longestStreak: number;
    recentSessions: StudySession[];
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
}

export function StudyStreak({
    currentStreak,
    longestStreak,
    recentSessions,
    isExpanded,
    onToggle,
}: StudyStreakProps) {
    // Generate last 7 days activity
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayStr = date.toDateString();
        const sessionsOnDay = recentSessions.filter(s =>
            new Date(s.createdAt).toDateString() === dayStr
        );
        return {
            date,
            dayName: date.toLocaleDateString('en', { weekday: 'short' }),
            hasActivity: sessionsOnDay.length > 0,
            minutes: sessionsOnDay.reduce((acc, s) => acc + s.durationMinutes, 0)
        };
    });

    const summaryContent = (
        <div className="flex items-center gap-2">
            <Flame size={18} className={currentStreak > 0 ? 'text-orange-500' : 'text-neutral-gray'} />
            <span className="text-xl font-black text-neutral-ink">{currentStreak}</span>
            <span className="text-sm text-neutral-ink/60">days</span>
        </div>
    );

    return (
        <CollapsibleCard
            id="study-streak"
            title="Study Streak"
            subtitle={`Best: ${longestStreak} days`}
            icon={Flame}
            isExpanded={isExpanded}
            onToggle={onToggle}
            summaryContent={summaryContent}
            badge={currentStreak > 0 ? `🔥 ${currentStreak}` : undefined}
            badgeVariant={currentStreak >= 7 ? 'success' : 'default'}
        >
            <div className="mt-4">
                {/* Streak Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-orange-50 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Flame size={20} className="text-orange-500" />
                            <span className="text-3xl font-black text-orange-600">{currentStreak}</span>
                        </div>
                        <p className="text-xs font-bold text-orange-600/70">Current Streak</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <TrendingUp size={20} className="text-emerald-500" />
                            <span className="text-3xl font-black text-emerald-600">{longestStreak}</span>
                        </div>
                        <p className="text-xs font-bold text-emerald-600/70">Longest Streak</p>
                    </div>
                </div>

                {/* Last 7 Days */}
                <div>
                    <h4 className="text-xs font-black text-neutral-ink uppercase tracking-widest mb-3">
                        Last 7 Days
                    </h4>
                    <div className="flex justify-between gap-2">
                        {last7Days.map((day, i) => (
                            <div key={i} className="flex-1 text-center">
                                <div
                                    className={`w-full aspect-square rounded-lg mb-1 flex items-center justify-center text-sm font-bold ${day.hasActivity
                                            ? 'bg-primary-strong text-white'
                                            : 'bg-neutral-beige text-neutral-gray'
                                        }`}
                                >
                                    {day.hasActivity ? '✓' : ''}
                                </div>
                                <span className="text-[10px] font-bold text-neutral-ink/60">
                                    {day.dayName}
                                </span>
                                {day.minutes > 0 && (
                                    <p className="text-[9px] text-primary-strong font-bold">{day.minutes}m</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </CollapsibleCard>
    );
}

export default StudyStreak;
