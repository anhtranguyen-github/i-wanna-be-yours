"use client";

import React from 'react';
import { Question } from '@/types/practice';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';

interface ExamPreviewProps {
    questions: Question[];
}

export function ExamPreview({ questions }: ExamPreviewProps) {
    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <FileText size={48} className="text-slate-200 mb-4" />
                <h3 className="text-lg font-bold text-neutral-ink">No questions generated yet</h3>
                <p className="text-sm text-neutral-ink max-w-xs">
                    Use the AI Assistant or select questions manually to preview them here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                <FileText size={20} className="text-brand-green" />
                Draft Questions ({questions.length})
            </h3>

            <div className="space-y-4">
                {questions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                {q.tags.skills?.[0] || 'VOCABULARY'} • {q.tags.level}
                            </span>
                            <span className="text-xs font-bold text-neutral-ink">Q{idx + 1}</span>
                        </div>

                        <p className="text-sm font-medium text-neutral-ink mb-4 leading-relaxed">
                            {q.content}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt) => (
                                <div
                                    key={opt.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg text-xs border ${opt.id === q.correctOptionId
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-slate-50 border-slate-100 text-neutral-ink'
                                        }`}
                                >
                                    {opt.id === q.correctOptionId ? (
                                        <CheckCircle2 size={14} className="shrink-0" />
                                    ) : (
                                        <div className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0" />
                                    )}
                                    {opt.text}
                                </div>
                            ))}
                        </div>

                        {q.explanation && (
                            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-neutral-ink italic">
                                <strong>Explanation:</strong> {q.explanation}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
