'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import {
    Target, Calendar, CheckCircle2, Clock, ChevronRight,
    Sparkles, TrendingUp, BookOpen, Brain, Activity
} from 'lucide-react';
import {
    PlanTemplateListItem,
    JLPT_LEVEL_INFO,
    JLPTLevel,
    JLPT_LEVELS
} from '@/types/studyPlanTypes';
import studyPlanService from '@/services/studyPlanService';
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import { useStudyPlanStatus } from '@/hooks/useStudyPlanStatus';

export default function StudyPlanPage() {
    const { user, hasPlan, plan, loading: statusLoading } = useStudyPlanStatus();
    const router = useRouter();
    const { openAuth } = useGlobalAuth();
    const [templates, setTemplates] = useState<PlanTemplateListItem[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    // Auto-redirect active plan users to dashboard
    useEffect(() => {
        if (!statusLoading && user && hasPlan) {
            router.push('/study-plan/dashboard');
        }
    }, [user, hasPlan, statusLoading, router]);

    const loadTemplates = async () => {
        try {
            const { templates } = await studyPlanService.listTemplates();
            setTemplates(templates);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGetStarted = () => {
        if (user && hasPlan) {
            router.push('/study-plan/dashboard');
        } else {
            router.push('/study-plan/setup');
        }
    };

    const filteredTemplates = selectedLevel
        ? templates.filter(t => t.target_level === selectedLevel)
        : templates;

    const groupedTemplates = JLPT_LEVELS.reduce((acc, level) => {
        acc[level] = filteredTemplates.filter(t => t.target_level === level);
        return acc;
    }, {} as Record<JLPTLevel, PlanTemplateListItem[]>);

    if (statusLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-brand-salmon border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-16 lg:py-24">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green/10 rounded-full text-brand-green font-bold text-sm mb-6">
                            <Sparkles size={16} />
                            {user ? 'Welcome Back, Commander' : 'Personalized JLPT Preparation'}
                        </div>

                        <h1 className="text-4xl lg:text-7xl font-black text-brand-dark mb-6 leading-[1.1]">
                            {user && hasPlan ? (
                                <>Your Strategic <span className="text-brand-salmon">Command Center</span></>
                            ) : (
                                <>Induct Your <span className="text-brand-salmon">Future in Japan</span></>
                            )}
                        </h1>

                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                            {user && hasPlan
                                ? `You are currently training for JLPT ${plan?.target_level}. Set your trajectory and resume your progress.`
                                : "Set your target level, commit to a daily rhythm, and let Hanachan's AI Sensei guide you to JLPT mastery."
                            }
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 justify-center">
                            <button
                                onClick={handleGetStarted}
                                className="btnPrimary text-xl px-10 py-5 rounded-2xl shadow-xl shadow-brand-salmon/20 hover:scale-105 transition-all"
                            >
                                {user && hasPlan ? 'Enter My Dashboard' : 'Create My Plan'}
                                <ChevronRight className="ml-2" size={24} />
                            </button>

                            {!user && (
                                <button
                                    onClick={() => openAuth('LOGIN', { flowType: 'STUDY_PLAN' })}
                                    className="btnSecondary text-xl px-10 py-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-brand-salmon hover:text-brand-salmon transition-all"
                                >
                                    Login to Resume
                                </button>
                            )}

                            {user && !hasPlan && (
                                <Link
                                    href="/study-plan/dashboard"
                                    className="btnSecondary text-xl px-10 py-5 rounded-2xl bg-white border-2 border-slate-200"
                                >
                                    View Analytics
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Discovery: Platform Functions */}
                    <div className="grid md:grid-cols-4 gap-6 mt-24">
                        {[
                            { icon: Target, title: 'OKR Alignment', desc: 'Sync long-term goals with daily tasks' },
                            { icon: Activity, title: 'PACT Consistency', desc: 'Track quality of study habits, not just time' },
                            { icon: Brain, title: 'AI Sensei', desc: 'Adaptive recommendations by Qwen LLM' },
                            { icon: BookOpen, title: 'Content Mastery', desc: 'SRS-backed verified knowledge vault' },
                        ].map((feature, idx) => (
                            <div key={idx} className="clay-card p-8 text-center group hover:scale-[1.02] transition-all bg-white/80 backdrop-blur-sm border-slate-200/50">
                                <div className="w-16 h-16 bg-brand-salmon/10 text-brand-salmon rounded-3xl flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-12 transition-transform">
                                    <feature.icon size={32} />
                                </div>
                                <h3 className="text-lg font-black text-brand-dark mb-3 tracking-tight">{feature.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Discovery: Current Offers/Why Hanachan */}
            <section className="py-20 bg-brand-dark text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-salmon/20 rounded-full blur-[120px] -mr-48 -mt-48" />
                <div className="container mx-auto px-6 max-w-6xl relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-black mb-8 leading-tight">Why Elite Learners <br /><span className="text-brand-salmon text-5xl">Choose Hanachan</span></h2>
                            <div className="space-y-6">
                                {[
                                    { title: 'Scientific Retention', desc: 'Uses SM-2 algorithm to guarantee long-term memory.' },
                                    { title: 'Multi-Agent Support', desc: 'Analyst, Coach, and Planner agents working 24/7 for you.' },
                                    { title: 'Zero Friction Onboarding', desc: 'Go from guest to personalized plan in under 120 seconds.' }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1 w-6 h-6 rounded-full bg-brand-salmon/20 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 size={14} className="text-brand-salmon" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                                            <p className="text-slate-400 text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="clay-card bg-white/5 border-white/10 p-2 transform rotate-2">
                            <div className="bg-slate-900 rounded-2xl p-8 border border-white/5 shadow-2xl">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                        <TrendingUp className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Growth Forecast</p>
                                        <p className="text-2xl font-black">+42% Retention Score</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-salmon w-[85%] rounded-full shadow-[0_0_15px_rgba(255,107,107,0.5)]" />
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-sky w-[60%] rounded-full shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
                                    </div>
                                </div>
                                <p className="mt-8 text-sm text-slate-400 font-medium italic">"The AI Sensei didn't just give me a plan; it gave me a mindset." - N2 Candidate</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Templates Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-brand-dark mb-4">
                            Choose Your JLPT Level
                        </h2>
                        <p className="text-gray-600 max-w-xl mx-auto">
                            Browse our curated study plan templates. Each plan is designed by JLPT experts and adapts to your schedule.
                        </p>
                    </div>

                    {/* Level Filter */}
                    <div className="flex flex-wrap gap-3 justify-center mb-10">
                        <button
                            onClick={() => setSelectedLevel(null)}
                            className={`px-5 py-2.5 rounded-xl font-bold transition-all ${selectedLevel === null
                                ? 'bg-brand-dark text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            All Levels
                        </button>
                        {JLPT_LEVELS.map(level => (
                            <button
                                key={level}
                                onClick={() => setSelectedLevel(level)}
                                className={`px-5 py-2.5 rounded-xl font-bold transition-all ${selectedLevel === level
                                    ? 'bg-brand-dark text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    {/* Template Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-brand-salmon border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading templates...</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {JLPT_LEVELS.filter(level => !selectedLevel || selectedLevel === level).map(level => {
                                const levelTemplates = groupedTemplates[level];
                                if (levelTemplates.length === 0) return null;

                                const levelInfo = JLPT_LEVEL_INFO[level];

                                return (
                                    <div key={level}>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg"
                                                style={{ backgroundColor: levelInfo.color }}
                                            >
                                                {level}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl text-brand-dark">{levelInfo.name}</h3>
                                                <p className="text-sm text-gray-500">{levelInfo.description}</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {levelTemplates.map(template => (
                                                <div
                                                    key={template.id}
                                                    className="clay-card p-6 hover:border-brand-salmon transition-all cursor-pointer group"
                                                    onClick={() => router.push(`/study-plan/setup?template=${template.id}`)}
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div
                                                            className="px-3 py-1 rounded-lg text-white text-xs font-bold"
                                                            style={{ backgroundColor: levelInfo.color }}
                                                        >
                                                            {template.target_level}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                                                            <Clock size={14} />
                                                            {template.duration_weeks}w
                                                        </div>
                                                    </div>

                                                    <h4 className="font-bold text-lg text-brand-dark mb-2 group-hover:text-brand-salmon transition-colors">
                                                        {template.title}
                                                    </h4>

                                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                                        {template.description}
                                                    </p>

                                                    <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100">
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <CheckCircle2 size={16} />
                                                            {template.milestone_count} milestones
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <BookOpen size={16} />
                                                            {template.daily_minutes_recommended} min/day
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-brand-salmon to-brand-sky">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <h2 className="text-3xl font-black text-white mb-4">
                        Ready to Start Your JLPT Journey?
                    </h2>
                    <p className="text-white/80 mb-8 text-lg">
                        Create your personalized study plan in just 2 minutes.
                    </p>
                    <button
                        onClick={handleGetStarted}
                        className="bg-white text-brand-salmon px-10 py-4 rounded-2xl font-bold text-lg hover:bg-brand-salmon hover:text-white hover:scale-105 transition-all"
                    >
                        {user ? 'Create My Plan' : 'Get Started Free'}
                    </button>
                </div>
            </section>
        </div>
    );
}
