'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import {
    Target, Calendar, CheckCircle2, Clock, ChevronRight,
    Sparkles, TrendingUp, BookOpen, Brain
} from 'lucide-react';
import {
    PlanTemplateListItem,
    JLPT_LEVEL_INFO,
    JLPTLevel,
    JLPT_LEVELS
} from '@/types/studyPlanTypes';
import studyPlanService from '@/services/studyPlanService';
import { useAuthPrompt } from '@/components/auth/AuthPromptModal';

export default function StudyPlanPage() {
    const { user, loading: userLoading } = useUser();
    const router = useRouter();
    const { showAuthPrompt, AuthPrompt } = useAuthPrompt();
    const [templates, setTemplates] = useState<PlanTemplateListItem[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

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
        if (!user) {
            showAuthPrompt(
                'Study Plans',
                'Create a personalized JLPT study plan tailored to your exam date and goals.'
            );
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

    return (
        <>
            <AuthPrompt />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30">
                {/* Hero Section */}
                <section className="relative overflow-hidden py-16 lg:py-24">
                    <div className="container mx-auto px-6 max-w-6xl">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green/10 rounded-full text-brand-green font-bold text-sm mb-6">
                                <Sparkles size={16} />
                                Personalized JLPT Preparation
                            </div>

                            <h1 className="text-4xl lg:text-6xl font-black text-brand-dark mb-6 leading-tight">
                                Your Path to <span className="text-brand-salmon">JLPT Success</span>
                            </h1>

                            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                                Set your target exam date, follow personalized milestones, and let our adaptive system guide you to certification.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleGetStarted}
                                    className="btnPrimary text-lg px-8 py-4"
                                >
                                    {user ? 'Create My Study Plan' : 'Get Started Free'}
                                    <ChevronRight className="ml-2" size={20} />
                                </button>

                                <Link
                                    href={user ? "/study-plan/dashboard" : "#"}
                                    onClick={(e) => {
                                        if (!user) {
                                            e.preventDefault();
                                            showAuthPrompt(
                                                'Your Study Plans',
                                                'View and manage your personalized study plans.'
                                            );
                                        }
                                    }}
                                    className="btnSecondary text-lg px-8 py-4"
                                >
                                    View My Plans
                                </Link>
                            </div>
                        </div>

                        {/* Feature Cards */}
                        <div className="grid md:grid-cols-4 gap-6 mt-16">
                            {[
                                { icon: Target, title: 'Set Your Goal', desc: 'Choose N5-N1 and exam date' },
                                { icon: Calendar, title: 'Get a Plan', desc: 'Personalized milestones' },
                                { icon: Brain, title: 'Study Daily', desc: 'Adaptive task recommendations' },
                                { icon: TrendingUp, title: 'Track Progress', desc: 'Visual milestone tracking' },
                            ].map((feature, idx) => (
                                <div key={idx} className="clay-card p-6 text-center group hover:scale-105 transition-transform">
                                    <div className="w-14 h-14 bg-brand-salmon/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-salmon group-hover:text-white transition-all">
                                        <feature.icon size={28} className="text-brand-salmon group-hover:text-white" />
                                    </div>
                                    <h3 className="font-bold text-brand-dark mb-2">{feature.title}</h3>
                                    <p className="text-sm text-gray-500">{feature.desc}</p>
                                </div>
                            ))}
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
        </>
    );
}
