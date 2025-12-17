"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

interface AuthPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: string;
    actionDescription: string;
}

const benefits = [
    "Track your learning progress across all devices",
    "Personalized study recommendations",
    "Spaced repetition for optimal memorization",
    "Custom flashcard decks and quizzes",
    "AI tutor with conversation history",
    "JLPT study plans tailored to your exam date",
];

export function AuthPromptModal({ isOpen, onClose, feature, actionDescription }: AuthPromptModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
                >
                    <X size={20} className="text-slate-400" />
                </button>

                {/* Header with gradient */}
                <div className="bg-gradient-to-br from-brand-green to-brand-blue p-8 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        Unlock {feature}
                    </h2>
                    <p className="text-white/80">
                        {actionDescription}
                    </p>
                </div>

                {/* Benefits */}
                <div className="p-6">
                    <p className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wide">
                        With a free account, you get:
                    </p>
                    <ul className="space-y-3 mb-6">
                        {benefits.slice(0, 4).map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-brand-green flex-shrink-0 mt-0.5" />
                                <span className="text-slate-600 text-sm">{benefit}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA Buttons */}
                    <div className="space-y-3">
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green/90 transition-all shadow-sm"
                        >
                            Create Free Account
                            <ArrowRight size={18} />
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center justify-center w-full py-3 px-6 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-all"
                        >
                            Already have an account? Sign in
                        </Link>
                    </div>

                    {/* Footer note */}
                    <p className="text-xs text-slate-400 text-center mt-4">
                        Free forever. No credit card required.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Hook for easy use in components
export function useAuthPrompt() {
    const [isOpen, setIsOpen] = useState(false);
    const [promptConfig, setPromptConfig] = useState({
        feature: "",
        actionDescription: "",
    });

    const showAuthPrompt = (feature: string, actionDescription: string) => {
        setPromptConfig({ feature, actionDescription });
        setIsOpen(true);
    };

    const closeAuthPrompt = () => {
        setIsOpen(false);
    };

    const AuthPrompt = () => (
        <AuthPromptModal
            isOpen={isOpen}
            onClose={closeAuthPrompt}
            feature={promptConfig.feature}
            actionDescription={promptConfig.actionDescription}
        />
    );

    return { showAuthPrompt, closeAuthPrompt, AuthPrompt, isOpen };
}
