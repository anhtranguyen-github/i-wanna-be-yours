
import React from 'react';
import { Artifact } from '@/types/artifact';
import { MoreHorizontal } from 'lucide-react';

interface QuizRendererProps {
    artifact: Artifact;
}

export function QuizRenderer({ artifact }: QuizRendererProps) {
    const questions = artifact.data?.questions || [];
    const skill = artifact.metadata?.skill || artifact.data?.skill || 'General';
    const description = artifact.data?.description || 'Practice quiz';

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-brand-dark">Quiz Settings</h2>
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-lg font-bold">
                        {skill}
                    </span>
                </div>
                <p className="text-slate-600 text-sm">{description}</p>
            </div>

            <div className="grid gap-4">
                {questions.length === 0 && (
                    <div className="text-slate-400 text-center py-8">No questions in this quiz.</div>
                )}
                {questions.map((q: any, i: number) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-green/30 transition-all shadow-sm">
                        <div className="flex justify-between mb-4">
                            <span className="font-bold text-slate-400 text-xs uppercase">Question {i + 1}</span>
                            <button className="text-slate-400 hover:text-brand-dark transition-colors"><MoreHorizontal size={16} /></button>
                        </div>
                        <p className="text-lg font-jp mb-6">{q.content || q.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options?.map((opt: any, idx: number) => (
                                <button
                                    key={idx}
                                    className={`p-3 border rounded-lg text-left transition-colors text-sm border-slate-200 hover:bg-slate-50`}
                                >
                                    <span className="font-bold mr-2">{opt.id?.toUpperCase()}.</span>
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
