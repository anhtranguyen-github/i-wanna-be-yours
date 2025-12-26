'use client';

import { Sparkles, Mountain } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';

interface VisionReminderProps {
    objective: {
        title: string;
        targetExam: string;
        targetDate: string;
    } | null;
    userName?: string;
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
}

export function VisionReminder({
    objective,
    userName,
    isExpanded,
    onToggle,
}: VisionReminderProps) {
    if (!objective) return null;

    const daysUntilExam = Math.ceil(
        (new Date(objective.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const motivationalQuotes = [
        "一歩一歩、山を登る。(Ippo ippo, yama wo noboru.) - Step by step, one climbs the mountain.",
        "継続は力なり。(Keizoku wa chikara nari.) - Persistence is power.",
        "千里の道も一歩から。(Senri no michi mo ippo kara.) - A journey of a thousand miles begins with a single step.",
        "七転び八起き。(Nana korobi ya oki.) - Fall seven times, stand up eight.",
    ];

    const quote = motivationalQuotes[Math.floor(Date.now() / 86400000) % motivationalQuotes.length];

    const summaryContent = (
        <span className="text-sm text-neutral-ink/60">
            {daysUntilExam}d to {objective.targetExam}
        </span>
    );

    return (
        <CollapsibleCard
            id="vision-reminder"
            title="Your Vision"
            subtitle="Remember why you started"
            icon={Sparkles}
            isExpanded={isExpanded}
            onToggle={onToggle}
            summaryContent={summaryContent}
        >
            <div className="mt-4 space-y-6">
                {/* Goal Statement */}
                <div className="p-6 bg-gradient-to-br from-primary-strong/5 to-primary-sky/10 rounded-2xl border border-primary-strong/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary-strong/10 rounded-xl">
                            <Mountain size={24} className="text-primary-strong" />
                        </div>
                        <div>
                            <h4 className="font-black text-neutral-ink">{objective.title}</h4>
                            <p className="text-sm text-neutral-ink/60">
                                {userName ? `${userName}'s goal` : 'Your goal'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-neutral-white rounded-xl text-center">
                            <span className="text-3xl font-black text-primary-strong">{objective.targetExam}</span>
                            <p className="text-xs font-bold text-neutral-ink/60 mt-1">Target Level</p>
                        </div>
                        <div className="p-4 bg-neutral-white rounded-xl text-center">
                            <span className="text-3xl font-black text-neutral-ink">{daysUntilExam}</span>
                            <p className="text-xs font-bold text-neutral-ink/60 mt-1">Days Remaining</p>
                        </div>
                    </div>
                </div>

                {/* Daily Quote */}
                <div className="p-4 bg-neutral-beige/50 rounded-xl">
                    <div className="flex items-start gap-3">
                        <Sparkles size={18} className="text-amber-500 shrink-0 mt-1" />
                        <div>
                            <p className="text-sm font-medium text-neutral-ink italic leading-relaxed">
                                "{quote}"
                            </p>
                            <p className="text-xs text-neutral-ink/50 mt-2">Today's inspiration</p>
                        </div>
                    </div>
                </div>

                {/* Exam Date */}
                <div className="text-center p-4 border border-neutral-gray/10 rounded-xl">
                    <p className="text-sm text-neutral-ink/60">Exam Date</p>
                    <p className="text-lg font-black text-neutral-ink">
                        {new Date(objective.targetDate).toLocaleDateString('en', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </div>
        </CollapsibleCard>
    );
}

export default VisionReminder;
