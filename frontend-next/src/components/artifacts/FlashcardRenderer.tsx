
import React from 'react';
import { Artifact } from '@/types/artifact';
import { Edit3, FileText } from 'lucide-react';

interface FlashcardRendererProps {
    artifact: Artifact;
}

export function FlashcardRenderer({ artifact }: FlashcardRendererProps) {
    const cards = artifact.data?.cards || [];
    const level = artifact.metadata?.level || artifact.data?.level || 'N/A';

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-brand-dark">Deck Overview</h2>
                    <span className="px-2 py-1 bg-brand-green/10 text-brand-green text-xs rounded-lg font-bold">
                        {level}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <div className="text-2xl font-bold text-brand-dark mb-1">{cards.length}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Cards</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <div className="text-2xl font-bold text-slate-400 mb-1">--</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Retention</div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">Cards Preview</h3>
                </div>
                {cards.length === 0 && (
                    <div className="text-slate-400 text-center py-8">No cards in this deck.</div>
                )}
                {cards.map((card: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="min-w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                                {idx + 1}
                            </div>
                            <div>
                                <p className="font-jp text-lg font-medium text-brand-dark">{card.front || card.word}</p>
                                <p className="text-sm text-slate-500 line-clamp-1">{card.back || card.meaning || card.definition}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-2 text-slate-300 hover:text-brand-green transition-colors">
                                <Edit3 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
