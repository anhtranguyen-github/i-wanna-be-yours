/**
 * Result Calculator Utility
 * Moves scoring, XP, and feedback logic to the backend
 * to ensure the frontend only displays what the backend sends.
 */

function formatSeconds(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getPracticeFeedback(accuracy, title) {
    if (accuracy >= 90) {
        return {
            title: "Exceptional Cognitive Link",
            message: `Your performance in ${title} was exemplary. You have demonstrated near-perfect mastery of these linguistic patterns.`,
            suggestions: [
                "Attempt a higher difficulty tier.",
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
            message: `The ${title} sequence was challenging. Your neural pathways are still forming for characters in ${title}.`,
            suggestions: [
                "Revisit the foundational vocabulary for this node.",
                "Use the AI Tutor to explain the grammatical nuances.",
                "Try a slower-paced study session before re-testing."
            ]
        };
    }
}

function getQuootFeedback(accuracy, title) {
    if (accuracy === 100) {
        return {
            title: "Apex Performer",
            message: `Flawless execution of the ${title} sequence. You have mastered every node in this arena.`,
            suggestions: [
                "Try Speed Mode for a higher cognitive load.",
                "Challenge yourself with a legendary tier arena.",
                "Share your perfect score and challenge your peers."
            ]
        };
    } else if (accuracy >= 70) {
        return {
            title: "Combat Efficiency: High",
            message: `Impressive agility in ${title}. A few more cycles and you'll achieve total mastery.`,
            suggestions: [
                "Focus on the cards where your response time lagged.",
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
                "Study the arena cards individually before playing again.",
                "Consult the AI Tutor for the most difficult terms."
            ]
        };
    }
}

/**
 * Calculates Unified Result for Practice
 */
function calculatePracticeResult(node, attempt) {
    const { score, maxScore, percentage, correctCount, incorrectCount, unansweredCount, timeSpentSeconds } = attempt;
    const accuracy = percentage;
    const xpHero = Math.round((correctCount * 10) + (accuracy * 2));

    const stats = [
        {
            label: 'Accuracy',
            value: `${accuracy}%`,
            icon: 'Target',
            color: accuracy >= 80 ? 'emerald' : 'primary'
        },
        {
            label: 'Time Spent',
            value: formatSeconds(timeSpentSeconds),
            icon: 'Clock',
            color: 'blue'
        },
        {
            label: 'Transmissions',
            value: `${correctCount}/${maxScore}`,
            icon: 'ArrowRight',
            color: 'purple'
        },
        {
            label: 'XP Gained',
            value: `+${xpHero}`,
            icon: 'Zap',
            color: 'amber'
        }
    ];

    const achievements = [];
    if (accuracy === 100) {
        achievements.push({
            id: 'perfect_sync',
            title: 'Perfect Sync',
            description: 'Achieved 100% accuracy in the protocol.',
            icon: 'Star',
            rarity: 'LEGENDARY'
        });
    } else if (accuracy >= 80) {
        achievements.push({
            id: 'expert_analyst',
            title: 'Expert Analyst',
            description: 'Demonstrated superior cognitive processing.',
            icon: 'Brain',
            rarity: 'RARE'
        });
    }

    if (timeSpentSeconds < 60 && maxScore >= 5) {
        achievements.push({
            id: 'speed_demon',
            title: 'Speed Demon',
            description: 'Completed the protocol in record time.',
            icon: 'Zap',
            rarity: 'RARE'
        });
    }

    return {
        sessionId: attempt._id ? attempt._id.toString() : Date.now().toString(),
        type: 'PRACTICE',
        isAnonymous: !!attempt.isAnonymous,
        score: accuracy,
        accuracy,
        timeSeconds: timeSpentSeconds,
        stats,
        achievements,
        feedback: getPracticeFeedback(accuracy, node.title),
        xpEarned: xpHero,
        // Include answers for review
        answers: attempt.answers || []
    };
}

/**
 * Calculates Unified Result for Quoot
 */
function calculateQuootResult(arena, gameState) {
    // gameState expected: { score, correctCount, maxStreak, totalCards }
    const totalCards = gameState.totalCards;
    const accuracy = Math.round((gameState.correctCount / totalCards) * 100);
    const xpHero = Math.round((gameState.score / 10) + (accuracy * 2));

    const stats = [
        {
            label: 'Final Score',
            value: gameState.score.toLocaleString(),
            icon: 'Trophy',
            color: 'primary'
        },
        {
            label: 'Accuracy',
            value: `${accuracy}%`,
            icon: 'Target',
            color: accuracy >= 80 ? 'emerald' : 'amber'
        },
        {
            label: 'Max Streak',
            value: `${gameState.maxStreak} 🔥`,
            icon: 'Flame',
            color: 'rose'
        },
        {
            label: 'XP Gained',
            value: `+${xpHero}`,
            icon: 'Zap',
            color: 'secondary'
        }
    ];

    const achievements = [];
    if (accuracy === 100) {
        achievements.push({
            id: 'zen_grandmaster',
            title: 'Zen Grandmaster',
            description: 'Achieved total synchronization with the arena.',
            icon: 'Trophy',
            rarity: 'LEGENDARY'
        });
    }

    if (gameState.maxStreak >= 10) {
        achievements.push({
            id: 'unstoppable_force',
            title: 'Unstoppable Force',
            description: 'Maintained a massive streak under pressure.',
            icon: 'Flame',
            rarity: 'RARE'
        });
    }

    return {
        sessionId: Date.now().toString(),
        type: 'QUOOT',
        isAnonymous: !!gameState.isAnonymous,
        score: accuracy,
        accuracy,
        timeSeconds: 0,
        stats,
        achievements,
        feedback: getQuootFeedback(accuracy, arena.title),
        xpEarned: xpHero
    };
}

module.exports = {
    calculatePracticeResult,
    calculateQuootResult
};
