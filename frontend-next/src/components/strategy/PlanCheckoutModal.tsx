'use client';

import React from 'react';
import {
    X, Target, Calendar, Clock, Sparkles,
    CheckCircle2, Rocket, ArrowRight
} from 'lucide-react';
import { JLPTLevel, JLPT_LEVEL_INFO } from '@/types/studyPlanTypes';

interface PlanCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    planSummary: {
        targetLevel: JLPTLevel;
        examDate: Date | string;
        dailyMinutes: number;
        studyDays: number;
        focusAreas: string[];
    };
    loading?: boolean;
}

export function PlanCheckoutModal({
    isOpen,
    onClose,
    onConfirm,
    planSummary,
    loading = false
}: PlanCheckoutModalProps) {
    if (!isOpen) return null;

    // Safely parse examDate whether it's a Date object or string
    const examDate = planSummary.examDate instanceof Date
        ? planSummary.examDate
        : new Date(planSummary.examDate);

    const daysUntil = Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const levelInfo = JLPT_LEVEL_INFO[planSummary.targetLevel];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white rounded-[2.5rem]  overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-brand-salmon to-brand-sky opacity-10" />

                <div className="relative p-8 pt-10">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-neutral-ink hover:text-brand-dark transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-salmon/20 text-brand-salmon rounded-3xl mb-6  shadow-brand-salmon/10">
                            <Rocket size={40} className="animate-bounce" />
                        </div>
                        <h2 className="text-3xl font-black text-brand-dark tracking-tight mb-2">Ready to Blast Off? 🚀</h2>
                        <p className="text-neutral-ink font-medium">Your personalized roadmap is prepared. Final review before activation.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* Target Level */}
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-brand-salmon/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <Target size={18} className="text-brand-salmon" />
                                <span className="text-xs font-black text-neutral-ink uppercase tracking-widest">Target Level</span>
                            </div>
                            <div className="flex items-center gap-3 text-brand-dark font-black text-lg">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"
                                    style={{ backgroundColor: levelInfo.color }}
                                >
                                    {planSummary.targetLevel}
                                </div>
                                {levelInfo.name}
                            </div>
                        </div>

                        {/* Exam Date */}
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-brand-sky/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar size={18} className="text-brand-sky" />
                                <span className="text-xs font-black text-neutral-ink uppercase tracking-widest">Exam Date</span>
                            </div>
                            <div className="text-brand-dark font-black text-lg leading-tight">
                                {examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                <div className="text-xs text-brand-sky font-bold flex items-center gap-1 mt-1">
                                    <Sparkles size={10} />
                                    {daysUntil} Days Remaining
                                </div>
                            </div>
                        </div>

                        {/* Daily Commitment */}
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-brand-green/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock size={18} className="text-brand-green" />
                                <span className="text-xs font-black text-neutral-ink uppercase tracking-widest">Daily Ritual</span>
                            </div>
                            <div className="text-brand-dark font-black text-lg">
                                {planSummary.dailyMinutes} <span className="text-sm text-neutral-ink font-bold">min / day</span>
                            </div>
                        </div>

                        {/* Weekly Schedule */}
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-brand-salmon/30 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle2 size={18} className="text-brand-salmon" />
                                <span className="text-xs font-black text-neutral-ink uppercase tracking-widest">Weekly Pace</span>
                            </div>
                            <div className="text-brand-dark font-black text-lg">
                                {planSummary.studyDays} <span className="text-sm text-neutral-ink font-bold">days / week</span>
                            </div>
                        </div>
                    </div>

                    {planSummary.focusAreas.length > 0 && (
                        <div className="mb-8 p-6 bg-brand-sky/5 rounded-3xl border border-brand-sky/10">
                            <p className="text-xs font-black text-brand-sky uppercase tracking-widest mb-3">Primary Training Focus</p>
                            <div className="flex flex-wrap gap-2">
                                {planSummary.focusAreas.map(area => (
                                    <span key={area} className="px-3 py-1 bg-white text-brand-sky border border-brand-sky/20 rounded-full text-xs font-black capitalize ">
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="w-full btnPrimary py-5 rounded-[1.5rem] flex items-center justify-center gap-3 text-lg group overflow-hidden relative  shadow-brand-salmon/20"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                            {loading ? (
                                <span className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Activating Plan...
                                </span>
                            ) : (
                                <span className="flex items-center gap-3 relative z-10 transition-transform group-hover:translate-x-1 duration-300">
                                    Confirm & Blast Off
                                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-4 text-neutral-ink font-bold hover:text-slate-600 transition-colors"
                        >
                            Modify Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
