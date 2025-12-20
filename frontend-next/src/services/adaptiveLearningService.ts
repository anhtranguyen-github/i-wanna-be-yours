/**
 * Adaptive Learning Service
 * 
 * Handles API calls for adaptive learning features:
 * - Get personalized recommendations
 * - Analyze performance
 * - Manage difficulty settings
 */

const API_BASE_URL = '/s-api';  // Study Plan Service (port 5500)

// ============================================
// Types
// ============================================

export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'needs_work' | 'struggling' | 'unknown';

export interface RecommendationAction {
    type: 'flashcards' | 'quiz' | 'lesson' | 'quick_quiz';
    deck?: string;
    category?: string;
    difficulty?: string;
    mode?: string;
    new_cards?: number;
}

export interface Recommendation {
    type: 'welcome' | 'review' | 'daily_review' | 'new_content' | 'maintenance' | 'start_learning';
    priority: number;
    title: string;
    description: string;
    action: RecommendationAction;
    estimated_minutes: number;
}

export interface RecommendationsResponse {
    recommendations: Recommendation[];
    focus_area: string;
    daily_goal_minutes: number;
    performance_summary?: Record<string, CategoryPerformance>;
}

export interface CategoryPerformance {
    average_score: number | null;
    total_activities: number;
    items_reviewed: number;
    performance_level: PerformanceLevel;
}

export interface PerformanceAnalysis {
    status: 'analyzed' | 'insufficient_data';
    period_days?: number;
    total_activities?: number;
    by_category?: Record<string, CategoryPerformance>;
    weak_areas?: string[];
    strong_areas?: string[];
    message?: string;
    recommendations?: Array<{ type: string; message: string }>;
}

export interface DifficultySettings {
    global_level: DifficultyLevel;
    category_levels: Record<string, DifficultyLevel>;
    auto_adjust: boolean;
}

export interface DifficultyAdjustmentResult {
    adjusted: boolean;
    category?: string;
    previous_level?: DifficultyLevel;
    new_level?: DifficultyLevel;
    reason: string;
}

export interface OptimalTimeRecommendation {
    optimal_times: string[];
    best_hour?: number;
    message: string;
    confidence: 'low' | 'medium' | 'high';
}

// ============================================
// Service Class
// ============================================

class AdaptiveLearningService {

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
    // Recommendations
    // ============================================

    /**
     * Get personalized learning recommendations
     */
    async getRecommendations(userId: string): Promise<RecommendationsResponse> {
        const res = await fetch(`/f-api/v1/adaptive/recommendations/${userId}`);
        return this.handleResponse<RecommendationsResponse>(res);
    }

    /**
     * Get recommendations for current user
     */
    async getMyRecommendations(): Promise<RecommendationsResponse> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        return this.getRecommendations(user.id);
    }

    // ============================================
    // Performance Analysis
    // ============================================

    /**
     * Analyze user's learning performance
     */
    async analyzePerformance(userId: string, days: number = 14): Promise<PerformanceAnalysis> {
        const res = await fetch(`/f-api/v1/adaptive/performance/${userId}?days=${days}`);
        return this.handleResponse<PerformanceAnalysis>(res);
    }

    /**
     * Analyze current user's performance
     */
    async analyzeMyPerformance(days: number = 14): Promise<PerformanceAnalysis> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        return this.analyzePerformance(user.id, days);
    }

    // ============================================
    // Difficulty Settings
    // ============================================

    /**
     * Get user's difficulty settings
     */
    async getDifficultySettings(userId: string): Promise<DifficultySettings> {
        const res = await fetch(`/f-api/v1/adaptive/difficulty/${userId}`);
        return this.handleResponse<DifficultySettings>(res);
    }

    /**
     * Request difficulty adjustment for a category
     */
    async adjustDifficulty(userId: string, category: string, score: number): Promise<DifficultyAdjustmentResult> {
        const res = await fetch(`/f-api/v1/adaptive/difficulty/${userId}/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, score }),
        });
        return this.handleResponse<DifficultyAdjustmentResult>(res);
    }

    // ============================================
    // Optimal Study Time
    // ============================================

    /**
     * Get optimal study time recommendations
     */
    async getOptimalStudyTime(userId: string): Promise<OptimalTimeRecommendation> {
        const res = await fetch(`/f-api/v1/adaptive/optimal-time/${userId}`);
        return this.handleResponse<OptimalTimeRecommendation>(res);
    }

    /**
     * Get optimal study time for current user
     */
    async getMyOptimalStudyTime(): Promise<OptimalTimeRecommendation> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        return this.getOptimalStudyTime(user.id);
    }

    // ============================================
    // Utility Methods
    // ============================================

    /**
     * Get color for performance level
     */
    getPerformanceColor(level: PerformanceLevel): string {
        const colors: Record<PerformanceLevel, string> = {
            excellent: '#4CAF50',
            good: '#8BC34A',
            average: '#FFC107',
            needs_work: '#FF9800',
            struggling: '#F44336',
            unknown: '#9E9E9E',
        };
        return colors[level] || colors.unknown;
    }

    /**
     * Get icon for recommendation type
     */
    getRecommendationIcon(type: Recommendation['type']): string {
        const icons: Record<Recommendation['type'], string> = {
            welcome: '👋',
            review: '📝',
            daily_review: '🔄',
            new_content: '✨',
            maintenance: '💪',
            start_learning: '🚀',
        };
        return icons[type] || '📚';
    }

    /**
     * Format difficulty level for display
     */
    formatDifficultyLevel(level: DifficultyLevel): string {
        return level.charAt(0).toUpperCase() + level.slice(1);
    }

    /**
     * Get priority badge color
     */
    getPriorityColor(priority: number): string {
        if (priority <= 1) return '#F44336';
        if (priority <= 2) return '#FF9800';
        if (priority <= 3) return '#FFC107';
        return '#9E9E9E';
    }
}

export const adaptiveLearningService = new AdaptiveLearningService();
export default adaptiveLearningService;
