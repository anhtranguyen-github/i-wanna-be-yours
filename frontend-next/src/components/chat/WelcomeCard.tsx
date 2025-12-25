/**
 * WelcomeCard Component
 * 
 * Displays the welcome screen for new chats with suggestions.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

interface WelcomeCardProps {
    isGuest?: boolean;
    onSuggestionClick?: (suggestion: string) => void;
}

const SUGGESTIONS = [
    "Teach me basic Japanese greetings",
    "Explain the difference between は and が",
    "Create flashcards for N5 vocabulary",
    "Help me practice verb conjugations",
];

export function WelcomeCard({ isGuest = false, onSuggestionClick }: WelcomeCardProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center max-w-md">
                {/* Logo */}
                <div className="w-16 h-16 bg-gradient-to-br from-brand-green to-brand-green/70 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                    🌸
                </div>

                <h1 className="text-2xl font-display font-bold text-brand-dark mb-2">
                    Welcome to Hanachan
                </h1>
                <p className="text-neutral-ink mb-8">
                    Your AI-powered Japanese learning companion
                </p>

                {/* Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUGGESTIONS.map((suggestion, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSuggestionClick?.(suggestion)}
                            className="p-3 text-left text-sm bg-slate-50 hover:bg-brand-green/10 rounded-xl border border-slate-200 hover:border-brand-green/30 transition-colors group"
                        >
                            <Sparkles size={14} className="text-brand-green mb-1" />
                            <span className="text-slate-600 group-hover:text-brand-dark transition-colors">
                                {suggestion}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
