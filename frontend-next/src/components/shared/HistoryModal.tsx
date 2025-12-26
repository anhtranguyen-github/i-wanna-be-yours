"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History } from 'lucide-react';
import { HistoryPanel } from './HistoryPanel';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-neutral-ink/20 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="relative w-full max-w-md bg-neutral-white dark:bg-neutral-800 rounded-3xl shadow-xl border border-neutral-gray/20 overflow-hidden"
                >
                    <div className="p-6 border-b border-neutral-gray/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-strong">
                                <History size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-neutral-ink font-display">Activity Log</h3>
                                <p className="text-xs font-bold text-neutral-ink/50">Your recent sessions</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-neutral-gray/10 flex items-center justify-center text-neutral-ink hover:bg-neutral-gray/20 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-0 max-h-[60vh] overflow-y-auto">
                        <div className="p-6">
                            <HistoryPanel />
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
