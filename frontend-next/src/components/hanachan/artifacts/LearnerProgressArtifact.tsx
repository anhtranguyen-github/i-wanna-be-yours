'use client';

import {
    Flame, Trophy, BookOpen, Target, Sparkles,
    Clock, TrendingUp, Star, Zap, Award,
    ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============================================
// Learner Progress Artifact
// ============================================

interface LearnerProgressArtifactProps {
    data: {
        vocabulary_mastered: number;
        kanji_mastered: number;
        grammar_points_learned: number;
        current_streak: number;
        longest_streak: number;
        total_study_time_minutes: number;
        weekly_goals?: {
            flashcard_reviews: { target: number; current: number };
            quizzes_completed: { target: number; current: number };
            study_minutes: { target: number; current: number };
        };
        weekly_stats?: {
            flashcard_reviews: number;
            quizzes_completed: number;
            avg_quiz_score: number;
            days_active: number;
        };
        recent_achievements?: Array<{
            id: string;
            name: string;
            icon: string;
        }>;
    };
}

export function LearnerProgressArtifact({ data }: LearnerProgressArtifactProps) {
    const router = useRouter();

    // Format study time
    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
            {/* Header with Streak */}
            <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Flame size={32} className="text-yellow-300" />
                            {data.current_streak > 0 && (
                                <div className="absolute -top-1 -right-2 bg-white text-orange-500 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {data.current_streak}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-sm opacity-80">Study Streak</div>
                            <div className="text-2xl font-black">
                                {data.current_streak} {data.current_streak === 1 ? 'day' : 'days'}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs opacity-70">Best</div>
                        <div className="font-bold">{data.longest_streak} days</div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50">
                <div className="text-center">
                    <div className="text-2xl font-black text-green-600">
                        {data.vocabulary_mastered}
                    </div>
                    <div className="text-xs text-gray-500">Vocab</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-black text-orange-600">
                        {data.kanji_mastered}
                    </div>
                    <div className="text-xs text-gray-500">Kanji</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-black text-blue-600">
                        {data.grammar_points_learned}
                    </div>
                    <div className="text-xs text-gray-500">Grammar</div>
                </div>
            </div>

            {/* Weekly Goals Progress */}
            {data.weekly_goals && (
                <div className="p-4 space-y-3 border-t border-gray-100">
                    <div className="text-xs font-bold text-gray-500 mb-2">WEEKLY GOALS</div>

                    {/* Flashcard Reviews */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Flashcard Reviews</span>
                            <span className="font-medium">
                                {data.weekly_goals.flashcard_reviews.current}/{data.weekly_goals.flashcard_reviews.target}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{
                                    width: `${Math.min(100, (data.weekly_goals.flashcard_reviews.current / data.weekly_goals.flashcard_reviews.target) * 100)}%`
                                }}
                            />
                        </div>
                    </div>

                    {/* Quizzes */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Quizzes</span>
                            <span className="font-medium">
                                {data.weekly_goals.quizzes_completed.current}/{data.weekly_goals.quizzes_completed.target}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{
                                    width: `${Math.min(100, (data.weekly_goals.quizzes_completed.current / data.weekly_goals.quizzes_completed.target) * 100)}%`
                                }}
                            />
                        </div>
                    </div>

                    {/* Study Time */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Study Time</span>
                            <span className="font-medium">
                                {formatTime(data.weekly_goals.study_minutes.current)}/{formatTime(data.weekly_goals.study_minutes.target)}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 rounded-full transition-all"
                                style={{
                                    width: `${Math.min(100, (data.weekly_goals.study_minutes.current / data.weekly_goals.study_minutes.target) * 100)}%`
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Achievements */}
            {data.recent_achievements && data.recent_achievements.length > 0 && (
                <div className="p-4 border-t border-gray-100 bg-amber-50/50">
                    <div className="text-xs font-bold text-gray-500 mb-2">RECENT ACHIEVEMENTS</div>
                    <div className="flex gap-2">
                        {data.recent_achievements.slice(0, 5).map((achievement) => (
                            <div
                                key={achievement.id}
                                className="flex flex-col items-center gap-1 p-2 bg-white rounded-lg shadow-sm"
                                title={achievement.name}
                            >
                                <span className="text-xl">{achievement.icon}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer Action */}
            <button
                onClick={() => router.push('/dashboard')}
                className="w-full p-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-1 border-t border-gray-100"
            >
                View Full Dashboard <ChevronRight size={16} />
            </button>
        </div>
    );
}

// ============================================
// Learning Recommendations Artifact
// ============================================

interface LearningRecommendationsArtifactProps {
    data: {
        focus_area: string;
        daily_goal_minutes: number;
        recommendations: Array<{
            type: string;
            priority: number;
            title: string;
            description: string;
            action: {
                type: string;
                deck?: string;
                category?: string;
            };
            estimated_minutes: number;
        }>;
    };
}

const RECOMMENDATION_ICONS: Record<string, React.ReactNode> = {
    welcome: <Star className="text-yellow-500" size={20} />,
    review: <TrendingUp className="text-blue-500" size={20} />,
    daily_review: <Zap className="text-purple-500" size={20} />,
    new_content: <Sparkles className="text-green-500" size={20} />,
    maintenance: <Target className="text-orange-500" size={20} />,
    start_learning: <BookOpen className="text-pink-500" size={20} />,
};

export function LearningRecommendationsArtifact({ data }: LearningRecommendationsArtifactProps) {
    const router = useRouter();

    const handleActionClick = (action: { type: string; deck?: string; category?: string }) => {
        switch (action.type) {
            case 'flashcards':
                router.push('/flashcards');
                break;
            case 'quiz':
                router.push('/quiz');
                break;
            case 'lesson':
                router.push('/knowledge-base');
                break;
            default:
                router.push('/dashboard');
        }
    };

    return (
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles size={24} />
                        <div>
                            <div className="font-bold">Recommended For You</div>
                            <div className="text-sm opacity-80">
                                Focus: {data.focus_area.charAt(0).toUpperCase() + data.focus_area.slice(1)}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1">
                            <Clock size={16} />
                            <span className="font-bold">{data.daily_goal_minutes}m</span>
                        </div>
                        <div className="text-xs opacity-80">daily goal</div>
                    </div>
                </div>
            </div>

            {/* Recommendations List */}
            <div className="p-4 space-y-3">
                {data.recommendations.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                        No recommendations available
                    </div>
                ) : (
                    data.recommendations.map((rec, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleActionClick(rec.action)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all text-left"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                {RECOMMENDATION_ICONS[rec.type] || <BookOpen className="text-gray-400" size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-800">{rec.title}</div>
                                <div className="text-sm text-gray-500 truncate">{rec.description}</div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <div className="flex items-center gap-1 text-gray-400 text-sm">
                                    <Clock size={14} />
                                    {rec.estimated_minutes}m
                                </div>
                                {rec.priority <= 2 && (
                                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                                        Priority
                                    </span>
                                )}
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-500 text-center">
                    Recommendations update based on your learning progress
                </div>
            </div>
        </div>
    );
}

// Export artifact types for registration
export const LEARNER_PROGRESS_ARTIFACT_TYPES = {
    learner_progress: LearnerProgressArtifact,
    learning_recommendations: LearningRecommendationsArtifact,
};
