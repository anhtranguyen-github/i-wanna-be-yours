'use client';

import React from 'react';
import { LogIn, RefreshCw, ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { useRouter } from 'next/navigation';

interface AuthErrorScreenProps {
    title?: string;
    message?: string;
    errorCode?: number | string;
    showHomeButton?: boolean;
    showBackButton?: boolean;
    onRetry?: () => void;
}

export function AuthErrorScreen({
    title = 'Session Expired',
    message = 'Your session has expired or you need to log in to access this content.',
    errorCode,
    showHomeButton = true,
    showBackButton = true,
    onRetry,
}: AuthErrorScreenProps) {
    const { openAuth } = useGlobalAuth();
    const router = useRouter();

    const handleLogin = () => {
        openAuth('LOGIN', {
            title: 'Welcome Back',
            description: 'Log in to continue where you left off.',
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12">
            {/* Icon */}
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center ">
                    <ShieldAlert size={48} className="text-amber-500" />
                </div>
                {errorCode && (
                    <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                        {errorCode}
                    </div>
                )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-neutral-ink mb-2 text-center">
                {title}
            </h1>

            {/* Message */}
            <p className="text-neutral-ink text-center max-w-md mb-8 leading-relaxed">
                {message}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                {/* Primary: Login Button */}
                <button
                    onClick={handleLogin}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 transition-all duration-200  hover: active:scale-95"
                >
                    <LogIn size={20} />
                    Log In
                </button>

                {/* Secondary: Retry (if provided) */}
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-all duration-200"
                    >
                        <RefreshCw size={18} />
                        Retry
                    </button>
                )}
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-4 mt-6 text-sm">
                {showBackButton && (
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1 text-neutral-ink hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Go Back
                    </button>
                )}
                {showHomeButton && showBackButton && (
                    <span className="text-slate-300">|</span>
                )}
                {showHomeButton && (
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-1 text-neutral-ink hover:text-slate-700 transition-colors"
                    >
                        <Home size={16} />
                        Home
                    </button>
                )}
            </div>

            {/* Toast-like helper text */}
            <p className="text-xs text-neutral-ink mt-8 text-center max-w-xs">
                If you believe this is an error, try refreshing the page or clearing your browser cookies.
            </p>
        </div>
    );
}

// Simplified inline version for embedding within pages
export function AuthErrorInline({
    message = 'Authentication required',
    onLogin,
    onRetry,
}: {
    message?: string;
    onLogin?: () => void;
    onRetry?: () => void;
}) {
    const { openAuth } = useGlobalAuth();

    const handleLogin = () => {
        if (onLogin) {
            onLogin();
        } else {
            openAuth('LOGIN');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-200/50">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <ShieldAlert size={32} className="text-amber-500" />
            </div>
            <p className="text-slate-600 font-medium text-center mb-4">{message}</p>
            <div className="flex gap-2">
                <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white font-medium rounded-lg hover:bg-brand-green/90 transition-all text-sm"
                >
                    <LogIn size={16} />
                    Log In
                </button>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-all text-sm"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
}
