
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
        <div className="prose prose-sm max-w-none p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
}
