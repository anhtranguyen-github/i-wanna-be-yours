'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
    ChevronLeft, CheckCircle2, Target, Calendar, Loader2,
    BookOpen, Play, AlertCircle
} from 'lucide-react';
import { Milestone } from '@/types/studyPlanTypes';
import studyPlanService from '@/services/studyPlanService';

export default function MilestoneDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user, loading: userLoading } = useUser();

    const [milestone, setMilestone] = useState<Milestone | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [error, setError] = useState('');

    const milestoneId = params.id as string;

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && milestoneId) {
            loadMilestone();
        }
    }, [user, userLoading, milestoneId]);

    const loadMilestone = async () => {
        try {
            setLoading(true);
            const data = await studyPlanService.getMilestone(milestoneId);
            setMilestone(data);
        } catch (err) {
            console.error('Failed to load milestone:', err);
            setError('Failed to load milestone');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteMilestone = async () => {
        if (!milestone) return;

        setCompleting(true);
        try {
            await studyPlanService.completeMilestone(milestoneId);
            setMilestone({ ...milestone, status: 'completed', progress_percent: 100 });
        } catch (err: any) {
            setError(err.message || 'Failed to complete milestone');
        } finally {
            setCompleting(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed':
                return { bg: 'bg-brand-green/10', text: 'text-brand-green', badge: 'bg-brand-green' };
            case 'in_progress':
                return { bg: 'bg-yellow-50', text: 'text-yellow-600', badge: 'bg-yellow-500' };
            case 'overdue':
                return { bg: 'bg-red-50', text: 'text-red-500', badge: 'bg-red-500' };
            default:
                return { bg: 'bg-gray-50', text: 'text-neutral-ink', badge: 'bg-gray-400' };
        }
    };

    const getCriteriaIcon = (type: string) => {
        switch (type) {
            case 'vocab_count':
            case 'kanji_count':
                return '📚';
            case 'grammar_points':
                return '✏️';
            case 'quiz_score':
                return '🎯';
            case 'reading_speed':
                return '📖';
            default:
                return '📋';
        }
    };

    const getRecommendedActions = () => {
        if (!milestone) return [];

        const actions: { icon: any; title: string; description: string; href: string }[] = [];

        const category = milestone.category;

        if (category === 'vocabulary' || category === 'mixed') {
            actions.push({
                icon: BookOpen,
                title: 'Learn New Vocabulary',
                description: 'Study flashcards to build your vocabulary',
                href: '/flashcards',
            });
        }

        if (category === 'grammar' || category === 'mixed') {
            actions.push({
                icon: BookOpen,
                title: 'Study Grammar',
                description: 'Review grammar patterns for this milestone',
                href: '/knowledge-base',
            });
        }

        if (category === 'kanji' || category === 'mixed') {
            actions.push({
                icon: BookOpen,
                title: 'Practice Kanji',
                description: 'Learn kanji readings and meanings',
                href: '/knowledge-base/kanji',
            });
        }

        actions.push({
            icon: Target,
            title: 'Take a Quiz',
            description: 'Test your knowledge with a practice quiz',
            href: '/practice/quiz',
        });

        return actions;
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-brand-salmon" />
            </div>
        );
    }

    if (!milestone) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30 py-12">
                <div className="container mx-auto px-6 max-w-2xl text-center">
                    <div className="clay-card p-12">
                        <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-400" />
                        <h2 className="text-2xl font-black text-brand-dark mb-4">
                            Milestone Not Found
                        </h2>
                        <p className="text-neutral-ink mb-6">{error || 'Could not load this milestone.'}</p>
                        <Link href="/study-plan/dashboard" className="btnPrimary">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const statusStyles = getStatusStyles(milestone.status);
    const recommendedActions = getRecommendedActions();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30 py-8">
            <div className="container mx-auto px-6 max-w-3xl">

                {/* Back Link */}
                <Link
                    href={`/study-plan/milestones?plan=${milestone.plan_id}`}
                    className="inline-flex items-center gap-2 text-neutral-ink hover:text-brand-dark transition-colors font-bold mb-6"
                >
                    <ChevronLeft size={20} />
                    Back to Milestones
                </Link>

                {/* Milestone Header */}
                <div className={`clay-card p-8 mb-6 ${statusStyles.bg}`}>
                    <div className="flex items-start gap-4">
                        <div className={`
                            w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0
                            ${statusStyles.badge}
                        `}>
                            {milestone.status === 'completed' ? (
                                <CheckCircle2 size={32} />
                            ) : (
                                milestone.milestone_number
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`
                                    px-3 py-1 rounded-lg text-xs font-bold text-white capitalize
                                    ${statusStyles.badge}
                                `}>
                                    {milestone.status.replace('_', ' ')}
                                </span>
                                <span className="px-3 py-1 bg-white/50 text-neutral-ink rounded-lg text-xs font-bold capitalize">
                                    {milestone.category}
                                </span>
                            </div>

                            <h1 className="text-2xl font-black text-brand-dark mb-2">
                                {milestone.title}
                            </h1>

                            <p className="text-neutral-ink">
                                {milestone.description}
                            </p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="mt-6 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-neutral-ink">
                            <Calendar size={16} />
                            <span>
                                {new Date(milestone.target_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {' - '}
                                {new Date(milestone.target_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>

                        {milestone.actual_end_date && (
                            <div className="flex items-center gap-2 text-brand-green font-bold">
                                <CheckCircle2 size={16} />
                                Completed {new Date(milestone.actual_end_date).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Section */}
                <div className="clay-card p-6 mb-6">
                    <h2 className="text-lg font-black text-brand-dark mb-4">Progress</h2>

                    {/* Overall Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-neutral-ink">Overall Milestone Progress</span>
                            <span className="font-bold text-brand-dark">{Math.round(milestone.progress_percent)}%</span>
                        </div>
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${milestone.status === 'completed'
                                    ? 'bg-brand-green'
                                    : 'bg-gradient-to-r from-brand-salmon to-brand-sky'
                                    }`}
                                style={{ width: `${milestone.progress_percent}%` }}
                            />
                        </div>
                    </div>

                    {/* Criteria */}
                    <h3 className="text-sm font-bold text-neutral-ink mb-3">Goals</h3>
                    <div className="space-y-4">
                        {milestone.criteria.map((criterion, idx) => {
                            const progress = criterion.target_value > 0
                                ? ((criterion.current_value ?? 0) / criterion.target_value) * 100
                                : 0;
                            const isComplete = progress >= 100;

                            return (
                                <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{getCriteriaIcon(criterion.type)}</span>
                                            <span className="font-bold text-brand-dark capitalize">
                                                {criterion.type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        {isComplete && (
                                            <CheckCircle2 className="text-brand-green" size={20} />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-neutral-ink">
                                            {criterion.current_value ?? 0} / {criterion.target_value} {criterion.unit}
                                        </span>
                                        <span className={`font-bold ${isComplete ? 'text-brand-green' : 'text-brand-dark'}`}>
                                            {Math.min(100, Math.round(progress))}%
                                        </span>
                                    </div>

                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${isComplete ? 'bg-brand-green' : 'bg-brand-salmon'
                                                }`}
                                            style={{ width: `${Math.min(100, progress)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recommended Actions */}
                {milestone.status !== 'completed' && (
                    <div className="clay-card p-6 mb-6">
                        <h2 className="text-lg font-black text-brand-dark mb-4">Recommended Actions</h2>

                        <div className="space-y-3">
                            {recommendedActions.map((action, idx) => (
                                <Link
                                    key={idx}
                                    href={action.href}
                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-brand-salmon/5 transition-colors group"
                                >
                                    <div className="p-3 rounded-xl bg-white border border-gray-100 group-hover:bg-brand-salmon group-hover:text-white transition-all">
                                        <action.icon size={24} className="text-brand-salmon group-hover:text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-brand-dark group-hover:text-brand-salmon transition-colors">
                                            {action.title}
                                        </h3>
                                        <p className="text-sm text-neutral-ink">{action.description}</p>
                                    </div>
                                    <Play size={20} className="text-neutral-ink group-hover:text-brand-salmon transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {milestone.status !== 'completed' && (
                    <div className="flex justify-end gap-4">
                        {error && (
                            <div className="flex-1 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleCompleteMilestone}
                            disabled={completing}
                            className="btnPrimary flex items-center gap-2"
                        >
                            {completing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Completing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={20} />
                                    Mark as Complete
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Completed Message */}
                {milestone.status === 'completed' && (
                    <div className="clay-card p-6 bg-brand-green/10 border-2 border-brand-green/30 text-center">
                        <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto mb-3" />
                        <h3 className="text-xl font-black text-brand-dark mb-2">Milestone Complete!</h3>
                        <p className="text-neutral-ink">
                            Great job! You&apos;ve successfully completed this milestone.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
