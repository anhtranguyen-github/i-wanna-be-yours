'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
    ChevronLeft, ChevronRight, Check, Calendar, Clock,
    Target, Sparkles, AlertCircle, Loader2
} from 'lucide-react';
import {
    JLPTLevel,
    JLPT_LEVELS,
    JLPT_LEVEL_INFO,
    STUDY_TIME_OPTIONS,
    FOCUS_AREAS,
    PlanTemplateDetail,
} from '@/types/studyPlanTypes';
import studyPlanService from '@/services/studyPlanService';
import { useGlobalAuth } from '@/context/GlobalAuthContext';

// Known JLPT exam dates (approximate - July and December)
const getNextExamDates = (): Date[] => {
    const now = new Date();
    const year = now.getFullYear();
    const dates: Date[] = [];

    // July exam (first Sunday)
    const julyExam = new Date(year, 6, 7);
    if (julyExam > now) dates.push(julyExam);

    // December exam (first Sunday)
    const decExam = new Date(year, 11, 1);
    if (decExam > now) dates.push(decExam);

    // Next year dates
    dates.push(new Date(year + 1, 6, 6));
    dates.push(new Date(year + 1, 11, 7));

    return dates.slice(0, 4);
};

import { useStudyPlanStatus } from '@/hooks/useStudyPlanStatus';
import { PlanCheckoutModal } from '@/components/strategy/PlanCheckoutModal';

function SetupWizardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, hasPlan, loading: statusLoading } = useStudyPlanStatus();
    const { openAuth } = useGlobalAuth();

    const [step, setStep] = useState(1);
    const [targetLevel, setTargetLevel] = useState<JLPTLevel | null>(null);
    const [examDate, setExamDate] = useState<Date | null>(null);
    const [customDate, setCustomDate] = useState('');
    const [dailyMinutes, setDailyMinutes] = useState(30);
    const [studyDays, setStudyDays] = useState(5);
    const [focusAreas, setFocusAreas] = useState<string[]>([]);

    const [template, setTemplate] = useState<PlanTemplateDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);

    const nextExamDates = getNextExamDates();

    // Redirect active users with a plan
    useEffect(() => {
        if (!statusLoading && user && hasPlan) {
            router.push('/study-plan/dashboard');
        }
    }, [user, hasPlan, statusLoading, router]);

    // Handle post-login checkout detection
    useEffect(() => {
        if (!statusLoading && user && !hasPlan) {
            const pendingSetup = localStorage.getItem('pending_study_plan_setup');
            if (pendingSetup) {
                try {
                    const data = JSON.parse(pendingSetup);
                    setTargetLevel(data.targetLevel);
                    setExamDate(new Date(data.examDate));
                    setDailyMinutes(data.dailyMinutes);
                    setStudyDays(data.studyDays);
                    setFocusAreas(data.focusAreas);
                    setShowCheckout(true);
                    // Clear the flag so it doesn't pop up again unless they try again
                    localStorage.removeItem('pending_study_plan_setup');
                } catch (e) {
                    console.error('Failed to parse pending setup', e);
                    localStorage.removeItem('pending_study_plan_setup');
                }
            }
        }
    }, [user, hasPlan, statusLoading]);
    // Load template if provided
    useEffect(() => {
        const templateId = searchParams.get('template');
        if (templateId) {
            loadTemplate(templateId);
        }
    }, [searchParams]);

    const loadTemplate = async (id: string) => {
        try {
            setLoading(true);
            const t = await studyPlanService.getTemplate(id);
            setTemplate(t);
            setTargetLevel(t.target_level);
            setDailyMinutes(t.daily_minutes_recommended);
        } catch (err) {
            console.error('Failed to load template:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateDaysUntilExam = (date: Date): number => {
        return Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    };

    const toggleFocusArea = (area: string) => {
        setFocusAreas(prev =>
            prev.includes(area)
                ? prev.filter(a => a !== area)
                : [...prev, area]
        );
    };

    const handleCreatePlan = async () => {
        if (!targetLevel || !examDate) {
            setError('Please complete all required fields');
            return;
        }

        if (!user) {
            // Save setup to local storage for recovery after login
            const setupData = {
                targetLevel,
                examDate: examDate.toISOString(),
                dailyMinutes,
                studyDays,
                focusAreas
            };
            localStorage.setItem('pending_study_plan_setup', JSON.stringify(setupData));

            // Trigger contextual auth for Study Plan
            openAuth('REGISTER', {
                flowType: 'STUDY_PLAN',
                title: "Activate Your Study Plan",
                description: "Your personalized road map is ready. Lock it in and start your journey today."
            });
            return;
        }

        setCreating(true);
        setError('');

        try {
            const result = await studyPlanService.createMyPlan(
                targetLevel,
                examDate,
                {
                    daily_study_minutes: dailyMinutes,
                    study_days_per_week: studyDays,
                    preferred_focus: focusAreas,
                }
            );

            router.push(`/study-plan/dashboard?plan=${result.id}&new=true`);
        } catch (err: any) {
            setError(err.message || 'Failed to create plan');
            setCreating(false);
            setShowCheckout(false);
        }
    };

    const canProceed = {
        1: targetLevel !== null,
        2: examDate !== null,
        3: dailyMinutes > 0,
        4: true, // Review step always valid
    };

    const handleNext = () => {
        if (step < 4 && canProceed[step as keyof typeof canProceed]) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    if (statusLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-brand-salmon" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30 py-12">
            <div className="container mx-auto px-6 max-w-3xl">

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-12">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
                                ${step >= s
                                    ? 'bg-brand-salmon text-white'
                                    : 'bg-gray-200 text-gray-400'
                                }
                            `}>
                                {step > s ? <Check size={18} /> : s}
                            </div>
                            {s < 4 && (
                                <div className={`w-12 h-1 mx-1 rounded ${step > s ? 'bg-brand-salmon' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="clay-card p-8 lg:p-12">

                    {/* Step 1: Select Level */}
                    {step === 1 && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <Target className="w-12 h-12 mx-auto mb-4 text-brand-salmon" />
                                <h2 className="text-2xl font-black text-brand-dark mb-2">
                                    Select Your Target Level
                                </h2>
                                <p className="text-gray-500">
                                    Which JLPT level are you preparing for?
                                </p>
                            </div>

                            <div className="grid gap-4">
                                {JLPT_LEVELS.map((level) => {
                                    const info = JLPT_LEVEL_INFO[level];
                                    const isSelected = targetLevel === level;

                                    return (
                                        <button
                                            key={level}
                                            onClick={() => setTargetLevel(level)}
                                            className={`
                                                p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4
                                                ${isSelected
                                                    ? 'border-brand-salmon bg-brand-salmon/5'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            <div
                                                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0"
                                                style={{ backgroundColor: info.color }}
                                            >
                                                {level}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-brand-dark">{info.name}</h3>
                                                <p className="text-sm text-gray-500">{info.description}</p>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-6 h-6 text-brand-salmon shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Exam Date */}
                    {step === 2 && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <Calendar className="w-12 h-12 mx-auto mb-4 text-brand-salmon" />
                                <h2 className="text-2xl font-black text-brand-dark mb-2">
                                    When is Your Exam?
                                </h2>
                                <p className="text-gray-500">
                                    Select your target JLPT exam date
                                </p>
                            </div>

                            {/* Suggested Exam Dates */}
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-gray-600">Official JLPT Dates:</p>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {nextExamDates.map((date, idx) => {
                                        const isSelected = examDate?.toDateString() === date.toDateString();
                                        const daysUntil = calculateDaysUntilExam(date);
                                        const months = Math.round(daysUntil / 30);

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setExamDate(date)}
                                                className={`
                                                    p-4 rounded-xl border-2 text-left transition-all
                                                    ${isSelected
                                                        ? 'border-brand-salmon bg-brand-salmon/5'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }
                                                `}
                                            >
                                                <div className="font-bold text-brand-dark">
                                                    {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {daysUntil} days ({months} months)
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Date */}
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-sm font-bold text-gray-600 mb-3">Or select a custom date:</p>
                                <input
                                    type="date"
                                    value={customDate}
                                    onChange={(e) => {
                                        setCustomDate(e.target.value);
                                        if (e.target.value) {
                                            setExamDate(new Date(e.target.value));
                                        }
                                    }}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-brand-salmon focus:outline-none text-lg"
                                />
                            </div>

                            {examDate && (
                                <div className="p-4 bg-brand-green/10 rounded-xl flex items-center gap-3">
                                    <Sparkles className="text-brand-green" />
                                    <span className="text-brand-dark font-medium">
                                        {calculateDaysUntilExam(examDate)} days until your exam!
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Study Preferences */}
                    {step === 3 && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <Clock className="w-12 h-12 mx-auto mb-4 text-brand-salmon" />
                                <h2 className="text-2xl font-black text-brand-dark mb-2">
                                    Set Your Study Preferences
                                </h2>
                                <p className="text-gray-500">
                                    How much time can you dedicate daily?
                                </p>
                            </div>

                            {/* Daily Minutes */}
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-3">
                                    Daily study time:
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
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-3">
                                    Days per week:
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
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-3">
                                    Focus areas <span className="text-gray-400 font-normal">(optional)</span>:
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
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-sm text-gray-500 mb-1">Weekly study time:</div>
                                <div className="text-2xl font-black text-brand-dark">
                                    {Math.round((dailyMinutes * studyDays) / 60 * 10) / 10} hours/week
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review & Confirm */}
                    {step === 4 && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <Sparkles className="w-12 h-12 mx-auto mb-4 text-brand-salmon" />
                                <h2 className="text-2xl font-black text-brand-dark mb-2">
                                    Review Your Plan
                                </h2>
                                <p className="text-gray-500">
                                    Confirm your study plan details
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Summary Cards */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-5 bg-gray-50 rounded-xl">
                                        <div className="text-sm text-gray-500 mb-1">Target Level</div>
                                        <div className="text-xl font-black text-brand-dark flex items-center gap-2">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                                style={{ backgroundColor: targetLevel ? JLPT_LEVEL_INFO[targetLevel].color : '#ccc' }}
                                            >
                                                {targetLevel}
                                            </div>
                                            {targetLevel && JLPT_LEVEL_INFO[targetLevel].name}
                                        </div>
                                    </div>

                                    <div className="p-5 bg-gray-50 rounded-xl">
                                        <div className="text-sm text-gray-500 mb-1">Exam Date</div>
                                        <div className="text-xl font-black text-brand-dark">
                                            {examDate?.toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {examDate && `${calculateDaysUntilExam(examDate)} days remaining`}
                                        </div>
                                    </div>

                                    <div className="p-5 bg-gray-50 rounded-xl">
                                        <div className="text-sm text-gray-500 mb-1">Daily Study</div>
                                        <div className="text-xl font-black text-brand-dark">
                                            {dailyMinutes} minutes
                                        </div>
                                    </div>

                                    <div className="p-5 bg-gray-50 rounded-xl">
                                        <div className="text-sm text-gray-500 mb-1">Weekly Schedule</div>
                                        <div className="text-xl font-black text-brand-dark">
                                            {studyDays} days/week
                                        </div>
                                    </div>
                                </div>

                                {focusAreas.length > 0 && (
                                    <div className="p-5 bg-gray-50 rounded-xl">
                                        <div className="text-sm text-gray-500 mb-2">Focus Areas</div>
                                        <div className="flex flex-wrap gap-2">
                                            {focusAreas.map(area => (
                                                <span key={area} className="px-3 py-1 bg-brand-sky/20 text-brand-sky rounded-full text-sm font-bold capitalize">
                                                    {area}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
                                    <AlertCircle size={20} />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                        <button
                            onClick={step === 1 ? () => router.push('/study-plan') : handleBack}
                            className="flex items-center gap-2 text-gray-500 hover:text-brand-dark transition-colors font-bold"
                        >
                            <ChevronLeft size={20} />
                            {step === 1 ? 'Back to Templates' : 'Back'}
                        </button>

                        {step < 4 ? (
                            <button
                                onClick={handleNext}
                                disabled={!canProceed[step as keyof typeof canProceed]}
                                className={`
                                    btnPrimary flex items-center gap-2
                                    ${!canProceed[step as keyof typeof canProceed] ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                Continue
                                <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleCreatePlan}
                                disabled={creating}
                                className="btnPrimary flex items-center gap-2"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create My Plan
                                        <Sparkles size={20} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Post-Login Confirmation Modal */}
                {targetLevel && examDate && (
                    <PlanCheckoutModal
                        isOpen={showCheckout}
                        onClose={() => setShowCheckout(false)}
                        onConfirm={handleCreatePlan}
                        planSummary={{
                            targetLevel,
                            examDate,
                            dailyMinutes,
                            studyDays,
                            focusAreas
                        }}
                        loading={creating}
                    />
                )}
            </div>
        </div>
    );
}

export default function SetupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-brand-salmon" />
            </div>
        }>
            <SetupWizardContent />
        </Suspense>
    );
}
