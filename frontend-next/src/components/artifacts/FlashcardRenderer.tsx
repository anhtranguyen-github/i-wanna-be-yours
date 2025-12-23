import React from 'react';
import { Artifact } from '@/types/artifact';
import { Edit3, Layers } from 'lucide-react';

interface FlashcardRendererProps {
    artifact: Artifact;
}

export function FlashcardRenderer({ artifact }: FlashcardRendererProps) {
    const cards = artifact.data?.cards || [];
    const level = artifact.metadata?.level || artifact.data?.level || 'N/A';
    const deckName = artifact.title || artifact.data?.title || 'Untitled Deck';

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Deck Overview */}
            <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground font-display">{deckName}</h2>
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg">{level}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-xl text-center">
                        <div className="flex items-center justify-center mb-2"><Layers size={20} className="text-muted-foreground" /></div>
                        <div className="text-2xl font-bold text-foreground">{cards.length}</div>
                        <div className="text-xs text-muted-foreground font-bold">Cards</div>
                    </div>
                    <div className="p-4 bg-muted rounded-xl text-center">
                        <div className="text-2xl font-bold text-muted-foreground">--</div>
                        <div className="text-xs text-muted-foreground font-bold">Retention</div>
                    </div>
                </div>
            </div>

            {/* Cards List */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-muted-foreground px-1">Cards Preview</h3>
                {cards.length === 0 ? (
                    <div className="text-muted-foreground text-center py-8 bg-card rounded-2xl border border-border">No cards in this deck.</div>
                ) : cards.map((card: any, idx: number) => (
                    <div key={idx} className="bg-card rounded-xl border border-border hover:border-primary/40 p-4 flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-xs font-bold text-muted-foreground">{idx + 1}</div>
                            <div>
                                <p className="font-jp text-lg font-bold text-foreground">{card.front || card.word}</p>
                                <p className="text-sm text-muted-foreground">{card.back || card.meaning || card.definition}</p>
                            </div>
                        </div>
                        <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <Edit3 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
