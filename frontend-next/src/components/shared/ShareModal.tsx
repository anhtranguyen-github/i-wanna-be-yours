'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, Calendar, Lock } from 'lucide-react';
import { shareService } from '@/services/shareService';
import { cn } from '@/lib/utils';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentId: string;
    contentType: 'flashcard-deck' | 'practice-arena' | 'quoot-arena';
    title: string;
}

export function ShareModal({
    isOpen,
    onClose,
    contentId,
    contentType,
    title
}: ShareModalProps) {
    const [loading, setLoading] = useState(false);
    const [shareData, setShareData] = useState<{ shareId: string; shareUrl: string; expiresAt?: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [expiresIn, setExpiresIn] = useState<number>(24); // Default 24 hours
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await shareService.generateShareLink(contentType, contentId, expiresIn);
            setShareData(data);
        } catch (err: any) {
            setError(err.message || 'Failed to generate share link');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!shareData) return;
        const fullUrl = `${window.location.origin}${shareData.shareUrl}`;
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-neutral-ink/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-neutral-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-primary-strong/10 to-primary-sky/10" />

                <div className="relative p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-neutral-ink/40 hover:text-neutral-ink transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-strong/10 text-primary-strong rounded-2xl mb-4">
                            <Share2 size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-neutral-ink tracking-tight">Share Content</h2>
                        <p className="text-sm text-neutral-ink/60 font-medium mt-1 truncate px-4">
                            {title}
                        </p>
                    </div>

                    {!shareData ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-neutral-beige/50 rounded-2xl border border-neutral-gray/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <Calendar size={18} className="text-primary-strong" />
                                    <span className="text-xs font-black text-neutral-ink uppercase tracking-widest">Expiration</span>
                                </div>
                                <select
                                    value={expiresIn}
                                    onChange={(e) => setExpiresIn(Number(e.target.value))}
                                    className="w-full p-3 bg-white border border-neutral-gray/20 rounded-xl text-sm font-bold text-neutral-ink focus:outline-none focus:ring-2 focus:ring-primary-strong/20 transition-all appearance-none"
                                >
                                    <option value={24}>24 Hours</option>
                                    <option value={168}>7 Days</option>
                                    <option value={720}>30 Days</option>
                                    <option value={0}>Never Expires</option>
                                </select>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full py-4 bg-primary-strong text-white rounded-2xl font-black text-lg hover:bg-primary-strong/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Generate Link
                                        <Share2 size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-1 bg-neutral-beige/30 rounded-2xl border border-neutral-gray/10">
                                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-neutral-gray/10 mb-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${window.location.origin}${shareData.shareUrl}`}
                                        className="flex-1 bg-transparent text-sm font-bold text-neutral-ink/80 outline-none"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            copied ? "bg-green-100 text-green-600" : "bg-primary-strong/10 text-primary-strong hover:bg-primary-strong/20"
                                        )}
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <div className="px-3 py-2 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-neutral-ink/40 uppercase tracking-widest">
                                        Link Generated Successfully
                                    </span>
                                    {shareData.expiresAt && (
                                        <span className="text-[10px] font-bold text-primary-strong/60">
                                            Expires: {new Date(shareData.expiresAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-primary-sky/5 rounded-2xl border border-primary-sky/20 flex items-start gap-3">
                                <Lock size={16} className="text-primary-sky shrink-0 mt-0.5" />
                                <p className="text-[11px] text-primary-sky/80 leading-relaxed font-bold">
                                    Anyone with this link can view and practice this content.
                                    Private information like your user ID is hidden.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-3 text-neutral-ink/60 font-black hover:text-neutral-ink transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 text-center">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ShareModal;
