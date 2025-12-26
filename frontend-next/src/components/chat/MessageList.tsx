/**
 * MessageList Component
 *
 * Displays the list of chat messages with auto-scroll.
 */

import React, { useRef, useEffect } from 'react';
import { MessageBubble, ChatMessage } from './MessageBubble';
import { Artifact } from '@/types/artifact';

interface MessageListProps {
    messages: ChatMessage[];
    isLoading?: boolean;
    onOpenArtifact: (artifact: Artifact) => void;
}

export function MessageList({ messages, isLoading = false, onOpenArtifact }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
            {messages.map(message => (
                <div key={message.id} className="group">
                    <MessageBubble message={message} onOpenArtifact={onOpenArtifact} />
                </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
                        <span className="text-sm">🌸</span>
                    </div>
                    <div className="bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-md">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}
