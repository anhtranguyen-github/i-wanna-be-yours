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
        <div className="min-h-screen bg-background p-6 md:p-12 selection:bg-primary/20">
            <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                    {/* Back & Title */}
                    <div className="flex items-center gap-8">
                        <Link
                            href="/practice"
                            className="p-4 bg-card hover:bg-muted text-muted-foreground hover:text-primary transition-all rounded-2xl  border border-border/50 active:scale-95 group"
                        >
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>

                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center  border border-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                                <GraduationCap size={40} />
                            </div>
                            <div>
                                <h1 className="text-5xl font-black tracking-tighter text-foreground font-display leading-[0.9]">
                                    JLPT <span className="text-primary italic">Practice</span>
                                </h1>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] font-display mt-2 opacity-60">
                                    Cognitive Synthesis & Mastery
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-6">
                        {/* Stats Badge */}
                        <div className="hidden lg:flex items-center gap-4 px-8 py-4 bg-card border border-border/50 rounded-2xl ">
                            <div className="relative">
                                <Sparkles size={20} className="text-primary animate-pulse" />
                                <div className="absolute inset-0 blur-sm bg-primary/20 animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground font-display">
                                {mockExamConfigs.length} Protocols Active
                            </span>
                        </div>

                        {/* Create New Exam Button */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-4 px-8 py-5 bg-foreground text-background rounded-2xl hover:opacity-95 active:scale-95 transition-all  font-display uppercase tracking-[0.2em] text-[10px] font-black group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                            Synthesize Exam
                        </button>
                    </div>
                </div>


                {/* View Switcher/Content Area */}
                <div className="space-y-12">
                    <div className="flex p-2 bg-muted/30 rounded-[2rem] border border-border/50 w-full max-w-md mx-auto sm:mx-0 ">
                        <button
                            onClick={() => setPageView('browse')}
                            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all font-display ${pageView === 'browse'
                                ? 'bg-card text-primary  border border-border/50'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <GraduationCap size={20} />
                            Nexus Hub
                        </button>
                        <button
                            onClick={() => setPageView('personal')}
                            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all font-display ${pageView === 'personal'
                                ? 'bg-card text-primary  border border-border/50'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <User size={20} />
                            Personal Archive
                            {totalPersonalItems > 0 && (
                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 bg-primary text-primary-foreground text-[9px] rounded-full font-black animate-in zoom-in-50 ">
                                    {totalPersonalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>


                {pageView === 'browse' ? (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Mode & Filter Sections */}
                        <div className="space-y-12">
                            <ModeSelector selectedMode={filters.mode} onModeChange={handleModeChange} />

                            <FilterBar
                                selectedLevel={filters.level}
                                selectedSkill={filters.skill}
                                selectedMode={filters.mode}
                                onLevelChange={handleLevelChange}
                                onSkillChange={handleSkillChange}
                            />
                        </div>

                        {/* Grid Header */}
                        <div className="flex items-center justify-between border-b border-border/50 pb-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 font-display">
                                Showing <span className="text-foreground tracking-tight">{allExams.length}</span> nodes available
                            </p>
                        </div>

                        {/* Exam Cards Grid */}
                        {allExams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {allExams.map((exam) => (
                                    <PracticeCard key={exam.id} config={exam} onStart={handleStartExam} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-32 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border/50">
                                <div className="w-24 h-24 mx-auto mb-8 bg-card rounded-[2rem] flex items-center justify-center  text-muted-foreground/30 ring-8 ring-muted/50">
                                    <GraduationCap size={48} />
                                </div>
                                <h3 className="text-2xl font-black text-foreground mb-3 font-display tracking-tight">Zero Matches Found</h3>
                                <p className="text-sm font-bold text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                    Adjust your search parameters to find the perfect challenge.
                                </p>
                            </div>
                        )}
                    </div>

                ) : (
                    /* Personal Collections View */
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
                        <div className="max-w-4xl">
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
                        </div>
                    </div>
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
