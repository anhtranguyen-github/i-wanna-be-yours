"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Sparkles, Plus, User } from "lucide-react";
import { ModeSelector, FilterBar, PracticeCard } from "@/components/practice";
import { mockExamConfigs, filterExams } from "@/data/mockPractice";
import { PracticeMode, JLPTLevel, SkillType, FilterState, ExamAttempt, UserCreatedExam } from "@/types/practice";
import { CreateExamModal } from "@/components/jlpt/CreateExamModal";
import { PersonalCollections } from "@/components/jlpt/PersonalCollections";
import { useUser } from "@/context/UserContext";
import * as jlptService from "@/services/jlptService";

// View mode for the page
type PageView = 'browse' | 'personal';

// Local storage keys
const STORAGE_KEYS = {
    attempts: 'hanabira_jlpt_attempts',
    userExams: 'hanabira_jlpt_user_exams',
};

export default function JLPTPracticePage() {
    const router = useRouter();
    const { user } = useUser();

    // View state
    const [pageView, setPageView] = useState<PageView>('browse');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filter State
    const [filters, setFilters] = useState<FilterState>({
        mode: "ALL",
        level: "ALL",
        skill: "ALL",
    });

    // Personal Collections State
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [userExams, setUserExams] = useState<UserCreatedExam[]>([]);
    const [collectionsLoading, setCollectionsLoading] = useState(true);

    // Load personal collections (localStorage + API if logged in)
    useEffect(() => {
        const loadCollections = async () => {
            setCollectionsLoading(true);

            // 1. Initial load from localStorage (instant)
            try {
                const localAttempts = jlptService.getLocalAttempts();
                const localExams = jlptService.getLocalUserExams();
                setAttempts(localAttempts);
                setUserExams(localExams);
            } catch (e) { console.error(e); }

            // 2. If logged in, sync with API
            if (user) {
                try {
                    const [apiAttempts, apiExams] = await Promise.all([
                        jlptService.getAttempts(),
                        jlptService.getUserExams()
                    ]);

                    if (apiAttempts.attempts.length > 0) {
                        setAttempts(apiAttempts.attempts);
                    }

                    if (apiExams.exams.length > 0) {
                        setUserExams(apiExams.exams);
                    }
                } catch (e) {
                    console.warn('API sync failed:', e);
                }
            }

            setCollectionsLoading(false);
        };

        loadCollections();
    }, [user]);

    // Filtered exams
    const filteredExams = useMemo(() => {
        return filterExams(filters.mode, filters.level, filters.skill);
    }, [filters]);

    // Combined exams (mock + user exams in browse mode)
    const allExams = useMemo(() => {
        // Convert user exams to exam configs for display
        const userExamConfigs = userExams.map(ue => ({
            ...ue.config,
            id: ue.id,
        }));

        // Filter user exams same as mock exams
        const filteredUserExams = userExamConfigs.filter(exam => {
            if (filters.mode !== 'ALL' && exam.mode !== filters.mode) return false;
            if (filters.level !== 'ALL' && exam.level !== filters.level) return false;
            if (filters.skill !== 'ALL' && !exam.skills.includes(filters.skill as SkillType)) return false;
            return true;
        });

        return [...filteredExams, ...filteredUserExams];
    }, [filteredExams, userExams, filters]);

    // Handlers
    const handleModeChange = (mode: PracticeMode) => {
        setFilters((prev) => ({
            ...prev,
            mode,
            skill: mode === "FULL_EXAM" ? "ALL" : prev.skill,
        }));
    };

    const handleLevelChange = (level: JLPTLevel | "ALL") => {
        setFilters((prev) => ({ ...prev, level }));
    };

    const handleSkillChange = (skill: SkillType | "ALL") => {
        setFilters((prev) => ({ ...prev, skill }));
    };

    const handleStartExam = (examId: string) => {
        router.push(`/jlpt/${examId}`);
    };

    const handleExamCreated = (examId: string) => {
        setShowCreateModal(false);
        // Navigate to the new exam
        router.push(`/jlpt/${examId}`);
    };

    // Personal Collections Handlers
    const handleRetakeExam = (examId: string) => {
        router.push(`/jlpt/${examId}`);
    };

    const handleReviewAttempt = (attemptId: string) => {
        const attempt = attempts.find(a => a.id === attemptId);
        if (attempt) {
            router.push(`/jlpt/${attempt.examId}/result?review=${attemptId}`);
        }
    };

    const handleEditExam = (examId: string) => {
        // TODO: Implement edit modal
        console.log('Edit exam:', examId);
    };

    const handleDeleteExam = async (examId: string) => {
        // If logged in, delete from API
        if (user) {
            try {
                await jlptService.deleteExam(examId);
            } catch (e) {
                console.error('Delete API failed:', e);
            }
        }

        // Always delete from local
        const updated = userExams.filter(e => e.id !== examId);
        setUserExams(updated);
        jlptService.deleteLocalUserExam(examId);
    };

    const totalPersonalItems = attempts.length + userExams.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        {/* Back & Title */}
                        <div className="flex items-center gap-4">
                            <Link
                                href="/practice"
                                className="flex items-center gap-2 text-slate-500 hover:text-brand-green transition-colors"
                            >
                                <ArrowLeft size={20} />
                                <span className="text-sm font-medium hidden sm:inline">Back</span>
                            </Link>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                    <GraduationCap size={26} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-brand-dark">
                                        JLPT Practice
                                    </h1>
                                    <p className="text-xs text-slate-500">
                                        Quizzes, exams & full simulations
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            {/* Stats Badge */}
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                                <Sparkles size={18} className="text-amber-500" />
                                <span className="text-sm font-semibold text-amber-700">
                                    {mockExamConfigs.length} Tests Available
                                </span>
                            </div>

                            {/* Create New Exam Button */}
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green/90 transition-colors shadow-lg shadow-emerald-200"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">Create Exam</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* View Switcher */}
                <div className="mb-6 flex items-center gap-4">
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                        <button
                            onClick={() => setPageView('browse')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pageView === 'browse'
                                ? 'bg-white shadow text-brand-green'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <GraduationCap size={16} className="inline mr-2" />
                            Browse Exams
                        </button>
                        <button
                            onClick={() => setPageView('personal')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${pageView === 'personal'
                                ? 'bg-white shadow text-brand-green'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <User size={16} />
                            My Collection
                            {totalPersonalItems > 0 && (
                                <span className="px-1.5 py-0.5 bg-brand-green text-white text-xs rounded-full font-bold">
                                    {totalPersonalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {pageView === 'browse' ? (
                    <>
                        {/* Mode Selector */}
                        <div className="mb-6">
                            <ModeSelector selectedMode={filters.mode} onModeChange={handleModeChange} />
                        </div>

                        {/* Filter Bar */}
                        <div className="mb-8">
                            <FilterBar
                                selectedLevel={filters.level}
                                selectedSkill={filters.skill}
                                selectedMode={filters.mode}
                                onLevelChange={handleLevelChange}
                                onSkillChange={handleSkillChange}
                            />
                        </div>

                        {/* Results Count */}
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Showing <span className="font-bold text-brand-dark">{allExams.length}</span> results
                            </p>
                        </div>

                        {/* Exam Cards Grid */}
                        {allExams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {allExams.map((exam) => (
                                    <PracticeCard key={exam.id} config={exam} onStart={handleStartExam} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                                    <GraduationCap size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-600 mb-2">No Tests Found</h3>
                                <p className="text-sm text-slate-400 max-w-md mx-auto">
                                    Try adjusting your filters to find more practice tests.
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    /* Personal Collections View */
                    <PersonalCollections
                        attempts={attempts}
                        userExams={userExams}
                        onRetakeExam={handleRetakeExam}
                        onReviewAttempt={handleReviewAttempt}
                        onStartExam={handleStartExam}
                        onEditExam={handleEditExam}
                        onDeleteExam={handleDeleteExam}
                        isLoading={collectionsLoading}
                    />
                )}
            </div>

            {/* Create Exam Modal */}
            <CreateExamModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onExamCreated={handleExamCreated}
            />
        </div>
    );
}
