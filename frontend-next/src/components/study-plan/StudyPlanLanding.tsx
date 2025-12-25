'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Target, CheckCircle2, Clock, ChevronRight, Sparkles, TrendingUp, BookOpen, Brain, Activity, Loader2 } from 'lucide-react';
import { PlanTemplateListItem, JLPT_LEVEL_INFO, JLPTLevel, JLPT_LEVELS } from '@/types/studyPlanTypes';
import studyPlanService from '@/services/studyPlanService';
import { useGlobalAuth } from "@/context/GlobalAuthContext";

interface StudyPlanLandingProps {
    user: any;
    hasPlan: boolean;
    plan: any;
}

export function StudyPlanLanding({ user, hasPlan, plan }: StudyPlanLandingProps) {
    const router = useRouter();
    const { openAuth } = useGlobalAuth();
    const [templates, setTemplates] = useState<PlanTemplateListItem[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadTemplates(); }, []);

    const loadTemplates = async () => {
        try {
            const { templates } = await studyPlanService.listTemplates();
            setTemplates(templates);
        } catch (error) { console.error('Failed to load templates:', error); }
        finally { setLoading(false); }
    };

    const handleGetStarted = () => {
        if (user && hasPlan) {
            // Already handled by parent view switching to dashboard, 
            // but just in case:
            router.push('/study-plan');
        } else {
            router.push('/study-plan/setup');
        }
    };

    const filteredTemplates = selectedLevel ? templates.filter(t => t.target_level === selectedLevel) : templates;
    const groupedTemplates = JLPT_LEVELS.reduce((acc, level) => {
        acc[level] = filteredTemplates.filter(t => t.target_level === level);
        return acc;
    }, {} as Record<JLPTLevel, PlanTemplateListItem[]>);

    return (
        <div className="min-h-screen bg-secondary">
            {/* Hero Section */}
            <section className="py-16 lg:py-20 bg-neutral-white border-b border-neutral-gray/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="container mx-auto px-6 max-w-5xl text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-xl text-primary-strong font-black text-[10px] uppercase tracking-widest mb-6 border border-primary/20 font-display">
                        <Sparkles size={16} className="text-primary-strong/70" />
                        {user ? 'Welcome Back' : 'Personalized JLPT Preparation'}
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-black text-neutral-ink font-display mb-6 tracking-tight">
                        Start Your JLPT <span className="text-primary-strong">Journey</span>
                    </h1>

                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                        Set your target level and let our AI guide you to JLPT mastery.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={handleGetStarted} className="flex items-center justify-center gap-3 px-10 py-5 bg-primary-strong text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary/30 active:scale-95 font-display uppercase tracking-widest text-xs">
                            Create My Plan
                            <ChevronRight size={20} />
                        </button>

                        {!user && (
                            <button onClick={() => openAuth('LOGIN', { flowType: 'STUDY_PLAN' })} className="px-10 py-5 bg-neutral-white border border-neutral-gray/30 text-neutral-ink font-black rounded-2xl hover:border-primary/50 transition-all shadow-md active:scale-95 font-display uppercase tracking-widest text-xs">
                                Login to Resume
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { icon: Target, title: 'Goal Alignment', desc: 'Sync goals with daily tasks' },
                            { icon: Activity, title: 'Habit Tracking', desc: 'Track quality of study habits' },
                            { icon: Brain, title: 'AI Sensei', desc: 'Adaptive recommendations' },
                            { icon: BookOpen, title: 'Content Mastery', desc: 'SRS-backed knowledge vault' },
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-neutral-white rounded-3xl border border-neutral-gray/20 p-8 text-center hover:border-primary/40 hover:shadow-2xl transition-all group overflow-hidden relative shadow-md">
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                                <div className="w-14 h-14 bg-neutral-beige text-primary-strong rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all relative z-10 shadow-inner">
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="font-black text-neutral-ink mb-3 font-display uppercase tracking-[0.2em] text-[10px]">{feature.title}</h3>
                                <p className="text-sm text-neutral-ink/70 font-bold leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Templates */}
            <section className="py-20 bg-neutral-beige/30 border-y border-neutral-gray/20">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-neutral-ink mb-4 font-display tracking-tight uppercase tracking-widest">Level Pathfinders</h2>
                        <p className="text-neutral-ink/60 font-bold">Browse curated study plan templates designed by JLPT experts.</p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center mb-16">
                        <button onClick={() => setSelectedLevel(null)} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 font-display ${selectedLevel === null ? 'bg-primary-strong text-white shadow-xl shadow-primary/30 scale-105' : 'bg-neutral-white text-neutral-ink/40 hover:text-neutral-ink border border-neutral-gray/30 shadow-sm'}`}>
                            All Levels
                        </button>
                        {JLPT_LEVELS.map(level => (
                            <button key={level} onClick={() => setSelectedLevel(level)} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 font-display ${selectedLevel === level ? 'bg-primary-strong text-white shadow-xl shadow-primary/30 scale-105' : 'bg-neutral-white text-neutral-ink/40 hover:text-neutral-ink border border-neutral-gray/30 shadow-sm'}`}>
                                {level}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading templates...</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {JLPT_LEVELS.filter(level => !selectedLevel || selectedLevel === level).map(level => {
                                const levelTemplates = groupedTemplates[level];
                                if (levelTemplates.length === 0) return null;
                                const levelInfo = JLPT_LEVEL_INFO[level];

                                return (
                                    <div key={level}>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: levelInfo.color }}>
                                                {level}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-neutral-ink font-display uppercase tracking-[0.2em] text-[10px]">{levelInfo.name}</h3>
                                                <p className="text-sm text-neutral-ink/60 font-bold">{levelInfo.description}</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {levelTemplates.map(template => (
                                                <div key={template.id} onClick={() => router.push(`/study-plan/setup?template=${template.id}`)} className="bg-neutral-white rounded-[2rem] border border-neutral-gray/20 p-8 hover:border-primary/40 hover:shadow-2xl transition-all cursor-pointer group shadow-md relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/2 rounded-full blur-2xl group-hover:bg-primary/5 transition-colors" />
                                                    <div className="flex items-start justify-between mb-6 relative z-10">
                                                        <span className="px-4 py-1.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-md" style={{ backgroundColor: levelInfo.color }}>{template.target_level}</span>
                                                        <span className="flex items-center gap-2 text-neutral-ink/40 text-[10px] font-black uppercase tracking-widest"><Clock size={14} />{template.duration_weeks}W</span>
                                                    </div>
                                                    <h4 className="text-xl font-black text-neutral-ink mb-3 font-display group-hover:text-primary-strong transition-colors relative z-10">{template.title}</h4>
                                                    <p className="text-sm text-neutral-ink/60 font-medium mb-8 line-clamp-2 leading-relaxed relative z-10">{template.description}</p>
                                                    <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase tracking-widest text-neutral-ink/40 pt-6 border-t border-neutral-gray/10 relative z-10">
                                                        <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary-strong/40" />{template.milestone_count} Points</span>
                                                        <span className="flex items-center gap-2"><BookOpen size={14} className="text-primary-strong/40" />{template.daily_minutes_recommended}m / Day</span>
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
        </div>
    );
}
