'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    redirectUrl?: string;
    message?: string;
    title?: string;
}

export default function LoginModal({
    isOpen,
    onClose,
    redirectUrl,
    message = 'Log in to continue',
    title,
}: LoginModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useUser();
    const router = useRouter();

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setPassword('');
            setError('');
            setIsLogin(true);
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

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
                onClose();
                if (redirectUrl) {
                    router.push(redirectUrl);
                }
            } else {
                setIsLogin(true);
                setError('Registration successful! Please log in.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header gradient */}
                <div className="h-2 bg-gradient-to-r from-brand-salmon via-brand-sky to-brand-green" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 transition-colors z-10"
                >
                    <X size={20} className="text-gray-400" />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-brand-salmon to-brand-sky rounded-2xl flex items-center justify-center mx-auto mb-4">
                            {isLogin ? (
                                <LogIn size={28} className="text-white" />
                            ) : (
                                <UserPlus size={28} className="text-white" />
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-brand-dark">
                            {title || (isLogin ? 'Welcome Back!' : 'Join hanachan')}
                        </h2>
                        <p className="text-gray-500 mt-2">{message}</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className={`p-3 rounded-xl mb-4 text-sm font-bold ${error.includes('successful')
                            ? 'bg-green-50 border border-green-200 text-green-600'
                            : 'bg-red-50 border border-red-200 text-red-600'
                            }`}>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-brand-salmon focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-brand-salmon focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-brand-salmon text-white font-bold rounded-xl hover:bg-brand-salmon/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                isLogin ? 'Log In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Toggle mode */}
                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-sm font-bold text-brand-sky hover:text-brand-salmon transition-colors"
                        >
                            {isLogin
                                ? "Don't have an account? Register"
                                : 'Already have an account? Login'
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
