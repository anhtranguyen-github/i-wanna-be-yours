'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Camera,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    User,
    Type,
    FileText
} from 'lucide-react';
import { settingsService, UserSettingsResponse } from '@/services/settingsService';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';

export default function ProfileSettingsPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<UserSettingsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form states
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');

    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            fetchSettings();
        }
    }, [user, userLoading]);

    const fetchSettings = async () => {
        try {
            const res = await settingsService.getSettings();
            setData(res);
            setDisplayName(res.display_name || '');
            setBio(res.bio || '');
        } catch (err) {
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await settingsService.updateSettings({
                display_name: displayName,
                bio: bio
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading || userLoading) {
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
                    <h1 className="text-4xl font-black text-neutral-ink font-display">Edit Profile</h1>
                    <p className="text-neutral-ink/60 font-medium">How the community sees you on Hanachan.</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-neutral-gray/10 relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-8 -mt-8" />

                    <form onSubmit={handleSave} className="space-y-8 relative">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-neutral-beige border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                                    <User size={64} className="text-neutral-ink/20" />
                                </div>
                                <button
                                    type="button"
                                    className="absolute bottom-0 right-0 p-3 bg-primary-strong text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                                >
                                    <Camera size={20} />
                                </button>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40 mt-4">Avatar customization coming soon</p>
                        </div>

                        {/* Public Identity */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-strong">
                                    <Type size={14} /> Display Name
                                </label>
                                <input
                                    className="w-full bg-slate-50 border border-neutral-gray/10 rounded-2xl p-4 font-bold outline-none focus:border-primary-strong focus:bg-white transition-all"
                                    placeholder="Your public name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-strong">
                                    <FileText size={14} /> Bio
                                </label>
                                <textarea
                                    className="w-full h-32 bg-slate-50 border border-neutral-gray/10 rounded-2xl p-4 font-bold outline-none focus:border-primary-strong focus:bg-white transition-all resize-none"
                                    placeholder="Tell the community about your Japanese journey..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Account Info (Read-only) */}
                        <div className="p-6 bg-neutral-beige/30 rounded-3xl border border-neutral-gray/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40">Account Information</h4>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-neutral-ink/60">Email</span>
                                <span className="text-neutral-ink">{data?.email}</span>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-600 font-bold text-sm animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 size={20} />
                                Profile updated successfully!
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-4 bg-primary-strong text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neutral-ink shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {saving ? 'Forging Changes...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
