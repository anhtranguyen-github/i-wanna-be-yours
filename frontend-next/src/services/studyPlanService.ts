/**
 * Study Plan Service
 * 
 * Handles all API calls for the JLPT Study Plan feature.
 */

import {
    JLPTInfo,
    PlanTemplateListItem,
    PlanTemplateDetail,
    CreatePlanRequest,
    StudyPlanListItem,
    StudyPlanDetail,
    DailyTasksResponse,
    PlanProgressReport,
    StudyPlanSettings,
} from '@/types/studyPlanTypes';
import { authFetch, dispatchSessionExpired } from '@/lib/authFetch';

const API_BASE_URL = '/s-api';  // Study Plan Service (port 5500)

class StudyPlanService {

    // ============================================
    // Helper Methods
    // ============================================

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            // For 401 errors, dispatch session expired event (authFetch handles this,
            // but just in case a regular fetch slips through)
            if (response.status === 401) {
                dispatchSessionExpired('Your session has expired. Please log in again.');
                throw new Error('Session expired');
            }
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
    // Public Endpoints (No Auth Required)
    // ============================================

    /**
     * Get JLPT level requirements and study info
     */
    async getJLPTInfo(): Promise<JLPTInfo> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/jlpt-info`);
        return this.handleResponse<JLPTInfo>(res);
    }

    /**
     * List all available plan templates
     */
    async listTemplates(level?: string): Promise<{ templates: PlanTemplateListItem[] }> {
        const params = level ? `?level=${level}` : '';
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/templates${params}`);
        return this.handleResponse<{ templates: PlanTemplateListItem[] }>(res);
    }

    /**
     * Get detailed template information
     */
    async getTemplate(templateId: string): Promise<PlanTemplateDetail> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/templates/${templateId}`);
        return this.handleResponse<PlanTemplateDetail>(res);
    }

    // ============================================
    // Authenticated Endpoints
    // ============================================

    /**
     * Create a new personalized study plan
     */
    async createPlan(request: CreatePlanRequest): Promise<{ id: string; message: string; target_level: string; total_days: number }> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/plans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        return this.handleResponse(res);
    }

    /**
     * List user's study plans
     */
    async listPlans(userId: string, status?: string): Promise<{ plans: StudyPlanListItem[] }> {
        const params = new URLSearchParams({ user_id: userId });
        if (status) params.append('status', status);

        // Use authFetch for authenticated endpoints
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/plans?${params}`);
        return this.handleResponse<{ plans: StudyPlanListItem[] }>(res);
    }

    /**
     * Get user's plans using current auth
     */
    async getMyPlans(status?: string): Promise<{ plans: StudyPlanListItem[] }> {
        const user = await this.getCurrentUser();
        if (!user) return { plans: [] };  // Graceful return for unauthenticated users
        return this.listPlans(user.id, status);
    }

    /**
     * Get detailed plan information
     */
    async getPlan(planId: string): Promise<StudyPlanDetail> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/plans/${planId}`);
        return this.handleResponse<StudyPlanDetail>(res);
    }

    /**
     * Update plan settings
     */
    async updatePlan(planId: string, updates: Partial<StudyPlanSettings & { status: string }>): Promise<{ message: string }> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/plans/${planId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        return this.handleResponse(res);
    }

    /**
     * Abandon/delete a study plan
     */
    async deletePlan(planId: string): Promise<{ message: string }> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/plans/${planId}`, {
            method: 'DELETE',
        });
        return this.handleResponse(res);
    }

    // ============================================
    // Milestone Endpoints
    // ============================================

    /**
     * Get milestone details
     */
    async getMilestone(milestoneId: string): Promise<any> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/milestones/${milestoneId}`);
        return this.handleResponse(res);
    }

    /**
     * Mark milestone as complete
     */
    async completeMilestone(milestoneId: string): Promise<{ message: string }> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/milestones/${milestoneId}/complete`, {
            method: 'PATCH',
        });
        return this.handleResponse(res);
    }

    // ============================================
    // Daily Tasks Endpoints
    // ============================================

    /**
     * Get daily tasks for a user
     */
    async getDailyTasks(userId: string, date?: string): Promise<DailyTasksResponse> {
        const params = new URLSearchParams({ user_id: userId });
        if (date) params.append('date', date);

        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/daily-tasks?${params}`);
        return this.handleResponse<DailyTasksResponse>(res);
    }

    /**
     * Get today's tasks using current auth
     */
    async getMyDailyTasks(date?: string): Promise<DailyTasksResponse> {
        const user = await this.getCurrentUser();
        if (!user) return { tasks: [], date: date || new Date().toISOString().split('T')[0], plan_id: '' };  // Graceful return
        return this.getDailyTasks(user.id, date);
    }

    /**
     * Mark a task as complete
     */
    async completeTask(taskId: string, score?: number): Promise<{ message: string }> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/daily-tasks/${taskId}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score }),
        });
        return this.handleResponse(res);
    }

    // ============================================
    // Progress Endpoints
    // ============================================

    /**
     * Get detailed progress report
     */
    async getProgress(planId: string): Promise<PlanProgressReport> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/progress/${planId}`);
        return this.handleResponse<PlanProgressReport>(res);
    }

    /**
     * Get performance trends and struggle points
     */
    async getPerformanceTrends(days: number = 30): Promise<{
        status: string;
        avg_note_quality: number;
        identified_struggles: string[];
    }> {
        const user = await this.getCurrentUser();
        if (!user) return { status: 'error', avg_note_quality: 0, identified_struggles: [] };

        const res = await authFetch(`${API_BASE_URL}/v1/performance/trends?user_id=${user.id}&days=${days}`);
        return this.handleResponse(res);
    }

    /**
     * Batch update goals (e.g., for priority recalibration)
     */
    async batchUpdateGoals(updates: Array<{ id: string; fields: any }>): Promise<{ success: boolean }> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const res = await authFetch(`${API_BASE_URL}/v1/smart-goals/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, updates }),
        });
        return this.handleResponse(res);
    }

    // ============================================
    // Convenience Methods
    // ============================================

    /**
     * Create a plan using current auth user
     */
    async createMyPlan(
        targetLevel: string,
        examDate: Date,
        settings: Partial<StudyPlanSettings> = {}
    ): Promise<{ id: string; message: string; target_level: string; total_days: number }> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        return this.createPlan({
            user_id: user.id,
            target_level: targetLevel as any,
            exam_date: examDate.toISOString(),
            daily_study_minutes: settings.daily_study_minutes ?? 30,
            study_days_per_week: settings.study_days_per_week ?? 5,
            preferred_focus: settings.preferred_focus ?? [],
        });
    }

    /**
     * Get active plan for current user
     */
    async getActivePlan(): Promise<StudyPlanDetail | null> {
        try {
            const { plans } = await this.getMyPlans('active');
            if (plans.length === 0) return null;
            return this.getPlan(plans[0].id);
        } catch {
            return null;
        }
    }

    // ============================================
    // Adaptive Adjustment Endpoints
    // ============================================

    /**
     * Check plan health and get recommendations
     */
    async checkPlanHealth(planId: string): Promise<{
        health_status: 'ahead' | 'on_track' | 'slightly_behind' | 'significantly_behind';
        expected_progress: number;
        actual_progress: number;
        progress_gap: number;
        overdue_milestones: number;
        issues: Array<{
            type: string;
            milestone_id?: string;
            title?: string;
            days_overdue?: number;
        }>;
        recommendations: Array<{
            type: string;
            message: string;
        }>;
    }> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/plans/${planId}/health`);
        return this.handleResponse(res);
    }

    /**
     * Recalculate milestone timelines
     */
    async recalculatePlan(planId: string, newExamDate?: Date): Promise<{
        success: boolean;
        adjustments: Array<{
            milestone_id: string;
            title: string;
            old_end_date: string;
            new_end_date: string;
        }>;
        remaining_days: number;
    }> {
        const body: any = {};
        if (newExamDate) {
            body.exam_date = newExamDate.toISOString();
        }

        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/plans/${planId}/recalculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        return this.handleResponse(res);
    }

    /**
     * Update milestone progress from quiz results
     */
    async updateFromQuiz(planId: string, quizResult: {
        category: 'vocabulary' | 'grammar' | 'kanji' | 'mixed';
        score: number;
        items_correct: number;
        items_total: number;
    }): Promise<{
        milestone_id: string;
        title: string;
        new_progress: number;
        criteria_updated: string[];
        completed: boolean;
    }> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/plans/${planId}/quiz-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quizResult),
        });
        return this.handleResponse(res);
    }

    /**
     * Update milestone progress from SRS/flashcard statistics
     */
    async updateFromSRS(userId: string, srsStats: {
        category: 'vocabulary' | 'kanji';
        cards_learned: number;
        total_reviewed: number;
    }): Promise<{
        milestone_id?: string;
        new_progress?: number;
        message?: string;
    }> {
        const res = await authFetch(`${API_BASE_URL}/v1/study-plan/srs-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, ...srsStats }),
        });
        return this.handleResponse(res);
    }

    // ============================================
    // UI Preferences Endpoints
    // ============================================

    /**
     * Get user's UI preferences (card collapse states, theme)
     */
    async getUIPreferences(): Promise<{
        userId: string;
        expandedCards: Record<string, boolean>;
        theme: string;
    }> {
        const user = await this.getCurrentUser();
        if (!user) return { userId: '', expandedCards: {}, theme: 'light' };

        const res = await authFetch(`${API_BASE_URL}/v1/user/ui-preferences?user_id=${user.id}`);
        return this.handleResponse(res);
    }

    /**
     * Update user's UI preferences
     */
    async saveUIPreferences(preferences: {
        expandedCards?: Record<string, boolean>;
        theme?: string;
    }): Promise<{ success: boolean }> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const res = await authFetch(`${API_BASE_URL}/v1/user/ui-preferences`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, ...preferences }),
        });
        return this.handleResponse(res);
    }

    // ============================================
    // Study Sessions Endpoints
    // ============================================

    /**
     * Log a study session
     */
    async logStudySession(session: {
        skill: string;
        effortLevel: string;
        durationMinutes: number;
        linkedKeyResultId?: string;
        notes?: string;
    }): Promise<{ id: string }> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const res = await authFetch(`${API_BASE_URL}/v1/user/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, ...session }),
        });
        return this.handleResponse(res);
    }

    /**
     * Get user's recent study sessions
     */
    async getStudySessions(limit: number = 20, skill?: string): Promise<{
        sessions: Array<{
            id: string;
            skill: string;
            effortLevel: string;
            durationMinutes: number;
            createdAt: string;
        }>;
    }> {
        const user = await this.getCurrentUser();
        if (!user) return { sessions: [] };

        const params = new URLSearchParams({ user_id: user.id, limit: String(limit) });
        if (skill) params.append('skill', skill);

        const res = await authFetch(`${API_BASE_URL}/v1/user/sessions?${params}`);
        return this.handleResponse(res);
    }

    /**
     * Get user's study streak
     */
    async getStudyStreak(): Promise<{ current: number; longest: number }> {
        const user = await this.getCurrentUser();
        if (!user) return { current: 0, longest: 0 };

        const res = await authFetch(`${API_BASE_URL}/v1/user/streak?user_id=${user.id}`);
        return this.handleResponse(res);
    }

    // ============================================
    // Reflection Endpoints
    // ============================================

    /**
     * Create a weekly reflection entry
     */
    async submitReflection(content: string): Promise<{ id: string }> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const res = await authFetch(`${API_BASE_URL}/v1/user/reflections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, content }),
        });
        return this.handleResponse(res);
    }

    /**
     * Get user's recent reflections
     */
    async getReflections(limit: number = 10): Promise<{
        reflections: Array<{
            id: string;
            weekStartDate: string;
            content: string;
            createdAt: string;
        }>;
    }> {
        const user = await this.getCurrentUser();
        if (!user) return { reflections: [] };

        const res = await authFetch(`${API_BASE_URL}/v1/user/reflections?user_id=${user.id}&limit=${limit}`);
        return this.handleResponse(res);
    }
}

export const studyPlanService = new StudyPlanService();
export default studyPlanService;


