'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Lock,
    ShieldCheck,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff
} from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';

export default function SecuritySettingsPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/');
            return;
        }
    }, [user, userLoading]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await authFetch('/e-api/v1/auth/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update password');
            }

            setSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccess(false), 5000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary-strong" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-6 max-w-2xl">
                {/* Header */}
                <div className="mb-10">
                    <Link
                        href="/settings"
                        className="inline-flex items-center gap-2 text-neutral-ink/60 hover:text-neutral-ink font-bold mb-6 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        Back to Settings
                    </Link>
                    <h1 className="text-4xl font-black text-neutral-ink font-display">Security</h1>
                    <p className="text-neutral-ink/60 font-medium">Protect your account and managed sessions.</p>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    {/* Password Form */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-neutral-gray/10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-primary-strong/10 text-primary-strong rounded-xl flex items-center justify-center">
                                <Lock size={20} />
                            </div>
                            <h3 className="text-xl font-black text-neutral-ink">Change Password</h3>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showCurrent ? "text" : "password"}
                                        className="w-full bg-slate-50 border border-neutral-gray/10 rounded-2xl p-4 font-bold outline-none focus:border-primary-strong focus:bg-white transition-all"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-ink/20 hover:text-neutral-ink transition-colors"
                                    >
                                        {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <hr className="border-neutral-gray/5" />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? "text" : "password"}
                                            className="w-full bg-slate-50 border border-neutral-gray/10 rounded-2xl p-4 font-bold outline-none focus:border-primary-strong focus:bg-white transition-all"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(!showNew)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-ink/20 hover:text-neutral-ink transition-colors"
                                        >
                                            {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 border border-neutral-gray/10 rounded-2xl p-4 font-bold outline-none focus:border-primary-strong focus:bg-white transition-all"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Status Messages */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
                                    <AlertCircle size={20} />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2 text-green-600 font-bold text-sm">
                                    <CheckCircle2 size={20} />
                                    Security credentials updated!
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 bg-neutral-ink text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-strong transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-neutral-ink/10"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                {saving ? 'Securing...' : 'Update Password'}
                            </button>
                        </form>
                    </div>

                    {/* Sessions Info */}
                    <div className="bg-neutral-beige/20 rounded-[2.5rem] p-10 border border-neutral-gray/10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40 mb-4">Device Sessions</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-gray/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-neutral-ink">Current Session</p>
                                        <p className="text-[10px] font-bold text-neutral-ink/40">IP: 127.0.0.1 • Active Now</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-widest rounded-md">Trusted</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
