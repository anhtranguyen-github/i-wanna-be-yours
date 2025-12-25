/**
 * MessageBubble Component
 * 
 * Displays a single chat message with user/assistant styling,
 * artifact cards, and action buttons.
 */

import React, { memo } from 'react';
import { Artifact } from '@/types/artifact';
import {
    User,
    Copy,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    FileText,
    CheckSquare,
    GraduationCap,
    Sparkles,
    Layers
} from 'lucide-react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    artifacts?: Artifact[];
}

interface MessageBubbleProps {
    message: ChatMessage;
    onOpenArtifact: (artifact: Artifact) => void;
}

function ArtifactIconSmall({ type }: { type: string }) {
    switch (type) {
        case 'flashcard':
        case 'flashcard_deck':
            return <Layers size={18} className="text-brand-green" />;
        case 'quiz':
            return <CheckSquare size={18} className="text-purple-500" />;
        case 'exam':
            return <GraduationCap size={18} className="text-red-500" />;
        case 'note':
            return <FileText size={18} className="text-blue-500" />;
        default:
            return <Sparkles size={18} className="text-neutral-ink" />;
    }
}

function MessageBubbleComponent({ message, onOpenArtifact }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-3 message-bubble ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                ${isUser ? 'bg-brand-peach' : 'bg-brand-green'}
            `}>
                {isUser ? (
                    <User size={16} className="text-white" />
                ) : (
                    <span className="text-sm">🌸</span>
                )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[80%] ${isUser ? 'flex flex-col items-end' : ''}`}>
                <div className={`
                    px-4 py-3 rounded-2xl
                    ${isUser
                        ? 'bg-brand-green text-white rounded-tr-md'
                        : 'bg-slate-50 text-brand-dark rounded-tl-md'
                    }
                `}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Artifact Cards */}
                {message.artifacts && message.artifacts.length > 0 && (
                    <div className="mt-3 space-y-2 w-full max-w-sm">
                        <p className="text-xs font-bold text-neutral-ink uppercase tracking-wider ml-1">Generated Content</p>
                        {message.artifacts.map((artifact) => (
                            <button
                                key={artifact.id}
                                onClick={() => onOpenArtifact(artifact)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-brand-green/30 hover:shadow-md transition-all group text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-brand-green/10 transition-colors">
                                    <ArtifactIconSmall type={artifact.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-brand-dark truncate">{artifact.title}</h4>
                                    <p className="text-xs text-neutral-ink capitalize">{artifact.type.replace('_', ' ')}</p>
                                </div>
                                <div className="text-brand-green opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">
                                    OPEN
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {!isUser && (
                    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded hover:bg-slate-100 text-neutral-ink" title="Copy">
                            <Copy size={14} />
                        </button>
                        <button className="p-1 rounded hover:bg-slate-100 text-neutral-ink" title="Good response">
                            <ThumbsUp size={14} />
                        </button>
                        <button className="p-1 rounded hover:bg-slate-100 text-neutral-ink" title="Bad response">
                            <ThumbsDown size={14} />
                        </button>
                        <button className="p-1 rounded hover:bg-slate-100 text-neutral-ink" title="Regenerate">
                            <RefreshCw size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Memoize to prevent unnecessary re-renders
export const MessageBubble = memo(MessageBubbleComponent, (prevProps, nextProps) => {
    // Only re-render if message content or id changes
    return (
        prevProps.message.id === nextProps.message.id &&
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.artifacts?.length === nextProps.message.artifacts?.length
    );
});

MessageBubble.displayName = 'MessageBubble';
