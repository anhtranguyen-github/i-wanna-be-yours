/**
 * Help Content Database
 * Contains explanations for all stats, frameworks, and features
 * Used by InfoTooltip components throughout the dashboard
 */

export interface HelpContentItem {
    title: string;
    content: string;
    learnMoreUrl?: string;
}

export const HELP_CONTENT: Record<string, HelpContentItem> = {
    // ============================================
    // Core Stats
    // ============================================
    vocabulary_mastered: {
        title: 'Vocabulary Mastered',
        content: 'Words you\'ve correctly recalled 4+ times in spaced repetition. These are considered learned and will be reviewed less frequently.',
        learnMoreUrl: '/help/srs',
    },
    kanji_mastered: {
        title: 'Kanji Mastered',
        content: 'Kanji characters you can read and understand. Includes knowing readings and common meanings.',
    },
    grammar_points: {
        title: 'Grammar Points',
        content: 'Number of grammar patterns you\'ve studied. Each point represents a distinct grammatical concept.',
    },
    current_streak: {
        title: 'Study Streak',
        content: 'Consecutive days you\'ve completed at least one study session. Missing a day resets the streak to zero.',
    },
    accuracy: {
        title: 'Accuracy Rate',
        content: 'Percentage of correct answers across all quizzes and flashcard reviews in the selected period.',
    },
    study_time: {
        title: 'Study Time',
        content: 'Total time spent actively studying. Includes flashcard reviews, quizzes, and lessons.',
    },
    days_remaining: {
        title: 'Days Remaining',
        content: 'Number of days until your target exam date. Helps track urgency and pacing.',
    },
    overall_progress: {
        title: 'Overall Progress',
        content: 'Combined progress across all milestones in your study plan. Based on completion of success criteria.',
    },

    // ============================================
    // SMART Framework
    // ============================================
    smart_framework: {
        title: 'SMART Goals',
        content: 'Goals that are Specific, Measurable, Achievable, Relevant, and Time-bound. This framework ensures your goals are clear and actionable.',
    },
    smart_specific: {
        title: 'Specific (S)',
        content: 'Clearly defined goal with no ambiguity. Answer: What exactly do you want to achieve?',
    },
    smart_measurable: {
        title: 'Measurable (M)',
        content: 'Quantifiable criteria to track progress. Answer: How will you know when it\'s achieved?',
    },
    smart_achievable: {
        title: 'Achievable (A)',
        content: 'Realistic given your resources and constraints. Answer: Can you actually accomplish this?',
    },
    smart_relevant: {
        title: 'Relevant (R)',
        content: 'Aligned with your larger objectives. Answer: Why does this goal matter for your JLPT success?',
    },
    smart_timebound: {
        title: 'Time-bound (T)',
        content: 'Has a clear deadline. Answer: By when will you achieve this?',
    },
    smart_progress: {
        title: 'Goal Progress',
        content: 'How close you are to completing this SMART goal, based on the measurable success criteria.',
    },

    // ============================================
    // OKR Framework
    // ============================================
    okr_framework: {
        title: 'OKRs (Objectives & Key Results)',
        content: 'A goal-setting framework where Objectives are qualitative goals and Key Results are measurable outcomes that indicate progress.',
    },
    okr_objective: {
        title: 'Objective',
        content: 'An inspiring, qualitative goal that describes what you want to achieve. Should be ambitious but achievable.',
    },
    okr_key_result: {
        title: 'Key Result',
        content: 'A measurable outcome that indicates progress toward the objective. Should be specific and quantifiable.',
    },
    okr_velocity: {
        title: 'Velocity',
        content: 'Your average daily progress rate toward a key result. Used to project completion dates.',
    },
    okr_projected_completion: {
        title: 'Projected Completion',
        content: 'Estimated date you\'ll achieve this key result based on your current velocity.',
    },
    okr_health: {
        title: 'OKR Health',
        content: 'Overall status of your OKRs. Green = on track, Yellow = at risk, Red = behind schedule.',
    },

    // ============================================
    // PACT Framework
    // ============================================
    pact_framework: {
        title: 'PACT (Purpose, Actions, Continuous, Trackable)',
        content: 'A habit-based framework for daily commitment. Focuses on what you do every day rather than end goals.',
    },
    pact_purpose: {
        title: 'Purpose',
        content: 'Your "why" - the deeper reason behind your daily commitment. Connects daily actions to long-term goals.',
    },
    pact_actions: {
        title: 'Actions',
        content: 'Specific activities you commit to doing daily. Should be concrete and within your control.',
    },
    pact_continuous: {
        title: 'Continuous',
        content: 'Designed to be sustainable long-term. Unlike one-time goals, these are ongoing habits.',
    },
    pact_trackable: {
        title: 'Trackable',
        content: 'Can be measured and tracked. You know definitively if you did it or not.',
    },
    pact_streak: {
        title: 'PACT Streak',
        content: 'Consecutive days you\'ve completed your daily PACT commitments.',
    },
    pact_habit_strength: {
        title: 'Habit Strength',
        content: 'How ingrained your daily habits are. Based on consistency over time.',
    },

    // ============================================
    // Diagnostic / Priority Matrix
    // ============================================
    priority_matrix: {
        title: 'Priority Matrix (RYG)',
        content: 'Categorizes content by learning priority: RED (critical gaps), YELLOW (needs practice), GREEN (maintain).',
    },
    priority_red: {
        title: 'RED Priority',
        content: 'Critical items needing deep, focused study. Go slow and ensure solid understanding before moving on.',
    },
    priority_yellow: {
        title: 'YELLOW Priority',
        content: 'Items you understand conceptually but need more practice to solidify. Focus on repetition.',
    },
    priority_green: {
        title: 'GREEN Priority',
        content: 'Well-learned items. Periodic review to maintain memory. Don\'t over-study these.',
    },
    error_knowledge_gap: {
        title: 'Knowledge Gap',
        content: 'Errors caused by missing fundamental understanding. Requires re-learning the concept.',
    },
    error_process: {
        title: 'Process Error',
        content: 'You know the concept but applied it incorrectly. Needs more practice with proper technique.',
    },
    error_careless: {
        title: 'Careless Error',
        content: 'You knew the answer but made a mistake due to rushing or distraction. Focus on attention habits.',
    },

    // ============================================
    // Context Factors
    // ============================================
    context_sleep: {
        title: 'Sleep Quality',
        content: 'How well you slept affects learning capacity. Poor sleep = focus on review, not new content.',
    },
    context_energy: {
        title: 'Energy Level',
        content: 'Your current mental energy. Low energy suggests shorter, easier sessions.',
    },
    context_mood: {
        title: 'Mood',
        content: 'Your emotional state affects learning. Stressed or anxious? Try relaxed review activities.',
    },
    context_stress: {
        title: 'Stress Level',
        content: 'High stress impairs memory formation. Consider lighter study loads during stressful periods.',
    },

    // ============================================
    // Review Cycles
    // ============================================
    daily_review: {
        title: 'Daily Review',
        content: 'Quick end-of-day reflection on what you learned and how the session went.',
    },
    weekly_review: {
        title: 'Weekly Review',
        content: 'Deeper analysis of the past week\'s progress, patterns, and adjustments needed.',
    },
    phase_review: {
        title: 'Phase Review',
        content: 'Comprehensive review at milestone completion. Evaluates overall strategy effectiveness.',
    },

    // ============================================
    // Milestones
    // ============================================
    milestone: {
        title: 'Milestone',
        content: 'A significant checkpoint in your study plan. Completing milestones unlocks the next phase.',
    },
    milestone_criteria: {
        title: 'Success Criteria',
        content: 'Specific requirements that must be met to complete this milestone.',
    },
    milestone_health: {
        title: 'Milestone Health',
        content: 'Whether you\'re on track to complete this milestone by its target date.',
    },

    // ============================================
    // AI Features
    // ============================================
    ai_confidence: {
        title: 'AI Confidence',
        content: 'Hanachan\'s assessment of goal achievability based on your current pace and patterns.',
    },
    ai_recommendation: {
        title: 'AI Recommendation',
        content: 'Personalized suggestions from Hanachan based on your learning data and goals.',
    },
};

/**
 * Get help content by key
 */
export function getHelpContent(key: string): HelpContentItem | undefined {
    return HELP_CONTENT[key];
}

/**
 * Get help content with fallback
 */
export function getHelpContentSafe(key: string, fallbackTitle: string): HelpContentItem {
    return HELP_CONTENT[key] || {
        title: fallbackTitle,
        content: 'Information about this feature.',
    };
}

export default HELP_CONTENT;
