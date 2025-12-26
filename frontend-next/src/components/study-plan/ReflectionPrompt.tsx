'use client';

import { useState } from 'react';
import { PenLine, Send, Loader2 } from 'lucide-react';
import { CollapsibleCard } from './CollapsibleCard';
import { ReflectionEntry } from '@/types/studyPlanTypes';

interface ReflectionPromptProps {
    recentReflections: ReflectionEntry[];
    isExpanded: boolean;
    onToggle: (id: string, isExpanded: boolean) => void;
    onSubmit: (content: string) => Promise<void>;
}

export function ReflectionPrompt({
    recentReflections,
    isExpanded,
    onToggle,
    onSubmit,
}: ReflectionPromptProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit(content);
            setContent('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const lastReflection = recentReflections[0];
    const daysSinceLastReflection = lastReflection
        ? Math.floor((Date.now() - new Date(lastReflection.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const summaryContent = (
        <span className="text-sm text-neutral-ink/60">
            {daysSinceLastReflection !== null
                ? `Last: ${daysSinceLastReflection === 0 ? 'Today' : `${daysSinceLastReflection}d ago`}`
                : 'No reflections yet'}
        </span>
    );

    const prompts = [
        "What went well in your studies this week?",
        "What challenges did you face?",
        "What will you focus on next week?",
        "How are you feeling about your progress?",
    ];

    return (
        <CollapsibleCard
            id="reflection-prompt"
            title="Weekly Reflection"
            subtitle="Pause and reflect on your journey"
            icon={PenLine}
            isExpanded={isExpanded}
            onToggle={onToggle}
            summaryContent={summaryContent}
        >
            <div className="mt-4 space-y-4">
                {/* Prompts */}
                <div className="flex flex-wrap gap-2">
                    {prompts.map((prompt, i) => (
                        <button
                            key={i}
                            onClick={() => setContent(prev => prev ? `${prev}\n\n${prompt}` : prompt)}
                            className="px-3 py-1.5 text-xs font-bold text-neutral-ink/70 bg-neutral-beige rounded-full hover:bg-primary-strong/10 hover:text-primary-strong transition-colors"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>

                {/* Text Area */}
                <div className="relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your reflection here..."
                        rows={4}
                        className="w-full p-4 bg-neutral-beige/50 border border-neutral-gray/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-strong/20 text-neutral-ink placeholder:text-neutral-ink/40"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || isSubmitting}
                        className="absolute bottom-4 right-4 p-2 bg-primary-strong text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-strong/90 transition-colors"
                    >
                        {isSubmitting ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>

                {/* Recent Reflections */}
                {recentReflections.length > 0 && (
                    <div className="pt-4 border-t border-neutral-gray/10">
                        <h4 className="text-xs font-black text-neutral-ink uppercase tracking-widest mb-3">
                            Recent Reflections
                        </h4>
                        <div className="space-y-3">
                            {recentReflections.slice(0, 3).map((ref) => (
                                <div key={ref.id} className="p-3 bg-neutral-beige/30 rounded-xl">
                                    <p className="text-sm text-neutral-ink/80 line-clamp-2">{ref.content}</p>
                                    <p className="text-xs text-neutral-ink/50 mt-1">
                                        {new Date(ref.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </CollapsibleCard>
    );
}

export default ReflectionPrompt;
