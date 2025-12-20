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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={handleBackdropClick}
        >
            {/* 
               Big Modal Container 
               Size: Max-w-5xl (Large), split screen layout
            */}
            <div
                className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in zoom-in-95 duration-300 cursor-default"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Close Button (Absolute) */}
                <button
                    onClick={closeAuth}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/20 hover:bg-black/10 transition-colors text-slate-500 hover:text-slate-800"
                >
                    <X size={24} />
                </button>

                {/* Left Column: The "Offer" / Value Proposition */}
                <div className="hidden md:flex flex-col flex-1 bg-gradient-to-br from-brand-dark via-brand-indigo to-brand-green text-white p-12 relative overflow-hidden">
                    {/* Decorative Blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-green/20 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/4"></div>

                    <div className="relative z-10 flex flex-col h-full justify-center">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-lg">
                            {featureContext?.icon ? (
                                <span className="text-white [&>*]:w-8 [&>*]:h-8">{featureContext.icon}</span>
                            ) : (
                                <Sparkles size={32} className="text-brand-green" />
                            )}
                        </div>

                        <h2 className="text-4xl font-display font-black mb-4 leading-tight">
                            {displayTitle}
                        </h2>

                        <p className="text-lg text-white/80 mb-10 leading-relaxed font-medium">
                            {displayDescription}
                        </p>

                        <div className="space-y-5">
                            {displayBenefits.map((benefit, idx) => (
                                <div key={idx} className="flex items-start gap-4 group">
                                    <div className="mt-1 p-1 rounded-full bg-white/10 group-hover:bg-brand-green group-hover:text-white transition-colors">
                                        <CheckCircle size={16} className="text-brand-green group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="text-base text-white/90 group-hover:text-white transition-colors">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-10 flex items-center gap-4 opacity-70">
                            <div className="text-xs font-bold uppercase tracking-widest text-white/50">Trusted By Learners Worldwide</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: The "Gate" / Auth Forms */}
                <div className="flex-1 bg-white p-8 md:p-12 flex items-center justify-center relative">
                    {/* Mobile Header Decoration */}
                    <div className="md:hidden absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-indigo to-brand-green" />

                    <div className="w-full max-w-md">
                        {/* Mobile-only offer title since the left column is hidden */}
                        <div className="md:hidden mb-8 text-center">
                            <h2 className="text-2xl font-display font-black text-brand-dark mb-2">
                                {displayTitle}
                            </h2>
                            <p className="text-gray-500 text-sm font-medium">
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
