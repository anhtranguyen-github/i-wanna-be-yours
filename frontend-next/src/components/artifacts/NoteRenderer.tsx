import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Artifact } from '@/types/artifact';

interface NoteRendererProps {
    artifact: Artifact;
}

export function NoteRenderer({ artifact }: NoteRendererProps) {
    const content = typeof artifact.data === 'string'
        ? artifact.data
        : artifact.data?.content || artifact.data?.summary || '_No content_';

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-card rounded-2xl border border-border p-6">
                <div className="prose prose-sm max-w-none
                    prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground
                    prose-p:text-foreground/80 prose-p:leading-relaxed
                    prose-strong:text-foreground prose-strong:font-bold
                    prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                    prose-pre:bg-muted prose-pre:rounded-xl
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                ">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
