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

    // CRITICAL FIX: Return empty immediately if no conversationId
    // This prevents stale artifacts from showing when navigating to new chat
    if (!conversationId) {
        return {
            artifacts: [],
            isLoading: false,
            error: undefined,
            revalidate: async () => { },
            findById: () => undefined,
        };
    }

    // Build SWR key - null if not ready to fetch
    const swrKey = useMemo(() => {
        if (!user || paused) {
            return null;
        }
        return swrKeys.artifacts(conversationId, user.id.toString());
    }, [conversationId, user, paused]);

    // Fetch artifacts
    const { data, error, isLoading, mutate } = useSWR<Artifact[]>(
        swrKey,
        () => {
            if (!user) {
                return Promise.resolve([]);
            }
            return artifactService.listByConversation(conversationId, user.id.toString());
        },
        ARTIFACTS_SWR_CONFIG
    );

    // Revalidate handler
    const revalidate = useCallback(async () => {
        await mutate();
    }, [mutate]);

    // Find artifact by ID helper
    const findById = useCallback(
        (id: string): Artifact | undefined => {
            return data?.find((a) => a.id === id);
        },
        [data]
    );

    return {
        artifacts: data ?? [],
        isLoading,
        error,
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
