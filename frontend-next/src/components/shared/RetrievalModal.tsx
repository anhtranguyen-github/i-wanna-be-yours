"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, CheckCircle, AlertCircle, Loader2, Download, Layers, Lock } from 'lucide-react';
import * as practiceService from '@/services/practiceService';
import { flashcardService } from '@/services/flashcardService';
import * as quootService from '@/services/quootService';
import { authFetch } from '@/lib/authFetch';
import { useUser } from '@/context/UserContext';
import { useGlobalAuth } from '@/context/GlobalAuthContext';

interface RetrievalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'PRACTICE' | 'FLASHCARD' | 'QUOOT';
}

export function RetrievalModal({ isOpen, onClose, type }: RetrievalModalProps) {
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();
    const [id, setId] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'FOUND' | 'ERROR' | 'SUCCESS'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');
    const [previewData, setPreviewData] = useState<any>(null);

    // Escape key listener
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleVerify = async () => {
        if (!id.trim()) return;
        setStatus('LOADING');
        setErrorMsg('');
        setPreviewData(null);

        try {
            let data: any = null;
            if (type === 'PRACTICE') {
                const res = await practiceService.getNodeSessionData(id);
                data = res.node;
            } else if (type === 'FLASHCARD') {
                data = await flashcardService.fetchFlashcardSetById(id);
            } else if (type === 'QUOOT') {
                data = await quootService.fetchQuootArenaById(id);
            }

            if (data) {
                setPreviewData(data);
                setStatus('FOUND');
            }
        } catch (err: any) {
            console.error(err);
            setStatus('ERROR');
            setErrorMsg('Item not found or private');
        }
    };

    const handleImport = async () => {
        if (!user) return;
        try {
            setStatus('LOADING');
            // Call user follow endpoint
            const res = await authFetch('/e-api/v1/users/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: id,
                    itemType: type
                })
            });

            if (!res.ok) throw new Error('Failed to follow item');
            setStatus('SUCCESS');
            setTimeout(() => {
                onClose();
                setStatus('IDLE');
                setId('');
                setPreviewData(null);
            }, 1500);
        } catch (err) {
            setStatus('ERROR');
            setErrorMsg('Failed to import.');
        }
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neutral-ink/40 backdrop-blur-sm"
                onClick={handleBackdropClick}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-neutral-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-neutral-gray/10"
                >
                    <div className="bg-gradient-to-br from-neutral-beige/30 to-white px-8 py-6 flex items-center justify-between border-b border-neutral-gray/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-strong/10 rounded-xl flex items-center justify-center text-primary-strong">
                                <Search size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-neutral-ink font-display leading-none">
                                    Registry Access
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/30 mt-1">Unified Retrieval System</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-neutral-beige/20 rounded-full flex items-center justify-center text-neutral-ink/40 hover:text-neutral-ink transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        {!user ? (
                            <div className="text-center space-y-6 py-4">
                                <div className="w-16 h-16 bg-neutral-beige/50 rounded-2xl flex items-center justify-center mx-auto text-neutral-ink/20">
                                    <Lock size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-black text-neutral-ink">Authentication Required</h4>
                                    <p className="text-sm font-bold text-neutral-ink/60 px-4">
                                        Registry lookups and collection monitoring require an active Hanabira Core account.
                                    </p>
                                </div>
                                <button
                                    onClick={() => openAuth('LOGIN', { title: 'Registry Access', description: 'Unlock the ability to import shared content by ID.' })}
                                    className="w-full bg-primary-strong text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-neutral-ink transition-all active:scale-[0.98]"
                                >
                                    Sign In to Hanapita
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-ink/40 ml-1">Universal Content Identifier</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={id}
                                            onChange={(e) => setId(e.target.value)}
                                            placeholder="Enter item ID (e.g. 64a...)"
                                            className="flex-1 bg-neutral-beige/10 border border-neutral-gray/20 rounded-2xl px-5 py-3 text-neutral-ink font-bold focus:outline-none focus:border-primary-strong focus:ring-4 focus:ring-primary-strong/5 transition-all text-sm"
                                        />
                                        <button
                                            onClick={handleVerify}
                                            disabled={status === 'LOADING' || !id}
                                            className="bg-neutral-ink text-white px-6 py-3 rounded-2xl font-black hover:bg-primary-strong transition-all disabled:opacity-50 active:scale-[0.98]"
                                        >
                                            {status === 'LOADING' ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
                                        </button>
                                    </div>
                                </div>

                                {status === 'ERROR' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-center gap-3 text-red-500 bg-red-50 p-4 rounded-2xl text-xs font-black uppercase tracking-wider border border-red-100"
                                    >
                                        <AlertCircle size={18} />
                                        {errorMsg}
                                    </motion.div>
                                )}

                                {status === 'SUCCESS' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-2xl text-xs font-black uppercase tracking-wider border border-green-100"
                                    >
                                        <CheckCircle size={18} />
                                        Collection updated successfully
                                    </motion.div>
                                )}

                                {status === 'FOUND' && previewData && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-neutral-beige/10 border border-neutral-gray/10 rounded-2xl p-6 space-y-4"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 bg-white border border-neutral-gray/10 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                                {previewData.icon || previewData.coverEmoji || <Layers size={28} className="text-primary-strong" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-neutral-ink font-display text-lg truncate">{previewData.title}</h4>
                                                <p className="text-xs text-neutral-ink/60 font-bold line-clamp-2 mt-1 leading-relaxed">{previewData.description || 'No description available.'}</p>
                                                <div className="flex items-center gap-2 mt-3">
                                                    {previewData.level && <span className="bg-primary-strong text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none">{previewData.level}</span>}
                                                    <span className="text-[10px] font-black text-neutral-ink/30 uppercase tracking-widest">
                                                        {previewData.creatorName || 'Official'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleImport}
                                            className="w-full bg-primary-strong text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-neutral-ink transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            <Download size={20} />
                                            Import to My Collection
                                        </button>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
