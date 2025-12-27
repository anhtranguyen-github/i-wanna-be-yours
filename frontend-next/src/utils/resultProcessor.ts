import { UnifiedSessionResult, SessionStat, Achievement } from "@/types/results";
import * as LucideIcons from "lucide-react";

/**
 * Maps icon names from backend strings to Lucide components
 * v3: extremely robust for nested results and missing fields
 */
export function mapResultIcons(input: any): UnifiedSessionResult {
    // 1. Safety check for null/undefined input
    if (!input) {
        console.warn("mapResultIcons: input is null or undefined");
        return {
            score: 0,
            accuracy: 0,
            xpEarned: 0,
            stats: [],
            achievements: [],
            feedback: {
                title: "Loading Data...",
                message: "Analyzing session protocol...",
                suggestions: []
            }
        } as any;
    }

    // 2. Extract the actual payload (backend sometimes wraps in { result: ... } or { data: ... })
    const data = input.result || input.data || input;

    // 3. Map stats with safety
    const stats: SessionStat[] = Array.isArray(data.stats)
        ? data.stats.map((stat: any) => ({
            ...stat,
            icon: (LucideIcons as any)[stat.icon] || LucideIcons.HelpCircle
        }))
        : [];

    // 4. Map achievements with safety
    const achievements: Achievement[] = Array.isArray(data.achievements)
        ? data.achievements.map((achievement: any) => ({
            ...achievement,
            icon: (LucideIcons as any)[achievement.icon] || LucideIcons.Trophy
        }))
        : [];

    // 5. Ensure feedback exists
    const feedback = data.feedback || {
        title: "Protocol Complete",
        message: "Analysis pending secure synchronization.",
        suggestions: ["Register to unlock deep insights"]
    };

    // 6. Return unified structure
    return {
        ...data,
        stats,
        achievements,
        feedback,
        score: data.score ?? 0,
        accuracy: data.accuracy ?? 0,
        xpEarned: data.xpEarned ?? 0
    } as UnifiedSessionResult;
}

// Stubs for legacy code
export function processPracticeResult(node: any, sessionData: any, questions: any[]): UnifiedSessionResult {
    return {} as any;
}
export function processQuootResult(deck: any, gameState: any, cards: any[]): UnifiedSessionResult {
    return {} as any;
}
