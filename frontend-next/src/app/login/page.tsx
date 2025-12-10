'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useUser();

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
                const redirectUrl = searchParams.get('redirect') || '/user-dashboard';
                router.push(redirectUrl);
            } else {
                // After registration, switch to login or auto-login
                setIsLogin(true);
                setError('Registration successful! Please log in.');
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="clay-card p-10 w-full max-w-md bg-white border-2 border-white relative overflow-hidden">

                {/* Decorative blob */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-indigo via-brand-softBlue to-brand-peach" />

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-display font-black text-brand-dark mb-2">
                        {isLogin ? 'Welcome Back!' : 'Join Hanabira'}
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {isLogin ? 'Continue your learning journey' : 'Start your Japanese adventure'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-2 border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 font-bold text-sm shadow-sm">
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="btnPrimary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-gray-100">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-bold text-brand-softBlue hover:text-brand-indigo transition-colors duration-200"
                    >
                        {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
}
