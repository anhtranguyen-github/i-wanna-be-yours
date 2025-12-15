'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
    ChevronLeft, Target, CheckCircle2, Lock, Clock,
    Loader2, AlertCircle, Play, Calendar, Award
} from 'lucide-react';
import {
    StudyPlanDetail,
    JLPT_LEVEL_INFO,
    Milestone,
} from '@/types/studyPlanTypes';
import studyPlanService from '@/services/studyPlanService';

interface Assessment {
    id: string;
    type: 'diagnostic' | 'milestone' | 'mock_exam';
    title: string;
    description: string;
    milestone_number?: number;
    status: 'locked' | 'available' | 'completed';
    lock_reason?: string;
    score?: number;
    completed_at?: string;
    estimated_minutes: number;
}

function AssessmentsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: userLoading } = useUser();

    const [plan, setPlan] = useState<StudyPlanDetail | null>(null);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            loadData();
        }
    }, [user, userLoading]);

    const loadData = async () => {
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

                // Generate assessments based on milestones
                const generatedAssessments = generateAssessments(planData);
                setAssessments(generatedAssessments);
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateAssessments = (planData: StudyPlanDetail): Assessment[] => {
        const result: Assessment[] = [];

        // Diagnostic test (always first)
        result.push({
            id: `diagnostic-${planData.id}`,
            type: 'diagnostic',
            title: `${planData.target_level} Diagnostic Test`,
            description: 'Assess your current level to personalize your study plan',
            status: planData.overall_progress_percent > 0 ? 'completed' : 'available',
            score: planData.overall_progress_percent > 0 ? 65 : undefined,
            completed_at: planData.overall_progress_percent > 0 ? planData.start_date : undefined,
            estimated_minutes: 30,
        });

        // Milestone assessments
        planData.milestones.forEach((milestone, idx) => {
            const prevMilestone = idx > 0 ? planData.milestones[idx - 1] : null;
            const isLocked = prevMilestone && prevMilestone.status !== 'completed';

            result.push({
                id: `milestone-${milestone.id}`,
                type: 'milestone',
                title: `${milestone.title} Quiz`,
                description: `Test your progress on milestone ${milestone.milestone_number}`,
                milestone_number: milestone.milestone_number,
                status: milestone.status === 'completed' ? 'completed' : isLocked ? 'locked' : 'available',
                lock_reason: isLocked ? `Complete milestone ${prevMilestone!.milestone_number} first` : undefined,
                score: milestone.status === 'completed' ? 85 : undefined,
                completed_at: milestone.actual_end_date || undefined,
                estimated_minutes: 15,
            });
        });

        // Final mock exam
        const allMilestonesComplete = planData.milestones.every(m => m.status === 'completed');
        result.push({
            id: `mock-${planData.id}`,
            type: 'mock_exam',
            title: `${planData.target_level} Mock Exam`,
            description: 'Full practice exam simulating the real JLPT test',
            status: allMilestonesComplete ? 'available' : 'locked',
            lock_reason: !allMilestonesComplete ? 'Complete all milestones first' : undefined,
            estimated_minutes: 120,
        });

        return result;
    };

    const getAssessmentIcon = (type: Assessment['type']) => {
        switch (type) {
            case 'diagnostic': return Target;
            case 'milestone': return CheckCircle2;
            case 'mock_exam': return Award;
        }
    };

    const getAssessmentColor = (type: Assessment['type']) => {
        switch (type) {
            case 'diagnostic': return 'bg-blue-500';
            case 'milestone': return 'bg-brand-salmon';
            case 'mock_exam': return 'bg-purple-500';
        }
    };

    const handleStartAssessment = (assessment: Assessment) => {
        if (assessment.status === 'locked') return;

        // Navigate to quiz page with assessment context
        router.push(`/practice/quiz?type=${assessment.type}&plan=${plan?.id}&assessment=${assessment.id}`);
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
                        <Target className="w-16 h-16 mx-auto mb-6 text-gray-300" />
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
    const completedCount = assessments.filter(a => a.status === 'completed').length;
    const availableCount = assessments.filter(a => a.status === 'available').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30 py-8">
            <div className="container mx-auto px-6 max-w-4xl">

                {/* Back Link */}
                <Link
                    href={`/study-plan/dashboard?plan=${plan.id}`}
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-dark transition-colors font-bold mb-6"
                >
                    <ChevronLeft size={20} />
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="clay-card p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className="px-3 py-1 rounded-lg text-white font-bold text-sm"
                                    style={{ backgroundColor: levelInfo.color }}
                                >
                                    {plan.target_level}
                                </div>
                                <h1 className="text-xl font-black text-brand-dark">
                                    Assessments
                                </h1>
                            </div>
                            <p className="text-gray-500 text-sm">
                                Track your progress with quizzes and mock exams
                            </p>
                        </div>

                        <div className="text-right">
                            <div className="text-2xl font-black text-brand-dark">
                                {completedCount}/{assessments.length}
                            </div>
                            <div className="text-xs text-gray-500">Completed</div>
                        </div>
                    </div>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="clay-card p-4 text-center">
                        <div className="text-2xl font-black text-brand-green">{completedCount}</div>
                        <div className="text-xs text-gray-500 font-medium">Completed</div>
                    </div>
                    <div className="clay-card p-4 text-center">
                        <div className="text-2xl font-black text-brand-salmon">{availableCount}</div>
                        <div className="text-xs text-gray-500 font-medium">Available</div>
                    </div>
                    <div className="clay-card p-4 text-center">
                        <div className="text-2xl font-black text-gray-400">
                            {assessments.filter(a => a.status === 'locked').length}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Locked</div>
                    </div>
                </div>

                {/* Assessments List */}
                <div className="space-y-4">
                    {assessments.map((assessment) => {
                        const Icon = getAssessmentIcon(assessment.type);
                        const isLocked = assessment.status === 'locked';
                        const isCompleted = assessment.status === 'completed';

                        return (
                            <div
                                key={assessment.id}
                                className={`
                                    clay-card p-6 transition-all
                                    ${isLocked ? 'opacity-60' : 'hover:-translate-y-1'}
                                    ${isCompleted ? 'bg-brand-green/5 border-2 border-brand-green/20' : ''}
                                `}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`
                                        w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
                                        ${isCompleted
                                            ? 'bg-brand-green text-white'
                                            : isLocked
                                                ? 'bg-gray-200 text-gray-400'
                                                : `${getAssessmentColor(assessment.type)} text-white`
                                        }
                                    `}>
                                        {isLocked ? (
                                            <Lock size={24} />
                                        ) : isCompleted ? (
                                            <CheckCircle2 size={24} />
                                        ) : (
                                            <Icon size={24} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`
                                                px-2 py-0.5 rounded text-xs font-bold uppercase
                                                ${assessment.type === 'diagnostic' ? 'bg-blue-100 text-blue-700' : ''}
                                                ${assessment.type === 'milestone' ? 'bg-brand-salmon/10 text-brand-salmon' : ''}
                                                ${assessment.type === 'mock_exam' ? 'bg-purple-100 text-purple-700' : ''}
                                            `}>
                                                {assessment.type.replace('_', ' ')}
                                            </span>
                                            {assessment.milestone_number && (
                                                <span className="text-xs text-gray-400">
                                                    Milestone {assessment.milestone_number}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className={`font-bold text-lg ${isLocked ? 'text-gray-400' : 'text-brand-dark'}`}>
                                            {assessment.title}
                                        </h3>

                                        <p className="text-sm text-gray-500 mb-3">
                                            {assessment.description}
                                        </p>

                                        {/* Meta Info */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1 text-gray-400">
                                                <Clock size={14} />
                                                ~{assessment.estimated_minutes} min
                                            </div>

                                            {isCompleted && assessment.score !== undefined && (
                                                <div className="flex items-center gap-1 text-brand-green font-bold">
                                                    <Award size={14} />
                                                    Score: {assessment.score}%
                                                </div>
                                            )}

                                            {isCompleted && assessment.completed_at && (
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <Calendar size={14} />
                                                    {new Date(assessment.completed_at).toLocaleDateString()}
                                                </div>
                                            )}

                                            {isLocked && assessment.lock_reason && (
                                                <div className="flex items-center gap-1 text-yellow-600">
                                                    <AlertCircle size={14} />
                                                    {assessment.lock_reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="shrink-0">
                                        {isLocked ? (
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                                <Lock size={20} className="text-gray-300" />
                                            </div>
                                        ) : isCompleted ? (
                                            <button
                                                onClick={() => handleStartAssessment(assessment)}
                                                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-all"
                                            >
                                                Retake
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStartAssessment(assessment)}
                                                className="px-4 py-2 rounded-xl bg-brand-salmon text-white font-bold text-sm hover:bg-brand-salmon/90 transition-all flex items-center gap-2"
                                            >
                                                <Play size={16} />
                                                Start
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info Box */}
                <div className="mt-8 p-6 bg-brand-sky/10 rounded-2xl border border-brand-sky/20">
                    <h3 className="font-bold text-brand-dark mb-2">How Assessments Work</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• <strong>Diagnostic Test:</strong> Take first to assess your starting level</li>
                        <li>• <strong>Milestone Quizzes:</strong> Unlock as you progress through milestones</li>
                        <li>• <strong>Mock Exam:</strong> Full practice test, available after completing all milestones</li>
                        <li>• Results update your SRS cards and milestone progress</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function AssessmentsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-brand-salmon" />
            </div>
        }>
            <AssessmentsContent />
        </Suspense>
    );
}
