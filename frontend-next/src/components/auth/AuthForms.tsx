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
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-display font-black text-brand-dark mb-2">
                        {isLogin ? 'Welcome Back!' : 'Join hanachan'}
                    </h2>
                    <p className="text-gray-500 font-medium">
                        {isLogin ? 'Continue your learning journey' : 'Start your Japanese adventure'}
                    </p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-2 border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 font-bold text-sm shadow-sm animate-shake">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2 ml-1">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="block w-full rounded-xl border-2 border-transparent bg-gray-50 shadow-inner p-3 text-brand-dark font-medium placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-indigo focus:ring-4 focus:ring-brand-indigo/10 transition-all"
                        placeholder="you@example.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2 ml-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="block w-full rounded-xl border-2 border-transparent bg-gray-50 shadow-inner p-3 text-brand-dark font-medium placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-indigo focus:ring-4 focus:ring-brand-indigo/10 transition-all"
                        placeholder="••••••••"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btnPrimary w-full py-3.5 text-lg shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
                    </button>
                </div>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-gray-100">
                <button
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                    }}
                    className="text-sm font-bold text-slate-500 hover:text-brand-indigo transition-colors duration-200"
                >
                    {isLogin ? (
                        <>
                            Don&apos;t have an account? <span className="text-brand-indigo">Register Free</span>
                        </>
                    ) : (
                        <>
                            Already have an account? <span className="text-brand-indigo">Login</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
