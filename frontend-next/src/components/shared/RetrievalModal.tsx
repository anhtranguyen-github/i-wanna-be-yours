"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, CheckCircle, AlertCircle, Loader2, Download, Layers } from 'lucide-react';
import * as practiceService from '@/services/practiceService';
import { flashcardService } from '@/services/flashcardService';
import * as quootService from '@/services/quootService';
import { authFetch } from '@/lib/authFetch';

interface RetrievalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'PRACTICE' | 'FLASHCARD' | 'QUOOT';
}

export function RetrievalModal({ isOpen, onClose, type }: RetrievalModalProps) {
    const [id, setId] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'FOUND' | 'ERROR' | 'SUCCESS'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');
    const [previewData, setPreviewData] = useState<any>(null);

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

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neutral-ink/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-neutral-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-neutral-gray/20"
                >
                    <div className="bg-neutral-beige/30 px-6 py-4 flex items-center justify-between border-b border-neutral-gray/10">
                        <h3 className="text-lg font-black text-neutral-ink font-display flex items-center gap-2">
                            <Search size={20} className="text-primary-strong" />
                            Registry Retrieval
                        </h3>
                        <button onClick={onClose} className="text-neutral-ink/60 hover:text-neutral-ink">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-ink/60">Registry ID</label>
                            <div className="flex gap-2">
                                <input
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    placeholder="Enter content ID..."
                                    className="flex-1 bg-neutral-beige/20 border border-neutral-gray/20 rounded-xl px-4 py-2 text-neutral-ink font-bold focus:outline-none focus:border-primary-strong transition-colors"
                                />
                                <button
                                    onClick={handleVerify}
                                    disabled={status === 'LOADING' || !id}
                                    className="bg-neutral-ink text-white px-4 py-2 rounded-xl font-bold hover:bg-neutral-ink/80 transition-colors disabled:opacity-50"
                                >
                                    {status === 'LOADING' ? <Loader2 size={20} className="animate-spin" /> : 'Verify'}
                                </button>
                            </div>
                        </div>

                        {status === 'ERROR' && (
                            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm font-bold">
                                <AlertCircle size={16} />
                                {errorMsg}
                            </div>
                        )}

                        {status === 'SUCCESS' && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl text-sm font-bold">
                                <CheckCircle size={16} />
                                Successfully imported to your collection
                            </div>
                        )}

                        {status === 'FOUND' && previewData && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-neutral-white border border-neutral-gray/20 rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
                                        {previewData.icon || previewData.coverEmoji || <Layers size={24} className="text-primary-strong" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-neutral-ink font-display text-lg">{previewData.title}</h4>
                                        <p className="text-sm text-neutral-ink/60 font-medium line-clamp-2">{previewData.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {previewData.level && <span className="bg-neutral-beige px-2 py-0.5 rounded-md text-xs font-bold text-neutral-ink">{previewData.level}</span>}
                                            <span className="text-xs font-bold text-neutral-ink/40">
                                                {previewData.creatorName || 'Unknown Author'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleImport}
                                    className="w-full bg-primary-strong text-white py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <Download size={18} />
                                    Import Reference
                                </button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
