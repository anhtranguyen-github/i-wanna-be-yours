'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
    ChevronLeft, Settings, Clock, Calendar, Target,
    Loader2, Save, AlertCircle, Trash2, Pause, Play
} from 'lucide-react';
import {
    StudyPlanDetail,
    JLPT_LEVEL_INFO,
    STUDY_TIME_OPTIONS,
    FOCUS_AREAS,
} from '@/types/studyPlanTypes';
import studyPlanService from '@/services/studyPlanService';

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: userLoading } = useUser();

    const [plan, setPlan] = useState<StudyPlanDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [dailyMinutes, setDailyMinutes] = useState(30);
    const [studyDays, setStudyDays] = useState(5);
    const [focusAreas, setFocusAreas] = useState<string[]>([]);

    // Danger zone
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            loadPlan();
        }
    }, [user, userLoading]);

    const loadPlan = async () => {
        try {
            setLoading(true);
            const planId = searchParams.get('plan');

            let planData: StudyPlanDetail | null = null;

            if (planId) {
                planData = await studyPlanService.getPlan(planId);
            } else {
                planData = await studyPlanService.getActivePlan();
            }

            if (planData) {
                setPlan(planData);
                setDailyMinutes(planData.daily_study_minutes);
                setStudyDays(planData.study_days_per_week);
                setFocusAreas(planData.preferred_focus);
            }
        } catch (err) {
            console.error('Failed to load plan:', err);
            setError('Failed to load plan settings');
        } finally {
            setLoading(false);
        }
    };

    const toggleFocusArea = (area: string) => {
        setFocusAreas(prev =>
            prev.includes(area)
                ? prev.filter(a => a !== area)
                : [...prev, area]
        );
    };

    const handleSaveSettings = async () => {
        if (!plan) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await studyPlanService.updatePlan(plan.id, {
                daily_study_minutes: dailyMinutes,
                study_days_per_week: studyDays,
                preferred_focus: focusAreas,
            });

            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handlePausePlan = async () => {
        if (!plan) return;

        try {
            const newStatus = plan.status === 'active' ? 'paused' : 'active';
            await studyPlanService.updatePlan(plan.id, { status: newStatus });
            setPlan({ ...plan, status: newStatus as any });
        } catch (err: any) {
            setError(err.message || 'Failed to update plan status');
        }
    };

    const handleDeletePlan = async () => {
        if (!plan) return;

        setDeleting(true);
        try {
            await studyPlanService.deletePlan(plan.id);
            router.push('/study-plan');
        } catch (err: any) {
            setError(err.message || 'Failed to delete plan');
            setDeleting(false);
        }
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-brand-salmon" />
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30 py-12">
                <div className="container mx-auto px-6 max-w-2xl text-center">
                    <div className="clay-card p-12">
                        <Settings className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                        <h2 className="text-2xl font-black text-brand-dark mb-4">
                            No Study Plan Found
                        </h2>
                        <Link href="/study-plan" className="btnPrimary">
                            Create Study Plan
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const levelInfo = JLPT_LEVEL_INFO[plan.target_level];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30 py-8">
            <div className="container mx-auto px-6 max-w-3xl">

                {/* Back Link */}
                <Link
                    href={`/study-plan/dashboard?plan=${plan.id}`}
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-dark transition-colors font-bold mb-6"
                >
                    <ChevronLeft size={20} />
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Settings className="w-10 h-10 text-brand-salmon" />
                    <div>
                        <h1 className="text-2xl font-black text-brand-dark">Plan Settings</h1>
                        <p className="text-gray-500">
                            {plan.target_level} • {plan.status === 'active' ? 'Active' : 'Paused'}
                        </p>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-brand-green/10 border border-brand-green/30 rounded-xl flex items-center gap-3 text-brand-green font-bold">
                        <Save size={20} />
                        {success}
                    </div>
                )}

                {/* Plan Info (Read-only) */}
                <div className="clay-card p-6 mb-6">
                    <h2 className="text-lg font-black text-brand-dark mb-4">Plan Information</h2>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="text-sm text-gray-500 mb-1">Target Level</div>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                    style={{ backgroundColor: levelInfo.color }}
                                >
                                    {plan.target_level}
                                </div>
                                <span className="font-bold text-brand-dark">{levelInfo.name}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="text-sm text-gray-500 mb-1">Exam Date</div>
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-gray-400" />
                                <span className="font-bold text-brand-dark">
                                    {new Date(plan.exam_date).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="text-sm text-gray-500 mb-1">Days Remaining</div>
                            <div className="flex items-center gap-2">
                                <Target size={18} className="text-gray-400" />
                                <span className="font-bold text-brand-dark">{plan.days_remaining} days</span>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="text-sm text-gray-500 mb-1">Progress</div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-salmon rounded-full"
                                        style={{ width: `${plan.overall_progress_percent}%` }}
                                    />
                                </div>
                                <span className="font-bold text-brand-dark">{Math.round(plan.overall_progress_percent)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Study Preferences */}
                <div className="clay-card p-6 mb-6">
                    <h2 className="text-lg font-black text-brand-dark mb-6">Study Preferences</h2>

                    {/* Daily Study Time */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-600 mb-3">
                            <Clock size={16} className="inline mr-2" />
                            Daily study time
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {STUDY_TIME_OPTIONS.map((mins) => (
                                <button
                                    key={mins}
                                    onClick={() => setDailyMinutes(mins)}
                                    className={`
                                        py-3 rounded-xl font-bold transition-all text-sm
                                        ${dailyMinutes === mins
                                            ? 'bg-brand-salmon text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    {mins} min
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Study Days Per Week */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-600 mb-3">
                            <Calendar size={16} className="inline mr-2" />
                            Days per week
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[5, 6, 7].map((days) => (
                                <button
                                    key={days}
                                    onClick={() => setStudyDays(days)}
                                    className={`
                                        py-3 rounded-xl font-bold transition-all
                                        ${studyDays === days
                                            ? 'bg-brand-salmon text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    {days} days
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Focus Areas */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-600 mb-3">
                            <Target size={16} className="inline mr-2" />
                            Focus areas
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {FOCUS_AREAS.map((area) => (
                                <button
                                    key={area}
                                    onClick={() => toggleFocusArea(area)}
                                    className={`
                                        px-4 py-2 rounded-full font-bold text-sm transition-all capitalize
                                        ${focusAreas.includes(area)
                                            ? 'bg-brand-sky text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    {area}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Estimated weekly hours */}
                    <div className="p-4 bg-gray-50 rounded-xl mb-6">
                        <div className="text-sm text-gray-500 mb-1">Weekly study time:</div>
                        <div className="text-2xl font-black text-brand-dark">
                            {Math.round((dailyMinutes * studyDays) / 60 * 10) / 10} hours/week
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="btnPrimary w-full flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="clay-card p-6 border-2 border-red-100">
                    <h2 className="text-lg font-black text-red-600 mb-4">Danger Zone</h2>

                    <div className="space-y-4">
                        {/* Pause/Resume */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <h3 className="font-bold text-brand-dark">
                                    {plan.status === 'active' ? 'Pause Plan' : 'Resume Plan'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {plan.status === 'active'
                                        ? 'Temporarily pause your study plan'
                                        : 'Resume your paused study plan'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={handlePausePlan}
                                className={`
                                    px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all
                                    ${plan.status === 'active'
                                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                        : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20'
                                    }
                                `}
                            >
                                {plan.status === 'active' ? (
                                    <>
                                        <Pause size={18} />
                                        Pause
                                    </>
                                ) : (
                                    <>
                                        <Play size={18} />
                                        Resume
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Delete Plan */}
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                            <div>
                                <h3 className="font-bold text-red-600">Abandon Plan</h3>
                                <p className="text-sm text-red-400">
                                    Permanently abandon this study plan
                                </p>
                            </div>

                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-2 rounded-xl font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    Abandon
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-2 rounded-xl font-bold bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeletePlan}
                                        disabled={deleting}
                                        className="px-4 py-2 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all flex items-center gap-2"
                                    >
                                        {deleting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                        Confirm
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-brand-salmon" />
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}
