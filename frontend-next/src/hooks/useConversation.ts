/**
 * useConversation Hook
 * 
 * Custom hook for fetching and managing a single conversation.
 */

import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
import { aiTutorService } from '@/services/aiTutorService';
import { Conversation, Message } from '@/types/aiTutorTypes';
import { swrKeys } from '@/lib/swr-keys';
import { useUser } from '@/context/UserContext';

interface UseConversationOptions {
    /**
     * If true, won't fetch even if conversationId is provided
     */
    paused?: boolean;
}

interface UseConversationReturn {
    /**
     * The conversation data
     */
    conversation: Conversation | null;
    /**
     * The messages in the conversation
     */
    messages: Message[];
    /**
     * Session ID for the conversation
     */
    sessionId: string | null;
    /**
     * Whether the conversation is loading
     */
    isLoading: boolean;
    /**
     * Error if fetch failed
     */
    error: Error | undefined;
    /**
     * Manually revalidate conversation
     */
    revalidate: () => Promise<void>;
}

const CONVERSATION_SWR_CONFIG = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000,
};

export function useConversation(
    conversationId: string | null | undefined,
    options: UseConversationOptions = {}
): UseConversationReturn {
    const { user } = useUser();
    const { paused = false } = options;

    // Build SWR key
    const swrKey = useMemo(() => {
        if (!conversationId || paused) {
            return null;
        }
        return swrKeys.conversation(conversationId);
    }, [conversationId, paused]);

    // Fetch conversation
    const { data, error, isLoading, mutate } = useSWR<Conversation>(
        swrKey,
        () => {
            if (!conversationId) {
                return Promise.resolve(null as unknown as Conversation);
            }
            return aiTutorService.getConversation(conversationId);
        },
        CONVERSATION_SWR_CONFIG
    );

    const revalidate = useCallback(async () => {
        await mutate();
    }, [mutate]);

    return {
        conversation: data ?? null,
        messages: data?.messages ?? [],
        sessionId: data?.sessionId ?? null,
        isLoading,
        error,
        revalidate,
    };
}
