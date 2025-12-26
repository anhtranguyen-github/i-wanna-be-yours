"use client";

import React, { useState } from "react";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";

export const AIResponseDisplay = ({ text }: { text: string }) => {
    // Simple parser to split <think>...</think> or <thinking>...</thinking>
    const parts = [];

    const thinkRegex = /<(think|thinking)>([\s\S]*?)(<\/(think|thinking)>|$)/g;

    let lastIndex = 0;
    let match;

    while ((match = thinkRegex.exec(text)) !== null) {
        // Text before the match
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }

        // The thinking content
        parts.push({ type: 'think', content: match[2] });

        lastIndex = thinkRegex.lastIndex;
    }

    // Remaining text
    if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return (
        <div className="space-y-2">
            {parts.map((part, i) => (
                part.type === 'think' ? (
                    <ThinkingBlock key={i} content={part.content} />
                ) : (
                    <div key={i} className="whitespace-pre-wrap">{part.content}</div>
                )
            ))}
        </div>
    );
};

const ThinkingBlock = ({ content }: { content: string }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border border-indigo-200 dark:border-indigo-800 rounded-md overflow-hidden my-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
                <Brain size={14} />
                <span>Thinking Process</span>
                {isOpen ? <ChevronDown size={14} className="ml-auto" /> : <ChevronRight size={14} className="ml-auto" />}
            </button>

            {isOpen && (
                <div className="p-3 bg-white dark:bg-gray-900 text-xs text-neutral-ink dark:text-neutral-ink font-mono whitespace-pre-wrap border-t border-indigo-100 dark:border-indigo-800/50 animate-in slide-in-from-top-2 duration-200">
                    {content || <span className="animate-pulse">Thinking...</span>}
                </div>
            )}
        </div>
    );
};
