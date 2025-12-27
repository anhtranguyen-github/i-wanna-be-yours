import { LucideIcon } from "lucide-react";

export interface SessionStat {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    color?: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
}

export interface UnifiedSessionResult {
    sessionId: string;
    type: 'PRACTICE' | 'QUOOT' | 'JLPT' | 'DAILY_CHALLENGE' | 'FLASHCARD';
    score: number; // 0-100
    accuracy: number; // 0-100
    timeSeconds: number;
    stats: SessionStat[];
    achievements: Achievement[];
    feedback: {
        title: string;
        message: string;
        suggestions: string[];
    };
    xpEarned: number;
    streakCount?: number;
}
