/**
 * Learner Progress Service
 * 
 * Handles all API calls for learner progress tracking.
 */

import {
    ProgressSummaryResponse,
    LogActivityRequest,
    LogActivityResponse,
    DetailedStatsResponse,
    AchievementsResponse,
    StartSessionRequest,
    StartSessionResponse,
    EndSessionResponse,
    ActivityType,
    JLPTLevel,
    LearningCategory,
} from '@/types/learnerProgressTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5100';

class LearnerProgressService {

    // ============================================
    // Helper Methods
    // ============================================

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP error ${response.status}`);
        }
        return response.json();
    }

    private async getCurrentUser(): Promise<{ id: string } | null> {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) return null;
            const data = await res.json();
            return data.user;
        } catch {
            return null;
        }
    }

    // ============================================
    // Progress Endpoints
    // ============================================

    /**
     * Get user's comprehensive progress summary
     */
    async getProgress(userId: string): Promise<ProgressSummaryResponse> {
        const res = await fetch(`${API_BASE_URL}/f-api/v1/learner/progress/${userId}`);
        return this.handleResponse<ProgressSummaryResponse>(res);
    }

    /**
     * Get progress for current authenticated user
     */
    async getMyProgress(): Promise<ProgressSummaryResponse> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        return this.getProgress(user.id);
    }

    // ============================================
    // Activity Logging
    // ============================================

    /**
     * Log a learning activity
     */
    async logActivity(request: LogActivityRequest): Promise<LogActivityResponse> {
        const res = await fetch(`${API_BASE_URL}/f-api/v1/learner/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        return this.handleResponse<LogActivityResponse>(res);
    }

    /**
     * Log flashcard review activity
     */
    async logFlashcardReview(
        userId: string,
        count: number,
        durationMinutes?: number,
        masteredCount?: number,
        category: LearningCategory = 'vocabulary'
    ): Promise<LogActivityResponse> {
        return this.logActivity({
            user_id: userId,
            activity_type: 'flashcard_review',
            data: {
                count,
                duration_minutes: durationMinutes,
                mastered_count: masteredCount,
                category,
            },
        });
    }

    /**
     * Log quiz completion
     */
    async logQuizCompleted(
        userId: string,
        score: number,
        level?: JLPTLevel,
        category?: LearningCategory,
        durationMinutes?: number
    ): Promise<LogActivityResponse> {
        return this.logActivity({
            user_id: userId,
            activity_type: 'quiz_completed',
            data: {
                score,
                level,
                category,
                duration_minutes: durationMinutes,
            },
        });
    }

    /**
     * Log grammar lesson completion
     */
    async logGrammarLesson(
        userId: string,
        durationMinutes?: number
    ): Promise<LogActivityResponse> {
        return this.logActivity({
            user_id: userId,
            activity_type: 'grammar_lesson',
            data: {
                duration_minutes: durationMinutes,
            },
        });
    }

    // ============================================
    // Statistics Endpoints
    // ============================================

    /**
     * Get detailed learning statistics
     */
    async getStats(userId: string, days: number = 30): Promise<DetailedStatsResponse> {
        const res = await fetch(`${API_BASE_URL}/f-api/v1/learner/stats/${userId}?days=${days}`);
        return this.handleResponse<DetailedStatsResponse>(res);
    }

    /**
     * Get stats for current user
     */
    async getMyStats(days: number = 30): Promise<DetailedStatsResponse> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        return this.getStats(user.id, days);
    }

    // ============================================
    // Achievements
    // ============================================

    /**
     * Get user's achievements
     */
    async getAchievements(userId: string): Promise<AchievementsResponse> {
        const res = await fetch(`${API_BASE_URL}/f-api/v1/learner/achievements/${userId}`);
        return this.handleResponse<AchievementsResponse>(res);
    }

    /**
     * Get achievements for current user
     */
    async getMyAchievements(): Promise<AchievementsResponse> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        return this.getAchievements(user.id);
    }

    // ============================================
    // Study Sessions
    // ============================================

    /**
     * Start a new study session
     */
    async startSession(request: StartSessionRequest): Promise<StartSessionResponse> {
        const res = await fetch(`${API_BASE_URL}/f-api/v1/learner/session/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        return this.handleResponse<StartSessionResponse>(res);
    }

    /**
     * End a study session
     */
    async endSession(sessionId: string): Promise<EndSessionResponse> {
        const res = await fetch(`${API_BASE_URL}/f-api/v1/learner/session/${sessionId}/end`, {
            method: 'POST',
        });
        return this.handleResponse<EndSessionResponse>(res);
    }

    /**
     * Start session for current user
     */
    async startMySession(focusArea?: string): Promise<StartSessionResponse> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        return this.startSession({
            user_id: user.id,
            focus_area: focusArea,
        });
    }

    // ============================================
    // Convenience Methods
    // ============================================

    /**
     * Calculate goal completion percentage
     */
    calculateGoalProgress(current: number, target: number): number {
        if (target <= 0) return 0;
        return Math.min(100, Math.round((current / target) * 100));
    }

    /**
     * Format study time to readable string
     */
    formatStudyTime(minutes: number): string {
        if (minutes < 60) {
            return `${Math.round(minutes)}m`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    /**
     * Get streak status message
     */
    getStreakMessage(currentStreak: number): string {
        if (currentStreak === 0) return "Start your streak today!";
        if (currentStreak === 1) return "Great start! Day 1 🔥";
        if (currentStreak < 7) return `${currentStreak} days! Keep going! 🔥`;
        if (currentStreak < 30) return `${currentStreak} days! Impressive! ⚔️`;
        return `${currentStreak} days! You're a master! 👑`;
    }
}

export const learnerProgressService = new LearnerProgressService();
export default learnerProgressService;
