'use client';

import React from 'react';
import { Lock, LogIn, Sparkles } from 'lucide-react';
import { useGlobalAuth } from '@/context/GlobalAuthContext';

interface LoginPromptCardProps {
    title?: string;
    message?: string;
    icon?: React.ReactNode;
    redirectUrl?: string;
    compact?: boolean;
}

export default function LoginPromptCard({
    title = 'Login Required',
    message = 'Please log in to access this feature.',
    icon,
    redirectUrl,
    compact = false,
}: LoginPromptCardProps) {
    const { openAuth } = useGlobalAuth();

    if (compact) {
        return (
            <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-salmon/10 rounded-xl flex items-center justify-center shrink-0">
                    <Lock size={20} className="text-brand-salmon" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">{message}</p>
                </div>
                <button
                    onClick={() => openAuth('LOGIN')}
                    className="px-4 py-2 bg-brand-salmon text-white text-sm font-bold rounded-xl hover:bg-brand-salmon/90 transition-colors shrink-0"
                >
                    Log In
                </button>
            </div>
        );
    }

    return (
        <div className="clay-card p-12 text-center max-w-md mx-auto">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-brand-salmon/20 to-brand-sky/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                {icon || <Lock size={36} className="text-brand-salmon" />}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-black text-brand-dark mb-3">
                {title}
            </h2>

            {/* Message */}
            <p className="text-gray-500 mb-8 leading-relaxed">
                {message}
            </p>

            {/* Login Button */}
            <button
                onClick={() => openAuth('LOGIN')}
                className="inline-flex items-center gap-2 px-8 py-3 bg-brand-salmon text-white font-bold rounded-xl hover:bg-brand-salmon/90 transition-all hover:scale-105"
            >
                <LogIn size={20} />
                Log In to Continue
            </button>

            {/* Benefits hint */}
            <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Sparkles size={14} />
                    Free account with unlimited access
                </p>
            </div>
        </div>
    );
}
