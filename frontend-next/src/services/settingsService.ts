import { authFetch } from '@/lib/authFetch';

export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    language: string;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    dailyGoalMinutes: number;
    preferredLevel?: string;
    preferredFocus?: string[];
}

export interface UserSettingsResponse {
    email: string;
    display_name: string;
    bio: string;
    settings: UserSettings;
}

class SettingsService {
    async getSettings(): Promise<UserSettingsResponse> {
        const response = await authFetch('/e-api/v1/users/settings');
        if (!response.ok) {
            throw new Error('Failed to fetch settings');
        }
        return response.json();
    }

    async updateSettings(updates: Partial<{
        settings: Partial<UserSettings>;
        display_name: string;
        bio: string;
    }>): Promise<UserSettingsResponse> {
        const response = await authFetch('/e-api/v1/users/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update settings');
        }
        return response.json();
    }
}

export const settingsService = new SettingsService();
export default settingsService;
