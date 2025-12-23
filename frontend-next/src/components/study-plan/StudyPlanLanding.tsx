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
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="py-16 lg:py-20 bg-card border-b border-border">
                <div className="container mx-auto px-6 max-w-5xl text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl text-primary font-bold text-sm mb-6 border border-primary/10">
                        <Sparkles size={16} className="text-primary/70" />
                        {user ? 'Welcome Back' : 'Personalized JLPT Preparation'}
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-bold text-foreground font-display mb-6">
                        Start Your JLPT <span className="text-primary">Journey</span>
                    </h1>

                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                        Set your target level and let our AI guide you to JLPT mastery.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={handleGetStarted} className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-black rounded-xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-95">
                            Create My Plan
                            <ChevronRight size={20} />
                        </button>

                        {!user && (
                            <button onClick={() => openAuth('LOGIN', { flowType: 'STUDY_PLAN' })} className="px-8 py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:border-primary/50 transition-colors shadow-sm active:scale-95">
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
                            <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-8 text-center hover:border-primary/30 hover:shadow-xl transition-all group overflow-hidden relative">
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                                <div className="w-14 h-14 bg-primary/5 text-primary rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform relative z-10">
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="font-black text-slate-900 mb-3 font-display uppercase tracking-widest text-[10px]">{feature.title}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Templates */}
            <section className="py-16 bg-card">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-900 mb-3 font-display tracking-tight">Level Pathfinders</h2>
                        <p className="text-slate-500 font-medium">Browse curated study plan templates designed by JLPT experts.</p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center mb-10">
                        <button onClick={() => setSelectedLevel(null)} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedLevel === null ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200'}`}>
                            All Levels
                        </button>
                        {JLPT_LEVELS.map(level => (
                            <button key={level} onClick={() => setSelectedLevel(level)} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedLevel === level ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200'}`}>
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
                                                <h3 className="font-black text-slate-900 font-display uppercase tracking-[0.2em] text-[10px]">{levelInfo.name}</h3>
                                                <p className="text-sm text-slate-500 font-medium">{levelInfo.description}</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {levelTemplates.map(template => (
                                                <div key={template.id} onClick={() => router.push(`/study-plan/setup?template=${template.id}`)} className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-primary/40 hover:shadow-xl transition-all cursor-pointer group">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <span className="px-3 py-1 rounded-lg text-white text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: levelInfo.color }}>{template.target_level}</span>
                                                        <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold"><Clock size={12} />{template.duration_weeks}W</span>
                                                    </div>
                                                    <h4 className="font-black text-slate-900 mb-2 font-display group-hover:text-primary transition-colors">{template.title}</h4>
                                                    <p className="text-xs text-slate-500 font-medium mb-6 line-clamp-2 leading-relaxed">{template.description}</p>
                                                    <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 pt-4 border-t border-slate-50">
                                                        <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-primary/50" />{template.milestone_count} Milestones</span>
                                                        <span className="flex items-center gap-1.5"><BookOpen size={12} className="text-primary/50" />{template.daily_minutes_recommended}m / Day</span>
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
