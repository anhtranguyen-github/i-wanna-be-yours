/**
 * useChatStream Hook
 * 
 * Custom hook for managing chat streaming with proper state handling.
 */

import { useState, useCallback, useRef } from 'react';
import { useSWRConfig } from 'swr';
import { aiTutorService } from '@/services/aiTutorService';
import { Artifact } from '@/types/artifact';
import { swrKeys } from '@/lib/swr-keys';
import { useUser } from '@/context/UserContext';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    artifacts?: Artifact[];
}

interface StreamState {
    isStreaming: boolean;
    currentText: string;
    error: Error | null;
}

interface UseChatStreamOptions {
    onMessageComplete?: (message: ChatMessage) => void;
    onArtifactsReceived?: (artifacts: Artifact[], conversationId: string) => void;
    onConversationCreated?: (conversationId: string) => void;
}

interface UseChatStreamReturn {
    streamState: StreamState;
    sendMessage: (
        content: string,
        conversationId: string | null,
        sessionId: string,
        resourceIds?: string[]
    ) => Promise<ChatMessage | null>;
    cancelStream: () => void;
}

export function useChatStream(options: UseChatStreamOptions = {}): UseChatStreamReturn {
    const { user } = useUser();
    const { mutate } = useSWRConfig();
    const abortControllerRef = useRef<AbortController | null>(null);

    const [streamState, setStreamState] = useState<StreamState>({
        isStreaming: false,
        currentText: '',
        error: null,
    });

    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setStreamState((prev) => ({ ...prev, isStreaming: false }));
    }, []);

    const sendMessage = useCallback(
        async (
            content: string,
            conversationId: string | null,
            sessionId: string,
            resourceIds: string[] = []
        ): Promise<ChatMessage | null> => {
            if (!user) {
                setStreamState((prev) => ({
                    ...prev,
                    error: new Error('User not authenticated'),
                }));
                return null;
            }

            // Reset state
            setStreamState({
                isStreaming: true,
                currentText: '',
                error: null,
            });

            try {
                const { reader, artifacts, conversationId: backendConvoId } =
                    await aiTutorService.streamChat(
                        content,
                        false,
                        conversationId || undefined,
                        sessionId,
                        resourceIds
                    );

                const activeConvoId = (backendConvoId || conversationId)?.toString();

                // Notify about new conversation
                if (backendConvoId && !conversationId) {
                    options.onConversationCreated?.(backendConvoId.toString());
                }

                // Notify about artifacts
                if (artifacts && artifacts.length > 0 && activeConvoId) {
                    options.onArtifactsReceived?.(artifacts, activeConvoId);
                }

                // Stream the response
                let fullText = '';
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

                    // Handle Metadata
                    if (chunk.startsWith('__METADATA__:')) {
                        try {
                            const metadataLine = chunk.split('\n')[0];
                            const metadataJson = metadataLine.replace('__METADATA__:', '');
                            const metadata = JSON.parse(metadataJson);

                            if (metadata.conversationId && !conversationId) {
                                options.onConversationCreated?.(metadata.conversationId.toString());
                            }

                            // If there's content after the newline, add it to fullText
                            const remaining = chunk.substring(metadataLine.length + 1);
                            if (remaining) {
                                fullText += remaining;
                            }
                            continue;
                        } catch (e) {
                            console.error("Failed to parse metadata chunk", e);
                        }
                    }

                    fullText += chunk;

                    setStreamState((prev) => ({
                        ...prev,
                        currentText: fullText,
                    }));
                }

                // Create final message
                const assistantMessage: ChatMessage = {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: fullText,
                    timestamp: new Date(),
                    artifacts,
                };

                // Invalidate SWR caches
                const convoIdToMutate = backendConvoId || conversationId;
                if (convoIdToMutate && user) {
                    mutate(swrKeys.artifacts(convoIdToMutate.toString(), user.id.toString()));
                    mutate(swrKeys.conversations(user.id.toString()));
                    mutate(swrKeys.resources(user.id.toString()));
                }

                setStreamState({
                    isStreaming: false,
                    currentText: '',
                    error: null,
                });

                options.onMessageComplete?.(assistantMessage);

                return assistantMessage;
            } catch (error) {
                const err = error instanceof Error ? error : new Error('Stream failed');
                setStreamState({
                    isStreaming: false,
                    currentText: '',
                    error: err,
                });
                return null;
            }
        },
        [user, mutate, options]
    );

    return {
        streamState,
        sendMessage,
        cancelStream,
    };
}
