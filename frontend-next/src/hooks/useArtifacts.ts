/**
 * useArtifacts Hook
 * 
 * Custom hook for managing artifacts with SWR integration.
 * Provides consistent fetching, caching, and mutation of artifacts.
 */

import useSWR from 'swr';
import { useSWRConfig } from 'swr';
import { useCallback, useMemo } from 'react';
import { Artifact } from '@/types/artifact';
import { artifactService } from '@/services/artifactService';
import { swrKeys } from '@/lib/swr-keys';
import { ARTIFACTS_SWR_CONFIG } from '@/lib/swr-config';
import { useUser } from '@/context/UserContext';

interface UseArtifactsOptions {
    /**
     * If true, won't fetch even if conversationId is provided
     */
    paused?: boolean;
}

interface UseArtifactsReturn {
    /**
     * List of artifacts for the conversation
     */
    artifacts: Artifact[];
    /**
     * Whether the artifacts are currently loading
     */
    isLoading: boolean;
    /**
     * Error if fetch failed
     */
    error: Error | undefined;
    /**
     * Manually revalidate artifacts
     */
    revalidate: () => Promise<void>;
    /**
     * Find an artifact by ID
     */
    findById: (id: string) => Artifact | undefined;
}

export function useArtifacts(
    conversationId: string | null | undefined,
    options: UseArtifactsOptions = {}
): UseArtifactsReturn {
    const { user } = useUser();
    const { paused = false } = options;

    // Build SWR key - null if no conversationId (prevents stale data)
    // When key is null, SWR won't fetch and returns undefined for data
    const swrKey = useMemo(() => {
        if (!conversationId || !user || paused) {
            return null;
        }
        return swrKeys.artifacts(conversationId, user.id.toString());
    }, [conversationId, user, paused]);

    // Fetch artifacts - only fetches when swrKey is non-null
    const { data, error, isLoading, mutate } = useSWR<Artifact[]>(
        swrKey,
        () => {
            if (!conversationId || !user) {
                return Promise.resolve([]);
            }
            return artifactService.listByConversation(conversationId, user.id.toString());
        },
        ARTIFACTS_SWR_CONFIG
    );

    // Revalidate handler
    const revalidate = useCallback(async () => {
        if (swrKey) {
            await mutate();
        }
    }, [mutate, swrKey]);

    // Find artifact by ID helper
    const findById = useCallback(
        (id: string): Artifact | undefined => {
            if (!conversationId) return undefined;
            return data?.find((a) => a.id === id);
        },
        [data, conversationId]
    );

    // CRITICAL: Return empty array when no conversationId to prevent stale artifacts
    // This handles the case after hooks (respecting React rules)
    return {
        artifacts: conversationId ? (data ?? []) : [],
        isLoading: conversationId ? isLoading : false,
        error: conversationId ? error : undefined,
        revalidate,
        findById,
    };
}

/**
 * Hook to get mutation function for artifacts
 * Useful when you need to invalidate artifacts from a different component
 */
export function useArtifactsMutate() {
    const { mutate } = useSWRConfig();
    const { user } = useUser();

    const mutateArtifacts = useCallback(
        (conversationId: string) => {
            if (!user) return;
            mutate(swrKeys.artifacts(conversationId, user.id.toString()));
        },
        [mutate, user]
    );

    return mutateArtifacts;
}
