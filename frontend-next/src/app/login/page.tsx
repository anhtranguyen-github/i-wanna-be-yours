'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';

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
        <div className="min-h-screen flex items-center justify-center bg-brand-cream dark:bg-gray-900 p-4">
            <div className="bg-white p-8 rounded-xl border-2 border-brand-dark shadow-hard w-full max-w-md clay-card">
                <h1 className="text-3xl font-extrabold mb-6 text-center text-brand-dark">
                    {isLogin ? 'Welcome Back!' : 'Join Hanabira'}
                </h1>

                {error && (
                    <div className="bg-brand-peach/20 border-2 border-brand-peach text-brand-dark px-4 py-3 rounded-xl mb-4 font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-brand-dark mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="block w-full rounded-xl border-2 border-brand-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue p-3 bg-white text-brand-dark font-medium placeholder-gray-400"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-brand-dark mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="block w-full rounded-xl border-2 border-brand-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue p-3 bg-white text-brand-dark font-medium placeholder-gray-400"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="clay-button w-full flex justify-center py-3 px-4 border-2 border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-brand-blue hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 transition-all duration-200"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-bold text-brand-blue hover:text-brand-dark transition-colors duration-200"
                    >
                        {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
}
