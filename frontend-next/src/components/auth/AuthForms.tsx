'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';

interface AuthFormsProps {
    initialMode?: 'LOGIN' | 'REGISTER';
    onSuccess?: () => void;
    hideHeader?: boolean;
}

export default function AuthForms({ initialMode = 'LOGIN', onSuccess, hideHeader = false }: AuthFormsProps) {
    const [isLogin, setIsLogin] = useState(initialMode === 'LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useUser();

    useEffect(() => {
        setIsLogin(initialMode === 'LOGIN');
    }, [initialMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            if (isLogin) {
                login(data.user);
                if (onSuccess) onSuccess();
            } else {
                // After registration, automatically login
                try {
                    const loginRes = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    });
                    const loginData = await loginRes.json();
                    if (loginRes.ok) {
                        login(loginData.user);
                        if (onSuccess) onSuccess();
                    } else {
                        setIsLogin(true);
                        setError('Registration successful! Please log in.');
                    }
                } catch (loginErr) {
                    // Fallback to login screen if auto-login fails
                    setIsLogin(true);
                    setError('Registration successful! Please log in.');
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col justify-center">
            {!hideHeader && (
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-display font-black text-foreground mb-3 tracking-tight">
                        {isLogin ? 'Welcome Back' : 'Start Your Journey'}
                    </h2>
                    <p className="text-neutral-ink font-bold text-sm">
                        {isLogin ? 'Continue where you left off' : 'Join a community of Japanese learners'}
                    </p>
                </div>
            )}

            {error && (
                <div className="bg-destructive/5 border border-destructive/20 text-destructive px-6 py-4 rounded-2xl mb-8 font-bold text-xs  animate-in fade-in slide-in-from-top-2 duration-300">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black font-display uppercase tracking-widest text-neutral-ink ml-1">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="block w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-3.5 text-foreground font-bold placeholder-muted-foreground/30 focus:outline-none focus:bg-card focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all "
                        placeholder="you@example.com"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-black font-display uppercase tracking-widest text-neutral-ink ml-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="block w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-3.5 text-foreground font-bold placeholder-muted-foreground/30 focus:outline-none focus:bg-card focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all "
                        placeholder="••••••••"
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 text-xs font-black font-display uppercase tracking-[0.2em] bg-primary text-primary-foreground rounded-2xl  hover: hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </div>
            </form>

            <div className="mt-10 text-center pt-8 border-t border-border/50">
                <button
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                    }}
                    className="text-[10px] font-black font-display uppercase tracking-widest text-neutral-ink hover:text-primary transition-colors duration-300"
                >
                    {isLogin ? (
                        <>
                            Don&apos;t have an account? <span className="text-secondary ml-1">Register Free</span>
                        </>
                    ) : (
                        <>
                            Already have an account? <span className="text-secondary ml-1">Sign In</span>
                        </>
                    )}
                </button>
            </div>

        </div>
    );
}
