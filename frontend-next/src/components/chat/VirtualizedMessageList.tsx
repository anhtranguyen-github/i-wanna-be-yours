/**
 * VirtualizedMessageList Component
 *
 * A performance-optimized message list using virtualization.
 * Only renders visible messages to handle 100+ messages smoothly.
 */

"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageBubble, ChatMessage } from './MessageBubble';
import { Artifact } from '@/types/artifact';

interface VirtualizedMessageListProps {
    messages: ChatMessage[];
    isLoading?: boolean;
    onOpenArtifact: (artifact: Artifact) => void;
    /**
     * Estimated height of each message in pixels.
     * Used for initial layout before actual measurement.
     */
    estimateSize?: number;
}

/**
 * Loading indicator component
 */
function LoadingIndicator() {
    return (
        <div className="flex gap-3 py-2">
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
    );
}

export function VirtualizedMessageList({
    messages,
    isLoading = false,
    onOpenArtifact,
    estimateSize = 120,
}: VirtualizedMessageListProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const lastMessageCount = useRef(messages.length);

    // Create virtualizer
    const virtualizer = useVirtualizer({
        count: messages.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimateSize,
        overscan: 5, // Render 5 extra items above/below viewport
    });

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > lastMessageCount.current) {
            // New message arrived, scroll to bottom
            virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
        }
        lastMessageCount.current = messages.length;
    }, [messages.length, virtualizer]);

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div
            ref={parentRef}
            className="flex-1 overflow-y-auto"
            style={{ contain: 'strict' }}
        >
            <div
                className="relative w-full"
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                }}
            >
                {virtualItems.map((virtualItem) => {
                    const message = messages[virtualItem.index];
                    return (
                        <div
                            key={virtualItem.key}
                            className="absolute top-0 left-0 w-full px-4"
                            style={{
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <div className="group py-2">
                                <MessageBubble
                                    message={message}
                                    onOpenArtifact={onOpenArtifact}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Loading indicator - outside virtualized list */}
            {isLoading && (
                <div className="px-4 pb-4">
                    <LoadingIndicator />
                </div>
            )}
        </div>
    );
}

/**
 * Hook to use with VirtualizedMessageList for scroll management
 */
export function useMessageListScroll(messages: ChatMessage[]) {
    const shouldAutoScroll = useRef(true);
    const lastScrollTop = useRef(0);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        shouldAutoScroll.current = isAtBottom;
        lastScrollTop.current = scrollTop;
    }, []);

    return {
        shouldAutoScroll: shouldAutoScroll.current,
        handleScroll,
    };
}
