import { UnifiedSessionResult, SessionStat, Achievement } from "@/types/results";
import { Clock, Target, Zap, Star, Trophy, Target as AccuracyIcon, Brain, Flame } from "lucide-react";

export function processPracticeResult(node: any, sessionData: any, questions: any[]): UnifiedSessionResult {
    const totalQuestions = questions.length;
    const answers = sessionData?.answers || {};

    let correctAnswers = 0;
    questions.forEach(q => {
        if (answers[q.id]?.selectedOptionId === q.correctOptionId) {
            correctAnswers++;
        }
    });

    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    const timeSpent = sessionData?.timeSpentSeconds || 0;
    const xpHero = Math.round((correctAnswers * 10) + (accuracy * 2));

    const stats: SessionStat[] = [
        {
            label: 'Accuracy',
            value: `${accuracy}%`,
            icon: AccuracyIcon,
            color: accuracy >= 80 ? 'emerald-500' : 'primary'
        },
        {
            label: 'Time Spent',
            value: formatSeconds(timeSpent),
            icon: Clock,
            color: 'blue-500'
        },
        {
            label: 'Transmissions',
            value: `${correctAnswers}/${totalQuestions}`,
            icon: Target,
            color: 'purple-500'
        },
        {
            label: 'XP Gained',
            value: `+${xpHero}`,
            icon: Zap,
            color: 'amber-500'
        }
    ];

    const achievements: Achievement[] = [];
    if (accuracy === 100) {
        achievements.push({
            id: 'perfect_sync',
            title: 'Perfect Sync',
            description: 'Achieved 100% accuracy in the protocol.',
            icon: Star,
            rarity: 'LEGENDARY'
        });
    } else if (accuracy >= 80) {
        achievements.push({
            id: 'expert_analyst',
            title: 'Expert Analyst',
            description: 'Demonstrated superior cognitive processing.',
            icon: Brain,
            rarity: 'RARE'
        });
    }

    if (timeSpent < 60 && totalQuestions >= 5) {
        achievements.push({
            id: 'speed_demon',
            title: 'Speed Demon',
            description: 'Completed the protocol in record time.',
            icon: Zap,
            rarity: 'RARE'
        });
    }

    const feedback = getFeedback(accuracy, node.title);

    return {
        sessionId: sessionData?.timestamp || Date.now().toString(),
        type: 'PRACTICE',
        score: accuracy,
        accuracy,
        timeSeconds: timeSpent,
        stats,
        achievements,
        feedback,
        xpEarned: xpHero
    };
}

export function processQuootResult(deck: any, gameState: any, cards: any[]): UnifiedSessionResult {
    const totalCards = cards.length;
    const accuracy = Math.round((gameState.correctCount / totalCards) * 100);
    const xpHero = Math.round((gameState.score / 10) + (accuracy * 2));

    const stats: SessionStat[] = [
        {
            label: 'Final Score',
            value: gameState.score.toLocaleString(),
            icon: Trophy,
            color: 'primary'
        },
        {
            label: 'Accuracy',
            value: `${accuracy}%`,
            icon: AccuracyIcon,
            color: accuracy >= 80 ? 'emerald-500' : 'amber-500'
        },
        {
            label: 'Max Streak',
            value: `${gameState.maxStreak} 🔥`,
            icon: Flame,
            color: 'rose-500'
        },
        {
            label: 'XP Gained',
            value: `+${xpHero}`,
            icon: Zap,
            color: 'secondary'
        }
    ];

    const achievements: Achievement[] = [];
    if (accuracy === 100) {
        achievements.push({
            id: 'zen_grandmaster',
            title: 'Zen Grandmaster',
            description: 'Achieved total synchronization with the deck.',
            icon: Trophy,
            rarity: 'LEGENDARY'
        });
    }

    if (gameState.maxStreak >= 10) {
        achievements.push({
            id: 'unstoppable_force',
            title: 'Unstoppable Force',
            description: 'Maintained a massive streak under pressure.',
            icon: Flame,
            rarity: 'RARE'
        });
    }

    const feedback = getQuootFeedback(accuracy, deck.title);

    return {
        sessionId: Date.now().toString(),
        type: 'QUOOT',
        score: accuracy,
        accuracy,
        timeSeconds: 0,
        stats,
        achievements,
        feedback,
        xpEarned: xpHero
    };
}

function formatSeconds(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getFeedback(accuracy: number, title: string) {
    if (accuracy >= 90) {
        return {
            title: "Exceptional Cognitive Link",
            message: `Your performance in ${title} was exemplary. You have demonstrated near-perfect mastery of these linguistic patterns.`,
            suggestions: [
                "Attempt a higher difficulty tier (N1/N2).",
                "Try Speed Mode to challenge your recall velocity.",
                "Incorporate these terms into your AI Tutor conversations."
            ]
        };
    } else if (accuracy >= 70) {
        return {
            title: "Solid Foundation Established",
            message: `You have successfully processed the majority of the ${title} protocol. Consistent repetition will bridge the final gap to mastery.`,
            suggestions: [
                "Review the specific nodes where synchronization failed.",
                "Focus on listening comprehension for these modules.",
                "Add missed items to your Personal Notebook."
            ]
        };
    } else {
        return {
            title: "Recalibration Required",
            message: `The ${title} sequence was challenging. Your neural pathways are still forming for these specific patterns.`,
            suggestions: [
                "Revisit the foundational vocabulary for this node.",
                "Use the AI Tutor to explain the grammatical nuances.",
                "Try a slower-paced study session before re-testing."
            ]
        };
    }
}

function getQuootFeedback(accuracy: number, title: string) {
    if (accuracy === 100) {
        return {
            title: "Apex Performer",
            message: `Flawless execution of the ${title} sequence. You have mastered every node in this deck.`,
            suggestions: [
                "Try Speed Mode for a higher cognitive load.",
                "Challenge yourself with a legendary tier deck.",
                "Share your perfect score and challenge your peers."
            ]
        };
    } else if (accuracy >= 70) {
        return {
            title: "Combat Efficiency: High",
            message: `Impressive agility in ${title}. A few more cycles and you'll achieve total mastery.`,
            suggestions: [
                "Focus on the nodes where your response time lagged.",
                "Review the definitions in the Dictionary Hub.",
                "Maintain your daily logic streak."
            ]
        };
    } else {
        return {
            title: "Feedback Loop Incomplete",
            message: `The ${title} challenge proved difficult. Consistency is the key to neural reinforcement.`,
            suggestions: [
                "Re-execute in Classic Mode with more safety lives.",
                "Study the deck cards individually before playing again.",
                "Consult the AI Tutor for the most difficult terms."
            ]
        };
    }
}
