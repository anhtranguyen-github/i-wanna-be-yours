/**
 * SWR Key Generators
 * 
 * Canonical SWR key generators to ensure consistency across the application.
 * All SWR usages and mutations MUST use these key generators.
 */

export const swrKeys = {
    /**
     * Key for fetching artifacts by conversation
     * @param conversationId - The conversation ID
     * @param userId - The user ID (required for security)
     */
    artifacts: (conversationId: string, userId: string) =>
        ['artifacts', conversationId, userId] as const,

    /**
     * Key for fetching user's conversation list
     * @param userId - The user ID
     */
    conversations: (userId: string) =>
        ['/h-api/conversations', userId] as const,

    /**
     * Key for fetching user's resources
     * @param userId - The user ID
     */
    resources: (userId: string) =>
        ['/f-api/v1/resources', userId] as const,

    /**
     * Key for fetching a single conversation
     * @param id - The conversation ID
     */
    conversation: (id: string) =>
        ['/h-api/conversation', id] as const,
};

// Type helper for SWR key types
export type SWRKeyType = ReturnType<typeof swrKeys[keyof typeof swrKeys]>;
