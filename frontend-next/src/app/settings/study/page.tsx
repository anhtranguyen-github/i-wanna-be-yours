'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Settings as SettingsIcon,
    Clock,
    Target,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Zap,
    GraduationCap,
    BookOpen
} from 'lucide-react';
import { settingsService, UserSettingsResponse } from '@/services/settingsService';
import studyPlanService from '@/services/studyPlanService';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function StudySettingsPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form states
    const [dailyGoal, setDailyGoal] = useState(30);
    const [preferredLevel, setPreferredLevel] = useState('N3');
    const [preferredFocus, setPreferredFocus] = useState<string[]>([]);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            fetchSettings();
        }
    }, [user, userLoading]);

    const fetchSettings = async () => {
        try {
            const res = await settingsService.getSettings();
            setSettings(res);
            setDailyGoal(res.settings?.dailyGoalMinutes || 30);
            setPreferredLevel(res.settings?.preferredLevel || 'N3');
            setPreferredFocus(res.settings?.preferredFocus || []);
        } catch (err) {
            setError('Failed to load study settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            // Update global user settings
            await settingsService.updateSettings({
                settings: {
                    dailyGoalMinutes: dailyGoal,
                    preferredLevel: preferredLevel,
                    preferredFocus: preferredFocus
                } as any
            });

            // Sync with active study plan if user has one
            try {
                const activePlan = await studyPlanService.getActivePlan();
                if (activePlan) {
                    await studyPlanService.updatePlan(activePlan.id, {
                        daily_study_minutes: dailyGoal,
                        preferred_focus: preferredFocus as any
                        // If we want to change target level of plan, that's more complex
                        // usually requires recalculation. For now just sync minutes.
                    });
                }
            } catch (syncErr) {
                console.warn('Settings updated but plan sync failed:', syncErr);
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading || userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary-strong" />
            </div>
        );
    }

    const goalLevels = [
        { label: 'Casual', mins: 15, icon: BookOpen, color: 'text-emerald-500' },
        { label: 'Standard', mins: 30, icon: GraduationCap, color: 'text-primary-strong' },
        { label: 'Intense', mins: 60, icon: Zap, iconColor: 'text-amber-500' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-6 max-w-2xl">
                {/* Header */}
                <div className="mb-10">
                    <Link
                        href="/settings"
                        className="inline-flex items-center gap-2 text-neutral-ink/60 hover:text-neutral-ink font-bold mb-6 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        Back to Settings
                    </Link>
                    <h1 className="text-4xl font-black text-neutral-ink font-display">Study Protocol</h1>
                    <p className="text-neutral-ink/60 font-medium">Fine-tune your training methodology.</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-neutral-gray/10">
                    <form onSubmit={handleSave} className="space-y-10">
                        {/* Daily Goal */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-strong/10 text-primary-strong rounded-xl flex items-center justify-center">
                                    <Clock size={20} />
                                </div>
                                <h3 className="text-xl font-black text-neutral-ink">Daily Training Target</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {goalLevels.map((g) => (
                                    <button
                                        key={g.mins}
                                        type="button"
                                        onClick={() => setDailyGoal(g.mins)}
                                        className={cn(
                                            "p-6 rounded-3xl border-2 transition-all text-left group relative overflow-hidden",
                                            dailyGoal === g.mins
                                                ? "border-primary-strong bg-primary/5 shadow-inner"
                                                : "border-neutral-gray/5 bg-slate-50 hover:border-neutral-gray/20"
                                        )}
                                    >
                                        <g.icon size={24} className={cn("mb-4", dailyGoal === g.mins ? "text-primary-strong" : "text-neutral-ink/20")} />
                                        <p className="text-xs font-black uppercase tracking-widest text-neutral-ink/40 mb-1">{g.label}</p>
                                        <p className="text-2xl font-black text-neutral-ink">{g.mins}</p>
                                        <p className="text-[10px] font-bold text-neutral-ink/40">minutes/day</p>

                                        {dailyGoal === g.mins && (
                                            <div className="absolute top-4 right-4 text-primary-strong">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40 block mb-3">Custom Goal (Minutes)</label>
                                <input
                                    type="range"
                                    min="5"
                                    max="180"
                                    step="5"
                                    value={dailyGoal}
                                    onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                                    className="w-full h-2 bg-neutral-beige rounded-lg appearance-none cursor-pointer accent-primary-strong"
                                />
                                <div className="flex justify-between text-[10px] font-black text-neutral-ink/20 uppercase tracking-widest mt-2">
                                    <span>5 mins</span>
                                    <span className="text-primary-strong bg-primary/10 px-2 py-1 rounded-md">{dailyGoal} mins</span>
                                    <span>3 hours</span>
                                </div>
                            </div>
                        </div>

                        <hr className="border-neutral-gray/5" />

                        {/* JLPT Target Level */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <Target size={20} />
                                </div>
                                <h3 className="text-xl font-black text-neutral-ink">Proficiency Focus</h3>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setPreferredLevel(level)}
                                        className={cn(
                                            "w-16 h-16 rounded-2xl font-black flex items-center justify-center transition-all",
                                            preferredLevel === level
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                                : "bg-slate-50 text-neutral-ink/20 border border-neutral-gray/5 hover:border-neutral-gray/20"
                                        )}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs font-bold text-neutral-ink/40">Your practice recommendations will be prioritized for {preferredLevel}.</p>
                        </div>

                        <hr className="border-neutral-gray/5" />

                        {/* Focus Areas */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-salmon/10 text-brand-salmon rounded-xl flex items-center justify-center">
                                    <Zap size={20} />
                                </div>
                                <h3 className="text-xl font-black text-neutral-ink">Focus Priority</h3>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {['Vocabulary', 'Grammar', 'Kanji', 'Reading', 'Listening'].map((area) => {
                                    const isSelected = preferredFocus.includes(area.toLowerCase());
                                    return (
                                        <button
                                            key={area}
                                            type="button"
                                            onClick={() => {
                                                const val = area.toLowerCase();
                                                setPreferredFocus(prev =>
                                                    prev.includes(val)
                                                        ? prev.filter(a => a !== val)
                                                        : [...prev, val]
                                                );
                                            }}
                                            className={cn(
                                                "p-4 rounded-2xl font-bold text-sm transition-all border flex items-center gap-3",
                                                isSelected
                                                    ? "bg-brand-salmon text-white border-brand-salmon shadow-lg shadow-brand-salmon/20"
                                                    : "bg-slate-50 text-neutral-ink/40 border-neutral-gray/5 hover:border-neutral-gray/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center",
                                                isSelected ? "border-white bg-white/20" : "border-neutral-gray/20"
                                            )}>
                                                {isSelected && <CheckCircle2 size={12} />}
                                            </div>
                                            {area}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs font-bold text-neutral-ink/40">Selected areas will receive more frequent training modules.</p>
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-600 font-bold text-sm">
                                <CheckCircle2 size={20} />
                                Training protocol updated!
                            </div>
                        )}

                        {/* Action Buttons */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-5 bg-primary-strong text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-neutral-ink shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                            {saving ? 'Updating Archive...' : 'Save Study Protocol'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
