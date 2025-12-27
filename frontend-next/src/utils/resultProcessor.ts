import { UnifiedSessionResult } from "@/types/results";
import * as LucideIcons from "lucide-react";

/**
 * Maps icon names from backend strings to Lucide components
 */
export function mapResultIcons(result: UnifiedSessionResult): UnifiedSessionResult {
    if (!result) return result;

    const stats = (result.stats || []).map(stat => ({
        ...stat,
        icon: (LucideIcons as any)[stat.icon as unknown as string] || LucideIcons.HelpCircle
    }));

    const achievements = (result.achievements || []).map(achievement => ({
        ...achievement,
        icon: (LucideIcons as any)[achievement.icon as unknown as string] || LucideIcons.Trophy
    }));

    return {
        ...result,
        stats,
        achievements
    } as UnifiedSessionResult;
}

// Keep these for backward compatibility during transition if needed,
// but they should eventually be phased out in favor of backend calculation.
export function processPracticeResult(node: any, sessionData: any, questions: any[]): UnifiedSessionResult {
    // This is now just a placeholder or should be used for guest sessions if we really don't want to hit the backend
    // But the user said "Front end only show what backend send", so guest sessions should also hit a calculation endpoint.
    return {} as any;
}

export function processQuootResult(deck: any, gameState: any, cards: any[]): UnifiedSessionResult {
    return {} as any;
}
