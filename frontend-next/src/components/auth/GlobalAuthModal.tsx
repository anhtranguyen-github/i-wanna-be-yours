'use client';

import React from 'react';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import AuthForms from './AuthForms';
import { X, Sparkles, CheckCircle, Trophy, Zap, BookOpen } from 'lucide-react';

export default function GlobalAuthModal() {
    const { isOpen, closeAuth, initialMode, featureContext } = useGlobalAuth();

    // Handle ESC key
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeAuth();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, closeAuth]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeAuth();
        }
    };

    // Context-specific content mapping
    const flowContent = {
        CHAT: {
            benefits: [
                "Save your chat conversations forever",
                "Personalized AI tutor with memory",
                "Real-time feedback on your grammar",
                "Review corrections from previous chats"
            ],
            title: "Continue Your Conversation",
            description: "Sign up to save this chat and let Hanachan remember your learning style."
        },
        PRACTICE: {
            benefits: [
                "Unlock deep AI error analysis",
                "Track your score history over time",
                "Get targeted drills for your weak spots",
                "Earn achievement badges & trophies"
            ],
            title: "Unlock Deep Insights",
            description: "Hanachan has analyzed your practice results. Join now to see where to improve."
        },
        STUDY_PLAN: {
            benefits: [
                "Activate your daily study tasks",
                "Get milestone reminders & tracking",
                "Adaptive scheduling based on progress",
                "Stay on track for your exam date"
            ],
            title: "Activate Your Study Plan",
            description: "Your personalized road map is ready. Lock it in and start your journey today."
        },
        LIBRARY: {
            benefits: [
                "Sync your resources across devices",
                "Upload & categorize your own files",
                "Save vocabulary from any text",
                "Access premium reading materials"
            ],
            title: "Build Your Personal Library",
            description: "Keep all your Japanese learning materials in one place, accessible anywhere."
        },
        GENERAL: {
            benefits: [
                "Track your learning progress & milestones",
                "Personalized AI tutor with memory",
                "Custom flashcard decks & SRS study",
                "Save your chat conversations forever",
                "Sync progress across all your devices"
            ],
            title: "Unlock Your Japanese Potential",
            description: "Join thousands of learners mastering Japanese with our AI-powered platform."
        }
    };

    const currentFlow = featureContext?.flowType || 'GENERAL';
    const activeContent = flowContent[currentFlow as keyof typeof flowContent];
    const displayBenefits = activeContent.benefits;
    const displayTitle = featureContext?.title || activeContent.title;
    const displayDescription = featureContext?.description || activeContent.description;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/80  animate-in fade-in duration-300 cursor-pointer"
            onClick={handleBackdropClick}
        >

            {/* 
               Big Modal Container 
               Size: Max-w-5xl (Large), split screen layout
            */}
            <div
                className="relative w-full max-w-5xl bg-background rounded-[2rem]  overflow-hidden flex flex-col md:flex-row min-h-[660px] animate-in zoom-in-95 duration-500 cursor-default border border-border"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Close Button (Absolute) */}
                <button
                    onClick={closeAuth}
                    className="absolute top-6 right-6 z-20 p-2.5 rounded-xl bg-card border border-border/50 text-muted-foreground hover:text-primary transition-all  hover: active:scale-90"
                >
                    <X size={20} />
                </button>


                {/* Left Column: The "Offer" / Value Proposition */}
                <div className="hidden md:flex flex-col flex-1 bg-gradient-to-br from-secondary/20 via-background to-primary/10 p-16 relative overflow-hidden border-r border-border/50">
                    {/* Decorative Patterns (Abstract Zen) */}
                    <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-primary/5 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-60"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-16 h-16 bg-card border border-border/50 rounded-2xl flex items-center justify-center mb-10 ">
                            {featureContext?.icon ? (
                                <span className="text-foreground [&>*]:w-8 [&>*]:h-8">{featureContext.icon}</span>
                            ) : (
                                <Sparkles size={32} className="text-secondary" />
                            )}
                        </div>

                        <h2 className="text-5xl font-display font-black mb-6 leading-[1.1] tracking-tight text-foreground">
                            {displayTitle}
                        </h2>

                        <p className="text-lg text-muted-foreground mb-12 leading-relaxed font-bold">
                            {displayDescription}
                        </p>

                        <div className="space-y-6">
                            {displayBenefits.map((benefit, idx) => (
                                <div key={idx} className="flex items-start gap-4 group">
                                    <div className="mt-1 p-1 rounded-full group-hover:bg-primary/10 transition-colors">
                                        <CheckCircle size={18} className="text-primary group- transition-transform" />
                                    </div>
                                    <span className="text-sm font-bold text-foreground/70 group-hover:text-foreground transition-colors leading-relaxed">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-12 flex items-center gap-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 font-display">Crafting Excellence in Education</div>
                        </div>
                    </div>
                </div>


                {/* Right Column: The "Gate" / Auth Forms */}
                <div className="flex-1 bg-background p-8 md:p-16 flex items-center justify-center relative">
                    <div className="w-full max-w-sm">
                        {/* Mobile-only offer title */}
                        <div className="md:hidden mb-12 text-center">
                            <h2 className="text-3xl font-display font-black text-foreground mb-3 tracking-tight">
                                {displayTitle}
                            </h2>
                            <p className="text-muted-foreground text-sm font-bold">
                                {displayDescription}
                            </p>
                        </div>

                        <AuthForms
                            initialMode={initialMode}
                            onSuccess={closeAuth}
                            hideHeader={true}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
