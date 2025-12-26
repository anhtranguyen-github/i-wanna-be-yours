'use client';

import { Activity, Clock, Zap, BookOpen } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';
import { StudySession } from '@/types/studyPlanTypes';

interface ActivityRecordsProps {
    sessions: StudySession[];
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
    onSessionClick?: (session: StudySession) => void;
}

const SKILL_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
    vocabulary: { label: 'Vocabulary', emoji: '📚', color: 'bg-blue-100 text-blue-700' },
    kanji: { label: 'Kanji', emoji: '漢', color: 'bg-purple-100 text-purple-700' },
    grammar: { label: 'Grammar', emoji: '✏️', color: 'bg-emerald-100 text-emerald-700' },
    reading: { label: 'Reading', emoji: '📖', color: 'bg-amber-100 text-amber-700' },
    listening: { label: 'Listening', emoji: '🎧', color: 'bg-pink-100 text-pink-700' },
    mixed: { label: 'Mixed', emoji: '🎯', color: 'bg-neutral-beige text-neutral-ink' },
};

const EFFORT_CONFIG: Record<string, { label: string; icon: typeof Zap }> = {
    light: { label: 'Light', icon: Clock },
    focused: { label: 'Focused', icon: Zap },
    deep: { label: 'Deep', icon: BookOpen },
};

export function ActivityRecords({
    sessions,
    isExpanded,
    onToggle,
    onSessionClick,
}: ActivityRecordsProps) {
    const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const todaySessions = sessions.filter(s =>
        new Date(s.createdAt).toDateString() === new Date().toDateString()
    );

    const summaryContent = (
        <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-neutral-ink">
                {todaySessions.length} today
            </span>
            <span className="text-sm text-neutral-ink/60">
                {totalMinutes} min total
            </span>
        </div>
    );

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    return (
        <CollapsibleCard
            id="activity-records"
            title="Activity Records"
            subtitle="Recent study sessions"
            icon={Activity}
            isExpanded={isExpanded}
            onToggle={onToggle}
            summaryContent={summaryContent}
            badge={sessions.length}
        >
            <div className="mt-4 space-y-3">
                {sessions.length === 0 ? (
                    <div className="text-center py-8">
                        <Activity size={32} className="mx-auto text-neutral-gray/30 mb-2" />
                        <p className="text-neutral-ink/60 font-medium">No sessions recorded yet</p>
                        <p className="text-sm text-neutral-ink/40">Complete tasks to see your activity</p>
                    </div>
                ) : (
                    sessions.slice(0, 10).map((session) => {
                        const skillConfig = SKILL_CONFIG[session.skill] || SKILL_CONFIG.mixed;
                        const effortConfig = EFFORT_CONFIG[session.effortLevel] || EFFORT_CONFIG.focused;
                        const EffortIcon = effortConfig.icon;

                        return (
                            <button
                                key={session.id}
                                onClick={() => onSessionClick?.(session)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-beige/50 transition-colors text-left"
                            >
                                {/* Skill Badge */}
                                <div className={`px-2.5 py-1.5 rounded-lg text-sm font-bold ${skillConfig.color}`}>
                                    {skillConfig.emoji}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-neutral-ink">{skillConfig.label}</span>
                                        <EffortIcon size={12} className="text-neutral-ink/40" />
                                        <span className="text-xs text-neutral-ink/50">{effortConfig.label}</span>
                                    </div>
                                    <p className="text-xs text-neutral-ink/60">
                                        {formatDate(session.createdAt)} at {formatTime(session.createdAt)}
                                    </p>
                                </div>

                                {/* Duration */}
                                <div className="text-right shrink-0">
                                    <span className="font-black text-neutral-ink">{session.durationMinutes}</span>
                                    <span className="text-xs text-neutral-ink/60 ml-1">min</span>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </CollapsibleCard>
    );
}

export default ActivityRecords;
