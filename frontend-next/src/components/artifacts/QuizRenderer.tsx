import React from 'react';
import { Artifact } from '@/types/artifact';
import { Target } from 'lucide-react';

interface QuizRendererProps {
    artifact: Artifact;
}

export function QuizRenderer({ artifact }: QuizRendererProps) {
    const questions = artifact.data?.questions || [];
    const skill = artifact.metadata?.skill || artifact.data?.skill || 'General';
    const description = artifact.data?.description || 'Practice quiz';
    const title = artifact.title || artifact.data?.title || 'Untitled Quiz';

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Quiz Header */}
            <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Target size={20} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground font-display">{title}</h2>
                    </div>
                    <span className="px-3 py-1 bg-muted text-neutral-ink text-xs font-bold rounded-lg">{skill}</span>
                </div>
                <p className="text-neutral-ink">{description}</p>
                <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-sm text-neutral-ink"><span className="font-bold text-foreground">{questions.length}</span> questions</span>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
                {questions.length === 0 ? (
                    <div className="text-neutral-ink text-center py-8 bg-card rounded-2xl border border-border">No questions in this quiz.</div>
                ) : questions.map((q: any, i: number) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-bold text-neutral-ink">{i + 1}</span>
                            <span className="text-xs text-neutral-ink font-bold">Question</span>
                        </div>
                        <p className="text-lg font-jp mb-6 text-foreground">{q.content || q.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options?.map((opt: any, idx: number) => (
                                <button key={idx} className="p-3 border border-border rounded-xl text-left transition-colors hover:border-primary/40 flex items-center gap-3">
                                    <span className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center font-bold text-xs text-neutral-ink">{(opt.id || String.fromCharCode(65 + idx)).toUpperCase()}</span>
                                    <span className="text-sm font-jp text-foreground">{opt.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
